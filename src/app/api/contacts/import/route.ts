import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 });
    }

    const csvText = await file.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    let createdCount = 0;
    let skippedCount = 0;

    for (const row of parsed.data as any[]) {
      const name = row.name || row.Name || row['Full Name'];
      const phone = row.phone || row.Phone || row['Phone Number'] || row.mobile;
      const email = row.email || row.Email;

      if (!phone) {
        skippedCount++;
        continue;
      }

      const formattedPhone = String(phone).replace(/[^\d]/g, '');

      try {
        await prisma.contact.upsert({
          where: {
            organizationId_phone: {
              organizationId: org.id,
              phone: formattedPhone,
            },
          },
          update: {
            name: name || 'Contact',
            email: email || undefined,
          },
          create: {
            organizationId: org.id,
            name: name || `Contact +${formattedPhone}`,
            phone: formattedPhone,
            email: email || null,
            whatsappId: formattedPhone,
            source: 'IMPORT',
          },
        });
        createdCount++;
      } catch (err) {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: createdCount,
      skippedCount,
      message: `Successfully imported ${createdCount} contact(s).`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'CSV Import failed' }, { status: 400 });
  }
}
