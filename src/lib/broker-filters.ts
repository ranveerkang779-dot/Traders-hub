// Filter-bar logic for the Brokers page — same idea as course-filters.ts.

import type { BrokerMarket, BrokerView } from "./broker-types";

export type SortKey = "name" | "deposit" | "rating";

export type Filters = {
  market: string;
  regulator: string;
  maxDeposit: string;
  minRating: string;
};

export const EMPTY_FILTERS: Filters = {
  market: "",
  regulator: "",
  maxDeposit: "",
  minRating: "",
};

export function matchesFilters(b: BrokerView, f: Filters): boolean {
  const maxDeposit = f.maxDeposit === "" ? NaN : Number(f.maxDeposit);
  return (
    (!f.market || b.markets.includes(f.market as BrokerMarket)) &&
    (!f.regulator || b.regulators.some((r) => r.regulator === f.regulator)) &&
    (Number.isNaN(maxDeposit) || (b.minDeposit != null && b.minDeposit <= maxDeposit)) &&
    (!f.minRating || (b.trustpilot != null && b.trustpilot.rating >= Number(f.minRating)))
  );
}

// ---- Filters in the web address ---------------------------------------------

const QUERY_KEYS: Record<keyof Filters, string> = {
  market: "market",
  regulator: "regulator",
  maxDeposit: "deposit",
  minRating: "rating",
};

export function filtersToQuery(f: Filters): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(QUERY_KEYS) as (keyof Filters)[]) {
    if (f[key]) params.set(QUERY_KEYS[key], f[key]);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function filtersFromQuery(params: { get(name: string): string | null }): Filters {
  const f = { ...EMPTY_FILTERS };
  for (const key of Object.keys(QUERY_KEYS) as (keyof Filters)[]) {
    f[key] = params.get(QUERY_KEYS[key]) ?? "";
  }
  return f;
}

export function sortFromQuery(value: string | null): SortKey {
  if (value === "deposit" || value === "rating") return value;
  return "name";
}

const LISTING_QUERY_KEYS = ["market", "regulator", "deposit", "rating", "sort", "compare"] as const;

/** Turn the directory's current filters into a query string, without the "?". */
export function currentListingQuery(filters: Filters, sort: SortKey, compare: string[]): string {
  const query = new URLSearchParams(filtersToQuery(filters).replace(/^\?/, ""));
  if (sort !== "name") query.set("sort", sort);
  if (compare.length) query.set("compare", compare.join(","));
  return query.toString();
}

/**
 * Back link from a broker page. Only known directory filters are kept, so a
 * crafted address cannot send someone off the site.
 */
export function listingHrefFromBack(back: string | null | undefined): string {
  if (!back) return "/brokers";
  const incoming = new URLSearchParams(back);
  const out = new URLSearchParams();
  for (const key of LISTING_QUERY_KEYS) {
    const value = incoming.get(key);
    if (!value || value.length > 120) continue;
    if (key === "sort" && value !== "deposit" && value !== "rating") continue;
    if (key === "compare" && !/^[a-z0-9,-]+$/.test(value)) continue;
    out.set(key, value);
  }
  const qs = out.toString();
  return qs ? `/brokers?${qs}` : "/brokers";
}

/** Up to three broker ids from ?compare=a,b,c */
export function compareFromQuery(value: string | null): string[] {
  if (!value) return [];
  const ids = value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]+$/.test(s));
  return [...new Set(ids)].slice(0, 3);
}

function compareBySort(a: BrokerView, b: BrokerView, sort: SortKey): number {
  if (sort === "deposit") {
    if (a.minDeposit == null && b.minDeposit == null) return a.name.localeCompare(b.name);
    if (a.minDeposit == null) return 1;
    if (b.minDeposit == null) return -1;
    return a.minDeposit - b.minDeposit || a.name.localeCompare(b.name);
  }
  if (sort === "rating") {
    return (b.trustpilot?.rating ?? -1) - (a.trustpilot?.rating ?? -1) || a.name.localeCompare(b.name);
  }
  return a.name.localeCompare(b.name);
}

/**
 * Our-choice brokers stay first for every sort. If more than one is marked,
 * that group is ordered by name. Everyone else keeps the selected sort.
 */
export function sortBrokers(list: BrokerView[], sort: SortKey): BrokerView[] {
  const copy = [...list];
  copy.sort((a, b) => {
    if (a.ourChoice !== b.ourChoice) return a.ourChoice ? -1 : 1;
    if (a.ourChoice && b.ourChoice) return a.name.localeCompare(b.name);
    return compareBySort(a, b, sort);
  });
  return copy;
}

export function leverageLabel(broker: BrokerView): string {
  return broker.leverageSummary || broker.leverage[0]?.value || "Not listed";
}
