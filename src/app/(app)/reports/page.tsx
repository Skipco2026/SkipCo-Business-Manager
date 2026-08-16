import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader, PlaceholderContent } from "@/components/layout/page-header";
import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <DashboardShell title="Reports" subtitle="Business analytics and financial reports">
      <PageHeader
        title="Reports"
        description="Analyse revenue, job performance, and customer trends."
        icon={BarChart3}
        action={{ label: "Generate Report", href: "#" }}
      />
      <PlaceholderContent
        features={[
          "Revenue reports by period, customer, and service type",
          "Outstanding invoices and ageing analysis",
          "Job completion and on-time delivery metrics",
          "Customer acquisition and retention reports",
          "Driver and vehicle utilisation reports",
          "Export reports to PDF and Excel",
        ]}
      />
    </DashboardShell>
  );
}
