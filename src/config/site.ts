export const siteConfig = {
  name: "SkipCo Business Manager",
  shortName: "SkipCo",
  description:
    "All-in-one business management platform for skip hire, waste removal, and field service operations.",
  company: {
    legalName: "DDW Consolidate (Pty) Ltd t/a SkipCo Solutions",
    tradingAs: "SkipCo Solutions",
    registration: "2025/216609/07",
    email: "ddw.trading@outlook.com",
    phone: "0627379728",
    location: "Bloemfontein, Free State, South Africa",
  },
  colors: {
    primary: "#0F8B8D",
    secondary: "#2B2B2B",
    background: "#FFFFFF",
    accent: "#000000",
  },
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export type SiteConfig = typeof siteConfig;
