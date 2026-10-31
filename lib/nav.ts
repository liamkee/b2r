export interface NavItem { path: string; label: string; description: string }
export const NAV_ITEMS: readonly NavItem[] = [
  { path: "/", label: "Home", description: "One ASEAN. Every opportunity." },
  { path: "/#explore", label: "Explore", description: "Pick a country on the map." },
  { path: "/match", label: "Match", description: "Describe your startup, get ranked matches." },
  { path: "/compare", label: "Compare", description: "Compare markets across up to 3 countries." },
] as const;