import type { Metadata } from "next";
import SignalGroupDirectory from "@/components/SignalGroupDirectory";
import { visibleSignalGroups } from "@/lib/signal-preview";
import { signalGroups } from "@/lib/signal-groups";
import { getSection } from "@/lib/sections";
import { SIGNAL_MARKET_ORDER } from "@/lib/signal-group-types";

const section = getSection("signal-groups");

export const metadata: Metadata = {
  title: section.title,
  description: section.summary,
};

const faqs = [
  {
    q: "Do you rank signal groups by results?",
    a: "No. This is a directory. We do not score accuracy, returns or how often a group's calls make money. The list order is a manual rank, then the name.",
  },
  {
    q: "What does Join open?",
    a: "The group's Telegram chat. That address is the only outbound link on the listing, so it can be swapped later without changing the page. If a link is an affiliate link, we may earn a commission, which the footer also says.",
  },
  {
    q: "Why might a group be missing?",
    a: "It has not been added yet, or it did not meet the listing rules: no guaranteed-return language, no pressure to deposit more, and a free option or a trial.",
  },
];

export default function SignalGroupsPage() {
  // Preview filtering stays on the server. Pass `listed`, never the raw
  // `signalGroups` array, or groups hidden by the free-preview limit would
  // still be embedded in the page for anyone to read.
  const listed = visibleSignalGroups(signalGroups);

  return (
    <>
      <h1 className="title-rule page-title">{section.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Find Telegram signal groups by market, trading style, price and language. Every listed group
        is on Telegram.
      </p>

      <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <Fact value={String(listed.length)} label="Groups listed" />
        <Fact value={String(SIGNAL_MARKET_ORDER.length)} label="Markets" />
        <Fact value="Not scored" label="Trading results" />
      </dl>

      <p className="meta mt-4 max-w-2xl">
        Descriptions are in our own words. A member count or price is shown only when the group
        publishes one. We do not verify trading results.
      </p>

      <div className="mt-8">
        <SignalGroupDirectory groups={listed} />
      </div>

      <section aria-labelledby="signal-faq-heading" className="mt-14 max-w-2xl border-t border-border pt-8">
        <h2 id="signal-faq-heading" className="section-title">
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
