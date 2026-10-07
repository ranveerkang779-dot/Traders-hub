import { useId } from "react";

// Flat geometric Tx mark. The T is champagne gold and the x is a darker gold.
// Fills switch in light mode (see globals.css) so the mark stays readable.
export default function TradoxMark({ className }: { className?: string }) {
  const clipId = `tx${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="96 94 314 314"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path className="tradox-mark-t" d="M111 94H387V157H285V408H213V157H111Z" />
      <g clipPath={`url(#${clipId})`}>
        <line className="tradox-mark-x" x1="270.3" y1="247.99" x2="423.7" y2="472.01" strokeWidth="25" />
        <line className="tradox-mark-x" x1="421.71" y1="247.66" x2="270.29" y2="472.34" strokeWidth="25" />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect x="301" y="313" width="94" height="95" />
        </clipPath>
      </defs>
    </svg>
  );
}
