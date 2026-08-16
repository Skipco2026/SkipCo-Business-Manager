export interface DashboardStats {
  monthlyRevenue: number;
  revenueChange: number;
  outstandingInvoices: number;
  outstandingInvoicesAmount: number;
  outstandingQuotes: number;
  outstandingQuotesAmount: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  jobsThisWeek: number;
  jobsCompletedThisWeek: number;
}

export interface ActivityItem {
  id: string;
  type: "invoice" | "quote" | "job" | "customer" | "payment";
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
  totalSpent: number;
  createdAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerName: string;
  amount: number;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  validUntil: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  createdAt: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  customerName: string;
  serviceType: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduledDate: string;
  location: string;
}
