export interface NavItem { path: string; label: string; description: string }
export const NAV_ITEMS: readonly NavItem[] = [
  { path: "/", label: "Home", description: "One ASEAN. Every opportunity." },
  { path: "/#explore", label: "Explore", description: "Pick a country on the map." },
  { path: "/match", label: "Match", description: "Research entry options for your business." },
  { path: "/compare", label: "Compare", description: "Compare evidence across selected countries." },
] as const;
