import { WhatsAppService } from './whatsapp.service';
import { MockWhatsAppService } from './mock.service';
import { prisma } from '@/lib/prisma';
import { eventBus, SSE_EVENTS } from '@/lib/sse';

export interface SendMessageOptions {
  organizationId: string;
  conversationId: string;
  contactId: string;
  recipientPhone: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'TEMPLATE';
  text?: string;
  mediaUrl?: string;
  caption?: string;
  mimeType?: string;
  templateName?: string;
  templateLanguage?: string;
  templateParameters?: Record<string, string> | Array<any>;
}

export class MessagesService {
  /**
   * Dispatch an outbound WhatsApp message
   */
  static async sendMessage(options: SendMessageOptions) {
    const {
      organizationId,
      conversationId,
      contactId,
      recipientPhone,
      type,
      text,
      mediaUrl,
      caption,
      mimeType,
      templateName,
      templateLanguage = 'en_US',
      templateParameters,
    } = options;

    const credentials = await WhatsAppService.getCredentials(organizationId);
    const isMock = process.env.WHATSAPP_MOCK_MODE === 'true';

    // 1. Create message record in database with QUEUED status
    const message = await prisma.message.create({
      data: {
        organizationId,
        conversationId,
        contactId,
        direction: 'OUTBOUND',
        messageType: type,
        text,
        mediaUrl,
        mimeType,
        caption,
        templateName,
        templateLanguage,
        templateParameters: templateParameters ? JSON.stringify(templateParameters) : null,
        status: 'QUEUED',
      },
    });

    // Clean phone number format for Meta API
    const formattedPhone = recipientPhone.replace(/[^\d]/g, '');

    // Construct Meta payload
    let metaPayload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
    };

    if (type === 'TEXT') {
      metaPayload.type = 'text';
      metaPayload.text = { body: text };
    } else if (type === 'IMAGE') {
      metaPayload.type = 'image';
      metaPayload.image = { link: mediaUrl, caption: caption || '' };
    } else if (type === 'VIDEO') {
      metaPayload.type = 'video';
      metaPayload.video = { link: mediaUrl, caption: caption || '' };
    } else if (type === 'DOCUMENT') {
      metaPayload.type = 'document';
      metaPayload.document = { link: mediaUrl, caption: caption || '', filename: text || 'Document' };
    } else if (type === 'AUDIO') {
      metaPayload.type = 'audio';
      metaPayload.audio = { link: mediaUrl };
    } else if (type === 'TEMPLATE') {
      metaPayload.type = 'template';
      
      let formattedComponents: any[] = [];
      if (templateParameters) {
        if (Array.isArray(templateParameters)) {
          formattedComponents = templateParameters;
        } else if (typeof templateParameters === 'object') {
          // Convert key-value object {{1}}: "Val" into Meta parameters array
          const parameters = Object.entries(templateParameters).map(([key, val]) => ({
            type: 'text',
            text: String(val),
          }));
          formattedComponents = [
            {
              type: 'body',
              parameters,
            },
          ];
        }
      }

      metaPayload.template = {
        name: templateName,
        language: { code: templateLanguage },
        components: formattedComponents,
      };
    }

    let metaMessageId = `wamid.mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    let status = 'SENT';
    let errorMessage = null;

    if (isMock) {
      // Use Mock service logic
      await prisma.message.update({
        where: { id: message.id },
        data: {
          metaMessageId,
          status: 'SENT',
        },
      });

      // Trigger automatic delivery lifecycle updates in mock mode
      MockWhatsAppService.simulateMessageLifecycle(message.id, conversationId, text || 'Template message');
    } else {
      // Call official Meta Graph API
      const { accessToken, phoneNumberId, graphApiVersion = 'v21.0' } = credentials || {};

      if (!accessToken || !phoneNumberId) {
        status = 'FAILED';
        errorMessage = 'Missing Meta Access Token or Phone Number ID';
        await prisma.message.update({
          where: { id: message.id },
          data: { status, errorMessage },
        });
        throw new Error(errorMessage);
      }

      const url = `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaPayload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        status = 'FAILED';
        errorMessage = data.error?.message || 'Meta API returned error';
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status,
            errorCode: String(data.error?.code || 'META_API_ERROR'),
            errorMessage,
          },
        });
        throw new Error(errorMessage);
      }

      metaMessageId = data.messages?.[0]?.id || metaMessageId;

      await prisma.message.update({
        where: { id: message.id },
        data: {
          metaMessageId,
          status: 'SENT',
        },
      });
    }

    // Update conversation last message timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const updatedMessage = await prisma.message.findUnique({
      where: { id: message.id },
    });

    // Broadcast live event via SSE
    eventBus.emit(SSE_EVENTS.NEW_MESSAGE, {
      organizationId,
      conversationId,
      message: updatedMessage,
    });

    return updatedMessage;
  }
}
