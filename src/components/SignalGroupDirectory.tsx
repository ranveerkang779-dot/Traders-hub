"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type ReactNode } from "react";
import SignalGroupLogo from "@/components/SignalGroupLogo";
import VisitSiteLink from "@/components/VisitSiteLink";
import {
  SIGNAL_EXTRA_LABELS,
  SIGNAL_EXTRA_ORDER,
  SIGNAL_MARKET_LABELS,
  SIGNAL_MARKET_ORDER,
  SIGNAL_PRICE_LABELS,
  SIGNAL_PRICE_ORDER,
  SIGNAL_STYLE_LABELS,
  SIGNAL_STYLE_ORDER,
  type SignalExtra,
  type SignalGroupView,
  type SignalMarket,
  type SignalPrice,
  type SignalStyle,
} from "@/lib/signal-group-types";

type MarketFilter = SignalMarket | "all";
type StyleFilter = SignalStyle | "any";
type PriceFilter = SignalPrice | "any";

type Filters = {
  market: MarketFilter;
  style: StyleFilter;
  price: PriceFilter;
  extras: SignalExtra[];
  language: string;
  query: string;
};

export default function SignalGroupDirectory({ groups }: { groups: SignalGroupView[] }) {
  return (
    <Suspense fallback={<Directory groups={groups} initialQuery="" />}>
      <DirectoryFromAddress groups={groups} />
    </Suspense>
  );
}

function DirectoryFromAddress({ groups }: { groups: SignalGroupView[] }) {
  const searchParams = useSearchParams();
  return <Directory groups={groups} initialQuery={searchParams.toString()} />;
}

function Directory({ groups, initialQuery }: { groups: SignalGroupView[]; initialQuery: string }) {
  const initial = filtersFromQuery(initialQuery);
  const [market, setMarket] = useState<MarketFilter>(initial.market);
  const [style, setStyle] = useState<StyleFilter>(initial.style);
  const [price, setPrice] = useState<PriceFilter>(initial.price);
  const [extras, setExtras] = useState<SignalExtra[]>(initial.extras);
  const [language, setLanguage] = useState(initial.language);
  const [query, setQuery] = useState(initial.query);

  const filters: Filters = { market, style, price, extras, language, query };

  const marketCounts = useMemo(() => {
    const map = new Map<SignalMarket, number>();
    for (const group of groups) {
      for (const id of group.markets) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [groups]);

  const languages = useMemo(() => {
    return [...new Set(groups.map((group) => group.language).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [groups]);

  const matching = groups.filter((group) => matches(group, filters));

  function commit(next: Filters) {
    setMarket(next.market);
    setStyle(next.style);
    setPrice(next.price);
    setExtras(next.extras);
    setLanguage(next.language);
    setQuery(next.query);
    const params = new URLSearchParams();
    if (next.market !== "all") params.set("market", next.market);
    if (next.style !== "any") params.set("style", next.style);
    if (next.price !== "any") params.set("price", next.price);
    if (next.extras.length) params.set("extras", next.extras.join(","));
    if (next.language !== "any") params.set("language", next.language);
    const trimmed = next.query.trim();
    if (trimmed) params.set("q", trimmed);
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }

  function toggleExtra(extra: SignalExtra) {
    const nextExtras = extras.includes(extra) ? extras.filter((item) => item !== extra) : [...extras, extra];
    commit({ ...filters, extras: nextExtras });
  }

  const marketName = market === "all" ? "" : SIGNAL_MARKET_LABELS[market];

  return (
    <div>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => commit({ ...filters, query: event.target.value })}
          placeholder="Search by name, market or language"
          className="field"
        />
      </label>

      <div className="mt-5">
        <p className="eyebrow" id="signal-market-label">
          Market
        </p>
        <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-labelledby="signal-market-label">
          <FilterChip
            label="All"
            count={groups.length}
            pressed={market === "all"}
            onClick={() => commit({ ...filters, market: "all" })}
          />
          {SIGNAL_MARKET_ORDER.map((id) => (
            <FilterChip
              key={id}
              label={SIGNAL_MARKET_LABELS[id]}
              count={marketCounts.get(id) ?? 0}
              pressed={market === id}
              onClick={() => commit({ ...filters, market: id })}
            />
          ))}
        </div>
        <p className="meta mt-2">Indices includes NQ, US30, S&amp;P 500 and DAX.</p>
      </div>

      <FilterRow label="Trading style">
        <FilterChip label="Any" pressed={style === "any"} onClick={() => commit({ ...filters, style: "any" })} />
        {SIGNAL_STYLE_ORDER.map((id) => (
          <FilterChip
            key={id}
            label={SIGNAL_STYLE_LABELS[id]}
            pressed={style === id}
            onClick={() => commit({ ...filters, style: id })}
          />
        ))}
      </FilterRow>

      <FilterRow label="Price">
        <FilterChip label="Any" pressed={price === "any"} onClick={() => commit({ ...filters, price: "any" })} />
        {SIGNAL_PRICE_ORDER.map((id) => (
          <FilterChip
            key={id}
            label={SIGNAL_PRICE_LABELS[id]}
            pressed={price === id}
            onClick={() => commit({ ...filters, price: id })}
          />
        ))}
      </FilterRow>

      <FilterRow label="Extras">
        {SIGNAL_EXTRA_ORDER.map((id) => (
          <FilterChip
            key={id}
            label={SIGNAL_EXTRA_LABELS[id]}
            pressed={extras.includes(id)}
            onClick={() => toggleExtra(id)}
          />
        ))}
      </FilterRow>

      <FilterRow label="Language">
        <FilterChip
          label="Any"
          pressed={language === "any"}
          onClick={() => commit({ ...filters, language: "any" })}
        />
        {languages.map((name) => (
          <FilterChip
            key={name}
            label={name}
            pressed={language === name}
            onClick={() => commit({ ...filters, language: name })}
          />
        ))}
        {languages.length === 0 && <span className="meta self-center">No languages listed yet.</span>}
      </FilterRow>

      <p aria-live="polite" className="meta mt-4">
        <span className="font-semibold text-foreground">{matching.length}</span> of {groups.length} shown
        {marketName ? ` in ${marketName}` : ""}.
      </p>

      {groups.length === 0 ? (
        <EmptyDirectory />
      ) : matching.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border-strong px-6 py-12 text-center text-muted">
          No groups match these filters. Clear one and try again.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matching.map((group, index) => (
            <GroupCard key={group.slug} group={group} index={index} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <p className="eyebrow">{label}</p>
      <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  count?: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 ${
        pressed
          ? "border-accent bg-accent/15 text-foreground"
          : "border-border-strong bg-surface text-muted hover:border-subtle hover:text-foreground"
      }`}
    >
      {label}
      {count != null && (
        <span className={`tabular-nums ${pressed ? "text-foreground" : "text-subtle"}`}>{count}</span>
      )}
    </button>
  );
}

function GroupCard({ group, index }: { group: SignalGroupView; index: number }) {
  return (
    <li
      className="signal-card lift-card flex flex-col rounded-xl border border-border bg-surface p-4 sm:p-5"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <SignalGroupLogo name={group.name} logo={group.logo} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{group.name}</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {group.markets.map((id) => (
              <li key={id} className="pill">
                {SIGNAL_MARKET_LABELS[id]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {group.description && (
        <p className="mt-3 text-sm leading-relaxed text-muted">{group.description}</p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
        {factsFor(group).map((fact) => (
          <Fact key={fact.label} label={fact.label} value={fact.value} note={fact.note} />
        ))}
      </dl>

      {group.telegramUrl && (
        <div className="mt-auto pt-4">
          <VisitSiteLink href={group.telegramUrl} firmName={group.name} label="Join" className="w-full" />
        </div>
      )}
    </li>
  );
}

function factsFor(group: SignalGroupView): { label: string; value: string; note?: string }[] {
  const facts: { label: string; value: string; note?: string }[] = [];
  if (group.memberCount) {
    const asOf = memberAsOfLabel(group.memberCountAsOf);
    facts.push({ label: "Members", value: group.memberCount, note: asOf ?? undefined });
  }
  facts.push({ label: "Price", value: group.priceLabel });
  if (group.styles.length) {
    facts.push({
      label: "Style",
      value: group.styles.map((id) => SIGNAL_STYLE_LABELS[id]).join(", "),
    });
  }
  if (group.signalsPerDay) facts.push({ label: "Signals", value: group.signalsPerDay });
  if (group.language) facts.push({ label: "Language", value: group.language });
  return facts;
}

function memberAsOfLabel(iso: string | null): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const name = months[month - 1];
  if (!name || !year || !day) return null;
  return `as of ${day} ${name} ${year}`;
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
      {note && <p className="meta mt-0.5">{note}</p>}
    </div>
  );
}

function EmptyDirectory() {
  return (
    <div className="panel-accent mt-8 rounded-xl border border-border bg-surface px-5 py-8 sm:px-8 sm:py-10">
      <h2 className="section-title">No groups listed yet</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        This directory is ready for Telegram signal groups. None are published yet. A group is added
        only after it meets the listing rules, and the filters above are what you will use to narrow
        the list.
      </p>
      <ul className="mt-4 max-w-2xl list-disc space-y-1.5 pl-5 text-sm text-muted marker:text-accent">
        <li>No guaranteed-return language, and no pressure to deposit more money.</li>
        <li>A free option or a trial is available.</li>
        <li>We do not score results, accuracy or how often a group&apos;s calls make money.</li>
      </ul>
    </div>
  );
}

function matches(group: SignalGroupView, filters: Filters): boolean {
  if (filters.market !== "all" && !group.markets.includes(filters.market)) return false;
  if (filters.style !== "any" && !group.styles.includes(filters.style)) return false;
  if (filters.price !== "any" && group.price !== filters.price) return false;
  if (filters.extras.some((extra) => !group.extras.includes(extra))) return false;
  if (filters.language !== "any" && group.language !== filters.language) return false;
  return matchesQuery(group, filters.query);
}

function matchesQuery(group: SignalGroupView, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    group.name,
    group.description,
    group.language,
    group.priceLabel,
    group.memberCount ?? "",
    group.signalsPerDay ?? "",
    ...group.markets.map((id) => SIGNAL_MARKET_LABELS[id]),
    ...group.styles.map((id) => SIGNAL_STYLE_LABELS[id]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function filtersFromQuery(initialQuery: string): Filters {
  const params = new URLSearchParams(initialQuery);
  const market = params.get("market") ?? "all";
  const style = params.get("style") ?? "any";
  const price = params.get("price") ?? "any";
  const language = params.get("language") ?? "any";
  const extras = (params.get("extras") ?? "")
    .split(",")
    .filter((extra): extra is SignalExtra => extra in SIGNAL_EXTRA_LABELS);
  return {
    market: market in SIGNAL_MARKET_LABELS ? (market as SignalMarket) : "all",
    style: style in SIGNAL_STYLE_LABELS ? (style as SignalStyle) : "any",
    price: price in SIGNAL_PRICE_LABELS ? (price as SignalPrice) : "any",
    extras,
    language,
    query: params.get("q") ?? "",
  };
}
