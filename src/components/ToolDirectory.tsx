"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import {
  TOOL_CATEGORY_LABELS,
  TOOL_CATEGORY_ORDER,
  toolPriceLabel,
  type ToolCategory,
  type ToolView,
} from "@/lib/tool-types";

export default function ToolDirectory({ tools }: { tools: ToolView[] }) {
  return (
    <Suspense fallback={<Directory tools={tools} initialQuery="" />}>
      <DirectoryFromAddress tools={tools} />
    </Suspense>
  );
}

function DirectoryFromAddress({ tools }: { tools: ToolView[] }) {
  const searchParams = useSearchParams();
  return <Directory tools={tools} initialQuery={searchParams.toString()} />;
}

function Directory({ tools, initialQuery }: { tools: ToolView[]; initialQuery: string }) {
  const params = new URLSearchParams(initialQuery);
  const initialCategory = params.get("category") ?? "all";
  const [category, setCategory] = useState<ToolCategory | "all">(
    isCategory(initialCategory) ? initialCategory : "all",
  );
  const [query, setQuery] = useState(params.get("q") ?? "");

  const counts = useMemo(() => {
    const map = new Map<ToolCategory, number>();
    for (const tool of tools) map.set(tool.category, (map.get(tool.category) ?? 0) + 1);
    return map;
  }, [tools]);

  const activeCategory: ToolCategory | "all" =
    category !== "all" && (counts.get(category) ?? 0) === 0 ? "all" : category;

  const matching = tools.filter((tool) => {
    if (activeCategory !== "all" && tool.category !== activeCategory) return false;
    return matchesQuery(tool, query);
  });

  function writeAddress(nextCategory: ToolCategory | "all", nextQuery: string) {
    const next = new URLSearchParams();
    if (nextCategory !== "all") next.set("category", nextCategory);
    const trimmed = nextQuery.trim();
    if (trimmed) next.set("q", trimmed);
    const qs = next.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }

  function updateCategory(next: ToolCategory | "all") {
    setCategory(next);
    writeAddress(next, query);
  }

  function updateQuery(next: string) {
    setQuery(next);
    writeAddress(category, next);
  }

  const listingQuery = currentListingQuery(category, query);

  return (
    <div>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Search</span>
        <input
          type="search"
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          placeholder="Search by name, feature or platform"
          className="field"
        />
      </label>

      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Tool categories">
        <CategoryChip
          label="All"
          count={tools.length}
          pressed={activeCategory === "all"}
          onClick={() => updateCategory("all")}
        />
        {TOOL_CATEGORY_ORDER.filter((id) => (counts.get(id) ?? 0) > 0).map((id) => (
          <CategoryChip
            key={id}
            label={TOOL_CATEGORY_LABELS[id]}
            count={counts.get(id) ?? 0}
            pressed={activeCategory === id}
            onClick={() => updateCategory(id)}
          />
        ))}
      </div>

      <p aria-live="polite" className="meta mt-4">
        <span className="font-semibold text-foreground">{matching.length}</span> of {tools.length} shown
        {activeCategory !== "all" ? ` in ${TOOL_CATEGORY_LABELS[activeCategory]}` : ""}. Forex and gold tools stay at the top.
      </p>

      {matching.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border-strong px-6 py-12 text-center text-muted">
          No tools match this search. Try another name, or clear the category.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matching.map((tool, index) => (
            <ToolCard key={tool.slug} tool={tool} index={index} listingQuery={listingQuery} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 ${
        pressed
          ? "border-accent bg-accent/15 text-foreground"
          : "border-border-strong bg-surface text-muted hover:border-subtle hover:text-foreground"
      }`}
    >
      {label}
      <span className={`tabular-nums ${pressed ? "text-foreground" : "text-subtle"}`}>{count}</span>
    </button>
  );
}

function ToolCard({
  tool,
  index,
  listingQuery,
}: {
  tool: ToolView;
  index: number;
  listingQuery: string;
}) {
  const price = toolPriceLabel(tool);
  const href = listingQuery
    ? `/tools/${tool.slug}?back=${encodeURIComponent(listingQuery)}`
    : `/tools/${tool.slug}`;

  return (
    <li
      className="tool-card lift-card group relative flex flex-col rounded-xl border border-border bg-surface p-4 sm:p-5"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <ToolLogo name={tool.name} logo={tool.logo} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{tool.name}</h2>
          <p className="mt-1">
            <span className="pill">{TOOL_CATEGORY_LABELS[tool.category]}</span>
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{tool.description}</p>

      <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-3">
        <div>
          <dt className="eyebrow">Price from</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{price ?? "Not listed"}</dd>
        </div>
        {tool.platforms.length > 0 && (
          <div>
            <dt className="eyebrow">Platforms</dt>
            <dd className="mt-1 line-clamp-2 text-sm text-foreground">{tool.platforms.join(", ")}</dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex items-center justify-end pt-4">
        <Link
          href={href}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-foreground after:absolute after:inset-0"
        >
          View
          <span className="sr-only"> {tool.name}</span>
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

function isCategory(value: string): value is ToolCategory {
  return value in TOOL_CATEGORY_LABELS;
}

function matchesQuery(tool: ToolView, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    tool.name,
    tool.description,
    TOOL_CATEGORY_LABELS[tool.category],
    ...tool.features,
    ...tool.platforms,
    ...tool.plans.map((plan) => `${plan.name} ${plan.price}`),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function currentListingQuery(category: ToolCategory | "all", query: string): string {
  const next = new URLSearchParams();
  if (category !== "all") next.set("category", category);
  const trimmed = query.trim();
  if (trimmed) next.set("q", trimmed);
  return next.toString();
}
