// "Visit site" button for a firm. Only rendered when the firm's data file has
// an affiliate_link, so it can be swapped without touching code.
// rel="sponsored" is the web standard for paid/affiliate links.
export default function VisitSiteLink({
  href,
  firmName,
  variant = "primary",
  className = "",
  label = "Visit site",
}: {
  href: string;
  firmName: string;
  variant?: "primary" | "outline";
  className?: string;
  /** Visible button text. Brokers pass "Visit broker". */
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener sponsored"
      className={`btn ${variant === "primary" ? "btn-primary" : "btn-outline"} ${className}`}
    >
      {label}
      <span className="sr-only"> for {firmName} (opens in a new tab)</span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}
