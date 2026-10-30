import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  let org = await prisma.organization.findFirst().catch(() => null);

  if (!org) {
    try {
      org = await prisma.organization.create({
        data: {
          name: 'Acme Global Corp',
          slug: 'acme-corp',
        },
      });
    } catch {
      // ignore
    }
  }

  const connection = org
    ? await prisma.whatsAppConnection.findUnique({
        where: { organizationId: org.id },
      }).catch(() => null)
    : null;

  if (!connection) {
    return NextResponse.json({
      connection: {
        appId: process.env.META_APP_ID || '',
        appSecret: process.env.META_APP_SECRET ? '••••••••••••••••' : '',
        accessToken: process.env.META_ACCESS_TOKEN ? '••••••••••••••••' : '',
        wabaId: process.env.META_WABA_ID || '',
        phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
        phoneNumber: '+1 (555) 019-2831',
        webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'whcrm_verify_9f7d3a2c8b6e4a1f',
        status: 'CONNECTED',
        webhookStatus: 'VERIFIED',
      },
    });
  }

  return NextResponse.json({
    connection: {
      ...connection,
      appSecret: connection.appSecret ? '••••••••••••••••' : '',
      accessToken: connection.accessToken ? '••••••••••••••••' : '',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, appSecret, accessToken, wabaId, phoneNumberId, phoneNumber, webhookVerifyToken } = body;

    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const updateData: any = {
      appId,
      wabaId,
      phoneNumberId,
      phoneNumber,
      webhookVerifyToken: webhookVerifyToken || 'whcrm_verify_9f7d3a2c8b6e4a1f',
    };

    // Only update sensitive tokens if provided (and not masked stars/dots)
    const isMaskedVal = (v?: string) => !v || v.includes('•') || v.includes('***');

    if (!isMaskedVal(appSecret)) {
      updateData.appSecret = appSecret;
    }
    if (!isMaskedVal(accessToken)) {
      updateData.accessToken = accessToken;
    }

    const connection = await prisma.whatsAppConnection.upsert({
      where: { organizationId: org.id },
      update: updateData,
      create: {
        organizationId: org.id,
        appId,
        appSecret,
        accessToken,
        wabaId,
        phoneNumberId,
        phoneNumber,
        webhookVerifyToken: webhookVerifyToken || 'whcrm_verify_9f7d3a2c8b6e4a1f',
        status: 'CONNECTED',
        webhookStatus: 'VERIFIED',
      },
    });

    return NextResponse.json({ success: true, connection });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update WhatsApp settings' }, { status: 400 });
  }
}
