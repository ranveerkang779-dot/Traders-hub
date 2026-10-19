// Types shared by the signal-group loader (server) and the directory
// (client). Keep this file free of Node-only imports.

export type SignalMarket =
  | "gold"
  | "forex-majors"
  | "forex-minors"
  | "indices"
  | "crypto"
  | "oil"
  | "stocks-options";

export type SignalStyle = "scalping" | "day-trading" | "swing";

export type SignalPrice = "free" | "paid" | "free-and-vip";

export type SignalExtra = "education" | "copy-trading" | "prop-firm";

export const SIGNAL_MARKET_LABELS: Record<SignalMarket, string> = {
  gold: "Gold (XAUUSD)",
  "forex-majors": "Forex majors",
  "forex-minors": "Forex minors & exotics",
  indices: "Indices",
  crypto: "Crypto",
  oil: "Oil & commodities",
  "stocks-options": "Stocks & options",
};

/** Order of the market chips. "All" is added in the directory. */
export const SIGNAL_MARKET_ORDER: SignalMarket[] = [
  "gold",
  "forex-majors",
  "forex-minors",
  "indices",
  "crypto",
  "oil",
  "stocks-options",
];

export const SIGNAL_STYLE_LABELS: Record<SignalStyle, string> = {
  scalping: "Scalping",
  "day-trading": "Day trading",
  swing: "Swing",
};

export const SIGNAL_STYLE_ORDER: SignalStyle[] = ["scalping", "day-trading", "swing"];

export const SIGNAL_PRICE_LABELS: Record<SignalPrice, string> = {
  free: "Free",
  paid: "Paid",
  "free-and-vip": "Free + paid VIP",
};

export const SIGNAL_PRICE_ORDER: SignalPrice[] = ["free", "paid", "free-and-vip"];

export const SIGNAL_EXTRA_LABELS: Record<SignalExtra, string> = {
  education: "Education included",
  "copy-trading": "Copy trading or auto-execution",
  "prop-firm": "Prop-firm friendly",
};

export const SIGNAL_EXTRA_ORDER: SignalExtra[] = ["education", "copy-trading", "prop-firm"];

export type SignalGroupView = {
  slug: string;
  name: string;
  description: string;
  markets: SignalMarket[];
  price: SignalPrice;
  /** Words we print for the price, e.g. "Free" or "Free + paid VIP · $99/mo". */
  priceLabel: string;
  /** Approximate snapshot, e.g. "12.4K members". Null when no count was published. */
  memberCount: string | null;
  /** YYYY-MM-DD the member count was read. Null when there is no count. */
  memberCountAsOf: string | null;
  language: string;
  /** Empty when the listing did not state a style. */
  styles: SignalStyle[];
  /** Null when the listing did not state how often it posts calls. */
  signalsPerDay: string | null;
  extras: SignalExtra[];
  /**
   * The only outbound address. Join uses this and nothing else.
   * Null hides the button.
   */
  telegramUrl: string | null;
  logo: string | null;
  /** Lower numbers are listed first. */
  rank: number;
  /**
   * Stays on the page even after the free-preview limit is turned on.
   * Not tied to any broker.
   */
  alwaysFree: boolean;
};
