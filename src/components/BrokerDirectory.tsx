"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import BrokerLogo from "@/components/BrokerLogo";
import OurChoiceBadge from "@/components/OurChoiceBadge";
import TrustpilotStars from "@/components/TrustpilotStars";
import {
  BROKER_MARKET_LABELS,
  formatDeposit,
  type BrokerView,
} from "@/lib/broker-types";
import {
  EMPTY_FILTERS,
  compareFromQuery,
  currentListingQuery,
  filtersFromQuery,
  filtersToQuery,
  leverageLabel,
  matchesFilters,
  sortBrokers,
  sortFromQuery,
  type Filters,
  type SortKey,
} from "@/lib/broker-filters";

const RATING_OPTIONS = ["3", "3.5", "4", "4.5"];
const MAX_COMPARE = 3;

export default function BrokerDirectory({ brokers }: { brokers: BrokerView[] }) {
  return (
    <Suspense fallback={<Directory brokers={brokers} initialQuery="" />}>
      <DirectoryFromAddress brokers={brokers} />
    </Suspense>
  );
}

function DirectoryFromAddress({ brokers }: { brokers: BrokerView[] }) {
  const searchParams = useSearchParams();
  return <Directory brokers={brokers} initialQuery={searchParams.toString()} />;
}

function Directory({ brokers, initialQuery }: { brokers: BrokerView[]; initialQuery: string }) {
  const params = new URLSearchParams(initialQuery);
  const [filters, setFilters] = useState<Filters>(filtersFromQuery(params));
  const [sort, setSort] = useState<SortKey>(sortFromQuery(params.get("sort")));
  const knownIds = new Set(brokers.map((b) => b.id));
  const [compare, setCompare] = useState<string[]>(
    compareFromQuery(params.get("compare")).filter((id) => knownIds.has(id)),
  );
  const [compareNote, setCompareNote] = useState("");

  const marketOptions = [...new Set(brokers.flatMap((b) => b.markets))].sort((a, b) =>
    BROKER_MARKET_LABELS[a].localeCompare(BROKER_MARKET_LABELS[b]),
  );
  const regulatorOptions = [...new Set(brokers.flatMap((b) => b.regulators.map((r) => r.regulator)))].sort();

  const matching = sortBrokers(
    brokers.filter((b) => matchesFilters(b, filters)),
    sort,
  );
  const compared = compare
    .map((id) => brokers.find((b) => b.id === id))
    .filter((b): b is BrokerView => Boolean(b));

  function writeAddress(nextFilters: Filters, nextSort: SortKey, nextCompare: string[]) {
    const query = new URLSearchParams(filtersToQuery(nextFilters).replace(/^\?/, ""));
    if (nextSort !== "name") query.set("sort", nextSort);
    if (nextCompare.length) query.set("compare", nextCompare.join(","));
    const qs = query.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }

  function updateFilters(changes: Partial<Filters>) {
    const next = { ...filters, ...changes };
    setFilters(next);
    writeAddress(next, sort, compare);
  }

  function updateSort(nextSort: SortKey) {
    setSort(nextSort);
    writeAddress(filters, nextSort, compare);
  }

  function toggleCompare(id: string) {
    if (compare.includes(id)) {
      const next = compare.filter((item) => item !== id);
      setCompare(next);
      setCompareNote("");
      writeAddress(filters, sort, next);
      return;
    }
    if (compare.length >= MAX_COMPARE) {
      setCompareNote("You can compare up to 3 brokers. Remove one to add another.");
      return;
    }
    const next = [...compare, id];
    setCompare(next);
    setCompareNote("");
    writeAddress(filters, sort, next);
  }

  function clearCompare() {
    setCompare([]);
    setCompareNote("");
    writeAddress(filters, sort, []);
  }

  const chips = activeFilterChips(filters);
  const listingQuery = currentListingQuery(filters, sort, compare);

  return (
    <div>
      <form
        aria-label="Filter brokers"
        className="grid grid-cols-2 gap-3 border-b border-border pb-5 lg:grid-cols-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <Select
          label="Market"
          value={filters.market}
          onChange={(v) => updateFilters({ market: v })}
          options={marketOptions.map((m) => [m, BROKER_MARKET_LABELS[m]])}
        />
        <Select
          label="Regulator"
          anyLabel="Any"
          value={filters.regulator}
          onChange={(v) => updateFilters({ regulator: v })}
          options={regulatorOptions.map((r) => [r, r])}
        />
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Deposit up to</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="Any"
            value={filters.maxDeposit}
            onChange={(e) => updateFilters({ maxDeposit: e.target.value })}
            className="field"
          />
        </label>
        <Select
          label="Trustpilot"
          anyLabel="Any"
          value={filters.minRating}
          onChange={(v) => updateFilters({ minRating: v })}
          options={RATING_OPTIONS.map((r) => [r, `${r}+ stars`])}
        />
        <Select
          label="Sort"
          anyLabel="Name"
          value={sort === "name" ? "" : sort}
          onChange={(v) => updateSort(sortFromQuery(v || "name"))}
          options={[
            ["deposit", "Lowest min. deposit"],
            ["rating", "Trustpilot score"],
          ]}
        />
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p aria-live="polite" className="meta mr-1">
          <span className="font-semibold text-foreground">{matching.length}</span> of {brokers.length} shown
        </p>
        {chips.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => updateFilters({ [key]: "" })}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border-strong bg-surface py-1 pl-3 pr-2 text-xs font-medium text-foreground transition-colors duration-150 hover:border-subtle"
          >
            {label}
            <span aria-hidden="true" className="text-muted">
              ×
            </span>
            <span className="sr-only">(remove filter)</span>
          </button>
        ))}
        {chips.length > 1 && (
          <button
            type="button"
            onClick={() => updateFilters(EMPTY_FILTERS)}
            className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>
      <p className="meta mt-2 max-w-2xl">
        Trustpilot figures are that site&apos;s review scores. They are not a measure of trading results.
        Leverage on a card is the highest figure the broker advertises. It increases losses, and the cap
        you get depends on where you live.
      </p>
      {brokers.some((b) => b.ourChoice) && (
        <p className="meta mt-2 max-w-2xl">
          Our choice stays at the top on every sort, including lowest deposit and Trustpilot. It is a
          featured listing, not the winner of that sort, and not a score of trading results.
        </p>
      )}

      {compared.length > 0 && (
        <ComparePanel
          brokers={compared}
          onRemove={toggleCompare}
          onClear={clearCompare}
          note={compareNote}
        />
      )}
      {compared.length === 0 && compareNote && (
        <p role="status" className="meta mt-3">
          {compareNote}
        </p>
      )}

      {matching.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border-strong px-6 py-12 text-center text-muted">
          No brokers match these filters.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matching.map((broker, index) => (
            <BrokerCard
              key={broker.id}
              broker={broker}
              index={index}
              selected={compare.includes(broker.id)}
              listingQuery={listingQuery}
              onToggleCompare={() => toggleCompare(broker.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function BrokerCard({
  broker,
  index,
  selected,
  listingQuery,
  onToggleCompare,
}: {
  broker: BrokerView;
  index: number;
  selected: boolean;
  listingQuery: string;
  onToggleCompare: () => void;
}) {
  const deposit = formatDeposit(broker.minDeposit, broker.currency);

  return (
    <li
      className="broker-card group relative flex flex-col rounded-xl border border-border bg-surface p-4 transition duration-200 ease-out hover:border-border-strong hover:bg-surface-2 motion-safe:hover:-translate-y-px sm:p-5"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <BrokerLogo name={broker.name} logo={broker.logo} logoBg={broker.logoBg} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{broker.name}</h2>
            {broker.ourChoice && <OurChoiceBadge />}
          </div>
          {broker.founded && <p className="meta mt-0.5">Since {broker.founded}</p>}
          {broker.trustpilot && (
            <div className="relative z-10 mt-1.5">
              <TrustpilotStars rating={broker.trustpilot} size="sm" />
            </div>
          )}
        </div>
      </div>

      {broker.tagline && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{broker.tagline}</p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <dt className="eyebrow">Min. deposit</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">{deposit ?? "Varies"}</dd>
        </div>
        <div>
          <dt className="eyebrow">Leverage</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{leverageLabel(broker)}</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <button
          type="button"
          aria-pressed={selected}
          onClick={onToggleCompare}
          className={`relative z-10 inline-flex min-h-11 items-center rounded-lg border px-3 text-xs font-semibold transition-colors duration-150 ${
            selected
              ? "border-accent bg-accent/12 text-foreground"
              : "border-border-strong text-muted hover:border-subtle hover:text-foreground"
          }`}
        >
          {selected ? "In compare" : "Compare"}
        </button>
        <Link
          href={
            listingQuery
              ? `/brokers/${broker.id}?back=${encodeURIComponent(listingQuery)}`
              : `/brokers/${broker.id}`
          }
          className="inline-flex min-h-9 items-center text-sm font-semibold text-foreground after:absolute after:inset-0"
        >
          View
          <span className="sr-only"> {broker.name}</span>
          <span
            aria-hidden="true"
            className="ml-1 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transform-none"
          >
            →
          </span>
        </Link>
      </div>
    </li>
  );
}

function ComparePanel({
  brokers,
  onRemove,
  onClear,
  note,
}: {
  brokers: BrokerView[];
  onRemove: (id: string) => void;
  onClear: () => void;
  note: string;
}) {
  return (
    <section aria-labelledby="compare-heading" className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h2 id="compare-heading" className="text-sm font-semibold tracking-tight">
            Compare {brokers.length} {brokers.length === 1 ? "broker" : "brokers"}
          </h2>
          <p className="meta mt-0.5">Side by side from each listing. This is not a ranking.</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-muted underline underline-offset-2 hover:text-foreground"
        >
          Clear comparison
        </button>
      </div>
      {note && (
        <p role="status" className="meta border-b border-border px-4 py-2 sm:px-5">
          {note}
        </p>
      )}
      {brokers.length < 2 ? (
        <p className="px-4 py-4 text-sm text-muted sm:px-5">Select one more broker to see them side by side.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="eyebrow sticky left-0 bg-surface px-4 py-3 font-semibold sm:px-5">
                  <span className="sr-only">Field</span>
                </th>
                {brokers.map((broker) => (
                  <th key={broker.id} scope="col" className="min-w-40 px-4 py-3 font-semibold text-foreground">
                    <Link href={`/brokers/${broker.id}`} className="hover:underline">
                      {broker.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => onRemove(broker.id)}
                      className="mt-1 block text-xs font-medium text-muted hover:text-foreground"
                    >
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <CompareRow label="Min. deposit" values={brokers.map((b) => formatDeposit(b.minDeposit, b.currency) ?? "Varies")} />
              <CompareRow label="Leverage" values={brokers.map((b) => leverageLabel(b))} />
              <CompareRow
                label="Regulators"
                values={brokers.map((b) =>
                  b.regulators.length ? b.regulators.map((r) => r.regulator).join(", ") : "None listed",
                )}
              />
              <CompareRow
                label="Platforms"
                values={brokers.map((b) => (b.platforms.length ? b.platforms.join(", ") : "Not listed"))}
              />
              <CompareRow
                label="Markets"
                values={brokers.map((b) => b.markets.map((m) => BROKER_MARKET_LABELS[m]).join(", "))}
              />
              <CompareRow
                label="Trustpilot"
                values={brokers.map((b) =>
                  b.trustpilot
                    ? `${b.trustpilot.rating.toFixed(1)} / 5${b.trustpilot.reviewCount != null ? ` (${b.trustpilot.reviewCount.toLocaleString("en-US")})` : ""}`
                    : "Not listed",
                )}
              />
              <CompareRow label="Published offer" values={brokers.map((b) => b.promotions ?? "None recorded")} />
              {brokers.some((b) => b.companyRegistration) && (
                <CompareRow
                  label="Company registration"
                  values={brokers.map((b) => b.companyRegistration ?? "None listed")}
                />
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="meta border-t border-border px-4 py-3 sm:px-5">
        Offers change often and depend on where you live. Check the broker&apos;s site before you rely on one.
        Trustpilot figures are review scores, not trading results.
      </p>
    </section>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <th scope="row" className="sticky left-0 bg-surface px-4 py-3 text-left align-top text-xs font-semibold text-muted sm:px-5">
        {label}
      </th>
      {values.map((value, i) => (
        <td key={i} className="px-4 py-3 align-top text-foreground">
          {value}
        </td>
      ))}
    </tr>
  );
}

function activeFilterChips(f: Filters): { key: keyof Filters; label: string }[] {
  const chips: { key: keyof Filters; label: string }[] = [];
  if (f.market) {
    chips.push({
      key: "market",
      label: BROKER_MARKET_LABELS[f.market as keyof typeof BROKER_MARKET_LABELS] ?? f.market,
    });
  }
  if (f.regulator) chips.push({ key: "regulator", label: f.regulator });
  if (f.maxDeposit) chips.push({ key: "maxDeposit", label: `Deposit up to ${f.maxDeposit}` });
  if (f.minRating) chips.push({ key: "minRating", label: `${f.minRating}+ stars` });
  return chips;
}

function Select({
  label,
  value,
  onChange,
  options,
  anyLabel = "All",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  anyLabel?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field">
        <option value="">{anyLabel}</option>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
