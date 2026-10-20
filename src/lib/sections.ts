// The site's main sections. The header menu, homepage cards and "coming soon"
// pages all read from this list, so a section only needs to be added here once.

export type SectionStatus = "live" | "next-up" | "coming-soon";

export type Section = {
  slug: string;
  title: string;
  summary: string;
  status: SectionStatus;
};

export const SITE_NAME = "Tradox";

export const sections: Section[] = [
  {
    slug: "funded-accounts",
    title: "Funded Accounts",
    summary:
      "Compare prop firms side by side: fees, account sizes, drawdown rules, profit splits, platforms and evaluation steps.",
    status: "live",
  },
  {
    slug: "courses",
    title: "Courses",
    summary:
      "Browse trading education courses by topic, format and price.",
    status: "live",
  },
  {
    slug: "signal-groups",
    title: "Signal Groups",
    summary:
      "Telegram groups organised by pair traded and platform. Every listing must meet our listing criteria, and we never rank groups by performance.",
    status: "coming-soon",
  },
  {
    slug: "brokers",
    title: "Brokers",
    summary:
      "Retail brokers for trading your own capital, filterable by regulatory status, minimum deposit and supported platforms.",
    status: "live",
  },
  {
    slug: "tools",
    title: "Tools",
    summary:
      "Charting, indicators, backtesting, scanners, automation, trade copiers and trading VPS hosting, with prices copied from each tool's own site when we could confirm them.",
    status: "live",
  },
  {
    slug: "strategies",
    title: "Strategies",
    summary:
      "58 trading strategies explained honestly — what each one is, how it's traditionally traded, and what independent research actually found, including when the answer is \"not much.\"",
    status: "live",
  },
];

export function getSection(slug: string): Section {
  const section = sections.find((s) => s.slug === slug);
  if (!section) throw new Error(`Unknown section: ${slug}`);
  return section;
}
