import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TemplatesService } from '@/services/whatsapp/templates.service';

export async function GET(request: NextRequest) {
  const org = await prisma.organization.findFirst();
  if (!org) return NextResponse.json({ templates: [] });

  const templates = await prisma.template.findMany({
    where: { organizationId: org.id },
    include: { components: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const result = await TemplatesService.createAndSubmitTemplate({
      organizationId: org.id,
      name: body.name,
      language: body.language || 'en_US',
      category: body.category,
      headerType: body.headerType,
      headerText: body.headerText,
      bodyText: body.bodyText,
      footerText: body.footerText,
      buttons: body.buttons,
      variableExamples: body.variableExamples,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Template submission failed' }, { status: 400 });
  }
}
