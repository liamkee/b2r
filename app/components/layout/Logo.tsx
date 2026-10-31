import type { ReactElement } from "react";

interface LogoProps {
  /** Rendered size in pixels (square). */
  size?: number;
  /** Extra classes for the wrapper. */
  className?: string;
  /**
   * `badge` renders the full emblem (map disc + curved wordmark), used as the
   * app mark. `plain` renders just the compass/network glyph, for tight spots.
   */
  variant?: "badge" | "plain";
  /** Accessible label; pass "" when the logo sits next to visible text. */
  title?: string;
}

/**
 * ASEAN ONE emblem.
 *
 * Recreation of the team's logo as vector art: a navy ASEAN map disc with
 * orange hub nodes joined by cross-border arcs, ringed by the wordmark. Drawn
 * in SVG (no raster asset) so it stays crisp at any size and can be reused for
 * the favicon and social cards.
 *
 * Colours are self-contained (the logo is a fixed brand mark, not theme-tinted)
 * so it reads correctly on any surface.
 */
export function Logo({
  size = 40,
  className,
  variant = "badge",
  title = "ASEAN ONE",
}: LogoProps): ReactElement {
  const labelled = title.length > 0;
  const a11y = labelled
    ? { role: "img" as const, "aria-label": title }
    : { "aria-hidden": true as const };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...a11y}
    >
      <defs>
        <radialGradient id="asean-logo-disc" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#16324f" />
          <stop offset="70%" stopColor="#0e2439" />
          <stop offset="100%" stopColor="#081726" />
        </radialGradient>
        <linearGradient id="asean-logo-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0a04b" />
          <stop offset="100%" stopColor="#e8672a" />
        </linearGradient>
      </defs>

      {variant === "badge" && (
        <>
          {/* Outer wordmark ring */}
          <path
            id="asean-logo-arc-top"
            d="M 100 100 m -78 0 a 78 78 0 1 1 156 0"
            fill="none"
          />
          <path
            id="asean-logo-arc-bottom"
            d="M 100 100 m 70 0 a 70 70 0 1 1 -140 0"
            fill="none"
          />
          <text
            fill="#2f6fb0"
            style={{
              fontSize: 17.5,
              fontWeight: 700,
              letterSpacing: "0.24em",
            }}
          >
            <textPath href="#asean-logo-arc-top" startOffset="50%" textAnchor="middle">
              ASEAN ONE
            </textPath>
          </text>
          <text
            fill="#2f6fb0"
            style={{ fontSize: 9.2, letterSpacing: "0.16em", fontWeight: 600 }}
          >
            <textPath href="#asean-logo-arc-bottom" startOffset="50%" textAnchor="middle">
              CROSS-BORDER COLLABORATION
            </textPath>
          </text>
          <text
            fill="#2f6fb0"
            style={{
              fontSize: 15.5,
              fontWeight: 700,
              letterSpacing: "0.2em",
            }}
          >
            <textPath
              href="#asean-logo-arc-bottom"
              startOffset="50%"
              textAnchor="middle"
              // Sits outside the collaboration line, along the same arc.
              style={{ dominantBaseline: "hanging" }}
            >
              STARTUP ECOSYSTEM
            </textPath>
          </text>
        </>
      )}

      {/* Map disc */}
      <circle cx="100" cy="100" r="62" fill="url(#asean-logo-disc)" />

      {/* Simplified ASEAN landmass, abstracted to keep the mark legible */}
      <g fill="#1f4a76">
        {/* Indochina peninsula */}
        <path d="M62 62c6-3 13-3 18 1 4 3 6 8 5 13-1 6-4 11-8 15-3 3-5 7-5 11 0 5 2 9 5 13l-6 3c-4-5-6-10-6-16 0-5 2-10 5-14 3-4 5-8 5-13 0-3-1-6-3-8-4-3-9-3-12-1z" />
        {/* Malay peninsula */}
        <path d="M88 108c4 1 7 4 8 8 1 5-1 10-4 14-2 3-3 6-3 10l-6-1c0-5 2-9 4-13 2-3 3-7 2-11-1-3-3-5-6-6z" />
        {/* Sumatra */}
        <path d="M70 128c5-2 10-2 14 1 3 2 5 5 5 9l-7 2c1-3 0-6-2-8-3-2-7-3-11-2z" />
        {/* Borneo */}
        <path d="M108 118c6-3 13-3 18 1 4 3 6 7 5 12-1 5-4 9-9 11-5 2-10 1-14-2-4-3-5-8-4-13 1-4 3-7 4-9z" />
        {/* Java chain */}
        <path d="M96 150c4-1 8-1 11 1l-1 6c-3-2-7-2-11-1z" />
        {/* Sulawesi */}
        <path d="M136 126c3-1 6 0 8 3 2 3 1 7-1 9l-5-2c2-2 2-4 1-6-1-2-2-3-3-4z" />
        {/* Philippines */}
        <path d="M140 84c3-2 6-1 8 2 2 2 2 6 0 9-2 3-5 5-8 3-3-2-4-5-3-9 1-2 2-4 3-5z" />
        {/* New Guinea (Papua) */}
        <path d="M146 150c5-2 11-2 15 1 3 2 4 5 3 8-2 4-7 6-12 5-5-1-8-4-8-8 0-3 1-5 2-6z" />
      </g>

      {/* Cross-border connection arcs */}
      <g
        fill="none"
        stroke="url(#asean-logo-ring)"
        strokeWidth="1.7"
        strokeLinecap="round"
      >
        <path d="M72 96 L100 62" />
        <path d="M72 96 L124 128" />
        <path d="M72 96 L150 104" />
        <path d="M100 62 L124 128" />
        <path d="M124 128 L150 104" />
        <path d="M150 104 L158 152" />
        <path d="M100 62 L158 152" opacity="0.55" />
      </g>

      {/* Hub nodes — orange, matching the brand accent */}
      <g>
        <circle cx="72" cy="96" r="5" fill="#e8672a" />
        <circle cx="100" cy="62" r="4.4" fill="#2f6fb0" />
        <circle cx="124" cy="128" r="5" fill="#e8672a" />
        <circle cx="150" cy="104" r="5.2" fill="#e8672a" />
        <circle cx="158" cy="152" r="4.4" fill="#2f6fb0" />
      </g>

      {/* Outer tick marks, echoing the reference's ring detail */}
      <g
        stroke="#2f6fb0"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.5"
      >
        <path d="M100 22 a78 78 0 0 1 55 23" fill="none" />
        <path d="M100 178 a78 78 0 0 1 -55 -23" fill="none" />
      </g>
    </svg>
  );
}