import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not set');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const body = JSON.parse(rawBody);

    if (body.event === 'payment.captured') {
      const amountInPaise = body.payload.payment.entity.amount;
      const amountInRupees = amountInPaise / 100;
      const adjustedAmount = amountInRupees - 1;

      const treasuryRef = doc(db, 'treasury', 'master_ledger');
      await updateDoc(treasuryRef, { 
        online_collected: increment(adjustedAmount) 
      });
      
      console.log(`Successfully processed payment: ${amountInRupees} INR, added ${adjustedAmount} INR to treasury`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
