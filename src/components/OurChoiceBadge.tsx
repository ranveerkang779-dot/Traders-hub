// A featured-listing mark. The words are the label. The icon is only a
// marker, so the badge is not identified by colour alone. It is not a
// score of trading results.

export default function OurChoiceBadge() {
  return (
    <span className="our-choice-badge">
      <svg viewBox="0 0 12 12" className="our-choice-mark" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3 1.25h6a.75.75 0 0 1 .75.75v8.15a.4.4 0 0 1-.63.33L6 8.55 2.88 10.48a.4.4 0 0 1-.63-.33V2A.75.75 0 0 1 3 1.25Z"
        />
      </svg>
      <span>Our choice</span>
    </span>
  );
}
