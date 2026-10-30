import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  const org = await prisma.organization.findFirst();
  if (!org) return new NextResponse('No Organization found', { status: 404 });

  const contacts = await prisma.contact.findMany({
    where: { organizationId: org.id },
    include: {
      contactTags: { include: { tag: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const exportData = contacts.map(c => ({
    Name: c.name,
    Phone: c.phone,
    Email: c.email || '',
    WhatsAppID: c.whatsappId || '',
    Source: c.source,
    Tags: c.contactTags.map(ct => ct.tag.name).join(', '),
    CreatedAt: c.createdAt.toISOString(),
  }));

  const csv = Papa.unparse(exportData);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="whatsapp-crm-contacts-${Date.now()}.csv"`,
    },
  });
}
