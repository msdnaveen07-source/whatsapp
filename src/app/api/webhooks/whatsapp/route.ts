import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WebhookService } from '@/services/whatsapp/webhook.service';

/**
 * GET /api/webhooks/whatsapp
 * Meta WhatsApp Cloud API Verification Endpoint
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  let storedVerifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'whcrm_verify_9f7d3a2c8b6e4a1f';

  try {
    const connection = await prisma.whatsAppConnection.findFirst();
    if (connection?.webhookVerifyToken) {
      storedVerifyToken = connection.webhookVerifyToken;
    }

    if (mode === 'subscribe' && token === storedVerifyToken) {
      if (connection) {
        await prisma.whatsAppConnection.update({
          where: { id: connection.id },
          data: { webhookStatus: 'VERIFIED' },
        }).catch(() => null);
      }

      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch (err) {
    // If DB is unreachable during Meta verification, verify against ENV token
    if (mode === 'subscribe' && token === storedVerifyToken) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }

  // Token mismatch
  return new NextResponse('Forbidden: Webhook verification token mismatch', { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp
 * Receives incoming WhatsApp Cloud API events
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  const connection = await prisma.whatsAppConnection.findFirst();
  const appSecret = connection?.appSecret || process.env.META_APP_SECRET;
  const isMock = process.env.WHATSAPP_MOCK_MODE === 'true';

  // Signature validation if appSecret is present and not mock mode
  if (appSecret && !isMock) {
    const isValid = WebhookService.verifySignature(rawBody, signature, appSecret);
    if (!isValid) {
      await prisma.apiLog.create({
        data: {
          endpoint: '/api/webhooks/whatsapp',
          method: 'POST',
          requestType: 'WEBHOOK',
          statusCode: 401,
          durationMs: Date.now() - startTime,
          requestBody: rawBody,
          errorMessage: 'Invalid HMAC-SHA256 signature',
        },
      });
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(rawBody);

    // Process event asynchronously
    WebhookService.processWebhookPayload(payload, rawBody).catch(err => {
      console.error('Asynchronous webhook payload error:', err);
    });

    await prisma.apiLog.create({
      data: {
        endpoint: '/api/webhooks/whatsapp',
        method: 'POST',
        requestType: 'WEBHOOK',
        statusCode: 200,
        durationMs: Date.now() - startTime,
        requestBody: rawBody.length > 1000 ? rawBody.substring(0, 1000) + '...' : rawBody,
        responseBody: JSON.stringify({ status: 'EVENT_RECEIVED' }),
      },
    });

    // Return HTTP 200 quickly to Meta API
    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid JSON' }, { status: 400 });
  }
}
