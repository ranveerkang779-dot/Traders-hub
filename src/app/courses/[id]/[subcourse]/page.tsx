import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { providers, getProviderCourse } from "@/lib/providers";
import { getSection } from "@/lib/sections";
import CourseDetail from "@/components/CourseDetail";
import { InfoIcon } from "@/components/icons";

// One page per course inside a multi-course provider, e.g.
// /courses/sharper-trades/block-orders. Built ahead of time; any other
// combination shows "not found".
export const dynamicParams = false;

export function generateStaticParams() {
  return providers.flatMap((p) => p.courses.map((c) => ({ id: p.id, subcourse: c.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[id]/[subcourse]">): Promise<Metadata> {
  const { id, subcourse } = await params;
  const found = getProviderCourse(id, subcourse);
  if (!found) return {};
  return {
    title: `${found.course.name} — ${found.provider.name} | ${getSection("courses").title}`,
    description: found.course.tagline ?? undefined,
  };
}

export default async function ProviderCoursePage({
  params,
}: PageProps<"/courses/[id]/[subcourse]">) {
  const { id, subcourse } = await params;
  const found = getProviderCourse(id, subcourse);
  if (!found) notFound();
  const { provider, course } = found;

  const notes = [];
  if (course.bundleOf.length > 0) {
    notes.push(
      <p key="bundle" className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-muted">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-accent" />
        This is a bundle of {provider.name}&apos;s other courses: {course.bundleOf.join(", ")} —
        each is also sold on its own.
      </p>,
    );
  }
  if (course.performanceClaim) {
    notes.push(
      <p key="perf" className="badge-warning mt-2 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        {course.performanceClaim} This is {provider.name}&apos;s own claim — we haven&apos;t
        independently verified it, and past performance never guarantees future results.
      </p>,
    );
  }

  return (
    <CourseDetail
      name={course.name}
      logo={provider.logo}
      logoBg={provider.logoBg}
      tagline={course.tagline}
      about={course.about}
      extraNote={notes.length > 0 ? <div className="space-y-2">{notes}</div> : undefined}
      instructors={course.instructors}
      trustpilot={provider.trustpilot}
      whop={provider.whop}
      pricing={course.pricing}
      formats={course.formats}
      platforms={course.platforms}
      curriculum={course.curriculum}
      testimonials={course.testimonials}
      testimonialsNote={course.testimonialsNote}
      visitHref={provider.affiliateLink ?? course.website ?? provider.website}
      ourChoice={provider.affiliateLink != null}
      backHref={`/courses/${provider.id}`}
      backLabel={`Back to ${provider.name}`}
    />
  );
}
