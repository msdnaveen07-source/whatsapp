import { WhatsAppService } from './whatsapp.service';
import { prisma } from '@/lib/prisma';

export interface CreateTemplateInput {
  organizationId: string;
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  headerType?: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL';
    text: string;
    phoneNumber?: string;
    url?: string;
  }>;
  variableExamples?: Record<string, string>; // e.g. {"1": "John", "2": "2026-10-01"}
}

export class TemplatesService {
  /**
   * Validate Meta template specs before submitting
   */
  static validateTemplate(input: CreateTemplateInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Name format: lowercase, alphanumeric and underscores only
    const nameRegex = /^[a-z0-9_]+$/;
    if (!input.name || !nameRegex.test(input.name)) {
      errors.push('Template name must contain only lowercase letters, numbers, and underscores (e.g. appointment_reminder).');
    }

    if (!input.bodyText || input.bodyText.trim().length === 0) {
      errors.push('Template body text is required.');
    }

    // Check variables in bodyText {{1}}, {{2}}
    const varMatches = input.bodyText.match(/\{\{(\d+)\}\}/g);
    if (varMatches) {
      const varIndices = varMatches.map(m => parseInt(m.replace(/\D/g, ''), 10));
      // Must start at 1 and be sequential
      const sorted = [...varIndices].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] !== i + 1) {
          errors.push(`Template variables must be sequential starting from {{1}}. Found invalid variable {{${sorted[i]}}}.`);
          break;
        }
      }

      // Check if variable examples are provided
      for (const idx of varIndices) {
        if (!input.variableExamples || !input.variableExamples[String(idx)]) {
          errors.push(`Example value for variable {{${idx}}} is required by Meta API.`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Submit template to Meta Cloud API or save as local PENDING template
   */
  static async createAndSubmitTemplate(input: CreateTemplateInput) {
    const validation = this.validateTemplate(input);
    if (!validation.valid) {
      throw new Error(`Validation Error: ${validation.errors.join(' ')}`);
    }

    const {
      organizationId,
      name,
      language = 'en_US',
      category,
      headerType = 'NONE',
      headerText,
      bodyText,
      footerText,
      buttons,
      variableExamples,
    } = input;

    // 1. Create Template in Database
    const template = await prisma.template.create({
      data: {
        organizationId,
        name,
        language,
        category,
        status: 'PENDING',
        components: {
          create: [
            ...(headerType !== 'NONE'
              ? [
                  {
                    type: 'HEADER',
                    format: headerType,
                    text: headerType === 'TEXT' ? headerText : null,
                  },
                ]
              : []),
            {
              type: 'BODY',
              text: bodyText,
              example: variableExamples ? JSON.stringify(variableExamples) : null,
            },
            ...(footerText
              ? [
                  {
                    type: 'FOOTER',
                    text: footerText,
                  },
                ]
              : []),
            ...(buttons && buttons.length > 0
              ? [
                  {
                    type: 'BUTTONS',
                    buttons: JSON.stringify(buttons),
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        components: true,
      },
    });

    const isMock = process.env.WHATSAPP_MOCK_MODE === 'true';

    if (isMock) {
      // In Mock Mode, keep as PENDING, but set metaTemplateId
      await prisma.template.update({
        where: { id: template.id },
        data: { metaTemplateId: `meta_tpl_${Date.now()}` },
      });
      return {
        template,
        metaSubmitted: true,
        message: 'Submitted to Meta for review (Mock Mode)',
      };
    }

    // Call Real Meta Graph API
    const credentials = await WhatsAppService.getCredentials(organizationId);
    const { accessToken, wabaId, graphApiVersion = 'v21.0' } = credentials || {};

    if (!accessToken || !wabaId) {
      throw new Error('Missing Meta Access Token or WABA ID in settings.');
    }

    // Build Meta components array
    const metaComponents: any[] = [];

    if (headerType !== 'NONE') {
      const headerComp: any = {
        type: 'HEADER',
        format: headerType,
      };
      if (headerType === 'TEXT' && headerText) {
        headerComp.text = headerText;
      }
      metaComponents.push(headerComp);
    }

    const bodyComp: any = {
      type: 'BODY',
      text: bodyText,
    };

    if (variableExamples && Object.keys(variableExamples).length > 0) {
      const sampleValues = Object.keys(variableExamples)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => variableExamples[key]);
      bodyComp.example = {
        body_text: [sampleValues],
      };
    }
    metaComponents.push(bodyComp);

    if (footerText) {
      metaComponents.push({
        type: 'FOOTER',
        text: footerText,
      });
    }

    if (buttons && buttons.length > 0) {
      metaComponents.push({
        type: 'BUTTONS',
        buttons: buttons.map(btn => {
          if (btn.type === 'QUICK_REPLY') {
            return { type: 'QUICK_REPLY', text: btn.text };
          }
          if (btn.type === 'PHONE_NUMBER') {
            return { type: 'PHONE_NUMBER', text: btn.text, phone_number: btn.phoneNumber };
          }
          if (btn.type === 'URL') {
            return { type: 'URL', text: btn.text, url: btn.url };
          }
          return { type: 'QUICK_REPLY', text: btn.text };
        }),
      });
    }

    const payload = {
      name,
      language,
      category,
      components: metaComponents,
    };

    const url = `https://graph.facebook.com/${graphApiVersion}/${wabaId}/message_templates`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const metaErr = data.error?.message || 'Meta API template submission failed.';
      await prisma.template.update({
        where: { id: template.id },
        data: {
          status: 'REJECTED',
          rejectionReason: metaErr,
        },
      });
      throw new Error(metaErr);
    }

    await prisma.template.update({
      where: { id: template.id },
      data: {
        metaTemplateId: data.id,
        status: data.status || 'PENDING',
      },
    });

    return {
      template,
      metaSubmitted: true,
      metaId: data.id,
      message: 'Submitted to Meta for review',
    };
  }

  /**
   * Sync Template status from Meta Graph API
   */
  static async syncTemplates(organizationId: string) {
    const isMock = process.env.WHATSAPP_MOCK_MODE === 'true';

    if (isMock) {
      // In mock mode, transition any PENDING templates to APPROVED for testing
      const pending = await prisma.template.findMany({
        where: { organizationId, status: 'PENDING' },
      });

      for (const t of pending) {
        await prisma.template.update({
          where: { id: t.id },
          data: { status: 'APPROVED' },
        });
      }

      return {
        syncedCount: pending.length,
        message: `Synced ${pending.length} template(s). Mock pending templates updated to APPROVED.`,
      };
    }

    const credentials = await WhatsAppService.getCredentials(organizationId);
    const { accessToken, wabaId, graphApiVersion = 'v21.0' } = credentials || {};

    if (!accessToken || !wabaId) {
      throw new Error('Missing Meta Access Token or WABA ID.');
    }

    const url = `https://graph.facebook.com/${graphApiVersion}/${wabaId}/message_templates?limit=100`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Failed to fetch templates from Meta API.');
    }

    const metaTemplates: any[] = data.data || [];
    let updatedCount = 0;

    for (const metaTpl of metaTemplates) {
      const existing = await prisma.template.findFirst({
        where: {
          organizationId,
          name: metaTpl.name,
          language: metaTpl.language,
        },
      });

      if (existing) {
        await prisma.template.update({
          where: { id: existing.id },
          data: {
            metaTemplateId: metaTpl.id,
            status: metaTpl.status, // APPROVED, REJECTED, PENDING, DISABLED
            rejectionReason: metaTpl.reason || null,
          },
        });
        updatedCount++;
      }
    }

    return {
      syncedCount: updatedCount,
      totalMetaTemplates: metaTemplates.length,
      message: `Successfully synced ${updatedCount} template(s) with Meta API.`,
    };
  }
}
