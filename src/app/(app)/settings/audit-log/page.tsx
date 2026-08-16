"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  History,
  Loader2,
  Search,
  RefreshCw,
  User,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Shield,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  module: string;
  record_id: string | null;
  record_type: string | null;
  description: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export default function AuditLogPage() {
  const supabase = createClient();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const [error, setError] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Audit log loading error:", error);
      setError(`Unable to load audit log: ${error.message}`);
      setLoading(false);
      return;
    }

    setLogs((data ?? []) as AuditLog[]);
    setLoading(false);
  }

  async function refreshLogs() {
    setRefreshing(true);
    await loadAuditLogs();
    setRefreshing(false);
  }

  const modules = Array.from(
    new Set(logs.map((log) => log.module).filter(Boolean))
  );

  const actions = Array.from(
    new Set(logs.map((log) => log.action).filter(Boolean))
  );

  const filteredLogs = logs.filter((log) => {
    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      !searchValue ||
      log.user_name?.toLowerCase().includes(searchValue) ||
      log.user_email?.toLowerCase().includes(searchValue) ||
      log.module?.toLowerCase().includes(searchValue) ||
      log.action?.toLowerCase().includes(searchValue) ||
      log.description?.toLowerCase().includes(searchValue) ||
      log.record_type?.toLowerCase().includes(searchValue);

    const matchesModule =
      moduleFilter === "all" ||
      log.module === moduleFilter;

    const matchesAction =
      actionFilter === "all" ||
      log.action === actionFilter;

    return (
      matchesSearch &&
      matchesModule &&
      matchesAction
    );
  });

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getActionIcon(action: string) {
    const value = action.toLowerCase();

    if (
      value.includes("create") ||
      value.includes("add")
    ) {
      return <Plus className="h-4 w-4" />;
    }

    if (
      value.includes("update") ||
      value.includes("edit")
    ) {
      return <Pencil className="h-4 w-4" />;
    }

    if (
      value.includes("delete") ||
      value.includes("remove")
    ) {
      return <Trash2 className="h-4 w-4" />;
    }

    if (
      value.includes("login") ||
      value.includes("permission") ||
      value.includes("role")
    ) {
      return <Shield className="h-4 w-4" />;
    }

    return <FileText className="h-4 w-4" />;
  }

  function getActionStyle(action: string) {
    const value = action.toLowerCase();

    if (
      value.includes("create") ||
      value.includes("add")
    ) {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (
      value.includes("update") ||
      value.includes("edit")
    ) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (
      value.includes("delete") ||
      value.includes("remove")
    ) {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-charcoal-50 text-charcoal-600 border-charcoal-200";
  }

  return (
    <DashboardShell
      title="Audit Log"
      subtitle="View activity and changes made throughout your business system"
    >
      <PageHeader
        title="Audit Log"
        description="Track who changed what, when it happened, and which area of the system was affected."
        icon={History}
      />

      <div className="space-y-6">

        {/* BACK */}

        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-500 transition hover:text-charcoal-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </div>

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* FILTERS */}

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

              {/* SEARCH */}

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search audit log..."
                  className="w-full rounded-lg border border-charcoal-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>

              {/* MODULE */}

              <select
                value={moduleFilter}
                onChange={(event) =>
                  setModuleFilter(event.target.value)
                }
                className="rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8]"
              >
                <option value="all">
                  All Modules
                </option>

                {modules.map((module) => (
                  <option
                    key={module}
                    value={module}
                  >
                    {module}
                  </option>
                ))}
              </select>

              {/* ACTION */}

              <select
                value={actionFilter}
                onChange={(event) =>
                  setActionFilter(event.target.value)
                }
                className="rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8]"
              >
                <option value="all">
                  All Actions
                </option>

                {actions.map((action) => (
                  <option
                    key={action}
                    value={action}
                  >
                    {action}
                  </option>
                ))}
              </select>

              {/* REFRESH */}

              <button
                type="button"
                onClick={refreshLogs}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal-200 bg-white px-4 py-2.5 text-sm font-medium text-charcoal-700 transition hover:bg-charcoal-50 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </button>

            </div>
          </CardContent>
        </Card>

        {/* SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-3">

          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                Total Activity
              </p>

              <p className="mt-2 text-2xl font-bold text-charcoal-900 dark:text-white">
                {logs.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                Showing
              </p>

              <p className="mt-2 text-2xl font-bold text-charcoal-900 dark:text-white">
                {filteredLogs.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                Modules
              </p>

              <p className="mt-2 text-2xl font-bold text-charcoal-900 dark:text-white">
                {modules.length}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* AUDIT TABLE */}

        <Card>
          <CardContent className="p-0">

            {loading ? (
              <div className="flex items-center justify-center px-6 py-20">
                <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />

                <span className="ml-3 text-sm text-charcoal-500">
                  Loading audit log...
                </span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-charcoal-100">
                  <History className="h-6 w-6 text-charcoal-400" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-charcoal-900">
                  No audit activity found
                </h3>

                <p className="mt-2 max-w-md text-sm text-charcoal-500">
                  Activity will appear here when users create,
                  update or delete records in the system.
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px]">

                  <thead>
                    <tr className="border-b border-charcoal-100 bg-charcoal-50/50">

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                        Date & Time
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                        User
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                        Action
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                        Module
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                        Description
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-charcoal-100">

                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="transition hover:bg-charcoal-50/50"
                      >

                        {/* DATE */}

                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="text-sm font-medium text-charcoal-800">
                            {formatDate(
                              log.created_at
                            )}
                          </p>
                        </td>

                        {/* USER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>

                            <div>
                              <p className="text-sm font-medium text-charcoal-800">
                                {log.user_name ||
                                  "Unknown User"}
                              </p>

                              {log.user_email && (
                                <p className="text-xs text-charcoal-400">
                                  {log.user_email}
                                </p>
                              )}
                            </div>

                          </div>

                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getActionStyle(
                              log.action
                            )}`}
                          >
                            {getActionIcon(
                              log.action
                            )}

                            {log.action}
                          </span>

                        </td>

                        {/* MODULE */}

                        <td className="px-5 py-4">

                          <span className="inline-flex rounded-md bg-charcoal-100 px-2.5 py-1 text-xs font-medium text-charcoal-600">
                            {log.module}
                          </span>

                        </td>

                        {/* DESCRIPTION */}

                        <td className="px-5 py-4">

                          <p className="max-w-md text-sm text-charcoal-600">
                            {log.description ||
                              "No description provided"}
                          </p>

                          {log.record_type && (
                            <p className="mt-1 text-xs text-charcoal-400">
                              Record:{" "}
                              {log.record_type}
                            </p>
                          )}

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            )}

          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  );
}