import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const org = await prisma.organization.findFirst();
  if (!org) return NextResponse.json({ campaigns: [] });

  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: org.id },
    include: {
      template: true,
      recipients: { include: { contact: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, templateId, contactIds, variables } = body;

    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template || template.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Template must be APPROVED by Meta to run broadcast campaigns.' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        organizationId: org.id,
        templateId,
        name,
        status: 'DRAFT',
        totalTarget: contactIds.length,
        recipients: {
          create: contactIds.map((cId: string) => ({
            contactId: cId,
            status: 'PENDING',
            variables: variables ? JSON.stringify(variables) : null,
          })),
        },
      },
      include: {
        recipients: true,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 400 });
  }
}
