import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courses, getCourse } from "@/lib/courses";
import { providers, getProvider } from "@/lib/providers";
import { getSection } from "@/lib/sections";
import CourseDetail from "@/components/CourseDetail";
import TrustpilotStars from "@/components/TrustpilotStars";
import PartnerFirmPill from "@/components/PartnerFirmPill";
import OurChoiceBadge from "@/components/OurChoiceBadge";
import { ChevronLeftIcon, LinkIcon } from "@/components/icons";

// This one route serves two kinds of page, both addressed as /courses/<id>:
// a standalone course (from courses-data-*.json) renders the full course
// detail body directly; a multi-course provider (from providers-data-*.json,
// e.g. Sharper Trades) renders a hub listing its courses, each of which gets
// its own page at /courses/<id>/<course slug> (see the nested route).
export const dynamicParams = false;

export function generateStaticParams() {
  return [...courses.map((c) => ({ id: c.id })), ...providers.map((p) => ({ id: p.id }))];
}

export async function generateMetadata({ params }: PageProps<"/courses/[id]">): Promise<Metadata> {
  const { id } = await params;
  const course = getCourse(id);
  if (course) {
    return {
      title: `${course.name} — ${getSection("courses").title}`,
      description: course.tagline ?? undefined,
    };
  }
  const provider = getProvider(id);
  if (provider) {
    return {
      title: `${provider.name} — ${getSection("courses").title}`,
      description: provider.tagline ?? undefined,
    };
  }
  return {};
}

export default async function CourseOrProviderPage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;

  const course = getCourse(id);
  if (course) {
    return (
      <CourseDetail
        name={course.name}
        logo={course.logo}
        logoBg={course.logoBg}
        tagline={course.tagline}
        about={course.about}
        instructors={course.instructor ? [course.instructor] : []}
        trustpilot={course.trustpilot}
        whop={course.whop}
        pricing={course.pricing}
        formats={course.formats}
        platforms={course.platforms}
        stats={course.stats}
        brokerPartnership={course.brokerPartnership}
        curriculum={course.curriculum}
        testimonials={course.testimonials}
        testimonialsNote={course.testimonialsNote}
        visitHref={course.affiliateLink ?? course.website}
        ourChoice={course.affiliateLink != null}
        backHref="/courses"
        backLabel="Back to courses"
      />
    );
  }

  const provider = getProvider(id);
  if (!provider) notFound();

  return (
    <>
      <Link href="/courses" className="back-link">
        <ChevronLeftIcon className="size-4" />
        Back to courses
      </Link>

      {/* Hero */}
      <div className="detail-hero relative mt-5 overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {provider.logo && (
            <div
              className={`flex size-20 shrink-0 items-center justify-center rounded-xl p-3 shadow-sm sm:size-24 ${
                provider.logoBg === "dark" ? "bg-black" : "bg-white"
              }`}
            >
              <Image
                src={provider.logo}
                alt={`${provider.name} logo`}
                width={96}
                height={96}
                className="h-auto max-h-14 w-full object-contain sm:max-h-16"
                priority
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="page-title">{provider.name}</h1>
              {provider.affiliateLink && <OurChoiceBadge />}
            </div>
            {provider.affiliateLink && (
              <p className="meta mt-2">Featured listing on Tradox. It is not a score of trading results.</p>
            )}
            {provider.tagline && <p className="mt-2 max-w-2xl text-base text-muted">{provider.tagline}</p>}
            {(provider.trustpilot || provider.whop) && (
              <div className="mt-3 flex flex-col gap-1.5">
                {provider.trustpilot && <TrustpilotStars rating={provider.trustpilot} />}
                {provider.whop && <TrustpilotStars rating={provider.whop} platform="Whop" />}
              </div>
            )}
          </div>
        </div>
      </div>

      {provider.about && <p className="mt-6 max-w-3xl text-muted">{provider.about}</p>}

      {provider.partnerFirms.length > 0 && (
        <section aria-labelledby="partner-firms-heading" className="mt-10">
          <h2 id="partner-firms-heading" className="section-title flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
              <LinkIcon className="size-4" />
            </span>
            Partner prop firms
          </h2>
          <p className="meta mt-2 max-w-2xl">
            Prop firms {provider.name} promotes or has a discount/affiliate arrangement with. Hover
            (or tap) one for a link to our own listing, where we have it.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {provider.partnerFirms.map((f) => (
              <li key={f.name}>
                <PartnerFirmPill name={f.name} internalId={f.internalId} />
              </li>
            ))}
          </ul>
          {provider.partnerFirmsNote && (
            <p className="meta mt-3 italic">{provider.partnerFirmsNote}</p>
          )}
        </section>
      )}

      <section aria-labelledby="provider-courses-heading" className="mt-10">
        <h2 id="provider-courses-heading" className="section-title">
          {provider.name}&apos;s courses
        </h2>
        <p className="meta mt-2">
          {provider.name} sells these separately rather than as one course — pick whichever fits
          what you&apos;re after.
        </p>
        <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {provider.courses.map((course) => {
            const fromPrice = course.pricing[0];
            return (
              <li
                key={course.slug}
                className="lift-card group relative flex flex-col rounded-xl border border-border bg-surface p-5"
              >
                <h3 className="text-lg font-semibold">{course.name}</h3>
                {course.bundleOf.length > 0 && (
                  <p className="meta mt-1">Bundle of {course.bundleOf.join(", ")}</p>
                )}
                {course.tagline && <p className="mt-2 text-sm text-muted">{course.tagline}</p>}
                {fromPrice && (
                  <div className="mt-4">
                    <div className="eyebrow">From</div>
                    <div className="figure-lg mt-1 text-accent">{fromPrice.price}</div>
                  </div>
                )}
                <Link
                  href={`/courses/${provider.id}/${course.slug}`}
                  className="btn btn-primary mt-5 w-full after:absolute after:inset-0"
                >
                  View course
                  <span className="sr-only"> — {course.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
