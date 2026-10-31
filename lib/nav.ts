export interface NavItem { path: string; label: string; description: string }
export const NAV_ITEMS: readonly NavItem[] = [
  { path: "/", label: "Home", description: "One ASEAN. Every opportunity." },
  { path: "/#countries", label: "Explore", description: "Browse 11 ASEAN countries." },
  { path: "/compare", label: "Compare", description: "Compare markets across up to 3 countries." },
  { path: "/#countries", label: "Dashboard", description: "Country intelligence dashboard." },
] as const;
