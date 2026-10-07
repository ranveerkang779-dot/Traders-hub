import Link from "next/link";
import TradoxLockup from "@/components/TradoxLockup";
import { SITE_NAME } from "@/lib/sections";

// Shown on every page. The disclaimer line is required on every page
// (see "Non-negotiable constraints" in CLAUDE.md) — do not remove it.
export default function SiteFooter() {
  return (
    <footer className="site-footer mt-16 border-t border-border bg-surface">
      <div className="container-page flex flex-col gap-3 py-8">
        <TradoxLockup className="self-start" />
        <p className="meta max-w-3xl">
          <strong className="font-semibold text-foreground">Disclaimer:</strong> {SITE_NAME}{" "}
          is a discovery and comparison platform for informational purposes
          only. We do not verify trading performance, accuracy or results, and
          nothing on this site is financial advice. Some links are affiliate
          links, which means we may earn a commission if you sign up.
        </p>
        <p className="meta">
          <Link href="/disclaimer" className="underline hover:text-foreground">
            Read the full disclaimer
          </Link>
        </p>
        <p className="text-xs text-subtle">
          Firm names and logos belong to their owners; showing them doesn&apos;t
          mean they endorse us.
        </p>
        <p className="text-xs text-subtle">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
