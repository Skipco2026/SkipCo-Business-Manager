import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardStats, recentActivity } from "@/lib/data/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skip Co Business Manager",
};

export default function DashboardPage() {
  const stats = dashboardStats;

  return (
    <DashboardShell
      title="Skip Co Business Manager"
      subtitle={`Welcome back! Here's an overview of your business for ${new Date().toLocaleDateString(
        "en-ZA",
        {
          month: "long",
          year: "numeric",
        }
      )}.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Monthly Revenue"
          value={stats.monthlyRevenue}
          icon="trending-up"
          trend={{
            value: stats.revenueChange,
            label: "vs last month",
          }}
          index={0}
        />

        <StatCard
          title="Outstanding Invoices"
          value={stats.outstandingInvoices}
          subtitle={`${formatCurrency(
            stats.outstandingInvoicesAmount
          )} outstanding`}
          icon="receipt"
          index={1}
        />

        <StatCard
          title="Outstanding Quotes"
          value={stats.outstandingQuotes}
          subtitle={`${formatCurrency(
            stats.outstandingQuotesAmount
          )} awaiting approval`}
          icon="file-text"
          index={2}
        />

        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          subtitle={`${stats.newCustomersThisMonth} new this month`}
          icon="users"
          index={3}
        />

        <StatCard
          title="Jobs This Week"
          value={stats.jobsThisWeek}
          subtitle={`${stats.jobsCompletedThisWeek} completed`}
          icon="briefcase"
          index={4}
        />

        <StatCard
          title="Completion Rate"
          value={`${Math.round(
            (stats.jobsCompletedThisWeek / stats.jobsThisWeek) * 100
          )}%`}
          subtitle="Completed this week"
          icon="clock"
          index={5}
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>

          <CardContent>
            <ActivityFeed activities={recentActivity} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}