import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // OPEN, CLOSED
  const assigned = searchParams.get('assigned'); // true, false
  const filter = searchParams.get('filter'); // unread, assigned_me

  const org = await prisma.organization.findFirst();
  if (!org) return NextResponse.json({ conversations: [] });

  const whereClause: any = {
    organizationId: org.id,
  };

  if (status) {
    whereClause.status = status;
  }

  if (filter === 'unread') {
    whereClause.unreadCount = { gt: 0 };
  }

  const conversations = await prisma.conversation.findMany({
    where: whereClause,
    include: {
      contact: {
        include: {
          contactTags: {
            include: { tag: true },
          },
        },
      },
      assignedAgent: true,
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  return NextResponse.json({ conversations });
}
