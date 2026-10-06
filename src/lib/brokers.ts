// Loads every `brokers-data-*.json` file in the project root, the same way
// courses.ts loads course files. To add a broker, drop a new
// `brokers-data-<name>.json` file next to the others and redeploy — no code
// changes needed.
//
// Files are read at build time, so the published page is static and the
// server never reads them at runtime (hence the turbopackIgnore hints below).

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { BrokerMarket, BrokerView } from "./broker-types";

type RawRow = { label: string; value: string; note?: string | null };

type RawFile = {
  broker: {
    id: string;
    name: string;
    logo?: string | null;
    logo_bg?: "white" | "dark" | null;
    tagline?: string | null;
    about?: string | null;
    founded?: number | null;
    headquarters?: string | null;
    min_deposit?: number | null;
    currency?: string | null;
    markets?: BrokerMarket[];
    regulators?: { regulator: string; country: string; entity?: string | null }[];
    regulators_note?: string | null;
    company_registration?: string | null;
    platforms?: string[];
    plans?: {
      name: string;
      price: string;
      billing_note?: string | null;
      highlight?: string | null;
      link?: string | null;
    }[];
    costs?: { title: string; rows: RawRow[] }[];
    costs_note?: string | null;
    leverage?: { market: string; value: string; note?: string | null }[];
    leverage_summary?: string | null;
    leverage_note?: string | null;
    promotions?: string | null;
    margin_rates?: {
      columns: string[];
      rows: { tier: string; values: string[] }[];
      note?: string | null;
    } | null;
    other_fees?: RawRow[];
    trustpilot?: {
      rating: number;
      review_count?: number | null;
      url?: string | null;
      label?: string | null;
    } | null;
    website?: string | null;
    affiliate_link?: string | null;
    /** Featured listing. Only brokers set to true are pinned and badged. */
    our_choice?: boolean | null;
  };
};

const DATA_FILE_PATTERN = /^brokers-data-.+\.json$/i;

const DEFAULT_LEVERAGE_NOTE =
  "Leverage makes losses bigger as well as gains, and you can lose more than you deposited.";

function loadBrokers(): BrokerView[] {
  const dir = process.cwd();
  const files = readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => DATA_FILE_PATTERN.test(f))
    .sort();

  const brokers = files.map((file) => {
    let data: RawFile;
    try {
      data = JSON.parse(readFileSync(path.join(/*turbopackIgnore: true*/ dir, file), "utf-8"));
    } catch (err) {
      throw new Error(`Could not read broker data file "${file}": ${err}`);
    }
    if (!data?.broker?.id || !data.broker.name) {
      throw new Error(`Broker data file "${file}" is missing "broker.id" or "broker.name".`);
    }
    if (!/^[a-z0-9-]+$/.test(data.broker.id)) {
      throw new Error(
        `Broker data file "${file}": "id" must use only lowercase letters, numbers and dashes.`,
      );
    }
    return buildBroker(data.broker);
  });

  const ids = brokers.map((b) => b.id);
  const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
  if (duplicate) throw new Error(`Two broker data files use the id "${duplicate}".`);
  return brokers;
}

function buildRow(r: RawRow) {
  return { label: r.label, value: r.value, note: r.note || null };
}

function buildBroker(b: RawFile["broker"]): BrokerView {
  return {
    id: b.id,
    name: b.name,
    logo: b.logo || null,
    logoBg: b.logo_bg === "dark" ? "dark" : "white",
    tagline: b.tagline || null,
    about: b.about || null,
    founded: b.founded ?? null,
    headquarters: b.headquarters || null,
    minDeposit: b.min_deposit ?? null,
    currency: b.currency || "USD",
    markets: b.markets ?? [],
    regulators: (b.regulators ?? []).map((r) => ({
      regulator: r.regulator,
      country: r.country,
      entity: r.entity || null,
    })),
    regulatorsNote: b.regulators_note || null,
    companyRegistration: b.company_registration || null,
    platforms: b.platforms ?? [],
    plans: (b.plans ?? []).map((p) => ({
      name: p.name,
      price: p.price,
      billingNote: p.billing_note ?? null,
      highlight: p.highlight ?? null,
      link: safeLink(p.link),
    })),
    costs: (b.costs ?? []).map((g) => ({ title: g.title, rows: g.rows.map(buildRow) })),
    costsNote: b.costs_note || null,
    leverage: (b.leverage ?? []).map((l) => ({ market: l.market, value: l.value, note: l.note || null })),
    leverageSummary: b.leverage_summary || null,
    leverageNote: b.leverage_note || DEFAULT_LEVERAGE_NOTE,
    marginRates: b.margin_rates
      ? {
          columns: b.margin_rates.columns,
          rows: b.margin_rates.rows,
          note: b.margin_rates.note || null,
        }
      : null,
    otherFees: (b.other_fees ?? []).map(buildRow),
    trustpilot: b.trustpilot
      ? {
          rating: b.trustpilot.rating,
          reviewCount: b.trustpilot.review_count ?? null,
          url: safeLink(b.trustpilot.url),
          label: b.trustpilot.label || null,
        }
      : null,
    promotions: b.promotions || null,
    website: safeLink(b.website),
    affiliateLink: safeLink(b.affiliate_link),
    ourChoice: b.our_choice === true,
  };
}

export { brokerOutboundUrl } from "./broker-types";

// Only allow normal web links, so a typo in a data file can't produce a
// harmful link (e.g. "javascript:...") — same guard as courses.ts.
function safeLink(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

// Read once when the module loads (build time for a static page).
export const brokers: BrokerView[] = loadBrokers();

export function getBroker(id: string): BrokerView | undefined {
  return brokers.find((b) => b.id === id);
}
