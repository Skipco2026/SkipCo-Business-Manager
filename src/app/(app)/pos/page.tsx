import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader, PlaceholderContent } from "@/components/layout/page-header";
import { ShoppingCart } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Point of Sale" };

export default function POSPage() {
  return (
    <DashboardShell title="POS" subtitle="Point of sale for on-site transactions">
      <PageHeader
        title="Point of Sale"
        description="Process walk-in sales and on-site payments from the field."
        icon={ShoppingCart}
        action={{ label: "New Sale", href: "#" }}
      />
      <PlaceholderContent
        features={[
          "Quick product and service selection",
          "Cash, card, and EFT payment recording",
          "Instant receipt generation and printing",
          "Link sales to customer accounts",
          "Daily cash-up and reconciliation reports",
          "Offline mode for field operations",
        ]}
      />
    </DashboardShell>
  );
}
