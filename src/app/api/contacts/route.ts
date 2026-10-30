import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const tag = searchParams.get('tag');

  const org = await prisma.organization.findFirst();
  if (!org) return NextResponse.json({ contacts: [] });

  const whereClause: any = {
    organizationId: org.id,
  };

  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ];
  }

  if (tag) {
    whereClause.contactTags = {
      some: {
        tag: { name: tag },
      },
    };
  }

  const contacts = await prisma.contact.findMany({
    where: whereClause,
    include: {
      contactTags: { include: { tag: true } },
      conversations: {
        take: 1,
        orderBy: { lastMessageAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const tags = await prisma.tag.findMany({
    where: { organizationId: org.id },
  });

  return NextResponse.json({ contacts, tags });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, tags } = body;

    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const formattedPhone = phone.replace(/[^\d]/g, '');

    const contact = await prisma.contact.create({
      data: {
        organizationId: org.id,
        name,
        phone: formattedPhone,
        email,
        whatsappId: formattedPhone,
        source: 'MANUAL',
      },
    });

    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        let tagRecord = await prisma.tag.findFirst({
          where: { organizationId: org.id, name: tagName },
        });

        if (!tagRecord) {
          tagRecord = await prisma.tag.create({
            data: { organizationId: org.id, name: tagName },
          });
        }

        await prisma.contactTag.create({
          data: {
            contactId: contact.id,
            tagId: tagRecord.id,
          },
        });
      }
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create contact' }, { status: 400 });
  }
}
