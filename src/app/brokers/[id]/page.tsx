import type { JSX, ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrokerBackLink from "@/components/BrokerBackLink";
import BrokerLogo from "@/components/BrokerLogo";
import BrokerReveal from "@/components/BrokerReveal";
import OurChoiceBadge from "@/components/OurChoiceBadge";
import CoursePricing from "@/components/CoursePricing";
import PlatformPill from "@/components/PlatformPill";
import StickyVisitBar from "@/components/StickyVisitBar";
import TrustpilotStars from "@/components/TrustpilotStars";
import VisitSiteLink from "@/components/VisitSiteLink";
import { InfoIcon, LayersIcon, MonitorIcon, ShieldIcon, TagIcon } from "@/components/icons";
import { BROKER_MARKET_LABELS, brokerOutboundUrl, formatDeposit, type CostRow } from "@/lib/broker-types";
import { brokers, getBroker } from "@/lib/brokers";
import { leverageLabel } from "@/lib/broker-filters";

export const dynamicParams = false;

export function generateStaticParams() {
  return brokers.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: PageProps<"/brokers/[id]">): Promise<Metadata> {
  const broker = getBroker((await params).id);
  if (!broker) return {};
  return {
    title: broker.name,
    description: broker.tagline ?? undefined,
  };
}

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: (p: { className?: string }) => JSX.Element;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="section-title flex items-center gap-2.5 scroll-mt-24">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
        <Icon className="size-4" />
      </span>
      {children}
    </h2>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3 sm:px-5">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">{value}</div>
    </div>
  );
}

function CostTable({ rows }: { rows: CostRow[] }) {
  return (
    <dl className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 px-4 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4 sm:px-5">
          <dt className="text-sm font-medium text-muted">{row.label}</dt>
          <dd>
            <div className="font-semibold text-foreground">{row.value}</div>
            {row.note && <p className="meta mt-1">{row.note}</p>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function BrokerPage({ params }: PageProps<"/brokers/[id]">) {
  const broker = getBroker((await params).id);
  if (!broker) notFound();

  const visitHref = brokerOutboundUrl(broker);
  const deposit = formatDeposit(broker.minDeposit, broker.currency);

  const jumps = [
    broker.about ? ["about-heading", "About"] : null,
    broker.plans.length ? ["plans-heading", "Plans"] : null,
    broker.costs.length ? ["costs-heading", "Costs"] : null,
    broker.leverage.length || broker.marginRates ? ["leverage-heading", "Leverage"] : null,
    broker.otherFees.length ? ["fees-heading", "Fees"] : null,
    broker.regulators.length
      ? ["regulation-heading", "Regulation"]
      : broker.companyRegistration
        ? ["regulation-heading", "Registration"]
        : null,
    broker.platforms.length ? ["platforms-heading", "Platforms"] : null,
  ].filter((item): item is [string, string] => Boolean(item));

  return (
    <>
      <BrokerBackLink />

      <header className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
          <BrokerLogo name={broker.name} logo={broker.logo} logoBg={broker.logoBg} size="lg" priority />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="page-title">{broker.name}</h1>
              {broker.ourChoice && <OurChoiceBadge />}
            </div>
            {broker.ourChoice && (
              <p className="meta mt-2">
                Featured listing on Traders Hub. It is not a score of trading results, and it is not advice to open an
                account.
              </p>
            )}
            {broker.tagline && <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">{broker.tagline}</p>}
            <p className="meta mt-2">
              {[broker.founded ? `Since ${broker.founded}` : null, broker.headquarters].filter(Boolean).join(" · ")}
            </p>
            {broker.trustpilot && (
              <div className="mt-3">
                <TrustpilotStars rating={broker.trustpilot} />
                <p className="meta mt-1.5">Trustpilot&apos;s review score. It is not a measure of trading results.</p>
              </div>
            )}
          </div>
          {visitHref && (
            <VisitSiteLink href={visitHref} firmName={broker.name} label="Visit broker" className="shrink-0 sm:self-start" />
          )}
        </div>

        <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
          <Stat label="Min. deposit" value={deposit ?? "Varies"} />
          <Stat label="Leverage" value={leverageLabel(broker)} />
          <Stat label="Regulators" value={broker.regulators.length ? String(broker.regulators.length) : "None listed"} />
          <Stat
            label="Trustpilot"
            value={broker.trustpilot ? `${broker.trustpilot.rating.toFixed(1)} / 5` : "Not listed"}
          />
        </dl>
      </header>

      {jumps.length > 0 && (
        <nav aria-label="On this page" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {jumps.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="pill min-h-10 shrink-0 px-3 transition-colors duration-150 hover:border-accent/40 hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
      )}

      {broker.promotions && (
        <BrokerReveal>
          <aside className="mt-6 rounded-xl border border-border bg-surface px-4 py-4 sm:px-5">
            <h2 className="eyebrow">Published offer</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{broker.promotions}</p>
            <p className="meta mt-2">
              Offers change often and depend on where you live. Check the broker&apos;s site before you rely on one.
            </p>
          </aside>
        </BrokerReveal>
      )}

      {broker.about && (
        <BrokerReveal className="mt-10">
          <section aria-labelledby="about-heading" className="max-w-3xl">
            <SectionHeading id="about-heading" icon={InfoIcon}>
              About
            </SectionHeading>
            <p className="mt-3 leading-relaxed text-muted">{broker.about}</p>
            {broker.markets.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Markets">
                {broker.markets.map((m) => (
                  <li key={m} className="pill">
                    {BROKER_MARKET_LABELS[m]}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </BrokerReveal>
      )}

      {broker.plans.length > 0 && (
        <BrokerReveal className="mt-10">
          <section aria-labelledby="plans-heading">
            <SectionHeading id="plans-heading" icon={LayersIcon}>
              Account plans
            </SectionHeading>
            <div className="mt-4">
              <CoursePricing
                tiers={broker.plans}
                courseName={broker.name}
                visitHref={visitHref}
                linkLabel="Visit broker"
              />
            </div>
          </section>
        </BrokerReveal>
      )}

      {broker.costs.length > 0 && (
        <BrokerReveal className="mt-10">
          <section aria-labelledby="costs-heading">
            <SectionHeading id="costs-heading" icon={TagIcon}>
              Commissions and spreads
            </SectionHeading>
            {broker.costsNote && <p className="meta mt-2 max-w-2xl">{broker.costsNote}</p>}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {broker.costs.map((group) => (
                <div key={group.title} className="overflow-hidden rounded-xl border border-border bg-surface">
                  <h3 className="border-b border-border px-4 py-3 text-sm font-semibold sm:px-5">{group.title}</h3>
                  <CostTable rows={group.rows} />
                </div>
              ))}
            </div>
          </section>
        </BrokerReveal>
      )}

      {(broker.leverage.length > 0 || broker.marginRates) && (
        <BrokerReveal className="mt-10">
          <section aria-labelledby="leverage-heading">
            <SectionHeading id="leverage-heading" icon={LayersIcon}>
              Leverage and margin
            </SectionHeading>
            <p className="mt-3 max-w-3xl border-l-2 border-warning/70 py-1 pl-3 text-sm text-foreground">
              <span className="font-semibold">Risk warning. </span>
              {broker.leverageNote}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {broker.leverage.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border bg-surface">
                  <h3 className="border-b border-border px-4 py-3 text-sm font-semibold sm:px-5">Maximum leverage</h3>
                  <CostTable rows={broker.leverage.map((l) => ({ label: l.market, value: l.value, note: l.note }))} />
                </div>
              )}
              {broker.marginRates && (
                <div className="overflow-hidden rounded-xl border border-border bg-surface">
                  <h3 className="border-b border-border px-4 py-3 text-sm font-semibold sm:px-5">Margin interest rates</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th scope="col" className="eyebrow px-4 py-3 font-semibold sm:px-5">
                            Amount borrowed
                          </th>
                          {broker.marginRates.columns.map((c) => (
                            <th key={c} scope="col" className="eyebrow px-3 py-3 text-right font-semibold last:pr-4 sm:last:pr-5">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {broker.marginRates.rows.map((row) => (
                          <tr key={row.tier}>
                            <th scope="row" className="px-4 py-3 text-left font-medium text-muted sm:px-5">
                              {row.tier}
                            </th>
                            {row.values.map((v, i) => (
                              <td key={i} className="px-3 py-3 text-right font-semibold tabular-nums last:pr-4 sm:last:pr-5">
                                {v}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {broker.marginRates.note && (
                    <p className="meta border-t border-border px-4 py-3 sm:px-5">{broker.marginRates.note}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </BrokerReveal>
      )}

      {broker.otherFees.length > 0 && (
        <BrokerReveal className="mt-10">
          <section aria-labelledby="fees-heading" className="max-w-3xl">
            <SectionHeading id="fees-heading" icon={TagIcon}>
              Other fees
            </SectionHeading>
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
              <CostTable rows={broker.otherFees} />
            </div>
          </section>
        </BrokerReveal>
      )}

      {(broker.regulators.length > 0 || broker.companyRegistration) && (
        <BrokerReveal className="mt-10">
          <section aria-labelledby="regulation-heading">
            <SectionHeading id="regulation-heading" icon={ShieldIcon}>
              {broker.regulators.length > 0 ? "Regulation" : "Company registration"}
            </SectionHeading>
            {broker.companyRegistration && (
              <p className="mt-3 text-sm font-semibold text-foreground">
                Company registration: {broker.companyRegistration}
              </p>
            )}
            {broker.regulatorsNote && <p className="meta mt-2 max-w-2xl">{broker.regulatorsNote}</p>}
            {broker.regulators.length > 0 && (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {broker.regulators.map((r) => (
                <li
                  key={`${r.regulator}-${r.country}-${r.entity ?? ""}`}
                  className="rounded-xl border border-border bg-surface p-4 transition duration-200 hover:border-border-strong"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{r.regulator}</span>
                    <span className="pill">{r.country}</span>
                  </div>
                  {r.entity && <p className="meta mt-1.5">{r.entity}</p>}
                </li>
              ))}
            </ul>
            )}
          </section>
        </BrokerReveal>
      )}

      {broker.platforms.length > 0 && (
        <BrokerReveal className="mt-10">
          <section aria-labelledby="platforms-heading">
            <SectionHeading id="platforms-heading" icon={MonitorIcon}>
              Trading platforms
            </SectionHeading>
            <ul className="mt-4 flex flex-wrap gap-2">
              {broker.platforms.map((p) => (
                <li key={p}>
                  <PlatformPill name={p} />
                </li>
              ))}
            </ul>
          </section>
        </BrokerReveal>
      )}

      <p className="meta mt-10 max-w-3xl">
        Fees, leverage and offers change often and can depend on where you live. We last checked these
        figures against the broker&apos;s own pages and the notes in its data file. Confirm them there
        before you open an account.
      </p>

      {visitHref && (
        <div className="mt-12 rounded-xl border border-border bg-surface px-6 py-8 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Open the broker&apos;s own site</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Full terms, current pricing and account opening stay on {broker.name}&apos;s website.
          </p>
          <VisitSiteLink href={visitHref} firmName={broker.name} label="Visit broker" className="mt-4" />
        </div>
      )}

      <StickyVisitBar
        courseName={broker.name}
        logo={broker.logo}
        logoBg={broker.logoBg}
        price={deposit ? `Min. deposit ${deposit}` : "Min. deposit varies"}
        visitHref={visitHref}
        visitLabel="Visit broker"
        wideLogo
      />
    </>
  );
}
