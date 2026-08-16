import {
  Settings,
  Users,
  ShieldCheck,
  History,
  Building2,
  Wallet,
  BriefcaseBusiness,
  FileText,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Settings",
};

const businessSettings = [
  {
    title: "Business Details",
    description:
      "Manage your legal business name, trading name, registration, contact details, address, tax information, banking details and logo.",
    icon: Building2,
    href: "/settings/business-profile",
  },
  {
    title: "Financial Settings",
    description:
      "Configure currency, invoice and quote numbering, payment terms and tax settings.",
    icon: Wallet,
    href: "/settings/financial",
  },
  {
    title: "Document Settings",
    description:
      "Manage default terms and conditions, document footers and document appearance.",
    icon: FileText,
    href: "/settings/documents",
  },
];

const operationalSettings = [
  {
    title: "Job Settings",
    description:
      "Configure job types and job statuses used throughout the Jobs module.",
    icon: BriefcaseBusiness,
    href: "/settings/jobs",
  },
  {
    title: "Employee & Leave Settings",
    description:
      "Configure employee numbering, leave rules and payroll-related defaults.",
    icon: Users,
    href: "/settings/employees",
  },
];

const administrationSettings = [
  {
    title: "Users",
    description:
      "Add and manage employee login accounts, activate or deactivate users and control account access.",
    icon: Users,
    href: "/settings/users",
  },
  {
    title: "Roles & Permissions",
    description:
      "Create and manage roles and control exactly what each user can access in the system.",
    icon: ShieldCheck,
    href: "/settings/roles",
  },
  {
    title: "Audit Log",
    description:
      "See who performed actions, what was changed, when it happened and which record was affected.",
    icon: History,
    href: "/settings/audit-log",
  },
];

function SettingsCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-charcoal-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:border-charcoal-800 dark:bg-charcoal-900"
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>

          <ChevronRight className="h-5 w-5 text-charcoal-300 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>

        <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-charcoal-500 dark:text-charcoal-400">
          {description}
        </p>
      </div>
    </Link>
  );
}

function SettingsSection({
  title,
  description,
  settings,
}: {
  title: string;
  description: string;
  settings: typeof businessSettings;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-charcoal-500 dark:text-charcoal-400">
          {description}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {settings.map((setting) => (
          <SettingsCard
            key={setting.title}
            title={setting.title}
            description={setting.description}
            icon={setting.icon}
            href={setting.href}
          />
        ))}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <DashboardShell
      title="Settings"
      subtitle="Configure your business preferences and system"
    >
      <PageHeader
        title="Settings"
        description="Manage your business configuration, operations, users, permissions and system preferences."
        icon={Settings}
      />

      <div className="space-y-10">
        {/* BUSINESS SUMMARY */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Business Profile
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                  Legal Name
                </p>

                <p className="mt-1 text-sm font-medium text-charcoal-900 dark:text-white">
                  {siteConfig.company.legalName}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                  Registration Number
                </p>

                <p className="mt-1 text-sm font-medium text-charcoal-900 dark:text-white">
                  {siteConfig.company.registration}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                  Contact
                </p>

                <p className="mt-1 text-sm font-medium text-charcoal-900 dark:text-white">
                  {siteConfig.company.email}
                </p>

                <p className="text-sm text-charcoal-600 dark:text-charcoal-300">
                  {siteConfig.company.phone}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                  Location
                </p>

                <p className="mt-1 text-sm font-medium text-charcoal-900 dark:text-white">
                  {siteConfig.company.location}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BUSINESS SETTINGS */}

        <SettingsSection
          title="Business"
          description="Manage the information and configuration that controls your business documents and financial setup."
          settings={businessSettings}
        />

        {/* OPERATIONAL SETTINGS */}

        <SettingsSection
          title="Operations"
          description="Configure settings used by jobs, employees, leave and payroll."
          settings={operationalSettings}
        />

        {/* ADMINISTRATION */}

        <SettingsSection
          title="Administration"
          description="Manage users, roles, permissions and system activity."
          settings={administrationSettings}
        />
      </div>
    </DashboardShell>
  );
}