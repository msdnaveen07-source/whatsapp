import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MessagesService } from '@/services/whatsapp/messages.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        recipients: { include: { contact: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.template.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Template must be APPROVED by Meta to execute campaign.' },
        { status: 400 }
      );
    }

    // Update campaign status to RUNNING
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'RUNNING' },
    });

    let sent = 0;
    let failed = 0;

    for (const recipient of campaign.recipients) {
      try {
        // Find or create conversation for contact
        let conversation = await prisma.conversation.findFirst({
          where: {
            organizationId: campaign.organizationId,
            contactId: recipient.contactId,
          },
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              organizationId: campaign.organizationId,
              contactId: recipient.contactId,
              status: 'OPEN',
            },
          });
        }

        const varMap = recipient.variables ? JSON.parse(recipient.variables) : {};

        await MessagesService.sendMessage({
          organizationId: campaign.organizationId,
          conversationId: conversation.id,
          contactId: recipient.contactId,
          recipientPhone: recipient.contact.phone,
          type: 'TEMPLATE',
          templateName: campaign.template.name,
          templateLanguage: campaign.template.language,
          templateParameters: varMap,
        });

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'SENT', sentAt: new Date() },
        });

        sent++;
      } catch (err: any) {
        failed++;
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', error: err.message },
        });
      }
    }

    // Final update campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        sentCount: sent,
        deliveredCount: sent, // Will update asynchronously as statuses come in
        readCount: sent,
        failedCount: failed,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Campaign executed successfully. Sent: ${sent}, Failed: ${failed}`,
      campaign: updatedCampaign,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Campaign execution failed' }, { status: 400 });
  }
}
