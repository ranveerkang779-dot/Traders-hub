import type { Metadata } from "next";
import BrokerDirectory from "@/components/BrokerDirectory";
import { brokers } from "@/lib/brokers";
import { getSection } from "@/lib/sections";

const section = getSection("brokers");

export const metadata: Metadata = {
  title: section.title,
  description: section.summary,
};

const faqs = [
  {
    q: "Why do fees for the same broker differ?",
    a: "Most of these brands are several companies. The one that holds your account depends on where you live, and that company sets the spread, the leverage cap and which regulator applies. Treat every figure here as a starting point and confirm it on the broker's own site.",
  },
  {
    q: "Do you rank brokers by results?",
    a: "No. Traders Hub is a directory. We do not score win rate, accuracy or returns. Trustpilot numbers are that site's review scores, shown with a link back to the source.",
  },
  {
    q: "Where does Visit broker go?",
    a: "For now it opens the broker's official homepage. If an affiliate link is added later, it lives in one field on that broker's listing and the button uses it automatically. The footer explains when a link may earn us a commission.",
  },
];

export default function BrokersPage() {
  const regulatorCount = new Set(brokers.flatMap((b) => b.regulators.map((r) => r.regulator))).size;

  return (
    <>
      <h1 className="page-title">{section.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Compare retail brokers on deposit, leverage, platforms and who regulates them.
      </p>

      <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <Fact value={String(brokers.length)} label="Brokers listed" />
        <Fact value={String(regulatorCount)} label="Regulator names on file" />
        <Fact value="Not scored" label="Trading results" />
      </dl>

      <p className="meta mt-4 max-w-2xl">
        We place each broker&apos;s published terms next to the others. We do not score trading
        results, and a blank or &quot;Varies&quot; means we could not confirm one number for every
        client. Fees and rules change, and they depend on where you live.
      </p>

      <div className="mt-8">
        <BrokerDirectory brokers={brokers} />
      </div>

      <section aria-labelledby="broker-faq-heading" className="mt-14 max-w-2xl border-t border-border pt-8">
        <h2 id="broker-faq-heading" className="section-title">
          How to read this page
        </h2>
        <div className="mt-4 divide-y divide-border">
          {faqs.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="cursor-pointer list-none font-medium text-foreground [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span aria-hidden="true" className="text-muted transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tracking-tight text-foreground">{value}</dd>
    </div>
  );
}
