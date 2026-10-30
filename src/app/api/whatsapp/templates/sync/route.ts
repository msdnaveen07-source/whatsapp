import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TemplatesService } from '@/services/whatsapp/templates.service';

export async function POST(request: NextRequest) {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const result = await TemplatesService.syncTemplates(org.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Template status sync failed' }, { status: 400 });
  }
}
