import type { DashboardStats, ActivityItem } from "@/types";

export const dashboardStats: DashboardStats = {
  monthlyRevenue: 284750,
  revenueChange: 12.4,
  outstandingInvoices: 8,
  outstandingInvoicesAmount: 67200,
  outstandingQuotes: 5,
  outstandingQuotesAmount: 43800,
  totalCustomers: 147,
  newCustomersThisMonth: 12,
  jobsThisWeek: 23,
  jobsCompletedThisWeek: 17,
};

export const recentActivity: ActivityItem[] = [
  {
    id: "1",
    type: "payment",
    title: "Payment received",
    description: "Bloemfontein Property Group paid Invoice #INV-2026-0842",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    amount: 12500,
  },
  {
    id: "2",
    type: "job",
    title: "Job completed",
    description: "6m³ skip collection at 42 Nelson Mandela Drive, Universitas",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "3",
    type: "quote",
    title: "Quote sent",
    description: "Quote #QT-2026-0318 sent to Free State Construction CC",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    amount: 8900,
  },
  {
    id: "4",
    type: "customer",
    title: "New customer added",
    description: "Mangaung Waste Solutions registered as a new account",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "5",
    type: "invoice",
    title: "Invoice issued",
    description: "Invoice #INV-2026-0847 issued to Brandwag Renovations",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    amount: 6200,
  },
  {
    id: "6",
    type: "job",
    title: "Job scheduled",
    description: "Skip delivery scheduled for 15 Jan Smuts Avenue, Westdene",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];
