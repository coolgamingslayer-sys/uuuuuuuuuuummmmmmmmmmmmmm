import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/env";
import { sendDownloadEmail } from "@/lib/email";
import { signDownloadToken } from "@/lib/jwt";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature as string, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;
    if (email) {
      const token = await signDownloadToken({ sub: email, product: "ai-starter" }, 60 * 60 * 72);
      const downloadUrl = `${getBaseUrl()}/api/download?token=${encodeURIComponent(token)}`;
      try {
        await sendDownloadEmail(email, downloadUrl);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: `Failed to send email: ${message}` }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}