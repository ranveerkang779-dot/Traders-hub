"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import VisitSiteLink from "@/components/VisitSiteLink";

// Appears once the visitor has scrolled past the hero, so the CTA stays
// reachable on a long page without pinning anything at the very top.
export default function StickyVisitBar({
  courseName,
  logo,
  logoBg = "white",
  price,
  visitHref,
  visitLabel = "Visit site",
  wideLogo = false,
}: {
  courseName: string;
  logo: string | null;
  logoBg?: "white" | "dark";
  price: string | null;
  visitHref: string | null;
  visitLabel?: string;
  /** Wider tile for wordmarks. Courses leave this off. */
  wideLogo?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 420);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visitHref) return null;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="container-page pb-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/95 p-3 shadow-glow backdrop-blur-md sm:p-4">
          {logo && (
            <div
              className={`flex shrink-0 items-center justify-center rounded-lg p-1.5 ${
                wideLogo ? "h-10 w-24" : "size-10"
              } ${logoBg === "dark" ? "bg-black" : "bg-white"}`}
            >
              <Image
                src={logo}
                alt=""
                width={wideLogo ? 96 : 40}
                height={40}
                className="h-auto max-h-7 w-auto max-w-full object-contain"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{courseName}</p>
            {price && <p className="meta">{price}</p>}
          </div>
          <VisitSiteLink href={visitHref} firmName={courseName} label={visitLabel} className="shrink-0" />
        </div>
      </div>
    </div>
  );
}
