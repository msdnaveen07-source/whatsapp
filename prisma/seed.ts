import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding WhatsApp Connect CRM database...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Global Corp',
      slug: 'acme-corp',
    },
  });

  // 2. Create Default Admin User
  const user = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Sarah Connor',
      passwordHash: 'hashed_password_demo', // In production, bcrypt hash
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  // Create Membership
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: user.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      organizationId: org.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  // 3. Create WhatsApp Connection
  await prisma.whatsAppConnection.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      appId: process.env.META_APP_ID || '123456789012345',
      appSecret: process.env.META_APP_SECRET || '0123456789abcdef0123456789abcdef',
      accessToken: process.env.META_ACCESS_TOKEN || 'EAAG_mock_access_token',
      wabaId: process.env.META_WABA_ID || '100987654321098',
      phoneNumberId: process.env.META_PHONE_NUMBER_ID || '105432109876543',
      phoneNumber: '+1 (555) 019-2831',
      webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'whcrm_verify_9f7d3a2c8b6e4a1f',
      status: 'CONNECTED',
      webhookStatus: 'VERIFIED',
    },
  });

  // 4. Create Tags
  const vipTag = await prisma.tag.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'VIP Lead' } },
    update: {},
    create: { organizationId: org.id, name: 'VIP Lead', color: '#8B5CF6' },
  });

  const activeTag = await prisma.tag.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Active Client' } },
    update: {},
    create: { organizationId: org.id, name: 'Active Client', color: '#10B981' },
  });

  // 5. Create Sample Contacts
  const contact1 = await prisma.contact.upsert({
    where: { organizationId_phone: { organizationId: org.id, phone: '14155552671' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Alex Rivera',
      phone: '14155552671',
      email: 'alex@example.com',
      whatsappId: '14155552671',
      source: 'MANUAL',
      lastContacted: new Date(),
    },
  });

  const contact2 = await prisma.contact.upsert({
    where: { organizationId_phone: { organizationId: org.id, phone: '14155559820' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Elena Rostova',
      phone: '14155559820',
      email: 'elena@techcorp.io',
      whatsappId: '14155559820',
      source: 'INBOUND_MESSAGE',
      lastContacted: new Date(),
    },
  });

  // Attach Tags
  await prisma.contactTag.upsert({
    where: { contactId_tagId: { contactId: contact1.id, tagId: vipTag.id } },
    update: {},
    create: { contactId: contact1.id, tagId: vipTag.id },
  });

  await prisma.contactTag.upsert({
    where: { contactId_tagId: { contactId: contact2.id, tagId: activeTag.id } },
    update: {},
    create: { contactId: contact2.id, tagId: activeTag.id },
  });

  // 6. Create Active Conversation for Alex Rivera
  const conv1 = await prisma.conversation.create({
    data: {
      organizationId: org.id,
      contactId: contact1.id,
      assignedUserId: user.id,
      status: 'OPEN',
      unreadCount: 0,
      messages: {
        create: [
          {
            organizationId: org.id,
            contactId: contact1.id,
            direction: 'INBOUND',
            messageType: 'TEXT',
            text: 'Hello! I saw your demo request for the Enterprise WhatsApp CRM plan.',
            status: 'READ',
            createdAt: new Date(Date.now() - 3600000 * 2),
          },
          {
            organizationId: org.id,
            contactId: contact1.id,
            direction: 'OUTBOUND',
            messageType: 'TEXT',
            text: 'Hi Alex! Thanks for reaching out. Yes, our team can set up a personalized walkthrough for you today.',
            status: 'READ',
            createdAt: new Date(Date.now() - 3600000 * 1),
          },
          {
            organizationId: org.id,
            contactId: contact1.id,
            direction: 'INBOUND',
            messageType: 'TEXT',
            text: 'Sounds great! Can you send me the template catalog as well?',
            status: 'READ',
            createdAt: new Date(Date.now() - 1800000),
          },
        ],
      },
    },
  });

  // Create Conversation for Elena
  await prisma.conversation.create({
    data: {
      organizationId: org.id,
      contactId: contact2.id,
      status: 'OPEN',
      unreadCount: 1,
      messages: {
        create: [
          {
            organizationId: org.id,
            contactId: contact2.id,
            direction: 'INBOUND',
            messageType: 'TEXT',
            text: 'Hi, we are looking to integrate Meta WhatsApp Cloud API for our 50 customer support agents.',
            status: 'READ',
            createdAt: new Date(Date.now() - 600000),
          },
        ],
      },
    },
  });

  // 7. Create Sample Templates
  const template1 = await prisma.template.create({
    data: {
      organizationId: org.id,
      name: 'appointment_reminder',
      language: 'en_US',
      category: 'UTILITY',
      status: 'APPROVED',
      components: {
        create: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: 'Appointment Confirmation',
          },
          {
            type: 'BODY',
            text: 'Hello {{1}}, your appointment with Acme Corp is scheduled for {{2}}. Please reply YES to confirm.',
            example: JSON.stringify({ '1': 'Alex Rivera', '2': 'Tomorrow at 2:00 PM' }),
          },
          {
            type: 'FOOTER',
            text: 'Acme Customer Support',
          },
        ],
      },
    },
  });

  await prisma.template.create({
    data: {
      organizationId: org.id,
      name: 'welcome_offer_marketing',
      language: 'en_US',
      category: 'MARKETING',
      status: 'APPROVED',
      components: {
        create: [
          {
            type: 'BODY',
            text: 'Welcome {{1}}! Use code {{2}} to get 20% off your first subscription.',
            example: JSON.stringify({ '1': 'Customer', '2': 'WELCOME20' }),
          },
        ],
      },
    },
  });

  await prisma.template.create({
    data: {
      organizationId: org.id,
      name: 'security_otp_verify',
      language: 'en_US',
      category: 'AUTHENTICATION',
      status: 'PENDING',
      components: {
        create: [
          {
            type: 'BODY',
            text: 'Your verification code is {{1}}. Do not share this code with anyone.',
            example: JSON.stringify({ '1': '482910' }),
          },
        ],
      },
    },
  });

  // 8. Create Sample Broadcast Campaign
  await prisma.campaign.create({
    data: {
      organizationId: org.id,
      templateId: template1.id,
      name: 'Q4 Customer Appointment Reminders',
      status: 'COMPLETED',
      totalTarget: 2,
      sentCount: 2,
      deliveredCount: 2,
      readCount: 2,
      failedCount: 0,
      recipients: {
        create: [
          {
            contactId: contact1.id,
            status: 'READ',
            variables: JSON.stringify({ '1': 'Alex', '2': 'Friday 3 PM' }),
          },
          {
            contactId: contact2.id,
            status: 'READ',
            variables: JSON.stringify({ '1': 'Elena', '2': 'Friday 4 PM' }),
          },
        ],
      },
    },
  });

  console.log('Database seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
