import type { JSX, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type {
  BrokerPartnership,
  CourseStat,
  CurriculumModule,
  LearningFormat,
  PricingTier,
  Testimonial,
  TrustpilotRating,
} from "@/lib/course-types";
import TrustpilotStars from "@/components/TrustpilotStars";
import VisitSiteLink from "@/components/VisitSiteLink";
import OurChoiceBadge from "@/components/OurChoiceBadge";
import CoursePricing from "@/components/CoursePricing";
import CourseCurriculum from "@/components/CourseCurriculum";
import StickyVisitBar from "@/components/StickyVisitBar";
import PlatformPill from "@/components/PlatformPill";
import {
  BookIcon,
  ChevronLeftIcon,
  InfoIcon,
  LayersIcon,
  LinkIcon,
  MonitorIcon,
  QuoteIcon,
  TagIcon,
  formatIcon,
} from "@/components/icons";

// The full rich "course page" body — hero, pricing, formats, platforms,
// curriculum, testimonials, sticky CTA. Shared by a standalone course page
// (/courses/<id>) and a provider's individual course page
// (/courses/<provider>/<course>), since both need the same depth of
// presentation; only where the data comes from and the back-link differ.

export type InstructorInfo = { name: string; role?: string | null; link?: string | null };

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: (p: { className?: string }) => JSX.Element;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="section-title flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
        <Icon className="size-4" />
      </span>
      {children}
    </h2>
  );
}

function Stat({
  label,
  value,
  color = "text-accent",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

export default function CourseDetail({
  name,
  logo,
  logoBg = "white",
  tagline,
  about,
  extraNote,
  instructors,
  trustpilot,
  whop = null,
  pricing,
  formats,
  platforms,
  stats = [],
  brokerPartnership = null,
  curriculum,
  testimonials,
  testimonialsNote,
  visitHref,
  ourChoice = false,
  backHref,
  backLabel,
}: {
  name: string;
  logo: string | null;
  /** "dark" for a logo that's a light mark with no transparent background. */
  logoBg?: "white" | "dark";
  tagline: string | null;
  about: string | null;
  /** Shown right under About — for things like "this is a bundle of X, Y, Z"
   *  or a disclaimer on a provider-claimed performance figure. */
  extraNote?: ReactNode;
  instructors: InstructorInfo[];
  trustpilot: TrustpilotRating | null;
  /** Rating from Whop, when the course is sold there — shown alongside
   *  Trustpilot rather than instead of it, since they're independent and
   *  can disagree a lot. */
  whop?: TrustpilotRating | null;
  pricing: PricingTier[];
  formats: LearningFormat[];
  platforms: string[];
  /** Extra credibility figures for the hero — course-specific, most courses
   *  won't have any. */
  stats?: CourseStat[];
  /** A disclosed broker partnership, when the course has one. */
  brokerPartnership?: BrokerPartnership | null;
  curriculum: CurriculumModule[];
  testimonials: Testimonial[];
  testimonialsNote: string;
  visitHref: string | null;
  /** True when we have a real tracked affiliate link for this course — set
   *  by the page, not guessed here, since this component doesn't know
   *  where visitHref came from (could just be the plain website). */
  ourChoice?: boolean;
  backHref: string;
  backLabel: string;
}) {
  const totalLessons = curriculum.reduce((n, m) => n + (m.moduleCount ?? m.topics.length), 0);

  return (
    <>
      <Link href={backHref} className="back-link">
        <ChevronLeftIcon className="size-4" />
        {backLabel}
      </Link>

      {/* Hero */}
      <div className="detail-hero relative mt-5 overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {logo && (
            <div
              className={`flex size-20 shrink-0 items-center justify-center rounded-xl p-3 shadow-sm sm:size-24 ${
                logoBg === "dark" ? "bg-black" : "bg-white"
              }`}
            >
              <Image
                src={logo}
                alt={`${name} logo`}
                width={96}
                height={96}
                className="h-auto max-h-14 w-full object-contain sm:max-h-16"
                priority
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="page-title">{name}</h1>
              {ourChoice && <OurChoiceBadge />}
            </div>
            {ourChoice && (
              <p className="meta mt-2">Featured listing on Tradox. It is not a score of trading results.</p>
            )}
            {tagline && <p className="mt-2 max-w-2xl text-base text-muted">{tagline}</p>}
            <div className="mt-3 flex flex-col flex-wrap gap-x-4 gap-y-1.5">
              {trustpilot && <TrustpilotStars rating={trustpilot} />}
              {whop && <TrustpilotStars rating={whop} platform="Whop" />}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {instructors.length > 0 && (
                <span className="meta">
                  {instructors.length === 1 ? "Instructor" : "Instructors"}:{" "}
                  {instructors.map((instr, i) => (
                    <span key={instr.name}>
                      {i > 0 && ", "}
                      {instr.link ? (
                        <a
                          href={instr.link}
                          target="_blank"
                          rel="noopener"
                          className="text-accent hover:underline"
                        >
                          {instr.name}
                        </a>
                      ) : (
                        instr.name
                      )}
                      {instr.role && <span className="text-subtle"> ({instr.role})</span>}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
          {visitHref && <VisitSiteLink href={visitHref} firmName={name} className="shrink-0 sm:self-start" />}
        </div>

        {/* Quick stats */}
        <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-border pt-6 sm:grid-cols-4">
          {pricing[0] && <Stat label="Starts from" value={pricing[0].price} />}
          {totalLessons > 0 && <Stat label="Lessons" value={`${totalLessons}+`} />}
          {trustpilot && (
            <Stat label="Trustpilot" value={`${trustpilot.rating.toFixed(1)}/5`} color="text-warning" />
          )}
          {whop && <Stat label="Whop" value={`${whop.rating.toFixed(1)}/5`} color="text-warning" />}
          {platforms.length > 0 && <Stat label="Platforms" value={String(platforms.length)} />}
          {stats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      </div>

      {(about || extraNote) && (
        <section aria-labelledby="about-heading" className="mt-10 max-w-3xl">
          <SectionHeading id="about-heading" icon={InfoIcon}>
            About
          </SectionHeading>
          {about && <p className="mt-3 text-muted">{about}</p>}
          {extraNote && <div className="mt-3">{extraNote}</div>}
        </section>
      )}

      {pricing.length > 0 && (
        <section aria-labelledby="pricing-heading" className="mt-10">
          <SectionHeading id="pricing-heading" icon={TagIcon}>
            Pricing
          </SectionHeading>
          <div className="mt-4">
            <CoursePricing tiers={pricing} courseName={name} visitHref={visitHref} />
          </div>
          <p className="meta mt-3">
            Prices and terms change often. Always check the provider&apos;s own website before
            buying.
          </p>
        </section>
      )}

      {formats.length > 0 && (
        <section aria-labelledby="formats-heading" className="mt-10">
          <SectionHeading id="formats-heading" icon={LayersIcon}>
            What&apos;s included
          </SectionHeading>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {formats.map((format) => {
              const Icon = formatIcon(format.label);
              return (
                <li
                  key={format.label}
                  className="flex gap-3 rounded-xl border border-border bg-surface p-5 transition hover:border-border-strong hover:bg-surface-2"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{format.label}</h3>
                    <p className="mt-1 text-sm text-muted">{format.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {platforms.length > 0 && (
        <section aria-labelledby="platforms-heading" className="mt-10">
          <SectionHeading id="platforms-heading" icon={MonitorIcon}>
            Platforms recommended by this course
          </SectionHeading>
          <p className="meta mt-2">
            Trading software and brokers this course teaches on or sets you up with — not where
            you watch the lessons. Hover (or tap) a platform for more about it.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {platforms.map((p) => (
              <li key={p}>
                <PlatformPill name={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {brokerPartnership && (
        <section aria-labelledby="broker-partnership-heading" className="mt-10 max-w-3xl">
          <SectionHeading id="broker-partnership-heading" icon={LinkIcon}>
            Broker partnership
          </SectionHeading>
          <div className="mt-4 rounded-xl border border-border bg-surface p-5">
            <h3 className="font-semibold text-foreground">{brokerPartnership.brokerName}</h3>
            <p className="mt-2 text-sm text-muted">{brokerPartnership.description}</p>
            {brokerPartnership.url && (
              <a
                href={brokerPartnership.url}
                target="_blank"
                rel="noopener"
                className="mt-3 inline-block text-sm text-accent hover:underline"
              >
                View the partnership offer
              </a>
            )}
          </div>
        </section>
      )}

      {curriculum.length > 0 && (
        <section aria-labelledby="curriculum-heading" className="mt-10">
          <SectionHeading id="curriculum-heading" icon={BookIcon}>
            What you&apos;ll learn
          </SectionHeading>
          <div className="mt-4">
            <CourseCurriculum modules={curriculum} />
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section aria-labelledby="testimonials-heading" className="mt-10">
          <SectionHeading id="testimonials-heading" icon={QuoteIcon}>
            Testimonials
          </SectionHeading>
          <p className="meta mt-2 max-w-2xl italic">{testimonialsNote}</p>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <li
                key={i}
                className="lift-card flex flex-col rounded-xl border border-border bg-surface p-5"
              >
                <QuoteIcon className="size-6 text-accent/50" />
                <p className="mt-2 flex-1 text-sm text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <p className="meta mt-4 border-t border-border pt-3">
                  <span className="font-medium text-foreground">{t.author}</span>
                  {t.source && <span className="block text-subtle">{t.source}</span>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visitHref && (
        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-accent/30 bg-accent/6 p-8 text-center">
          <h2 className="text-xl font-semibold">Ready to take a closer look?</h2>
          <p className="max-w-md text-sm text-muted">
            Visit {name}&apos;s own site for full terms, current pricing and to sign up.
          </p>
          <VisitSiteLink href={visitHref} firmName={name} className="mt-1" />
        </div>
      )}

      <StickyVisitBar
        courseName={name}
        logo={logo}
        logoBg={logoBg}
        price={pricing[0]?.price ?? null}
        visitHref={visitHref}
      />
    </>
  );
}
