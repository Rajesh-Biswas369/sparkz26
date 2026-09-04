import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // Make sure we have a secret configured
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing RAZORPAY_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error("Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse payload
    const payload = JSON.parse(rawBody);

    // Process payment.captured event
    if (payload.event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const amountInPaise = paymentEntity.amount;

      // 1. Convert paise to Rupees
      const amountInRupees = amountInPaise / 100;
      
      // 2. Subtract 1
      const adjustedAmount = amountInRupees - 1;

      console.log(`Razorpay payment captured: ₹${amountInRupees}. Adding ₹${adjustedAmount} to treasury.`);

      // 3. Update Firestore using atomic increment
      const masterLedgerRef = db.collection('treasury').doc('master_ledger');
      await masterLedgerRef.set({
        online: FieldValue.increment(adjustedAmount),
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
