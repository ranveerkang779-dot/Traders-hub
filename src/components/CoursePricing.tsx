"use client";

import { useState } from "react";
import type { PricingTier } from "@/lib/course-types";
import VisitSiteLink from "@/components/VisitSiteLink";
import { CheckIcon } from "@/components/icons";

// Clickable pricing cards — picking one reveals a plan-specific CTA, so the
// section does something rather than just listing numbers.
export default function CoursePricing({
  tiers,
  courseName,
  visitHref,
  linkLabel = "Visit site",
}: {
  tiers: PricingTier[];
  courseName: string;
  visitHref: string | null;
  linkLabel?: string;
}) {
  const highlightedIndex = tiers.findIndex((t) => t.highlight);
  const [selected, setSelected] = useState(highlightedIndex >= 0 ? highlightedIndex : 0);
  const selectedTier = tiers[selected];
  // A tier with its own tracked link (e.g. separate monthly/annual affiliate
  // links) wins over the course's general visit link.
  const selectedHref = selectedTier?.link ?? visitHref;

  return (
    <div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tiers.map((tier, i) => {
          const isSelected = i === selected;
          return (
            <li key={tier.name}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                aria-pressed={isSelected}
                className={`relative w-full rounded-xl border p-5 text-left transition hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-accent bg-accent/6 shadow-glow"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                {tier.highlight && (
                  <span className="badge badge-success absolute -top-2.5 left-4">
                    {tier.highlight}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className={`absolute right-4 top-4 flex size-5 items-center justify-center rounded-full border transition-colors ${
                    isSelected ? "border-accent bg-accent text-accent-fg" : "border-border-strong text-transparent"
                  }`}
                >
                  <CheckIcon className="size-3" />
                </span>
                <div className="eyebrow">{tier.name}</div>
                <div className="figure-lg mt-1">{tier.price}</div>
                {tier.billingNote && <p className="meta mt-2">{tier.billingNote}</p>}
              </button>
            </li>
          );
        })}
      </ul>

      {selectedHref && selectedTier && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2 p-4">
          <p className="meta flex-1">
            Selected: <span className="font-medium text-foreground">{selectedTier.name}</span>,{" "}
            {selectedTier.price}
          </p>
          <VisitSiteLink href={selectedHref} firmName={courseName} variant="outline" label={linkLabel} />
        </div>
      )}
    </div>
  );
}
