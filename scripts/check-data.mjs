#!/usr/bin/env node
// Checks every listing data file (propfirms-data-*.json, courses-data-*.json,
// providers-data-*.json) for mistakes before they reach the live site.
//
//   npm run check:data            -> check all files, print a report
//   node scripts/check-data.mjs --hook
//                                 -> used by Claude Code after it edits a file.
//                                    Reads the edit from stdin and only runs when
//                                    a data file was touched.
//
// ERRORS block a release (wrong shape, banned wording, broken links).
// WARNINGS are things a human should look at (stale prices, missing fields).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT =
  process.env.CLAUDE_PROJECT_DIR ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PROP_PATTERN = /^propfirms-data-.+\.json$/i;
const COURSE_PATTERN = /^courses-data-.+\.json$/i;
// A "provider" sells several distinct courses under one brand (e.g. Sharper
// Trades) rather than one course on its own — see provider-types.ts.
const PROVIDER_PATTERN = /^providers-data-.+\.json$/i;
const BROKER_PATTERN = /^brokers-data-.+\.json$/i;
const STALE_AFTER_DAYS = 30;

// Keep in sync with BrokerMarket in src/lib/broker-types.ts.
const KNOWN_BROKER_MARKETS = new Set(["stocks", "options", "futures", "forex", "bonds", "funds", "crypto", "cfds"]);

// Keep in sync with CourseMarket in src/lib/course-types.ts.
const KNOWN_MARKETS = new Set(["forex", "futures", "options", "stocks", "crypto", "commodities"]);

function checkMarkets(file, where, markets) {
  if (markets == null) return;
  if (!Array.isArray(markets)) return err(file, `${where}.markets must be a list`);
  for (const m of markets) {
    if (!KNOWN_MARKETS.has(m))
      err(file, `${where}.markets has "${m}" - must be one of ${[...KNOWN_MARKETS].join(", ")}`);
  }
}

// Wording we never publish (see CLAUDE.md "Non-negotiable constraints").
const BANNED = [
  [/guaranteed?\s+(profits?|returns?|income|payouts?|results?|funding)/i, "promises a guaranteed outcome"],
  [/\brisk[\s-]?free\b/i, "says trading is risk-free"],
  [/\bwin[\s-]?rate\b/i, "shows a win rate"],
  [/\bcan'?t\s+lose\b|\bno[\s-]?lose\b/i, "implies you can't lose"],
  [/\bget\s+rich\b/i, "get-rich wording"],
  [/\b\d{2,3}\s?%\s+accura(te|cy)\b/i, "claims an accuracy score"],
];
// Wording that is sometimes fine but needs a human look.
const REVIEW = [
  [/\bprofitable\b/i, "uses the word 'profitable'"],
  [/\bpassive income\b/i, "uses 'passive income'"],
  [/\bAlpha (Futures|Capital)\b/, "mentions Alpha Futures / Alpha Capital (we list Alpha Funded)"],
];
// Fields where quoting someone else is expected; banned wording here is a
// warning (we may be quoting the provider) rather than an error.
const QUOTE_FIELDS = new Set(["quote", "name_note"]);

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isNumOrNull = (v) => v === null || v === undefined || isNum(v);

function checkLink(file, field, url) {
  if (url === null || url === undefined || url === "") return;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") err(file, `${field} should start with https:// (got "${url}")`);
  } catch {
    err(file, `${field} is not a valid web address: "${url}"`);
  }
}

// A rating from any review platform (Trustpilot, Whop, ...) — same shape,
// same checks either way.
function checkRating(file, field, r) {
  if (!r) return;
  checkLink(file, `${field}.url`, r.url);
  if (!isNum(r.rating) || r.rating < 0 || r.rating > 5) err(file, `${field}.rating must be between 0 and 5`);
}

function checkCurrency(file, code) {
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: code });
  } catch {
    err(file, `currency "${code}" is not a valid 3-letter currency code (e.g. USD, EUR)`);
  }
}

function checkVerified(file, notes) {
  const d = notes?.last_verified;
  if (!d) {
    warn(file, `no "_notes.last_verified" date - add the date you checked the provider's site`);
    return;
  }
  const age = (Date.now() - new Date(d).getTime()) / 86_400_000;
  if (Number.isNaN(age)) err(file, `"_notes.last_verified" is not a date (use YYYY-MM-DD)`);
  else if (age > STALE_AFTER_DAYS)
    warn(file, `prices last verified ${d} (${Math.floor(age)} days ago) - re-check the live pricing page`);
}

// Walk every string in the file and scan its wording.
function scanWording(file, value, trail = []) {
  if (typeof value === "string") {
    const field = trail[trail.length - 1];
    if (trail[0] === "_notes") return;
    for (const [re, why] of BANNED) {
      if (re.test(value)) {
        const where = trail.join(".");
        if (QUOTE_FIELDS.has(field)) warn(file, `${where} ${why} (quoted text - check it's clearly attributed): "${value}"`);
        else err(file, `${where} ${why}: "${value}"`);
      }
    }
    for (const [re, why] of REVIEW) {
      if (re.test(value) && field !== "name_note") warn(file, `${trail.join(".")} ${why}: "${value}"`);
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scanWording(file, v, [...trail, String(i)]));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) scanWording(file, v, [...trail, k]);
  }
}

// Which countries a firm accepts. Codes are ISO 3166-1 alpha-2 (US, GB, AE...),
// so a future "where are you from?" filter can use them directly.
function checkCountries(file, c) {
  if (!c) return warn(file, `no "firm.countries" - add which countries the firm does and doesn't accept`);
  for (const key of ["restricted", "allowed_only"]) {
    const list = c[key];
    if (list == null) continue;
    if (!Array.isArray(list)) {
      err(file, `firm.countries.${key} must be a list of country codes or null`);
      continue;
    }
    for (const code of list) {
      if (!/^[A-Z]{2}$/.test(code)) err(file, `firm.countries.${key}: "${code}" is not a 2-letter country code (e.g. "US", "AE")`);
    }
  }
  if (c.restricted == null && c.allowed_only == null)
    warn(file, `firm.countries has no restricted or allowed_only list - country rules not found yet`);
  checkLink(file, "firm.countries.source", c.source);
  if (!c.last_checked) warn(file, `firm.countries has no "last_checked" date`);
}

// Trustpilot / Google ratings shown in a firm's "Reviews" box. A missing
// rating needs a note saying why, because the note is shown instead.
function checkReviews(file, r) {
  if (!r) return warn(file, `no "firm.reviews" - add the Trustpilot and Google ratings`);
  for (const site of ["trustpilot", "google"]) {
    const v = r[site];
    const where = `firm.reviews.${site}`;
    if (v == null) {
      if (!r[`${site}_note`]) warn(file, `${where} is empty and has no ${site}_note saying why`);
      continue;
    }
    if (!isNum(v.rating) || v.rating < 0 || v.rating > 5) err(file, `${where}.rating must be a number from 0 to 5`);
    if (v.review_count != null && (!Number.isInteger(v.review_count) || v.review_count < 0))
      err(file, `${where}.review_count must be a whole number (no commas)`);
    checkLink(file, `${where}.url`, v.url);
    if (!v.checked) warn(file, `${where} has no "checked" date`);
    else if (Number.isNaN(new Date(v.checked).getTime())) err(file, `${where}.checked is not a date (use YYYY-MM-DD)`);
  }
  const quotes = r.trustpilot_quotes ?? [];
  if (!Array.isArray(quotes)) return err(file, `firm.reviews.trustpilot_quotes must be a list`);
  if (quotes.length > 3) warn(file, `firm.reviews.trustpilot_quotes has ${quotes.length} quotes - keep it to 3`);
  quotes.forEach((q, i) => {
    const where = `firm.reviews.trustpilot_quotes[${i}]`;
    if (!q.quote) err(file, `${where} has no quote text`);
    else if (q.quote.length > 300) warn(file, `${where} is ${q.quote.length} characters - use a shorter excerpt`);
    if (!q.author) err(file, `${where} has no author`);
    if (q.stars != null && (!Number.isInteger(q.stars) || q.stars < 1 || q.stars > 5)) err(file, `${where}.stars must be 1 to 5`);
    if (q.date && Number.isNaN(new Date(q.date).getTime())) err(file, `${where}.date is not a date (use YYYY-MM-DD)`);
    checkLink(file, `${where}.url`, q.url);
  });
  // A page showing only praise (or only complaints) reads as cherry-picked.
  const stars = quotes.map((q) => q.stars).filter((s) => s != null);
  if (stars.length >= 2 && (stars.every((s) => s >= 4) || stars.every((s) => s <= 2)))
    warn(file, `firm.reviews.trustpilot_quotes are all ${stars[0] >= 4 ? "positive" : "negative"} - aim for a range of opinions`);
}

function checkPropFirm(file, data) {
  const f = data?.firm;
  if (!f) return err(file, `missing top-level "firm"`);
  if (!/^[a-z0-9-]+$/.test(f.id ?? "")) err(file, `firm.id must be lowercase letters, numbers and dashes (got "${f.id}")`);
  if (!f.name) err(file, `firm.name is missing`);
  if (!f.about) warn(file, `firm.about is empty - add a short description in our own words`);
  checkCurrency(file, f.currency);
  checkLink(file, "firm.website", f.website);
  checkLink(file, "firm.affiliate_link", f.affiliate_link);
  if (!f.affiliate_link) warn(file, `no affiliate_link yet - the "Visit site" button stays hidden`);
  if (f.platforms !== null && !Array.isArray(f.platforms)) err(file, `firm.platforms must be a list or null`);
  checkCountries(file, f.countries);
  checkReviews(file, f.reviews);
  if (f.logo) {
    if (!f.logo.startsWith("/")) err(file, `firm.logo should be a path under /public, e.g. "/funded-accounts/${f.id}-logo.png"`);
    else if (!existsSync(path.join(ROOT, "public", f.logo))) err(file, `firm.logo file not found: public${f.logo}`);
  } else warn(file, `no firm.logo - the page shows the firm's initials instead`);
  if (f.logo_bg != null && f.logo_bg !== "white" && f.logo_bg !== "dark")
    err(file, `firm.logo_bg must be "white", "dark" or left out (got "${f.logo_bg}")`);
  if (!Array.isArray(f.markets) || f.markets.length === 0) return err(file, `firm.markets must be a non-empty list`);

  f.markets.forEach((m, mi) => {
    const at = `markets[${mi}]`;
    if (m.market !== "forex" && m.market !== "futures") err(file, `${at}.market must be "forex" or "futures" (got "${m.market}")`);
    if (!Array.isArray(m.programs) || m.programs.length === 0) return err(file, `${at}.programs must be a non-empty list`);
    m.programs.forEach((p, pi) => {
      const pat = `${at}.programs[${pi}] (${p.program})`;
      if (!p.program) err(file, `${pat} has no "program" name`);
      (p.tiers ?? []).forEach((t, ti) => {
        const tat = `${pat}.tiers[${ti}] (${t.tier})`;
        if (t.billing != null && t.billing !== "one-time" && t.billing !== "monthly")
          err(file, `${tat}: billing must be "one-time" or "monthly" (got "${t.billing}")`);
        const unit = t.rules?.unit;
        if (m.market === "forex" && unit !== "percent") err(file, `${tat}: forex rules must use "unit": "percent"`);
        if (m.market === "futures" && unit !== "usd") err(file, `${tat}: futures rules must use "unit": "usd"`);
        const split = t.rules?.profit_split_max;
        if (!isNumOrNull(split) || (isNum(split) && (split <= 0 || split > 100))) err(file, `${tat}: profit_split_max must be a number between 1 and 100`);
        if (unit === "percent") {
          for (const k of ["phase1_target", "phase2_target", "phase3_target", "daily_loss", "max_loss"]) {
            const v = t.rules[k];
            if (k === "daily_loss" && v === "none") continue; // firm has no daily limit
            if (!isNumOrNull(v)) err(file, `${tat}: ${k} must be a number or null${k === "daily_loss" ? ' (or "none" for no limit)' : ""}`);
            else if (isNum(v) && (v <= 0 || v > 50)) err(file, `${tat}: ${k} = ${v}% looks wrong (forex rules are % of account size)`);
          }
        }
        if (!Array.isArray(t.accounts) || t.accounts.length === 0) return err(file, `${tat} has no accounts`);
        const seen = new Set();
        t.accounts.forEach((a) => {
          const aat = `${tat} $${a.size}`;
          if (!isNum(a.size) || a.size <= 0) err(file, `${tat}: account size must be a positive number`);
          if (seen.has(a.size)) err(file, `${aat} is listed twice`);
          seen.add(a.size);
          if (!isNumOrNull(a.promo) || !isNumOrNull(a.standard)) err(file, `${aat}: prices must be numbers (no currency symbols) or null`);
          if (a.promo == null && a.standard == null) warn(file, `${aat} has no price`);
          if (isNum(a.promo) && isNum(a.standard) && a.promo >= a.standard)
            err(file, `${aat}: promo price (${a.promo}) should be lower than the standard price (${a.standard})`);
          if (unit === "usd") {
            if (!isNumOrNull(a.daily_loss) && a.daily_loss !== "none")
              err(file, `${aat}: daily_loss must be a number, null, or "none" for no limit`);
            for (const k of ["profit_target", "daily_loss", "max_loss", "payout_cap"]) {
              if (isNum(a[k]) && a[k] >= a.size) err(file, `${aat}: ${k} (${a[k]}) is bigger than the account - futures rules are USD amounts`);
            }
          }
        });
      });
    });
  });
}

function checkCourse(file, data) {
  const c = data?.course;
  if (!c) return err(file, `missing top-level "course"`);
  if (!/^[a-z0-9-]+$/.test(c.id ?? "")) err(file, `course.id must be lowercase letters, numbers and dashes (got "${c.id}")`);
  if (!c.name) err(file, `course.name is missing`);
  if (!c.about) warn(file, `course.about is empty`);
  if (c.logo) {
    if (!c.logo.startsWith("/")) err(file, `course.logo should be a path under /public, e.g. "/courses/name-logo.webp"`);
    else if (!existsSync(path.join(ROOT, "public", c.logo))) err(file, `course.logo file not found: public${c.logo}`);
  }
  if (c.logo_bg != null && c.logo_bg !== "white" && c.logo_bg !== "dark")
    err(file, `course.logo_bg must be "white", "dark" or left out (got "${c.logo_bg}")`);
  checkLink(file, "course.website", c.website);
  checkLink(file, "course.affiliate_link", c.affiliate_link);
  checkLink(file, "course.instructor.link", c.instructor?.link);
  checkRating(file, "course.trustpilot", c.trustpilot);
  checkRating(file, "course.whop", c.whop);
  checkLink(file, "course.broker_partnership.url", c.broker_partnership?.url);
  if (c.broker_partnership && !c.broker_partnership.broker_name)
    err(file, `course.broker_partnership has no "broker_name"`);
  (c.testimonials ?? []).forEach((t, i) => {
    if (!t.source) err(file, `testimonials[${i}] has no "source" - every quote must say where it came from`);
  });
  if (!Array.isArray(c.pricing) || c.pricing.length === 0) warn(file, `no pricing listed`);
  (c.pricing ?? []).forEach((p, i) => checkLink(file, `pricing[${i}].link`, p.link));
  checkMarkets(file, "course", c.markets);
  if (!c.markets || c.markets.length === 0) warn(file, `course.markets is empty - the course won't show up under any market filter`);
}

// One course inside a multi-course provider — same spirit as checkCourse's
// per-course checks, minus the fields a provider supplies once for all its
// courses (logo, trustpilot, top-level website).
function checkProviderCourse(file, c) {
  const where = `course "${c.slug}"`;
  if (!/^[a-z0-9-]+$/.test(c.slug ?? "")) err(file, `${where}: slug must be lowercase letters, numbers and dashes (got "${c.slug}")`);
  if (!c.name) err(file, `${where}: name is missing`);
  if (!c.about) warn(file, `${where}: about is empty`);
  checkLink(file, `${where}.website`, c.website);
  (c.instructors ?? []).forEach((instr, i) => checkLink(file, `${where}.instructors[${i}].link`, instr.link));
  (c.testimonials ?? []).forEach((t, i) => {
    if (!t.source) err(file, `${where}.testimonials[${i}] has no "source" - every quote must say where it came from`);
  });
  if (!Array.isArray(c.pricing) || c.pricing.length === 0) warn(file, `${where}: no pricing listed`);
  checkMarkets(file, where, c.markets);
  if (!c.markets || c.markets.length === 0) warn(file, `${where}.markets is empty - it won't show up under any market filter`);
}

function checkProvider(file, data) {
  const p = data?.provider;
  if (!p) return err(file, `missing top-level "provider"`);
  if (!/^[a-z0-9-]+$/.test(p.id ?? "")) err(file, `provider.id must be lowercase letters, numbers and dashes (got "${p.id}")`);
  if (!p.name) err(file, `provider.name is missing`);
  if (!p.about) warn(file, `provider.about is empty`);
  if (p.logo) {
    if (!p.logo.startsWith("/")) err(file, `provider.logo should be a path under /public, e.g. "/courses/name-logo.webp"`);
    else if (!existsSync(path.join(ROOT, "public", p.logo))) err(file, `provider.logo file not found: public${p.logo}`);
  }
  checkLink(file, "provider.website", p.website);
  checkLink(file, "provider.affiliate_link", p.affiliate_link);
  checkRating(file, "provider.trustpilot", p.trustpilot);
  checkRating(file, "provider.whop", p.whop);
  if (p.logo_bg != null && p.logo_bg !== "white" && p.logo_bg !== "dark")
    err(file, `provider.logo_bg must be "white", "dark" or left out (got "${p.logo_bg}")`);
  (p.partner_firms ?? []).forEach((f, i) => {
    if (!f.name) err(file, `provider.partner_firms[${i}] has no "name"`);
  });
  if (!Array.isArray(p.courses) || p.courses.length === 0) return err(file, `provider.courses must be a non-empty list`);
  const slugs = new Set();
  for (const c of p.courses) {
    if (slugs.has(c.slug)) err(file, `two courses share the slug "${c.slug}"`);
    slugs.add(c.slug);
    checkProviderCourse(file, c);
  }
}

function checkBroker(file, data) {
  const b = data?.broker;
  if (!b) return err(file, `missing top-level "broker"`);
  if (!/^[a-z0-9-]+$/.test(b.id ?? "")) err(file, `broker.id must be lowercase letters, numbers and dashes (got "${b.id}")`);
  if (!b.name) err(file, `broker.name is missing`);
  if (!b.about) warn(file, `broker.about is empty - add a short description in our own words`);
  if (b.logo) {
    if (!b.logo.startsWith("/")) err(file, `broker.logo should be a path under /public, e.g. "/brokers/name-logo.png"`);
    else if (!existsSync(path.join(ROOT, "public", b.logo))) err(file, `broker.logo file not found: public${b.logo}`);
  } else warn(file, `no broker.logo - the page shows the broker's initials instead`);
  if (b.logo_bg != null && b.logo_bg !== "white" && b.logo_bg !== "dark")
    err(file, `broker.logo_bg must be "white", "dark" or left out (got "${b.logo_bg}")`);
  checkCurrency(file, b.currency ?? "USD");
  if (!isNumOrNull(b.min_deposit) || (isNum(b.min_deposit) && b.min_deposit < 0))
    err(file, `broker.min_deposit must be a plain number (no currency symbol) or null`);
  checkLink(file, "broker.website", b.website);
  checkLink(file, "broker.affiliate_link", b.affiliate_link);
  checkRating(file, "broker.trustpilot", b.trustpilot);
  if (!Array.isArray(b.markets) || b.markets.length === 0) warn(file, `broker.markets is empty - it won't show up under any market filter`);
  for (const m of b.markets ?? []) {
    if (!KNOWN_BROKER_MARKETS.has(m))
      err(file, `broker.markets has "${m}" - must be one of ${[...KNOWN_BROKER_MARKETS].join(", ")}`);
  }
  if (b.company_registration != null && typeof b.company_registration !== "string")
    err(file, `broker.company_registration must be text or left out`);
  if (!Array.isArray(b.regulators) || b.regulators.length === 0) {
    if (!b.company_registration) warn(file, `no broker.regulators - add who licenses the broker`);
  }
  (b.regulators ?? []).forEach((r, i) => {
    if (!r.regulator) err(file, `broker.regulators[${i}] has no "regulator"`);
    if (!/^[A-Z]{2}$/.test(r.country ?? "")) err(file, `broker.regulators[${i}].country must be a 2-letter country code (e.g. "GB")`);
  });
  (b.costs ?? []).forEach((g, i) => {
    if (!g.title) err(file, `broker.costs[${i}] has no "title"`);
    if (!Array.isArray(g.rows) || g.rows.length === 0) err(file, `broker.costs[${i}] has no rows`);
  });
  // Leverage is always shown with a risk warning; make sure one exists.
  if ((b.leverage ?? []).length > 0 && !b.leverage_note)
    warn(file, `broker.leverage has no leverage_note - the default risk warning will be shown`);
  if (b.leverage_summary != null && typeof b.leverage_summary !== "string")
    err(file, `broker.leverage_summary must be text or left out`);
  if (b.promotions != null && typeof b.promotions !== "string")
    err(file, `broker.promotions must be text or left out`);
  if (b.our_choice != null && typeof b.our_choice !== "boolean")
    err(file, `broker.our_choice must be true, false, or left out`);
  const mr = b.margin_rates;
  if (mr) {
    (mr.rows ?? []).forEach((r, i) => {
      if (!Array.isArray(r.values) || r.values.length !== (mr.columns ?? []).length)
        err(file, `broker.margin_rates.rows[${i}] needs one value per column (${(mr.columns ?? []).length})`);
    });
  }
}

function checkAll() {
  const files = readdirSync(ROOT)
    .filter((f) => PROP_PATTERN.test(f) || COURSE_PATTERN.test(f) || PROVIDER_PATTERN.test(f) || BROKER_PATTERN.test(f))
    .sort();
  const ids = new Map();
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(readFileSync(path.join(ROOT, file), "utf-8"));
    } catch (e) {
      err(file, `is not valid JSON - ${e.message}`);
      continue;
    }
    const isProp = PROP_PATTERN.test(file);
    const isProvider = PROVIDER_PATTERN.test(file);
    const isBroker = BROKER_PATTERN.test(file);
    const kind = isProp ? "firm" : isProvider ? "provider" : isBroker ? "broker" : "course";
    const entity = isProp ? data.firm : isProvider ? data.provider : isBroker ? data.broker : data.course;
    if (isProp) checkPropFirm(file, data);
    else if (isProvider) checkProvider(file, data);
    else if (isBroker) checkBroker(file, data);
    else checkCourse(file, data);
    checkVerified(file, data._notes);
    scanWording(file, entity);
    const id = `${kind}:${entity?.id}`;
    if (ids.has(id)) err(file, `uses the same id as ${ids.get(id)}`);
    ids.set(id, file);
  }
  return files.length;
}

function report(count) {
  const out = [];
  if (errors.length) out.push(`ERRORS (must fix):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  if (warnings.length) out.push(`WARNINGS (review):\n${warnings.map((w) => `  - ${w}`).join("\n")}`);
  out.push(`Checked ${count} data file(s): ${errors.length} error(s), ${warnings.length} warning(s).`);
  return out.join("\n\n");
}

async function main() {
  if (process.argv.includes("--hook")) {
    let raw = "";
    for await (const chunk of process.stdin) raw += chunk;
    let filePath = "";
    try {
      filePath = JSON.parse(raw)?.tool_input?.file_path ?? "";
    } catch {
      process.exit(0);
    }
    const name = path.basename(filePath);
    if (!PROP_PATTERN.test(name) && !COURSE_PATTERN.test(name) && !PROVIDER_PATTERN.test(name) && !BROKER_PATTERN.test(name))
      process.exit(0);
    const count = checkAll();
    // Only interrupt Claude for real errors; warnings show up in npm run check.
    if (errors.length) {
      console.error(`Data check failed after editing ${name}. Fix these before continuing:\n\n${report(count)}`);
      process.exit(2);
    }
    process.exit(0);
  }

  const count = checkAll();
  console.log(report(count));
  process.exit(errors.length ? 1 : 0);
}

main();
