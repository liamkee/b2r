import type { ReactElement } from "react";

interface MapAmbienceProps {
  width: number;
  height: number;
  /** Fewer clouds and no star twinkle drift stagger on small screens. */
  reduced: boolean;
}

/**
 * Ambient map atmosphere: three parallax cloud layers drifting at different
 * speeds/opacities, plus a scatter of twinkling stars.
 *
 * Everything animates `transform` and `opacity` only — the drift is a CSS
 * `translateX` keyframe on a blurred SVG group, so it runs on the compositor.
 * There are no images; the clouds are blurred ellipses.
 */
export function MapAmbience({
  width,
  height,
  reduced,
}: MapAmbienceProps): ReactElement {
  const cloudLayers = reduced
    ? [
        { id: "far", opacity: 0.06, blur: 26, duration: 150, y: 0.16, scale: 1.5 },
        { id: "near", opacity: 0.09, blur: 18, duration: 96, y: 0.7, scale: 1.15 },
      ]
    : [
        { id: "far", opacity: 0.055, blur: 28, duration: 168, y: 0.14, scale: 1.6 },
        { id: "mid", opacity: 0.075, blur: 22, duration: 124, y: 0.44, scale: 1.3 },
        { id: "near", opacity: 0.1, blur: 16, duration: 88, y: 0.74, scale: 1.1 },
      ];

  /* Fixed star positions (no random per render → stable across re-renders). */
  const stars = reduced ? STAR_FIELD.slice(0, 14) : STAR_FIELD;

  return (
    <>
      <style>{`
        @keyframes asean-drift {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-32%, 0, 0); }
        }
        @keyframes asean-twinkle {
          0%, 100% { opacity: var(--star-min, 0.15); transform: scale(0.85); }
          50%      { opacity: var(--star-max, 0.75); transform: scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .asean-cloud-layer, .asean-star { animation: none !important; }
        }
      `}</style>

      {/* Clouds: each layer is a wide row of blurred ellipses scrolled by a
          single transform, so the cost stays one animation per layer. */}
      {cloudLayers.map((layer) => (
        <g
          key={layer.id}
          className="asean-cloud-layer pointer-events-none"
          style={{
            opacity: layer.opacity,
            animation: `asean-drift ${layer.duration}s linear infinite`,
            willChange: "transform",
          }}
        >
          <g
            transform={`translate(0 ${height * layer.y}) scale(${layer.scale})`}
            style={{ filter: `blur(${layer.blur}px)` }}
          >
            {CLOUD_PUFFS.map((puff, i) => (
              <ellipse
                key={i}
                cx={puff.cx}
                cy={puff.cy}
                rx={puff.rx}
                ry={puff.ry}
                fill="rgb(255 255 255)"
              />
            ))}
          </g>
        </g>
      ))}

      {/* Stars: absolutely positioned dots that twinkle in place. */}
      <g className="pointer-events-none">
        {stars.map((star, i) => (
          <circle
            key={i}
            className="asean-star"
            cx={star.x * width}
            cy={star.y * height}
            r={star.r}
            fill="rgb(255 255 255)"
            style={{
              ["--star-min" as string]: star.min,
              ["--star-max" as string]: star.max,
              transformOrigin: `${star.x * width}px ${star.y * height}px`,
              animation: `asean-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              willChange: "opacity, transform",
            }}
          />
        ))}
      </g>
    </>
  );
}

/** Clouds are laid out in a repeating row wider than the viewBox. */
const CLOUD_PUFFS = [
  { cx: 40, cy: 0, rx: 90, ry: 26 },
  { cx: 190, cy: 14, rx: 120, ry: 30 },
  { cx: 370, cy: -8, rx: 100, ry: 24 },
  { cx: 520, cy: 10, rx: 130, ry: 32 },
  { cx: 700, cy: 0, rx: 95, ry: 26 },
  { cx: 860, cy: 16, rx: 115, ry: 28 },
] as const;

/** Fractional star positions so they scale with any viewBox size. */
const STAR_FIELD = [
  { x: 0.08, y: 0.14, r: 1.1, min: 0.12, max: 0.7, duration: 4.2, delay: 0 },
  { x: 0.18, y: 0.34, r: 0.8, min: 0.1, max: 0.5, duration: 5.6, delay: 0.6 },
  { x: 0.29, y: 0.1, r: 1.3, min: 0.14, max: 0.8, duration: 3.8, delay: 1.2 },
  { x: 0.41, y: 0.26, r: 0.9, min: 0.1, max: 0.55, duration: 6.1, delay: 0.4 },
  { x: 0.52, y: 0.08, r: 1.0, min: 0.12, max: 0.65, duration: 4.8, delay: 1.8 },
  { x: 0.63, y: 0.22, r: 0.7, min: 0.1, max: 0.45, duration: 5.2, delay: 0.9 },
  { x: 0.74, y: 0.36, r: 1.2, min: 0.13, max: 0.72, duration: 4.4, delay: 1.5 },
  { x: 0.86, y: 0.12, r: 0.9, min: 0.1, max: 0.58, duration: 5.9, delay: 0.3 },
  { x: 0.94, y: 0.3, r: 1.1, min: 0.12, max: 0.68, duration: 4.6, delay: 2.1 },
  { x: 0.12, y: 0.58, r: 0.8, min: 0.1, max: 0.48, duration: 5.4, delay: 1.1 },
  { x: 0.24, y: 0.74, r: 1.0, min: 0.11, max: 0.6, duration: 4.9, delay: 0.7 },
  { x: 0.37, y: 0.62, r: 0.7, min: 0.1, max: 0.42, duration: 6.3, delay: 1.9 },
  { x: 0.49, y: 0.82, r: 1.2, min: 0.13, max: 0.7, duration: 4.1, delay: 0.2 },
  { x: 0.61, y: 0.68, r: 0.9, min: 0.1, max: 0.52, duration: 5.7, delay: 1.4 },
  { x: 0.72, y: 0.88, r: 0.8, min: 0.1, max: 0.5, duration: 5.1, delay: 0.5 },
  { x: 0.83, y: 0.6, r: 1.1, min: 0.12, max: 0.66, duration: 4.5, delay: 2.3 },
  { x: 0.91, y: 0.78, r: 0.9, min: 0.1, max: 0.55, duration: 5.8, delay: 1.0 },
  { x: 0.05, y: 0.44, r: 0.7, min: 0.1, max: 0.44, duration: 6.5, delay: 1.7 },
  { x: 0.44, y: 0.46, r: 0.85, min: 0.1, max: 0.5, duration: 5.3, delay: 2.6 },
  { x: 0.68, y: 0.52, r: 1.05, min: 0.11, max: 0.62, duration: 4.7, delay: 0.35 },
] as const;
