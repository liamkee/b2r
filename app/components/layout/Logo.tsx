import type { ReactElement } from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 26, className }: LogoProps): ReactElement {
  return (
    <span className={className} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="15" stroke="var(--color-gold-400)" strokeWidth="1.5" />
        <circle
          cx="16"
          cy="16"
          r="15"
          fill="var(--color-ocean-800)"
          fillOpacity="0.6"
        />
        <path
          d="M16 6.5l2.35 5.02 5.15.72-3.75 3.68.9 5.33L16 18.72l-4.65 2.53.9-5.33-3.75-3.68 5.15-.72L16 6.5z"
          fill="var(--color-gold-400)"
        />
        <path
          d="M6 26c2.2-1.6 4.3-1.6 6.5 0s4.3 1.6 6.5 0 4.3-1.6 6.5 0"
          stroke="var(--color-ocean-300)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
