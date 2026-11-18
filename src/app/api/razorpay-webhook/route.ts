import { NextRequest, NextResponse } from 'next/server';
import { handleRazorpayWebhook } from '@/lib/razorpayWebhookHandler';

export async function POST(req: NextRequest) {
  return handleRazorpayWebhook(req);
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/razorpay-webhook',
    message: 'Razorpay webhook endpoint ready'
  });
}
