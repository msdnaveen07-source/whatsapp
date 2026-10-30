import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const conversationId = params.id;

  // Mark conversation as read
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { unreadCount: 0 },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    include: {
      statuses: true,
    },
  });

  return NextResponse.json({ messages });
}
