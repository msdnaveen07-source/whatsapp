import { NextRequest, NextResponse } from 'next/server';
import { AutomationConfigService } from '@/services/whatsapp/automation.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = AutomationConfigService.getSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = AutomationConfigService.updateSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update automation settings' }, { status: 400 });
  }
}
