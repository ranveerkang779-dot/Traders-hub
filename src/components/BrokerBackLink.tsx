"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import { listingHrefFromBack } from "@/lib/broker-filters";

const linkClass =
  "inline-flex min-h-9 items-center gap-1 text-sm text-muted transition-colors duration-150 hover:text-foreground";

function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className={linkClass}>
      <ChevronLeftIcon className="size-4" />
      Back to brokers
    </Link>
  );
}

function BackFromQuery() {
  const back = useSearchParams().get("back");
  return <BackLink href={listingHrefFromBack(back)} />;
}

// The query string is read in the browser so the broker page itself can stay
// a static file. Awaiting searchParams on the server made the route dynamic,
// and the live host then had no broker data to render.
export default function BrokerBackLink() {
  return (
    <Suspense fallback={<BackLink href="/brokers" />}>
      <BackFromQuery />
    </Suspense>
  );
}
