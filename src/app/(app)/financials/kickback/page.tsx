"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";

interface Customer {
  id: string;
  customer_number: string | null;
  company_name: string;
  trading_name: string | null;
}

interface Job {
  id: string;
  job_number: string;
  job_type: string | null;
  description: string | null;
  customer_id: string | null;
  customer: Customer | null;
}

interface KickbackTransaction {
  id: string;
  transaction_date: string;
  reference: string;
  description: string;
  amount: number;
  customer_id: string | null;
  job_id: string | null;
  notes: string | null;
  created_at: string;
}

interface KickbackFormData {
  transaction_date: string;
  job_id: string;
  amount: string;
  description: string;
  reason: string;
  notes: string;
}

function getCurrentMonth() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function getInitialFormData(): KickbackFormData {
  return {
    transaction_date: new Date().toISOString().split("T")[0],
    job_id: "",
    amount: "",
    description: "",
    reason: "",
    notes: "",
  };
}

function buildStoredNotes(reason: string, notes: string) {
  const parts: string[] = [];

  if (reason.trim()) {
    parts.push(`Reason: ${reason.trim()}`);
  }

  if (notes.trim()) {
    parts.push(notes.trim());
  }

  return parts.join("\n");
}

function extractReason(notes: string | null) {
  if (!notes) return "";

  const match = notes.match(/^Reason:\s*(.*?)(?:\n|$)/);

  return match?.[1] ?? "";
}

function extractAdditionalNotes(notes: string | null) {
  if (!notes) return "";

  return notes.replace(/^Reason:\s*.*?(?:\n|$)/, "").trim();
}

export default function KickbackPage() {
  const supabase = createClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [kickbacks, setKickbacks] = useState<KickbackTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingKickback, setEditingKickback] =
    useState<KickbackTransaction | null>(null);

  const [formData, setFormData] =
    useState<KickbackFormData>(getInitialFormData());

  const [jobSearch, setJobSearch] = useState("");
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setJobsLoading(true);

      const [jobsResult, kickbacksResult] = await Promise.all([
        supabase
          .from("jobs")
          .select(
            `
              id,
              job_number,
              job_type,
              description,
              customer_id,
              customer:customers (
                id,
                customer_number,
                company_name,
                trading_name
              )
            `
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("financial_transactions")
          .select(
            `
              id,
              transaction_date,
              reference,
              description,
              amount,
              customer_id,
              job_id,
              notes,
              created_at
            `
          )
          .eq("type", "kickback")
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (jobsResult.error) {
        throw jobsResult.error;
      }

      if (kickbacksResult.error) {
        throw kickbacksResult.error;
      }

      const normalizedJobs: Job[] = ((jobsResult.data ?? []) as Array<
        Job & {
          customer: Customer | Customer[] | null;
        }
      >).map((job) => ({
        ...job,
        customer: Array.isArray(job.customer)
          ? job.customer[0] ?? null
          : job.customer ?? null,
      }));

      const normalizedKickbacks: KickbackTransaction[] = (
        (kickbacksResult.data ?? []) as KickbackTransaction[]
      ).map((kickback) => ({
        ...kickback,
        amount: Number(kickback.amount) || 0,
      }));

      setJobs(normalizedJobs);
      setKickbacks(normalizedKickbacks);
    } catch (error) {
      console.error("Error loading kickbacks:", error);

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to load kickbacks.",
      });
    } finally {
      setLoading(false);
      setJobsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const jobMap = useMemo(() => {
    const map = new Map<string, Job>();

    jobs.forEach((job) => {
      map.set(job.id, job);
    });

    return map;
  }, [jobs]);

  const selectedJob = formData.job_id
    ? jobMap.get(formData.job_id) ?? null
    : null;

  const filteredJobs = useMemo(() => {
    const value = jobSearch.trim().toLowerCase();

    if (!value) {
      return jobs.slice(0, 20);
    }

    return jobs
      .filter((job) => {
        const customerName =
          job.customer?.company_name ??
          job.customer?.trading_name ??
          "";

        const searchable = [
          job.job_number,
          job.job_type ?? "",
          job.description ?? "",
          customerName,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(value);
      })
      .slice(0, 20);
  }, [jobs, jobSearch]);

  const filteredKickbacks = useMemo(() => {
    const value = search.trim().toLowerCase();

    return kickbacks.filter((kickback) => {
      const matchesMonth =
        !selectedMonth ||
        kickback.transaction_date?.startsWith(selectedMonth);

      const job = kickback.job_id
        ? jobMap.get(kickback.job_id)
        : null;

      const customerName =
        job?.customer?.company_name ??
        job?.customer?.trading_name ??
        "";

      const searchable = [
        kickback.reference,
        kickback.description,
        kickback.notes ?? "",
        job?.job_number ?? "",
        job?.job_type ?? "",
        customerName,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !value || searchable.includes(value);

      return matchesMonth && matchesSearch;
    });
  }, [kickbacks, selectedMonth, search, jobMap]);

  const totalKickbacks = useMemo(() => {
    return filteredKickbacks.reduce(
      (total, kickback) =>
        total + Number(kickback.amount || 0),
      0
    );
  }, [filteredKickbacks]);

  const openAddModal = () => {
    setEditingKickback(null);
    setFormData(getInitialFormData());
    setJobSearch("");
    setJobDropdownOpen(false);
    setMessage(null);
    setModalOpen(true);
  };

  const openEditModal = (kickback: KickbackTransaction) => {
    const job = kickback.job_id
      ? jobMap.get(kickback.job_id)
      : null;

    setEditingKickback(kickback);

    setFormData({
      transaction_date: kickback.transaction_date,
      job_id: kickback.job_id ?? "",
      amount: String(kickback.amount),
      description: kickback.description,
      reason: extractReason(kickback.notes),
      notes: extractAdditionalNotes(kickback.notes),
    });

    setJobSearch(job?.job_number ?? "");
    setJobDropdownOpen(false);
    setMessage(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingKickback(null);
    setFormData(getInitialFormData());
    setJobSearch("");
    setJobDropdownOpen(false);
  };

  const handleChange = (
    field: keyof KickbackFormData,
    value: string
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const selectJob = (job: Job) => {
    setFormData((current) => ({
      ...current,
      job_id: job.id,
    }));

    setJobSearch(job.job_number);
    setJobDropdownOpen(false);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.job_id) {
      setMessage({
        type: "error",
        text: "Please select a job.",
      });
      return;
    }

    if (!formData.description.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a description.",
      });
      return;
    }

    const amount = Number(formData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage({
        type: "error",
        text: "Please enter a valid kickback amount.",
      });
      return;
    }

    if (!formData.transaction_date) {
      setMessage({
        type: "error",
        text: "Please select a date.",
      });
      return;
    }

    const job = jobMap.get(formData.job_id);

    if (!job) {
      setMessage({
        type: "error",
        text: "The selected job could not be found.",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const reference = job.job_number;

      const payload = {
        transaction_date: formData.transaction_date,
        reference,
        description: formData.description.trim(),
        amount,
        type: "kickback",
        customer_id: job.customer_id || null,
        job_id: job.id,
        notes: buildStoredNotes(
          formData.reason,
          formData.notes
        ) || null,
      };

      if (editingKickback) {
        const { error } = await supabase
          .from("financial_transactions")
          .update(payload)
          .eq("id", editingKickback.id);

        if (error) {
          throw error;
        }

        setMessage({
          type: "success",
          text: "Kickback updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("financial_transactions")
          .insert(payload);

        if (error) {
          throw error;
        }

        setMessage({
          type: "success",
          text: "Kickback added successfully.",
        });
      }

      await loadData();

      setTimeout(() => {
        setModalOpen(false);
        setEditingKickback(null);
        setFormData(getInitialFormData());
        setJobSearch("");
        setJobDropdownOpen(false);
        setMessage(null);
      }, 700);
    } catch (error) {
      console.error("Error saving kickback:", error);

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to save kickback.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this kickback?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setMessage(null);

      const { error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", id)
        .eq("type", "kickback");

      if (error) {
        throw error;
      }

      setKickbacks((current) =>
        current.filter((kickback) => kickback.id !== id)
      );

      setMessage({
        type: "success",
        text: "Kickback deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting kickback:", error);

      setMessage({
        type: "error",
        text: "Unable to delete kickback.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardShell
      title="Kickback"
      subtitle="Track job-related kickbacks and credits"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">
              Kickback
            </h1>

            <p className="mt-1 text-sm text-charcoal-500 dark:text-charcoal-400">
              Record kickbacks against the jobs they relate to.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4" />
            Add Kickback
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">
                  Total Kickbacks
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalKickbacks)}
                </p>
              </div>

              <div className="rounded-xl bg-red-100 p-3 dark:bg-red-950/40">
                <CircleDollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">
                  Kickback Transactions
                </p>

                <p className="mt-2 text-2xl font-bold text-charcoal-900 dark:text-white">
                  {filteredKickbacks.length}
                </p>
              </div>

              <div className="rounded-xl bg-cyan-100 p-3 dark:bg-cyan-950/40">
                <FileText className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-charcoal-200 bg-white p-4 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search job, customer, reference or description..."
                className="w-full rounded-xl border border-charcoal-200 bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal-900 outline-none transition placeholder:text-charcoal-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
              />
            </div>

            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

              <input
                type="month"
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(event.target.value)
                }
                className="rounded-xl border border-charcoal-200 bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && !modalOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}

              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-charcoal-200 bg-white shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
          <div className="border-b border-charcoal-200 px-5 py-4 dark:border-charcoal-800">
            <h2 className="font-semibold text-charcoal-900 dark:text-white">
              Kickback Transactions
            </h2>

            <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
              {filteredKickbacks.length} transaction
              {filteredKickbacks.length === 1 ? "" : "s"} found
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-cyan-600" />
            </div>
          ) : filteredKickbacks.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full bg-charcoal-100 p-4 dark:bg-charcoal-800">
                <FileText className="h-7 w-7 text-charcoal-400" />
              </div>

              <h3 className="mt-4 font-semibold text-charcoal-900 dark:text-white">
                No kickbacks found
              </h3>

              <p className="mt-1 max-w-md text-sm text-charcoal-500 dark:text-charcoal-400">
                There are no kickbacks matching the selected month and
                search criteria.
              </p>

              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4" />
                Add Kickback
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-charcoal-200 bg-charcoal-50 text-left dark:border-charcoal-800 dark:bg-charcoal-950/50">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Job
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Description
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
                  {filteredKickbacks.map((kickback) => {
                    const job = kickback.job_id
                      ? jobMap.get(kickback.job_id)
                      : null;

                    return (
                      <tr
                        key={kickback.id}
                        className="transition hover:bg-charcoal-50 dark:hover:bg-charcoal-950/50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-charcoal-600 dark:text-charcoal-300">
                          {formatDate(kickback.transaction_date)}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-charcoal-900 dark:text-white">
                            {job?.job_number ??
                              kickback.reference}
                          </p>

                          {job?.job_type && (
                            <p className="mt-1 text-xs text-charcoal-400">
                              {job.job_type}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-charcoal-600 dark:text-charcoal-300">
                          {job?.customer?.company_name ??
                            job?.customer?.trading_name ??
                            "—"}
                        </td>

                        <td className="max-w-[280px] px-5 py-4">
                          <p className="truncate text-sm font-medium text-charcoal-900 dark:text-white">
                            {kickback.description}
                          </p>

                          {extractReason(kickback.notes) && (
                            <p className="mt-1 truncate text-xs text-charcoal-400">
                              {extractReason(kickback.notes)}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(
                            Number(kickback.amount || 0)
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(kickback)
                              }
                              className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-cyan-600 dark:hover:bg-charcoal-800"
                              title="Edit kickback"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(kickback.id)
                              }
                              disabled={
                                deletingId === kickback.id
                              }
                              className="rounded-lg p-2 text-charcoal-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30"
                              title="Delete kickback"
                            >
                              {deletingId === kickback.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-charcoal-900"
            >
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-charcoal-200 bg-white px-6 py-4 dark:border-charcoal-800 dark:bg-charcoal-900">
                <div>
                  <h2 className="text-lg font-bold text-charcoal-900 dark:text-white">
                    {editingKickback
                      ? "Edit Kickback"
                      : "Add Kickback"}
                  </h2>

                  <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
                    Link the kickback directly to an existing job.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100 hover:text-charcoal-900 disabled:opacity-50 dark:hover:bg-charcoal-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleSave}
                className="space-y-5 p-6"
              >
                {message && (
                  <div
                    className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                      message.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                    }`}
                  >
                    {message.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}

                    {message.text}
                  </div>
                )}

                {/* Job Search */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                    Job / Kickback Ref *
                  </label>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                    <input
                      type="text"
                      value={jobSearch}
                      onChange={(event) => {
                        setJobSearch(event.target.value);
                        setJobDropdownOpen(true);

                        if (!event.target.value) {
                          setFormData((current) => ({
                            ...current,
                            job_id: "",
                          }));
                        }
                      }}
                      onFocus={() => setJobDropdownOpen(true)}
                      placeholder="Search job number or customer..."
                      className="w-full rounded-xl border border-charcoal-200 bg-white py-2.5 pl-10 pr-10 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />

                    <ChevronDown
                      className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400 transition ${
                        jobDropdownOpen ? "rotate-180" : ""
                      }`}
                    />

                    {jobDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-charcoal-200 bg-white shadow-xl dark:border-charcoal-700 dark:bg-charcoal-900">
                        {jobsLoading ? (
                          <div className="flex items-center justify-center p-5">
                            <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
                          </div>
                        ) : filteredJobs.length === 0 ? (
                          <div className="p-5 text-center text-sm text-charcoal-500">
                            No matching jobs found.
                          </div>
                        ) : (
                          filteredJobs.map((job) => (
                            <button
                              key={job.id}
                              type="button"
                              onClick={() => selectJob(job)}
                              className="w-full border-b border-charcoal-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-charcoal-50 dark:border-charcoal-800 dark:hover:bg-charcoal-800"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-charcoal-900 dark:text-white">
                                    {job.job_number}
                                  </p>

                                  <p className="mt-0.5 truncate text-sm text-charcoal-600 dark:text-charcoal-300">
                                    {job.customer?.company_name ??
                                      job.customer?.trading_name ??
                                      "No customer"}
                                  </p>

                                  {job.job_type && (
                                    <p className="mt-0.5 text-xs text-charcoal-400">
                                      {job.job_type}
                                    </p>
                                  )}
                                </div>

                                {formData.job_id === job.id && (
                                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan-600" />
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Job */}
                {selectedJob && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900/50 dark:bg-cyan-950/20"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
                          Job
                        </p>

                        <p className="mt-1 text-sm font-semibold text-charcoal-900 dark:text-white">
                          {selectedJob.job_number}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
                          Customer
                        </p>

                        <p className="mt-1 text-sm font-semibold text-charcoal-900 dark:text-white">
                          {selectedJob.customer?.company_name ??
                            selectedJob.customer?.trading_name ??
                            "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
                          Job Type
                        </p>

                        <p className="mt-1 text-sm font-semibold text-charcoal-900 dark:text-white">
                          {selectedJob.job_type ?? "—"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Date */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Date *
                    </label>

                    <input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(event) =>
                        handleChange(
                          "transaction_date",
                          event.target.value
                        )
                      }
                      required
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-2.5 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Kickback Amount *
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-charcoal-400">
                        R
                      </span>

                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(event) =>
                          handleChange(
                            "amount",
                            event.target.value
                          )
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                        className="w-full rounded-xl border border-charcoal-200 bg-white py-2.5 pl-9 pr-4 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Description *
                    </label>

                    <input
                      type="text"
                      value={formData.description}
                      onChange={(event) =>
                        handleChange(
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Customer referral kickback"
                      required
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-2.5 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>

                  {/* Reason */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Reason
                    </label>

                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(event) =>
                        handleChange(
                          "reason",
                          event.target.value
                        )
                      }
                      placeholder="Reason for the kickback"
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-2.5 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Notes
                    </label>

                    <textarea
                      value={formData.notes}
                      onChange={(event) =>
                        handleChange(
                          "notes",
                          event.target.value
                        )
                      }
                      rows={3}
                      placeholder="Additional notes..."
                      className="w-full resize-none rounded-xl border border-charcoal-200 bg-white px-4 py-2.5 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse gap-3 border-t border-charcoal-200 pt-5 sm:flex-row sm:justify-end dark:border-charcoal-800">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-charcoal-200 px-5 py-2.5 text-sm font-semibold text-charcoal-700 transition hover:bg-charcoal-50 disabled:opacity-50 dark:border-charcoal-700 dark:text-charcoal-300 dark:hover:bg-charcoal-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {editingKickback
                      ? "Update Kickback"
                      : "Save Kickback"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}