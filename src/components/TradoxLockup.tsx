import Link from "next/link";
import TradoxMark from "@/components/TradoxMark";
import { SITE_NAME } from "@/lib/sections";

// The site mark beside the Tradox wordmark. Same size in the header and footer.
export default function TradoxLockup({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg ${className}`}
    >
      <TradoxMark className="size-10 sm:size-11" />
      <span className="text-sm font-semibold tracking-[0.16em] uppercase">{SITE_NAME}</span>
    </Link>
  );
}
