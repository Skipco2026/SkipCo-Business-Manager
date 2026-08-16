import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  BriefcaseBusiness,
  Truck,
  Settings,
  ClipboardList,
} from "lucide-react";

export const mainNavItems = [
  // 0
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  // 1
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },

  // 2
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
  },

  // 3
  {
    title: "Quotes",
    href: "/quotes",
    icon: Receipt,
  },

  // 4
  {
    title: "Payments",
    href: "/payments",
    icon: Receipt,
  },

  // 5
  {
    title: "Statements",
    href: "/statements",
    icon: ClipboardList,
  },

  // 6
  {
    title: "Employees",
    href: "/employees",
    icon: BriefcaseBusiness,
  },

  // 7
  {
    title: "Contractors",
    href: "/contractors",
    icon: Truck,
  },

  // 8
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];