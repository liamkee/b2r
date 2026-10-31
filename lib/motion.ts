import type { Transition, Variants } from "framer-motion";
export const DURATION = { instant: 0.12, fast: 0.2, base: 0.3, slow: 0.5, slower: 0.8 } as const;
export const EASE = { out: [0.22, 1, 0.36, 1], inOut: [0.65, 0, 0.35, 1], in: [0.4, 0, 1, 1] } as const satisfies Record<string, readonly number[]>;
export const SPRING = { type: "spring", stiffness: 350, damping: 30, mass: 1 } as const satisfies Transition;
export const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 32, mass: 1 } as const satisfies Transition;
export const SPRING_BOUNCY = { type: "spring", stiffness: 400, damping: 28, mass: 0.9 } as const satisfies Transition;
export const STAGGER = { tight: 0.04, base: 0.06, loose: 0.1, map: 0.045 } as const;
export const TRANSITION = { spring: SPRING, soft: SPRING_SOFT, bouncy: SPRING_BOUNCY, fade: { duration: DURATION.base, ease: EASE.out }, fast: { duration: DURATION.fast, ease: EASE.out }, page: { duration: DURATION.base, ease: EASE.out } } satisfies Record<string, Transition>;
export const fadeUp: Variants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: SPRING } };
export const fadeUpSm: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: SPRING } };
export const fade: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: TRANSITION.fade } };
export const scaleIn: Variants = { hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1, transition: SPRING } };
export const staggerList: Variants = { hidden: {}, visible: { transition: { staggerChildren: STAGGER.base, delayChildren: 0.05 } } };
export const staggerListTight: Variants = { hidden: {}, visible: { transition: { staggerChildren: STAGGER.tight, delayChildren: 0.02 } } };
export const staggerListLoose: Variants = { hidden: {}, visible: { transition: { staggerChildren: STAGGER.loose, delayChildren: 0.1 } } };
export const pageTransition: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: TRANSITION.page }, exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.in } } };
export const layoutIndicator: Transition = { type: "spring", stiffness: 400, damping: 32 };
export const VIEWPORT = { once: true, amount: 0.25 } as const;
export const REDUCED: Record<string, Variants> = {
  fadeUp: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: DURATION.instant } } },
  pageTransition: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: DURATION.instant } } },
};
