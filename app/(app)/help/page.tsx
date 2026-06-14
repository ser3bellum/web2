// app/(app)/help/page.tsx

import Link from "next/link";
import { ArrowRight, LifeBuoy, Rocket, Sparkles } from "lucide-react";

const helpCards = [
  {
    title: "Quick Start",
    description: "Learn the basics and get your dashboard ready.",
    href: "help/quick-start",
    icon: Rocket,
  },
  {
    title: "Contact Support",
    description: "Need help? Send us a message.",
    href: "#support",
    icon: LifeBuoy,
  },
  {
    title: "What's New",
    description: "See the latest Ser3bellum updates.",
    href: "help/whats-new",
    icon: Sparkles,
  },
];

export default function HelpPage() {
  return (
    <main className="space-y-8 px-6 py-8">
      <div>
        <p className="text-sm font-medium text-slate-500">Help Center</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          How can we help?
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Find your way around Ser3bellum, contact support, or check the latest
          product updates.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {helpCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Icon className="h-6 w-6" />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {card.description}
                  </p>
                </div>

                <ArrowRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
              </div>
            </Link>
          );
        })}
      </div>
      <section
  id="support"
  className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
>
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-slate-900">
      Contact Support
    </h2>
    <p className="mt-2 text-sm text-slate-600">
      Need help with Ser3bellum? Send us a message and we'll get back to you as
      soon as possible.
    </p>
  </div>

  <form className="space-y-4">
    <div>
      <label
        htmlFor="subject"
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        Subject
      </label>

      <input
        id="subject"
        type="text"
        placeholder="Brief description of your request"
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label
        htmlFor="message"
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        Message
      </label>

      <textarea
        id="message"
        rows={6}
        placeholder="Describe your issue or question..."
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div className="flex justify-end">
      <button
        type="submit"
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
      >
        Send Message
      </button>
    </div>
  </form>
</section>
    </main>
  );
}