import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { eventBus, SSE_EVENTS } from '@/lib/sse';

export class WebhookService {
  /**
   * Verify HMAC-SHA256 Webhook Signature against META_APP_SECRET
   */
  static verifySignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
    if (!signatureHeader) return false;

    const [algorithm, signature] = signatureHeader.split('=');
    if (algorithm !== 'sha256' || !signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Process incoming Meta WhatsApp Webhook Payload
   */
  static async processWebhookPayload(payload: any, rawPayloadString: string) {
    // 1. Identify entries and changes
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return { status: 'IGNORED', message: 'Payload does not contain WhatsApp change values' };
    }

    const phoneNumberId = value.metadata?.phone_number_id;

    // Find target organization by WhatsApp connection phone_number_id or fallback to first org
    let connection = null;
    if (phoneNumberId) {
      connection = await prisma.whatsAppConnection.findFirst({
        where: { phoneNumberId },
      });
    }

    if (!connection) {
      connection = await prisma.whatsAppConnection.findFirst();
    }

    const organizationId = connection?.organizationId || null;

    // 2. Process incoming messages
    if (value.messages && value.messages.length > 0) {
      for (const msg of value.messages) {
        await this.handleIncomingMessage(msg, value.contacts?.[0], organizationId, rawPayloadString);
      }
    }

    // 3. Process message statuses (sent, delivered, read, failed)
    if (value.statuses && value.statuses.length > 0) {
      for (const statusObj of value.statuses) {
        await this.handleMessageStatus(statusObj, organizationId, rawPayloadString);
      }
    }

    return { status: 'PROCESSED', organizationId };
  }

  /**
   * Handle incoming customer message
   */
  private static async handleIncomingMessage(
    msg: any,
    contactInfo: any,
    organizationId: string | null,
    rawPayloadString: string
  ) {
    const metaMessageId = msg.id;
    const senderPhone = msg.from; // Customer phone number
    const messageType = msg.type?.toUpperCase() || 'TEXT';

    // Deduplication check using metaMessageId
    const existingMessage = await prisma.message.findUnique({
      where: { metaMessageId },
    });

    if (existingMessage) {
      return; // Already processed
    }

    // Save Webhook Event log
    if (organizationId) {
      await prisma.webhookEvent.create({
        data: {
          organizationId,
          eventId: metaMessageId,
          eventType: 'message',
          payload: rawPayloadString,
          processed: true,
        },
      });
    }

    // Ensure Organization exists
    let orgId = organizationId;
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst();
      if (!firstOrg) return;
      orgId = firstOrg.id;
    }

    // Find or create Contact
    const customerName = contactInfo?.profile?.name || `Customer +${senderPhone}`;
    let contact = await prisma.contact.findFirst({
      where: {
        organizationId: orgId,
        phone: senderPhone,
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          organizationId: orgId,
          phone: senderPhone,
          name: customerName,
          whatsappId: contactInfo?.wa_id || senderPhone,
          source: 'INBOUND_MESSAGE',
          lastContacted: new Date(),
        },
      });
    } else {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { lastContacted: new Date() },
      });
    }

    // Find or create Conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        organizationId: orgId,
        contactId: contact.id,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: orgId,
          contactId: contact.id,
          status: 'OPEN',
          unreadCount: 1,
          lastMessageAt: new Date(),
        },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          unreadCount: { increment: 1 },
          lastMessageAt: new Date(),
          status: 'OPEN',
        },
      });
    }

    // Extract message content based on type
    let textContent: string | null = null;
    let mediaUrl: string | null = null;
    let mimeType: string | null = null;
    let caption: string | null = null;

    if (messageType === 'TEXT') {
      textContent = msg.text?.body || '';
    } else if (messageType === 'IMAGE') {
      mediaUrl = msg.image?.id ? `https://graph.facebook.com/v21.0/${msg.image.id}` : null;
      caption = msg.image?.caption || null;
      mimeType = msg.image?.mime_type || 'image/jpeg';
      textContent = caption || '[Image Attachment]';
    } else if (messageType === 'VIDEO') {
      mediaUrl = msg.video?.id ? `https://graph.facebook.com/v21.0/${msg.video.id}` : null;
      caption = msg.video?.caption || null;
      mimeType = msg.video?.mime_type || 'video/mp4';
      textContent = caption || '[Video Attachment]';
    } else if (messageType === 'AUDIO') {
      mediaUrl = msg.audio?.id ? `https://graph.facebook.com/v21.0/${msg.audio.id}` : null;
      mimeType = msg.audio?.mime_type || 'audio/ogg';
      textContent = '[Voice Message]';
    } else if (messageType === 'DOCUMENT') {
      mediaUrl = msg.document?.id ? `https://graph.facebook.com/v21.0/${msg.document.id}` : null;
      caption = msg.document?.caption || null;
      mimeType = msg.document?.mime_type || 'application/pdf';
      textContent = msg.document?.filename || caption || '[Document]';
    } else if (messageType === 'INTERACTIVE' || messageType === 'BUTTON') {
      textContent = msg.interactive?.button_reply?.title || msg.button?.text || '[Button Response]';
    } else {
      textContent = `[${messageType} Message]`;
    }

    // Create Message record
    const message = await prisma.message.create({
      data: {
        organizationId: orgId,
        conversationId: conversation.id,
        contactId: contact.id,
        metaMessageId,
        direction: 'INBOUND',
        messageType,
        text: textContent,
        mediaUrl,
        mimeType,
        caption,
        status: 'READ',
      },
    });

    // Broadcast Real-time event via SSE
    eventBus.emit(SSE_EVENTS.NEW_MESSAGE, {
      organizationId: orgId,
      conversationId: conversation.id,
      message,
    });

    // Trigger Automated Bot Auto-Responder Flow
    this.triggerAutoResponder({
      organizationId: orgId,
      conversationId: conversation.id,
      contactId: contact.id,
      recipientPhone: senderPhone,
      incomingText: textContent || '',
    }).catch(err => {
      console.error('Auto responder error:', err);
    });
  }

  /**
   * Automated Keyword & Gemini AI Auto-Responder Flow
   */
  private static async triggerAutoResponder(options: {
    organizationId: string;
    conversationId: string;
    contactId: string;
    recipientPhone: string;
    incomingText: string;
  }) {
    const { organizationId, conversationId, contactId, recipientPhone, incomingText } = options;
    const cleanText = incomingText.trim().toLowerCase();

    let autoReplyMessage: string | null = null;

    // 1. Check custom Keyword Bot rules first (instant & reliable)
    try {
      const { AutomationConfigService } = await import('./automation.service');
      const keywordReply = AutomationConfigService.matchReply(incomingText);
      if (keywordReply) {
        autoReplyMessage = keywordReply;
      }
    } catch (err) {
      console.warn('AutomationConfigService error:', err);
    }

    // 2. Try Gemini AI Smart Response if no specific keyword matched
    if (!autoReplyMessage) {
      try {
        const { GeminiService } = await import('../ai/gemini.service');
        const aiReply = await GeminiService.generateReply({
          incomingMessage: incomingText,
        });

        if (aiReply) {
          autoReplyMessage = aiReply;
        }
      } catch (err) {
        console.warn('Gemini AI fallback triggered:', err);
      }
    }

    // 3. Fallback to default greeting if empty
    if (!autoReplyMessage) {
      if (cleanText === 'hi' || cleanText === 'hello' || cleanText === 'start' || cleanText === 'menu' || cleanText === 'vanakkam') {
        autoReplyMessage = `👋 Welcome to WhatsApp CRM Service!\n\nHow can we help you today? Reply with a number:\n1️⃣ View Pricing & Plans\n2️⃣ Request Product Demo\n3️⃣ Download Catalog / Brochure\n4️⃣ Talk to Support Agent`;
      }
    }

    if (autoReplyMessage) {
      // Dynamically import MessagesService to avoid circular dependency
      const { MessagesService } = await import('./messages.service');
      await MessagesService.sendMessage({
        organizationId,
        conversationId,
        contactId,
        recipientPhone,
        type: 'TEXT',
        text: autoReplyMessage,
      });
    }
  }

  /**
   * Handle message status updates (sent, delivered, read, failed)
   */
  private static async handleMessageStatus(
    statusObj: any,
    organizationId: string | null,
    rawPayloadString: string
  ) {
    const metaMessageId = statusObj.id;
    const newStatus = statusObj.status?.toUpperCase(); // SENT, DELIVERED, READ, FAILED

    if (!metaMessageId || !newStatus) return;

    const message = await prisma.message.findUnique({
      where: { metaMessageId },
    });

    if (!message) return;

    let errorCode = null;
    let errorMessage = null;

    if (newStatus === 'FAILED' && statusObj.errors?.[0]) {
      errorCode = String(statusObj.errors[0].code || 'ERROR');
      errorMessage = statusObj.errors[0].title || statusObj.errors[0].message || 'Message delivery failed';
    }

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: newStatus,
        errorCode,
        errorMessage,
      },
    });

    // Save status history record
    await prisma.messageStatus.create({
      data: {
        messageId: message.id,
        status: newStatus,
        error: errorMessage,
      },
    });

    // Broadcast Real-time status update via SSE
    eventBus.emit(SSE_EVENTS.MESSAGE_STATUS_UPDATE, {
      organizationId: message.organizationId,
      conversationId: message.conversationId,
      messageId: message.id,
      status: newStatus,
    });
  }
}
