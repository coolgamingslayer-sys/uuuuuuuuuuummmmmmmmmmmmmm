"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url as string;
      } else {
        alert("Failed to start checkout.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg">AI Starter</Link>
          <button onClick={startCheckout} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50">
            {loading ? "Processing..." : "Buy now $49"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              Ultimate AI Business Starter Kit
            </h1>
            <p className="text-lg text-neutral-700">
              Launch and scale an AI-powered microbusiness in days, not months. Get 100+ battle-tested prompts, automations, SOPs, a plug-and-play Notion OS, and client-ready templates.
            </p>
            <ul className="space-y-2 text-neutral-800">
              <li>• 100+ proven prompts across sales, marketing, ops</li>
              <li>• Notion OS for pipeline, content, finances</li>
              <li>• Zapier/Make automations and walkthroughs</li>
              <li>• Client proposal, SOW, onboarding templates</li>
              <li>• Lifetime updates</li>
            </ul>
            <div className="flex gap-3 pt-4">
              <button onClick={startCheckout} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-6 py-3 text-base font-medium disabled:opacity-50">
                {loading ? "Redirecting..." : "Get the kit – $49"}
              </button>
              <a href="#details" className="px-6 py-3 rounded-lg border border-neutral-300">See what’s inside</a>
            </div>
            <p className="text-sm text-neutral-500">Secure checkout by Stripe. Instant delivery via email.</p>
          </div>
          <div className="border border-neutral-200 rounded-xl p-4 md:p-6">
            <div className="aspect-[4/3] w-full rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500">
              Preview
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-neutral-600">
              <div className="h-16 bg-neutral-100 rounded" />
              <div className="h-16 bg-neutral-100 rounded" />
              <div className="h-16 bg-neutral-100 rounded" />
            </div>
          </div>
        </section>

        <section id="details" className="mt-20 grid md:grid-cols-3 gap-6">
          {[
            ["AI Playbooks", "Step-by-step strategies for acquisition, retention, and ops."],
            ["Prompt Library", "100+ ready-to-use prompts for growth and delivery."],
            ["Notion OS", "Projects, clients, content, finances – all streamlined."],
            ["Automations", "Zapier/Make blueprints to automate your workflow."],
            ["Templates", "Proposals, SOWs, onboarding decks, and more."],
            ["Updates", "Lifetime updates as the AI landscape evolves."],
          ].map(([title, desc]) => (
            <div key={title as string} className="border border-neutral-200 rounded-xl p-5">
              <h3 className="font-medium mb-2">{title}</h3>
              <p className="text-neutral-600 text-sm">{desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 text-center">
          <h2 className="text-2xl font-semibold">30-day money-back guarantee</h2>
          <p className="text-neutral-600 mt-2">Try it risk-free. If it doesn’t help, email us for a full refund.</p>
          <div className="mt-6">
            <button onClick={startCheckout} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-8 py-4 text-base font-medium disabled:opacity-50">
              {loading ? "Redirecting..." : "Buy now – $49"}
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-neutral-600 flex items-center justify-between">
          <p>© {new Date().getFullYear()} AI Starter</p>
          <a href="mailto:support@example.com" className="hover:underline">Support</a>
        </div>
      </footer>
    </div>
  );
}
