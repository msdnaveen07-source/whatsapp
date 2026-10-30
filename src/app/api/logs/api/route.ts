import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  const whereClause: any = {};
  if (type) whereClause.requestType = type;
  if (status === 'success') whereClause.statusCode = { lt: 400 };
  if (status === 'failed') whereClause.statusCode = { gte: 400 };

  const logs = await prisma.apiLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ logs });
}
