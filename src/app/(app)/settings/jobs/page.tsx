"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface JobSettingItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const defaultJobTypes = [
  {
    name: "Skip Hire",
    description: "Delivery and collection of skip bins.",
  },
  {
    name: "Waste Removal",
    description: "General waste removal services.",
  },
  {
    name: "Wheelie Bin Collection",
    description: "Scheduled wheelie bin collection service.",
  },
  {
    name: "Truck Hire",
    description: "8 ton truck hire and related transport.",
  },
  {
    name: "Food Waste",
    description: "Food waste bin collection and disposal.",
  },
  {
    name: "Agricultural Waste",
    description: "Agricultural waste collection and removal.",
  },
];

const defaultStatuses = [
  {
    name: "Draft",
    description: "Job has been created but not yet scheduled.",
  },
  {
    name: "Scheduled",
    description: "Job has been scheduled for a future date.",
  },
  {
    name: "In Progress",
    description: "Work on the job is currently underway.",
  },
  {
    name: "Completed",
    description: "The job has been completed successfully.",
  },
  {
    name: "Cancelled",
    description: "The job has been cancelled.",
  },
];

export default function JobSettingsPage() {
  const supabase = createClient();

  const [jobTypes, setJobTypes] = useState<JobSettingItem[]>([]);
  const [jobStatuses, setJobStatuses] = useState<JobSettingItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadJobSettings();
  }, []);

  async function loadJobSettings() {
    setLoading(true);
    setError("");

    const { data: types, error: typesError } =
      await supabase
        .from("job_types")
        .select("*")
        .order("sort_order", {
          ascending: true,
        });

    if (typesError) {
      console.error(
        "Job types loading error:",
        typesError
      );

      setError(
        `Unable to load job types: ${typesError.message}`
      );

      setLoading(false);
      return;
    }

    const { data: statuses, error: statusesError } =
      await supabase
        .from("job_statuses")
        .select("*")
        .order("sort_order", {
          ascending: true,
        });

    if (statusesError) {
      console.error(
        "Job statuses loading error:",
        statusesError
      );

      setError(
        `Unable to load job statuses: ${statusesError.message}`
      );

      setLoading(false);
      return;
    }

    setJobTypes((types ?? []) as JobSettingItem[]);
    setJobStatuses((statuses ?? []) as JobSettingItem[]);

    setLoading(false);
  }

  function addJobType() {
    setJobTypes((current) => [
      ...current,
      {
        id: `new-type-${Date.now()}`,
        name: "",
        description: "",
        is_active: true,
        sort_order: current.length + 1,
        created_at: "",
        updated_at: "",
      },
    ]);
  }

  function addJobStatus() {
    setJobStatuses((current) => [
      ...current,
      {
        id: `new-status-${Date.now()}`,
        name: "",
        description: "",
        is_active: true,
        sort_order: current.length + 1,
        created_at: "",
        updated_at: "",
      },
    ]);
  }

  function updateJobType(
    id: string,
    field: "name" | "description" | "is_active",
    value: string | boolean
  ) {
    setJobTypes((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function updateJobStatus(
    id: string,
    field: "name" | "description" | "is_active",
    value: string | boolean
  ) {
    setJobStatuses((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function removeJobType(id: string) {
    setJobTypes((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function removeJobStatus(id: string) {
    setJobStatuses((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  async function saveSettings() {
    setError("");
    setSuccess("");
    setSaving(true);

    const validJobTypes = jobTypes.filter(
      (item) => item.name.trim()
    );

    const validStatuses = jobStatuses.filter(
      (item) => item.name.trim()
    );

    if (validJobTypes.length === 0) {
      setError(
        "Please add at least one job type."
      );
      setSaving(false);
      return;
    }

    if (validStatuses.length === 0) {
      setError(
        "Please add at least one job status."
      );
      setSaving(false);
      return;
    }

    const { error: deleteTypesError } =
      await supabase
        .from("job_types")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteTypesError) {
      setError(
        `Unable to update job types: ${deleteTypesError.message}`
      );
      setSaving(false);
      return;
    }

    const { error: deleteStatusesError } =
      await supabase
        .from("job_statuses")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteStatusesError) {
      setError(
        `Unable to update job statuses: ${deleteStatusesError.message}`
      );
      setSaving(false);
      return;
    }

    const jobTypeData = validJobTypes.map(
      (item, index) => ({
        name: item.name.trim(),
        description:
          item.description?.trim() || null,
        is_active: item.is_active,
        sort_order: index + 1,
      })
    );

    const jobStatusData = validStatuses.map(
      (item, index) => ({
        name: item.name.trim(),
        description:
          item.description?.trim() || null,
        is_active: item.is_active,
        sort_order: index + 1,
      })
    );

    const { error: insertTypesError } =
      await supabase
        .from("job_types")
        .insert(jobTypeData);

    if (insertTypesError) {
      setError(
        `Unable to save job types: ${insertTypesError.message}`
      );
      setSaving(false);
      return;
    }

    const { error: insertStatusesError } =
      await supabase
        .from("job_statuses")
        .insert(jobStatusData);

    if (insertStatusesError) {
      setError(
        `Unable to save job statuses: ${insertStatusesError.message}`
      );
      setSaving(false);
      return;
    }

    setSuccess(
      "Job settings saved successfully."
    );

    setSaving(false);

    await loadJobSettings();
  }

  async function createDefaultSettings() {
    setError("");
    setSuccess("");
    setSaving(true);

    const { error: typesError } =
      await supabase
        .from("job_types")
        .insert(
          defaultJobTypes.map((item, index) => ({
            ...item,
            is_active: true,
            sort_order: index + 1,
          }))
        );

    if (typesError) {
      setError(
        `Unable to create default job types: ${typesError.message}`
      );
      setSaving(false);
      return;
    }

    const { error: statusesError } =
      await supabase
        .from("job_statuses")
        .insert(
          defaultStatuses.map((item, index) => ({
            ...item,
            is_active: true,
            sort_order: index + 1,
          }))
        );

    if (statusesError) {
      setError(
        `Unable to create default job statuses: ${statusesError.message}`
      );
      setSaving(false);
      return;
    }

    setSuccess(
      "Default job settings created successfully."
    );

    setSaving(false);

    await loadJobSettings();
  }

  return (
    <DashboardShell
      title="Job Settings"
      subtitle="Configure job types and statuses"
    >
      <PageHeader
        title="Job Settings"
        description="Configure the job types and statuses used throughout SkipCo Business Manager."
        icon={BriefcaseBusiness}
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

        {/* SUCCESS */}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-charcoal-100 bg-white px-6 py-20 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />

            <span className="ml-3 text-sm text-charcoal-500">
              Loading job settings...
            </span>
          </div>
        ) : (
          <>
            {/* JOB TYPES */}

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>
                      Job Types
                    </CardTitle>

                    <p className="mt-1 text-sm text-charcoal-500">
                      Configure the types of work your business
                      performs.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addJobType}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal-200 bg-white px-4 py-2.5 text-sm font-medium text-charcoal-700 transition hover:border-primary hover:text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    Add Job Type
                  </button>
                </div>
              </CardHeader>

              <CardContent>
                {jobTypes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-charcoal-200 px-6 py-10 text-center">
                    <p className="text-sm text-charcoal-500">
                      No job types have been configured yet.
                    </p>

                    <button
                      type="button"
                      onClick={createDefaultSettings}
                      disabled={saving}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1897a0] disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}

                      Add Default Job Settings
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobTypes.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-charcoal-100 bg-charcoal-50/30 p-4 dark:border-charcoal-800 dark:bg-charcoal-900/40"
                      >
                        <div className="flex gap-3">
                          <div className="flex items-center text-charcoal-300">
                            <GripVertical className="h-5 w-5" />
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(event) =>
                                  updateJobType(
                                    item.id,
                                    "name",
                                    event.target.value
                                  )
                                }
                                placeholder="Job type name"
                                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                              />

                              <input
                                type="text"
                                value={
                                  item.description ?? ""
                                }
                                onChange={(event) =>
                                  updateJobType(
                                    item.id,
                                    "description",
                                    event.target.value
                                  )
                                }
                                placeholder="Description"
                                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                              />
                            </div>

                            <label className="inline-flex items-center gap-2 text-sm text-charcoal-600">
                              <input
                                type="checkbox"
                                checked={item.is_active}
                                onChange={(event) =>
                                  updateJobType(
                                    item.id,
                                    "is_active",
                                    event.target.checked
                                  )
                                }
                                className="h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                              />

                              Active
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeJobType(item.id)
                            }
                            className="self-start rounded-lg p-2 text-charcoal-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Remove job type"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* JOB STATUSES */}

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>
                      Job Statuses
                    </CardTitle>

                    <p className="mt-1 text-sm text-charcoal-500">
                      Configure the stages a job can move through.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addJobStatus}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal-200 bg-white px-4 py-2.5 text-sm font-medium text-charcoal-700 transition hover:border-primary hover:text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    Add Job Status
                  </button>
                </div>
              </CardHeader>

              <CardContent>
                {jobStatuses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-charcoal-200 px-6 py-10 text-center">
                    <p className="text-sm text-charcoal-500">
                      No job statuses have been configured yet.
                    </p>

                    <button
                      type="button"
                      onClick={createDefaultSettings}
                      disabled={saving}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1897a0] disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}

                      Add Default Job Settings
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobStatuses.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-charcoal-100 bg-charcoal-50/30 p-4 dark:border-charcoal-800 dark:bg-charcoal-900/40"
                      >
                        <div className="flex gap-3">
                          <div className="flex items-center text-charcoal-300">
                            <GripVertical className="h-5 w-5" />
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(event) =>
                                  updateJobStatus(
                                    item.id,
                                    "name",
                                    event.target.value
                                  )
                                }
                                placeholder="Status name"
                                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                              />

                              <input
                                type="text"
                                value={
                                  item.description ?? ""
                                }
                                onChange={(event) =>
                                  updateJobStatus(
                                    item.id,
                                    "description",
                                    event.target.value
                                  )
                                }
                                placeholder="Description"
                                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                              />
                            </div>

                            <label className="inline-flex items-center gap-2 text-sm text-charcoal-600">
                              <input
                                type="checkbox"
                                checked={item.is_active}
                                onChange={(event) =>
                                  updateJobStatus(
                                    item.id,
                                    "is_active",
                                    event.target.checked
                                  )
                                }
                                className="h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                              />

                              Active
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeJobStatus(item.id)
                            }
                            className="self-start rounded-lg p-2 text-charcoal-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Remove job status"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SAVE */}

            <div className="flex justify-end border-t border-charcoal-100 pt-6">
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#1897a0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Job Settings
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}