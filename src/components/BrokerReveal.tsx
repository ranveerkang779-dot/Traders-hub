"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

// Fades a block in when it enters the screen. Content stays visible if the
// visitor prefers reduced motion, or if this script never runs.
export default function BrokerReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const show = () => {
      el.style.animationDelay = `${delay}ms`;
      el.classList.add("broker-in");
    };

    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.94 && rect.bottom > 0;
    if (inView) {
      show();
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    el.classList.add("broker-wait");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.classList.remove("broker-wait");
        show();
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
