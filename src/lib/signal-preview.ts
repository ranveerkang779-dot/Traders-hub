// Free-preview gate for signal groups.
//
// OFF today: every group is shown. Turn SIGNAL_PREVIEW_ENABLED on later to
// show about five groups per market to free visitors. Groups marked
// alwaysFree stay visible past that cut. No login and no payment live here.
//
// This module is imported only by the server page. The client directory
// receives the list this function returns. Groups left out must not be
// passed into a client component, or they are included in the page payload
// and a visitor can read them anyway.

import {
  SIGNAL_MARKET_ORDER,
  type SignalGroupView,
} from "./signal-group-types";

/** The single switch. False means the limit is off. */
export const SIGNAL_PREVIEW_ENABLED = false;

/** How many groups each market keeps once the switch is on. */
export const SIGNAL_PREVIEW_PER_MARKET = 5;

export function visibleSignalGroups(groups: SignalGroupView[]): SignalGroupView[] {
  const sorted = [...groups].sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  if (!SIGNAL_PREVIEW_ENABLED) return sorted;

  const visible = new Set<string>();
  for (const market of SIGNAL_MARKET_ORDER) {
    const inMarket = sorted.filter((group) => group.markets.includes(market));
    for (const group of inMarket.slice(0, SIGNAL_PREVIEW_PER_MARKET)) visible.add(group.slug);
  }
  for (const group of sorted) {
    if (group.alwaysFree) visible.add(group.slug);
  }
  return sorted.filter((group) => visible.has(group.slug));
}
