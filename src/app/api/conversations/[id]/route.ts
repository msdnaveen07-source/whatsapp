import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      contact: {
        include: {
          contactTags: { include: { tag: true } },
          notes: {
            include: { author: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      assignedAgent: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, assignedUserId } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (assignedUserId !== undefined) updateData.assignedUserId = assignedUserId;

    const updated = await prisma.conversation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contact: true,
        assignedAgent: true,
      },
    });

    return NextResponse.json({ conversation: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 400 });
  }
}
