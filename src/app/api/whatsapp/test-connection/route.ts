import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/services/whatsapp/whatsapp.service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    const isMasked = (str?: string) => !str || str.includes('•') || str.includes('***');

    let resolvedCreds: any = {
      appId: body.appId || undefined,
      appSecret: body.appSecret || undefined,
      accessToken: body.accessToken || undefined,
      wabaId: body.wabaId || undefined,
      phoneNumberId: body.phoneNumberId || undefined,
      graphApiVersion: body.graphApiVersion || 'v21.0',
    };

    // If access token has masked bullet characters, load actual token from database
    if (isMasked(resolvedCreds.accessToken)) {
      const dbCreds = await WhatsAppService.getCredentials(org.id);
      if (dbCreds?.accessToken) {
        resolvedCreds.accessToken = dbCreds.accessToken;
      }
    }

    if (isMasked(resolvedCreds.appSecret)) {
      const dbCreds = await WhatsAppService.getCredentials(org.id);
      if (dbCreds?.appSecret) {
        resolvedCreds.appSecret = dbCreds.appSecret;
      }
    }

    const activeCreds = resolvedCreds.accessToken
      ? resolvedCreds
      : await WhatsAppService.getCredentials(org.id);

    if (!activeCreds || isMasked(activeCreds.accessToken)) {
      return NextResponse.json({
        success: false,
        status: 'CONFIG_ERROR',
        message: 'Please enter a valid Meta Access Token (do not use placeholder dots).',
      });
    }

    const result = await WhatsAppService.testConnection(activeCreds);

    // Update DB connection status if connection object exists
    const connection = await prisma.whatsAppConnection.findUnique({
      where: { organizationId: org.id },
    });

    if (connection) {
      await prisma.whatsAppConnection.update({
        where: { id: connection.id },
        data: {
          status: result.status,
          lastTestedAt: new Date(),
          lastErrorMessage: result.success ? null : result.message,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: 'CONFIG_ERROR', message: error.message || 'Connection test failed' },
      { status: 500 }
    );
  }
}
