"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { pageTransition, REDUCED } from "@/lib/motion";
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const variants = reduced ? REDUCED.pageTransition : pageTransition;
  return <motion.div variants={variants} initial="hidden" animate="visible">{children}</motion.div>;
}
