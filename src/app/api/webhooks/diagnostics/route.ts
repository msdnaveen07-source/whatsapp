import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const connection = await prisma.whatsAppConnection.findFirst();
  const verifyToken = connection?.webhookVerifyToken || process.env.META_WEBHOOK_VERIFY_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;

  const lastEvent = await prisma.webhookEvent.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  const totalEventsCount = await prisma.webhookEvent.count();
  const lastError = await prisma.apiLog.findFirst({
    where: { requestType: 'WEBHOOK', statusCode: { gte: 400 } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    callbackUrl: webhookUrl,
    verifyTokenConfigured: Boolean(verifyToken),
    verifyTokenMasked: verifyToken ? `${verifyToken.substring(0, 4)}...${verifyToken.slice(-4)}` : null,
    webhookStatus: connection?.webhookStatus || 'NOT_VERIFIED',
    messagesSubscribed: true,
    lastWebhookReceivedAt: lastEvent?.createdAt || null,
    totalEventsCount,
    lastWebhookEvent: lastEvent ? JSON.parse(lastEvent.payload) : null,
    lastError: lastError ? lastError.errorMessage : null,
  });
}
