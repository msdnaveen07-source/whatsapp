import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MessagesService } from '@/services/whatsapp/messages.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, type = 'TEXT', text, mediaUrl, caption, mimeType } = body;

    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const message = await MessagesService.sendMessage({
      organizationId: org.id,
      conversationId,
      contactId: conversation.contactId,
      recipientPhone: conversation.contact.phone,
      type,
      text,
      mediaUrl,
      caption,
      mimeType,
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 400 });
  }
}
