import Image from "next/image";

const SIZES = {
  sm: { box: "h-10 w-24", text: "text-sm", img: 96 },
  md: { box: "h-12 w-36", text: "text-base", img: 144 },
  lg: { box: "h-16 w-52 sm:h-20 sm:w-60", text: "text-xl", img: 240 },
} as const;

export default function BrokerLogo({
  name,
  logo,
  logoBg,
  size = "md",
  priority = false,
}: {
  name: string;
  logo: string | null;
  logoBg: "white" | "dark";
  size?: keyof typeof SIZES;
  priority?: boolean;
}) {
  const s = SIZES[size];
  const mark = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "BR";

  if (!logo) {
    return (
      <div
        className={`flex ${s.box} shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 font-semibold tracking-tight text-foreground ${s.text}`}
        aria-hidden="true"
      >
        {mark}
      </div>
    );
  }

  return (
    <div
      className={`flex ${s.box} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border p-1.5 ${
        logoBg === "dark" ? "bg-black" : "bg-white"
      }`}
    >
      <Image
        src={logo}
        alt=""
        width={s.img}
        height={s.img}
        priority={priority}
        className="h-auto max-h-full w-auto max-w-full object-contain"
      />
    </div>
  );
}
