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
    a: "No. Tradox is a directory. We do not score win rate, accuracy or returns. Trustpilot numbers are that site's review scores, shown with a link back to the source.",
  },
  {
    q: "Where does Visit broker go?",
    a: "For now it opens the broker's official homepage. If an affiliate link is added later, it lives in one field on that broker's listing and the button uses it automatically. The footer explains when a link may earn us a commission.",
  },
];

export default function BrokersPage() {
  return (
    <>
      <h1 className="title-rule page-title">{section.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Compare retail brokers on deposit, leverage, platforms and who regulates them.
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
