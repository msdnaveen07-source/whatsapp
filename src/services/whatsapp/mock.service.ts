import { prisma } from '@/lib/prisma';
import { eventBus, SSE_EVENTS } from '@/lib/sse';

export class MockWhatsAppService {
  /**
   * Simulate outbound message status transitions: SENT -> DELIVERED -> READ
   * and create simulated customer response
   */
  static simulateMessageLifecycle(messageId: string, conversationId: string, outboundText: string) {
    // 1. After 1.5s -> DELIVERED
    setTimeout(async () => {
      try {
        const msg = await prisma.message.update({
          where: { id: messageId },
          data: { status: 'DELIVERED' },
        });

        eventBus.emit(SSE_EVENTS.MESSAGE_STATUS_UPDATE, {
          organizationId: msg.organizationId,
          conversationId,
          messageId,
          status: 'DELIVERED',
        });
      } catch (err) {
        // Ignore if deleted
      }
    }, 1500);

    // 2. After 3.5s -> READ
    setTimeout(async () => {
      try {
        const msg = await prisma.message.update({
          where: { id: messageId },
          data: { status: 'READ' },
        });

        eventBus.emit(SSE_EVENTS.MESSAGE_STATUS_UPDATE, {
          organizationId: msg.organizationId,
          conversationId,
          messageId,
          status: 'READ',
        });
      } catch (err) {
        // Ignore if deleted
      }
    }, 3500);

    // 3. After 6.0s -> Simulate Customer Automated Inbound Reply
    setTimeout(async () => {
      try {
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { contact: true },
        });

        if (!conv) return;

        const replies = [
          'Thanks for the update! Very helpful.',
          'Got it! When is your team available for a quick call?',
          'Sounds great! Thanks for reaching out via WhatsApp.',
          'Confirmed. Thank you!',
        ];

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const metaMessageId = `wamid.mock_inbound_${Date.now()}`;

        const replyMsg = await prisma.message.create({
          data: {
            organizationId: conv.organizationId,
            conversationId: conv.id,
            contactId: conv.contactId,
            metaMessageId,
            direction: 'INBOUND',
            messageType: 'TEXT',
            text: randomReply,
            status: 'READ',
          },
        });

        await prisma.conversation.update({
          where: { id: conv.id },
          data: {
            unreadCount: { increment: 1 },
            lastMessageAt: new Date(),
            status: 'OPEN',
          },
        });

        eventBus.emit(SSE_EVENTS.NEW_MESSAGE, {
          organizationId: conv.organizationId,
          conversationId: conv.id,
          message: replyMsg,
        });
      } catch (err) {
        // Ignore
      }
    }, 6000);
  }
}
