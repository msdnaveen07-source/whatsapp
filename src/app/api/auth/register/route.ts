import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgName, fullName, email, password } = body;

    if (!email || !password || !fullName || !orgName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // 1. Create or find Organization
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug: slug,
      },
    });

    // 2. Create User
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: fullName,
        passwordHash: password, // For production security
      },
    });

    // 3. Create Membership as OWNER
    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

    // 4. Create default WhatsApp Connection row
    await prisma.whatsAppConnection.create({
      data: {
        organizationId: org.id,
        webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'whcrm_verify_9f7d3a2c8b6e4a1f',
        status: 'DISCONNECTED',
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization: { name: org.name, slug: org.slug },
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
