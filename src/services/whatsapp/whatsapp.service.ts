import { prisma } from '@/lib/prisma';

export interface MetaConnectionCredentials {
  appId?: string | null;
  appSecret?: string | null;
  accessToken?: string | null;
  wabaId?: string | null;
  phoneNumberId?: string | null;
  graphApiVersion?: string | null;
  webhookVerifyToken?: string | null;
}

export class WhatsAppService {
  private static graphApiVersion = process.env.META_GRAPH_API_VERSION || 'v21.0';

  /**
   * Fetch active connection credentials for an organization
   */
  static async getCredentials(organizationId: string): Promise<MetaConnectionCredentials | null> {
    const connection = await prisma.whatsAppConnection.findUnique({
      where: { organizationId },
    });

    if (!connection) {
      // Fallback to process.env if available
      return {
        appId: process.env.META_APP_ID,
        appSecret: process.env.META_APP_SECRET,
        accessToken: process.env.META_ACCESS_TOKEN,
        wabaId: process.env.META_WABA_ID,
        phoneNumberId: process.env.META_PHONE_NUMBER_ID,
        graphApiVersion: process.env.META_GRAPH_API_VERSION || 'v21.0',
        webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
      };
    }

    return {
      appId: connection.appId || process.env.META_APP_ID,
      appSecret: connection.appSecret || process.env.META_APP_SECRET,
      accessToken: connection.accessToken || process.env.META_ACCESS_TOKEN,
      wabaId: connection.wabaId || process.env.META_WABA_ID,
      phoneNumberId: connection.phoneNumberId || process.env.META_PHONE_NUMBER_ID,
      graphApiVersion: connection.graphApiVersion || process.env.META_GRAPH_API_VERSION || 'v21.0',
      webhookVerifyToken: connection.webhookVerifyToken || process.env.META_WEBHOOK_VERIFY_TOKEN,
    };
  }

  /**
   * Test WhatsApp Connection against Meta Graph API
   */
  static async testConnection(credentials: MetaConnectionCredentials): Promise<{
    success: boolean;
    status: string;
    message: string;
    details?: any;
  }> {
    const isMock = process.env.WHATSAPP_MOCK_MODE === 'true';

    if (isMock) {
      return {
        success: true,
        status: 'CONNECTED',
        message: 'WhatsApp Cloud API connection verified successfully (Mock Mode)',
        details: {
          mockMode: true,
          phone_number: '+1 555 019 2831',
          display_phone_number: '+1 555-019-2831',
          verified_name: 'WhatsApp CRM Sandbox',
          quality_rating: 'GREEN',
        },
      };
    }

    const { accessToken, phoneNumberId, graphApiVersion = 'v21.0' } = credentials;

    if (!accessToken || !phoneNumberId) {
      return {
        success: false,
        status: 'CONFIG_ERROR',
        message: 'Missing Access Token or Phone Number ID in configuration.',
      };
    }

    try {
      const url = `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === 190) {
          return {
            success: false,
            status: 'TOKEN_EXPIRED',
            message: 'Meta Access Token has expired or is invalid.',
            details: data.error,
          };
        }
        return {
          success: false,
          status: 'INVALID_TOKEN',
          message: data.error?.message || 'Failed to verify WhatsApp Phone Number ID',
          details: data.error,
        };
      }

      return {
        success: true,
        status: 'CONNECTED',
        message: `Successfully connected to phone number ${data.display_phone_number || phoneNumberId}`,
        details: data,
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'CONFIG_ERROR',
        message: error.message || 'Network error connecting to Meta Graph API.',
      };
    }
  }
}
