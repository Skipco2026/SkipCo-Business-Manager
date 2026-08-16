import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader, PlaceholderContent } from "@/components/layout/page-header";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <DashboardShell title="Calendar" subtitle="View deliveries, collections, and events">
      <PageHeader
        title="Calendar"
        description="Visual schedule of all jobs, deliveries, collections, and business events."
        icon={Calendar}
        action={{ label: "Add Event", href: "#" }}
      />
      <PlaceholderContent
        features={[
          "Monthly, weekly, and daily calendar views",
          "Colour-coded job types: delivery, collection, service",
          "Drag-and-drop job rescheduling",
          "Driver and vehicle availability view",
          "Public holiday and business closure markers",
          "Sync with Google Calendar and Outlook",
        ]}
      />
    </DashboardShell>
  );
}
