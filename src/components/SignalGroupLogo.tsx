import Image from "next/image";

const SIZES = {
  md: { box: "size-14", text: "text-base", img: 56 },
} as const;

function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? "SG").slice(0, 2).toUpperCase();
}

export default function SignalGroupLogo({ name, logo }: { name: string; logo: string | null }) {
  const s = SIZES.md;
  if (!logo) {
    return (
      <div
        className={`flex ${s.box} shrink-0 items-center justify-center rounded-xl border border-border bg-accent/12 font-semibold tracking-tight text-foreground ${s.text}`}
        aria-hidden="true"
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <div
      className={`flex ${s.box} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-1.5`}
    >
      <Image
        src={logo}
        alt=""
        width={s.img}
        height={s.img}
        className="h-auto max-h-full w-auto max-w-full object-contain"
      />
    </div>
  );
}
