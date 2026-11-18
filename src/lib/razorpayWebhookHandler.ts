import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, increment, collection, query, where, getDocs, limit } from 'firebase/firestore';

// Clean environment variable helper (removes accidental quotes and whitespace)
function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

const firebaseConfig = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const BOT_EMAIL = cleanEnv(process.env.FIREBASE_BOT_EMAIL) || 'webhook_bot@sparkz26.internal';
const BOT_PASSWORD = cleanEnv(process.env.FIREBASE_BOT_PASSWORD) || 'WebhookBotPassword2026!';

// Supported Razorpay payment completion events
const SUPPORTED_EVENTS = new Set([
  'payment.captured',
  'payment.authorized',
  'order.paid',
  'payment_link.paid',
  'qr_code.credited'
]);

// Shared mutex/promise to prevent concurrent sign-in collisions during bursts
let authPromise: Promise<any> | null = null;

// Helper to get authenticated server Firestore instance safely under high load
async function getServerDb() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (!auth.currentUser) {
    if (!authPromise) {
      authPromise = signInWithEmailAndPassword(auth, BOT_EMAIL, BOT_PASSWORD)
        .then(() => {
          console.log('[Razorpay Webhook] Authenticated server session via bot UID:', auth.currentUser?.uid);
        })
        .catch((authErr: any) => {
          console.error('[Razorpay Webhook] Failed to authenticate server bot session:', authErr.message);
          throw authErr;
        })
        .finally(() => {
          authPromise = null;
        });
    }
    await authPromise;
  }

  return db;
}

export async function handleRazorpayWebhook(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const webhookSecret = cleanEnv(process.env.RAZORPAY_WEBHOOK_SECRET);
    if (!webhookSecret) {
      console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature) {
      console.error('[Razorpay Webhook] Missing x-razorpay-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify HMAC SHA-256 signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    const isSignatureValid =
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isSignatureValid) {
      console.error('[Razorpay Webhook] Invalid signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error('[Razorpay Webhook] Failed to parse JSON body');
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const eventName = payload.event;
    console.log(`[Razorpay Webhook] Received event: ${eventName}`);

    if (!SUPPORTED_EVENTS.has(eventName)) {
      console.log(`[Razorpay Webhook] Event '${eventName}' is not a payment completion event. Acknowledged.`);
      return NextResponse.json({ status: 'ignored', event: eventName }, { status: 200 });
    }

    // Extract payment entities
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const paymentLinkEntity = payload.payload?.payment_link?.entity;
    const qrCodeEntity = payload.payload?.qr_code?.entity;

    const amountInPaise =
      paymentEntity?.amount ??
      orderEntity?.amount_paid ??
      paymentLinkEntity?.amount_paid ??
      qrCodeEntity?.amount;

    if (amountInPaise === undefined || amountInPaise === null || isNaN(Number(amountInPaise))) {
      console.warn('[Razorpay Webhook] No valid amount found in supported event payload');
      return NextResponse.json({ status: 'ok', warning: 'No amount in payload' }, { status: 200 });
    }

    const transactionId =
      paymentEntity?.id ||
      orderEntity?.id ||
      paymentLinkEntity?.id ||
      qrCodeEntity?.id ||
      payload.event_id ||
      `tx_${Date.now()}`;

    // 1. Convert paise to Rupees
    const amountInRupees = Number(amountInPaise) / 100;

    // 2. Adjust for project fee rule:
    // e.g. For ₹61 payment, deduct ₹1 -> adds ₹60 to treasury.
    // For ₹501 payment, deduct ₹1 -> adds ₹500 to treasury.
    const adjustedAmount = amountInRupees > 1 ? amountInRupees - 1 : amountInRupees;

    console.log(`[Razorpay Webhook] Processing Tx ${transactionId}: ₹${amountInRupees} (Credited to Treasury: ₹${adjustedAmount})`);

    const db = await getServerDb();

    // Check for deduplication (prevents double crediting on retry/multiple events)
    const txRef = doc(db, 'treasury_transactions', transactionId);
    const existingTx = await getDoc(txRef);
    if (existingTx.exists()) {
      console.log(`[Razorpay Webhook] Transaction ${transactionId} already processed. Skipping duplicate treasury increment.`);
      return NextResponse.json({ status: 'already_processed', transactionId }, { status: 200 });
    }

    // Update treasury master_ledger with atomic increment (concurrency-safe)
    const treasuryRef = doc(db, 'treasury', 'master_ledger');
    await setDoc(treasuryRef, {
      online_collected: increment(adjustedAmount),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // Record transaction for deduplication and audit trail
    await setDoc(txRef, {
      transactionId,
      event: eventName,
      amountInPaise,
      amountInRupees,
      adjustedAmount,
      email: paymentEntity?.email || null,
      contact: paymentEntity?.contact || null,
      method: paymentEntity?.method || null,
      processedAt: new Date().toISOString()
    });

    // Optional Auto-link: If roll number or mobile number is provided, mark contributor as paid
    try {
      const notes = paymentEntity?.notes || orderEntity?.notes || {};
      const rollNumber = notes.rollNumber || notes.roll_number || notes.roll || notes.roll_no;
      const rawContact = paymentEntity?.contact || '';
      const cleanPhone = rawContact.replace(/^\+91/, '').replace(/^0+/, '').trim();

      if (rollNumber) {
        const contributorRef = doc(db, 'contributors', String(rollNumber).trim());
        const cSnap = await getDoc(contributorRef);
        if (cSnap.exists() && cSnap.data()?.status !== 'paid') {
          await setDoc(contributorRef, {
            status: 'paid',
            amount: adjustedAmount,
            paymentMethod: 'online',
            recipient: 'Razorpay Webhook',
            collected: false,
            transactionId,
            timestamp: new Date().toISOString()
          }, { merge: true });
          console.log(`[Razorpay Webhook] Auto-marked contributor ${rollNumber} as paid.`);
        }
      } else if (cleanPhone && cleanPhone.length === 10) {
        const qPhone = query(collection(db, 'contributors'), where('phone', '==', cleanPhone), limit(1));
        const phoneSnap = await getDocs(qPhone);
        if (!phoneSnap.empty) {
          const docItem = phoneSnap.docs[0];
          if (docItem.data()?.status !== 'paid') {
            await setDoc(docItem.ref, {
              status: 'paid',
              amount: adjustedAmount,
              paymentMethod: 'online',
              recipient: 'Razorpay Webhook',
              collected: false,
              transactionId,
              timestamp: new Date().toISOString()
            }, { merge: true });
            console.log(`[Razorpay Webhook] Auto-marked contributor with phone ${cleanPhone} as paid.`);
          }
        }
      }
    } catch (contribErr) {
      console.warn('[Razorpay Webhook] Contributor auto-match notice (non-fatal):', contribErr);
    }

    console.log(`[Razorpay Webhook] Successfully updated treasury! Added ₹${adjustedAmount} to online_collected for Tx ${transactionId}`);

    return NextResponse.json({
      status: 'ok',
      transactionId,
      amountInRupees,
      adjustedAmount
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Razorpay Webhook] Error processing webhook:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message || String(error)
    }, { status: 500 });
  }
}
