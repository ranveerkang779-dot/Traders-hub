import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_NAME, sections } from "@/lib/sections";
import { propFirms } from "@/lib/propfirms";
import { courses } from "@/lib/courses";
import { brokers } from "@/lib/brokers";
import { tools } from "@/lib/tools";
import { toolPriceLabel } from "@/lib/tool-types";
import { strategiesInDisplayOrder } from "@/lib/strategies";
import { STRATEGY_TIER_LABELS, STRATEGY_CATEGORY_LABELS } from "@/lib/strategy-types";
import { allAccounts } from "@/lib/propfirm-filters";
import { BROKER_MARKET_LABELS } from "@/lib/broker-types";
import FirmBadge from "@/components/FirmBadge";

// Real counts, computed from the data at build time — never hand-typed, so
// this line can't go stale the way a written "29 prop firms" sentence would
// the day someone adds a 30th.
const STATS = [
  { label: "prop firms", count: propFirms.length },
  { label: "courses", count: courses.length },
  { label: "strategies", count: strategiesInDisplayOrder.length },
  { label: "brokers", count: brokers.length },
  { label: "tools", count: tools.length },
];

function money(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** One row of the snapshot list on a showcase row's "examples" side — a
 *  logo (or lettermark), a name, and up to two short facts. Shared shape
 *  across all five sections below so the eye reads them the same way even
 *  though the underlying data is different for each. */
type SnapshotItem = {
  href: string;
  name: string;
  logo: string | null;
  logoBg: "white" | "dark";
  primary: string | null;
  secondary: string | null;
};

function fundedAccountsSnapshot(): SnapshotItem[] {
  const ids = ["ftmo", "alpha-funded", "topstep"];
  const chosen = ids.map((id) => propFirms.find((f) => f.id === id)).filter((f) => f != null);
  const firms = chosen.length >= 3 ? chosen : [...chosen, ...propFirms].slice(0, 3);
  return firms.map((firm) => {
    const accounts = allAccounts(firm);
    const cheapest = accounts
      .filter((a) => a.lowestPrice != null)
      .reduce<(typeof accounts)[number] | null>(
        (best, a) => (best == null || a.lowestPrice! < best.lowestPrice! ? a : best),
        null,
      );
    const splits = accounts.map((a) => a.profitSplit).filter((s): s is number => s != null);
    return {
      href: `/funded-accounts/${firm.id}`,
      name: firm.name,
      logo: firm.logo,
      logoBg: firm.logoBg,
      primary: cheapest ? money(cheapest.lowestPrice!, firm.currency) + (cheapest.monthly ? "/mo" : "") : null,
      secondary: splits.length > 0 ? `up to ${Math.max(...splits)}% split` : null,
    };
  });
}

function coursesSnapshot(): SnapshotItem[] {
  // Courses we actually earn from — the same ones that sort first and carry
  // the Our choice badge on /courses (see CourseDirectory.tsx).
  const affiliateCourses = courses.filter((c) => c.affiliateLink != null).slice(0, 3);
  const chosen = affiliateCourses.length >= 3 ? affiliateCourses : courses.slice(0, 3);
  return chosen.map((c) => ({
    href: `/courses/${c.id}`,
    name: c.name,
    logo: c.logo,
    logoBg: c.logoBg,
    primary: c.pricing[0]?.price ?? null,
    secondary: c.affiliateLink != null ? "Our choice" : null,
  }));
}

function brokersSnapshot(): SnapshotItem[] {
  const ids = ["interactive-brokers", "oanda", "cmc-markets"];
  const chosen = ids.map((id) => brokers.find((b) => b.id === id)).filter((b) => b != null);
  const picked = chosen.length >= 3 ? chosen : [...chosen, ...brokers].slice(0, 3);
  return picked.map((b) => ({
    href: `/brokers/${b.id}`,
    name: b.name,
    logo: b.logo,
    logoBg: b.logoBg,
    primary: b.minDeposit != null ? `${money(b.minDeposit, b.currency)} min deposit` : null,
    secondary: b.markets.length > 0 ? b.markets.slice(0, 2).map((m) => BROKER_MARKET_LABELS[m]).join(", ") : null,
  }));
}

function toolsSnapshot(): SnapshotItem[] {
  // The loader already puts the tools we earn from first. Every listing has
  // an affiliate link, so the homepage examples stay inside that set.
  const picked = tools.slice(0, 3);
  return picked.map((t) => ({
    href: `/tools/${t.slug}`,
    name: t.name,
    logo: t.logo,
    logoBg: "white" as const,
    primary: toolPriceLabel(t),
    secondary: null,
  }));
}

function strategiesSnapshot() {
  return strategiesInDisplayOrder.slice(0, 3).map((s) => ({
    href: `/strategies/${s.slug}`,
    name: s.name,
    tier: STRATEGY_TIER_LABELS[s.tier],
    category: STRATEGY_CATEGORY_LABELS[s.category],
  }));
}

export default function Home() {
  const liveSections = sections.filter((s) => s.status === "live");
  const upcomingSections = sections.filter((s) => s.status !== "live");

  return (
    <>
      <section className="hero-intro pb-10 pt-2 sm:pb-14 sm:pt-6">
        <h1 className="title-rule page-title max-w-2xl sm:text-5xl lg:text-6xl">
          Compare trading products side by side, honestly
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          {SITE_NAME} puts real prop firm, course, broker and tool pricing
          next to each other — so you can see the facts and decide for
          yourself, instead of trusting one provider&apos;s own pitch.
        </p>
        <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="eyebrow">{stat.label}</dt>
              <dd className="figure-lg text-accent">{stat.count}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="what-we-are"
        className="panel-accent rounded-xl border border-border bg-surface p-6"
      >
        <h2 id="what-we-are" className="section-title">
          Discovery, not verification
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted marker:text-accent">
          <li>We are a directory and comparison site.</li>
          <li>
            We are not a broker, not a signal provider and not a financial
            adviser.
          </li>
          <li>
            We do not verify or rank anyone&apos;s trading performance, accuracy
            or win rate.
          </li>
          <li>
            We earn money through affiliate links and clearly labelled sponsored
            listings.
          </li>
        </ul>
      </section>

      <section aria-labelledby="sections-heading" className="pt-14">
        <h2 id="sections-heading" className="sr-only">
          What you&apos;ll find here
        </h2>

        <div className="flex flex-col divide-y divide-border">
          <SectionShowcase
            section={liveSections.find((s) => s.slug === "funded-accounts")}
            totalCount={propFirms.length}
            reverse={false}
          >
            <SnapshotList items={fundedAccountsSnapshot()} />
          </SectionShowcase>

          <SectionShowcase
            section={liveSections.find((s) => s.slug === "courses")}
            totalCount={courses.length}
            reverse={true}
          >
            <SnapshotList items={coursesSnapshot()} />
          </SectionShowcase>

          <SectionShowcase
            section={liveSections.find((s) => s.slug === "brokers")}
            totalCount={brokers.length}
            reverse={false}
          >
            <SnapshotList items={brokersSnapshot()} />
          </SectionShowcase>

          <SectionShowcase
            section={liveSections.find((s) => s.slug === "tools")}
            totalCount={tools.length}
            reverse={true}
          >
            <SnapshotList items={toolsSnapshot()} />
          </SectionShowcase>

          <SectionShowcase
            section={liveSections.find((s) => s.slug === "strategies")}
            totalCount={strategiesInDisplayOrder.length}
            reverse={false}
          >
            <StrategySnapshotList items={strategiesSnapshot()} />
          </SectionShowcase>
        </div>

        {upcomingSections.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-3 border-t border-border pt-8">
            {upcomingSections.map((section) => (
              <li key={section.slug}>
                <Link
                  href={`/${section.slug}`}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-border-strong hover:text-foreground"
                >
                  <span className="pill">
                    {section.status === "next-up" ? "Next up" : "Coming soon"}
                  </span>
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// A full-width row: the section's name and summary on one side, a real
// snapshot of its listings on the other. Alternates which side the text
// sits on (reverse) so a long stack of these doesn't read as one repeating
// template — a deliberate break from the identical-card grid this replaced.
function SectionShowcase({
  section,
  totalCount,
  reverse,
  children,
}: {
  section: { slug: string; title: string; summary: string } | undefined;
  totalCount: number;
  reverse: boolean;
  children: ReactNode;
}) {
  if (!section) return null;
  return (
    <div className="grid gap-6 py-10 first:pt-0 last:pb-0 lg:grid-cols-2 lg:items-center lg:gap-12">
      <div className={reverse ? "lg:order-2" : undefined}>
        <span className="eyebrow">{totalCount} listed</span>
        <h3 className="mt-2 text-2xl font-semibold">
          <Link href={`/${section.slug}`} className="hover:text-accent">
            {section.title}
          </Link>
        </h3>
        <p className="mt-2 max-w-md text-muted">{section.summary}</p>
        <Link href={`/${section.slug}`} className="btn btn-outline mt-5">
          Browse {section.title.toLowerCase()}
        </Link>
      </div>
      <div className={reverse ? "lg:order-1" : undefined}>{children}</div>
    </div>
  );
}

function SnapshotList({ items }: { items: SnapshotItem[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="lift-card flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5"
          >
            <FirmBadge name={item.name} logo={item.logo} logoBg={item.logoBg} />
            <span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span>
            {(item.primary || item.secondary) && (
              <span className="shrink-0 text-right">
                {item.primary && <span className="figure block text-accent">{item.primary}</span>}
                {item.secondary && <span className="meta block">{item.secondary}</span>}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Strategies have no logo or price — the honest snapshot for them is the
// name plus what they are (difficulty tier, trading style), not a number.
function StrategySnapshotList({
  items,
}: {
  items: { href: string; name: string; tier: string; category: string }[];
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="lift-card flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5"
          >
            <span className="flex-1">
              <span className="block font-semibold">{item.name}</span>
              <span className="meta mt-0.5 block">{item.category}</span>
            </span>
            <span className="pill shrink-0">{item.tier}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
