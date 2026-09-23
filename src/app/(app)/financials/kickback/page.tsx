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

interface KickbackItem {
  id: string;
  kickback_id: string;
  description: string;
  rate_per_kg: number;
  quantity_kg: number;
  line_total: number;
  created_at: string;
}

interface KickbackFormItem {
  id?: string;
  description: string;
  rate_per_kg: string;
  quantity_kg: string;
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
  items: KickbackItem[];
}

interface KickbackFormData {
  transaction_date: string;
  job_id: string;
  items: KickbackFormItem[];
  reason: string;
  notes: string;
}

interface SupabaseErrorLike {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
  status?: number;
  statusCode?: number;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentMonth() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
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

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getInitialItem(): KickbackFormItem {
  return {
    description: "",
    rate_per_kg: "",
    quantity_kg: "",
  };
}

function getInitialFormData(): KickbackFormData {
  return {
    transaction_date: getToday(),
    job_id: "",
    items: [getInitialItem()],
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

function getLineTotal(item: KickbackFormItem) {
  const rate = Number(item.rate_per_kg);
  const quantity = Number(item.quantity_kg);

  if (!Number.isFinite(rate) || !Number.isFinite(quantity)) {
    return 0;
  }

  return roundCurrency(rate * quantity);
}

function getKickbackDescription(kickback: KickbackTransaction) {
  if (kickback.items.length > 0) {
    const descriptions = kickback.items
      .map((item) => item.description.trim())
      .filter(Boolean);

    if (descriptions.length > 0) {
      return descriptions.join(", ");
    }
  }

  return kickback.description;
}

function getSupabaseErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const supabaseError = error as SupabaseErrorLike;

    const parts = [
      supabaseError.message,
      supabaseError.details,
      supabaseError.hint,
      supabaseError.code
        ? `Code: ${supabaseError.code}`
        : undefined,
      supabaseError.status
        ? `Status: ${supabaseError.status}`
        : undefined,
      supabaseError.statusCode
        ? `Status Code: ${supabaseError.statusCode}`
        : undefined,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" — ");
    }

    try {
      const stringified = JSON.stringify(error);

      if (stringified && stringified !== "{}") {
        return stringified;
      }
    } catch {
      // Ignore.
    }
  }

  return "Unable to save kickback.";
}

export default function KickbackPage() {
  const supabase = createClient();

  const [kickbacks, setKickbacks] = useState<KickbackTransaction[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [formData, setFormData] =
    useState<KickbackFormData>(getInitialFormData());

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [jobsResult, kickbacksResult, itemsResult] =
        await Promise.all([
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
            .order("created_at", {
              ascending: false,
            }),

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
            .order("transaction_date", {
              ascending: false,
            })
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("kickback_items")
            .select(
              `
                id,
                kickback_id,
                description,
                rate_per_kg,
                quantity_kg,
                line_total,
                created_at
              `
            )
            .order("created_at", {
              ascending: true,
            }),
        ]);

      if (jobsResult.error) {
        throw new Error(
          `Loading jobs failed: ${getSupabaseErrorMessage(
            jobsResult.error
          )}`
        );
      }

      if (kickbacksResult.error) {
        throw new Error(
          `Loading kickbacks failed: ${getSupabaseErrorMessage(
            kickbacksResult.error
          )}`
        );
      }

      if (itemsResult.error) {
        throw new Error(
          `Loading kickback items failed: ${getSupabaseErrorMessage(
            itemsResult.error
          )}`
        );
      }

      const loadedJobs =
        (jobsResult.data ?? []) as unknown as Job[];

      const loadedKickbacks =
        (kickbacksResult.data ?? []) as KickbackTransaction[];

      const loadedItems =
        (itemsResult.data ?? []) as unknown as KickbackItem[];

      const itemsByKickback = new Map<
        string,
        KickbackItem[]
      >();

      for (const item of loadedItems) {
        const existing =
          itemsByKickback.get(item.kickback_id) ?? [];

        existing.push({
          ...item,
          rate_per_kg: Number(item.rate_per_kg) || 0,
          quantity_kg: Number(item.quantity_kg) || 0,
          line_total: Number(item.line_total) || 0,
        });

        itemsByKickback.set(item.kickback_id, existing);
      }

      const normalizedKickbacks =
        loadedKickbacks.map((kickback) => ({
          ...kickback,
          amount: Number(kickback.amount) || 0,
          items:
            itemsByKickback.get(kickback.id) ?? [],
        }));

      setJobs(loadedJobs);
      setKickbacks(normalizedKickbacks);
    } catch (error) {
      const message = getSupabaseErrorMessage(error);

      console.error("KICKBACK LOAD FAILED:", message);

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  const filteredKickbacks = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return kickbacks.filter((kickback) => {
      if (
        selectedMonth &&
        !kickback.transaction_date.startsWith(
          selectedMonth
        )
      ) {
        return false;
      }

      if (!searchTerm) return true;

      const job = jobs.find(
        (item) => item.id === kickback.job_id
      );

      const searchableText = [
        kickback.reference,
        kickback.description,
        kickback.notes ?? "",
        job?.job_number ?? "",
        job?.customer?.company_name ?? "",
        job?.customer?.trading_name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [
    kickbacks,
    jobs,
    search,
    selectedMonth,
  ]);

  const grandTotal = useMemo(() => {
    return roundCurrency(
      formData.items.reduce(
        (total, item) =>
          total + getLineTotal(item),
        0
      )
    );
  }, [formData.items]);

  const totalKickbacks = useMemo(
    () =>
      kickbacks.reduce(
        (total, kickback) =>
          total + Number(kickback.amount || 0),
        0
      ),
    [kickbacks]
  );

  const currentMonthTotal = useMemo(
    () =>
      kickbacks
        .filter((kickback) =>
          kickback.transaction_date.startsWith(
            getCurrentMonth()
          )
        )
        .reduce(
          (total, kickback) =>
            total + Number(kickback.amount || 0),
          0
        ),
    [kickbacks]
  );

  function resetForm() {
    setEditingId(null);

    setFormData({
      ...getInitialFormData(),
      transaction_date: getToday(),
    });
  }

  function openNewModal() {
    setErrorMessage("");
    setSuccessMessage("");
    resetForm();
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setErrorMessage("");
    resetForm();
  }

  function openEditModal(kickback: KickbackTransaction) {
    setErrorMessage("");
    setSuccessMessage("");

    let items = kickback.items;

    if (items.length === 0) {
      items = [
        {
          id: "",
          kickback_id: kickback.id,
          description:
            kickback.description || "Kickback",
          rate_per_kg: Number(kickback.amount) || 0,
          quantity_kg: 1,
          line_total:
            Number(kickback.amount) || 0,
          created_at: kickback.created_at,
        },
      ];
    }

    setEditingId(kickback.id);

    setFormData({
      transaction_date:
        kickback.transaction_date || getToday(),

      job_id: kickback.job_id ?? "",

      items: items.map((item) => ({
        id: item.id,
        description: item.description,
        rate_per_kg: String(
          Number(item.rate_per_kg) || 0
        ),
        quantity_kg: String(
          Number(item.quantity_kg) || 0
        ),
      })),

      reason: extractReason(kickback.notes),
      notes: extractAdditionalNotes(kickback.notes),
    });

    setShowModal(true);
  }

  function addItem() {
    setFormData((current) => ({
      ...current,
      items: [
        ...current.items,
        getInitialItem(),
      ],
    }));
  }

  function removeItem(index: number) {
    setFormData((current) => {
      if (current.items.length === 1) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
      };
    });
  }

  function updateItem(
    index: number,
    field: keyof KickbackFormItem,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      items: current.items.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      ),
    }));
  }

  async function handleSave() {
    if (saving) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("KICKBACK AUTH CHECK:", {
        userId: user?.id ?? null,
        email: user?.email ?? null,
        hasUser: Boolean(user),
        userError,
      });

      if (userError) {
        throw new Error(
          `Authentication check failed: ${getSupabaseErrorMessage(
            userError
          )}`
        );
      }

      if (!user) {
        throw new Error(
          "You are not currently authenticated in Supabase. Please sign out and sign in again before saving the kickback."
        );
      }

      if (!formData.transaction_date) {
        throw new Error(
          "Please select a kickback date."
        );
      }

      if (!formData.job_id) {
        throw new Error("Please select a job.");
      }

      if (formData.items.length === 0) {
        throw new Error(
          "Please add at least one kickback line item."
        );
      }

      for (
        let index = 0;
        index < formData.items.length;
        index++
      ) {
        const item = formData.items[index];

        if (!item.description.trim()) {
          throw new Error(
            `Please enter a description for line ${
              index + 1
            }.`
          );
        }

        const rate = Number(item.rate_per_kg);
        const quantity = Number(item.quantity_kg);

        if (!Number.isFinite(rate) || rate < 0) {
          throw new Error(
            `Please enter a valid price per kg for line ${
              index + 1
            }.`
          );
        }

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          throw new Error(
            `Please enter a quantity greater than 0 for line ${
              index + 1
            }.`
          );
        }
      }

      if (grandTotal <= 0) {
        throw new Error(
          "The kickback total must be greater than R0.00."
        );
      }

      const selectedJob = jobs.find(
        (job) => job.id === formData.job_id
      );

      if (!selectedJob) {
        throw new Error(
          "The selected job could not be found. Please refresh the page and try again."
        );
      }

      const storedNotes = buildStoredNotes(
        formData.reason,
        formData.notes
      );

      const description =
        formData.items
          .map((item) =>
            item.description.trim()
          )
          .filter(Boolean)
          .join(", ") || "Kickback";

      /*
       * KICKBACK REFERENCE NUMBER
       *
       * Editing:
       * Keep the existing reference.
       *
       * New kickback:
       * Find the highest existing KB-### number
       * and create the next number.
       *
       * Example:
       * KB-001
       * KB-002
       * KB-003
       * Next = KB-004
       */
      let reference: string;

      if (editingId) {
        reference =
          kickbacks.find(
            (kickback) =>
              kickback.id === editingId
          )?.reference ?? "KB-001";
      } else {
        const highestKickbackNumber =
          kickbacks.reduce(
            (highest, kickback) => {
              const match =
                kickback.reference?.match(
                  /^KB-(\d+)$/i
                );

              if (!match) {
                return highest;
              }

              const number = Number(match[1]);

              return Number.isFinite(number)
                ? Math.max(
                    highest,
                    number
                  )
                : highest;
            },
            0
          );

        const nextNumber =
          highestKickbackNumber + 1;

        reference = `KB-${String(
          nextNumber
        ).padStart(3, "0")}`;
      }

      const customerId =
        selectedJob.customer_id ?? null;

      const transactionPayload = {
        transaction_date:
          formData.transaction_date,
        type: "kickback",
        reference,
        description,
        amount: grandTotal,
        customer_id: customerId,
        job_id: formData.job_id,
        notes: storedNotes || null,
      };

      console.log(
        "KICKBACK TRANSACTION PAYLOAD:",
        transactionPayload
      );

      let kickbackId = editingId;

      if (editingId) {
        const { error: updateError } =
          await supabase
            .from("financial_transactions")
            .update(transactionPayload)
            .eq("id", editingId);

        if (updateError) {
          throw new Error(
            `Updating kickback failed: ${getSupabaseErrorMessage(
              updateError
            )}`
          );
        }
      } else {
        const {
          data: insertedKickback,
          error: insertError,
        } = await supabase
          .from("financial_transactions")
          .insert(transactionPayload)
          .select("id")
          .single();

        if (insertError) {
          throw new Error(
            `Creating kickback failed: ${getSupabaseErrorMessage(
              insertError
            )}`
          );
        }

        if (!insertedKickback?.id) {
          throw new Error(
            "Kickback was created but Supabase did not return the kickback ID."
          );
        }

        kickbackId = insertedKickback.id;
      }

      if (!kickbackId) {
        throw new Error(
          "No kickback ID was available for saving the line items."
        );
      }

      console.log(
        "KICKBACK TRANSACTION SAVED:",
        {
          kickbackId,
          userId: user.id,
        }
      );

      if (editingId) {
        const { error: deleteError } =
          await supabase
            .from("kickback_items")
            .delete()
            .eq("kickback_id", kickbackId);

        if (deleteError) {
          throw new Error(
            `Deleting old kickback items failed: ${getSupabaseErrorMessage(
              deleteError
            )}`
          );
        }
      }

      const itemsPayload = formData.items.map(
        (item) => ({
          kickback_id: kickbackId,
          description:
            item.description.trim(),
          rate_per_kg: Number(
            item.rate_per_kg
          ),
          quantity_kg: Number(
            item.quantity_kg
          ),
          line_total: getLineTotal(item),
        })
      );

      console.log(
        "KICKBACK ITEMS PAYLOAD:",
        itemsPayload
      );

      console.log(
        "KICKBACK ITEMS INSERT AUTH:",
        {
          userId: user.id,
          email: user.email,
          itemCount:
            itemsPayload.length,
        }
      );

      const {
        data: insertedItems,
        error: itemsError,
      } = await supabase
        .from("kickback_items")
        .insert(itemsPayload)
        .select(
          "id, kickback_id, description, rate_per_kg, quantity_kg, line_total, created_at"
        );

      if (itemsError) {
        console.error(
          "KICKBACK ITEMS INSERT FAILED:",
          {
            error: itemsError,
            message: itemsError.message,
            details: itemsError.details,
            hint: itemsError.hint,
            code: itemsError.code,
            userId: user.id,
            email: user.email,
            role: "authenticated expected",
            payload: itemsPayload,
          }
        );

        throw new Error(
          `Saving kickback items failed: ${getSupabaseErrorMessage(
            itemsError
          )}`
        );
      }

      console.log(
        "KICKBACK ITEMS SAVED:",
        insertedItems
      );

      setSuccessMessage(
        editingId
          ? "Kickback updated successfully."
          : "Kickback saved successfully."
      );

      setShowModal(false);
      resetForm();

      await loadData();

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (error) {
      const message =
        getSupabaseErrorMessage(error);

      console.error(
        "KICKBACK SAVE FAILED:",
        message
      );

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    kickback: KickbackTransaction
  ) {
    const confirmed = window.confirm(
      `Delete kickback ${kickback.reference}? This will also remove all of its line items.`
    );

    if (!confirmed) return;

    try {
      setErrorMessage("");
      setSuccessMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "You are not authenticated. Please sign in again."
        );
      }

      const { error: deleteError } =
        await supabase
          .from("financial_transactions")
          .delete()
          .eq("id", kickback.id);

      if (deleteError) {
        throw new Error(
          `Deleting kickback failed: ${getSupabaseErrorMessage(
            deleteError
          )}`
        );
      }

      setSuccessMessage(
        "Kickback deleted successfully."
      );

      await loadData();

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (error) {
      const message =
        getSupabaseErrorMessage(error);

      console.error(
        "KICKBACK DELETE FAILED:",
        message
      );

      setErrorMessage(message);
    }
  }

  return (
    <DashboardShell
      title="Kickbacks"
      subtitle="Manage customer kickbacks and credit adjustments"
    >
      <div className="space-y-6">
        {/* SUCCESS */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />

              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ERROR */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div className="flex-1">
                <div className="font-semibold">
                  Error
                </div>

                <div className="mt-1">
                  {errorMessage}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setErrorMessage("")
                }
                className="rounded-lg p-1 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500">
                  Total Kickbacks
                </p>

                <p className="mt-2 text-2xl font-bold text-charcoal-900">
                  {formatCurrency(
                    totalKickbacks
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-cyan-50 p-3">
                <CircleDollarSign className="h-6 w-6 text-cyan-500" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500">
                  This Month
                </p>

                <p className="mt-2 text-2xl font-bold text-charcoal-900">
                  {formatCurrency(
                    currentMonthTotal
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-cyan-50 p-3">
                <Calendar className="h-6 w-6 text-cyan-500" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500">
                  Number of Kickbacks
                </p>

                <p className="mt-2 text-2xl font-bold text-charcoal-900">
                  {kickbacks.length}
                </p>
              </div>

              <div className="rounded-xl bg-cyan-50 p-3">
                <FileText className="h-6 w-6 text-cyan-500" />
              </div>
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col gap-4 rounded-2xl border border-charcoal-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search kickbacks, jobs or customers..."
                className="w-full rounded-xl border border-charcoal-200 bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal-900 outline-none transition placeholder:text-charcoal-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
              />
            </div>

            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

              <input
                type="month"
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(
                    event.target.value
                  )
                }
                className="rounded-xl border border-charcoal-200 bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600"
          >
            <Plus className="h-4 w-4" />

            New Kickback
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-charcoal-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="border-b border-charcoal-200 bg-charcoal-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                    Reference
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                    Job
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                    Description
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-charcoal-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center"
                    >
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-500" />

                      <p className="mt-3 text-sm text-charcoal-500">
                        Loading kickbacks...
                      </p>
                    </td>
                  </tr>
                ) : filteredKickbacks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center"
                    >
                      <FileText className="mx-auto h-8 w-8 text-charcoal-300" />

                      <p className="mt-3 text-sm font-medium text-charcoal-700">
                        No kickbacks found
                      </p>

                      <p className="mt-1 text-xs text-charcoal-400">
                        Create a new kickback to get started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredKickbacks.map(
                    (kickback) => {
                      const job =
                        jobs.find(
                          (item) =>
                            item.id ===
                            kickback.job_id
                        );

                      return (
                        <tr
                          key={kickback.id}
                          className="transition hover:bg-charcoal-50"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-charcoal-600">
                            {formatDate(
                              kickback.transaction_date
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="font-medium text-charcoal-900">
                              {
                                kickback.reference
                              }
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-cyan-600">
                            {job?.job_number ??
                              "—"}
                          </td>

                          <td className="px-5 py-4">
                            <div className="max-w-[220px]">
                              <div className="truncate text-sm font-medium text-charcoal-900">
                                {job
                                  ?.customer
                                  ?.company_name ??
                                  "—"}
                              </div>

                              {job?.customer
                                ?.trading_name && (
                                <div className="truncate text-xs text-charcoal-400">
                                  {
                                    job
                                      .customer
                                      .trading_name
                                  }
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="max-w-[260px] truncate text-sm text-charcoal-600">
                              {getKickbackDescription(
                                kickback
                              )}
                            </div>

                            {kickback.items
                              .length > 0 && (
                              <div className="mt-1 text-xs text-charcoal-400">
                                {
                                  kickback
                                    .items
                                    .length
                                }{" "}
                                line{" "}
                                {kickback
                                  .items
                                  .length ===
                                1
                                  ? "item"
                                  : "items"}
                              </div>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <span className="font-semibold text-cyan-600">
                              {formatCurrency(
                                Number(
                                  kickback.amount
                                ) || 0
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    kickback
                                  )
                                }
                                className="rounded-lg border border-charcoal-200 p-2 text-charcoal-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600"
                                title="Edit"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleDelete(
                                    kickback
                                  )
                                }
                                className="rounded-lg border border-charcoal-200 p-2 text-charcoal-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.97,
              }}
              className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-charcoal-200 bg-white shadow-2xl"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-charcoal-200 bg-white px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-charcoal-900">
                    {editingId
                      ? "Edit Kickback"
                      : "New Kickback"}
                  </h2>

                  <p className="mt-1 text-sm text-charcoal-500">
                    Add the kickback details and line items.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl p-2 text-charcoal-400 transition hover:bg-charcoal-100 hover:text-charcoal-700 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* BODY */}
              <div className="overflow-y-auto bg-white px-6 py-6">
                <div className="space-y-6">
                  {/* DETAILS */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-600">
                      Kickback Details
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-charcoal-700">
                          Date
                        </label>

                        <input
                          type="date"
                          value={
                            formData.transaction_date
                          }
                          onChange={(event) =>
                            setFormData(
                              (current) => ({
                                ...current,
                                transaction_date:
                                  event.target
                                    .value,
                              })
                            )
                          }
                          className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-charcoal-700">
                          Job
                          <span className="ml-1 text-red-500">
                            *
                          </span>
                        </label>

                        <div className="relative">
                          <select
                            value={
                              formData.job_id
                            }
                            onChange={(event) =>
                              setFormData(
                                (current) => ({
                                  ...current,
                                  job_id:
                                    event.target
                                      .value,
                                })
                              )
                            }
                            className="w-full appearance-none rounded-xl border border-charcoal-200 bg-white px-4 py-3 pr-10 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                          >
                            <option value="">
                              Select a job...
                            </option>

                            {jobs.map(
                              (job) => (
                                <option
                                  key={job.id}
                                  value={
                                    job.id
                                  }
                                >
                                  {job.job_number}
                                  {job.customer
                                    ? ` — ${job.customer.company_name}`
                                    : ""}
                                </option>
                              )
                            )}
                          </select>

                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
                        </div>
                      </div>
                    </div>

                    {formData.job_id && (
                      <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                        {(() => {
                          const selectedJob =
                            jobs.find(
                              (job) =>
                                job.id ===
                                formData.job_id
                            );

                          if (!selectedJob) {
                            return null;
                          }

                          return (
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                              <div>
                                <span className="text-charcoal-500">
                                  Job:
                                </span>{" "}
                                <span className="font-medium text-cyan-600">
                                  {
                                    selectedJob.job_number
                                  }
                                </span>
                              </div>

                              <div>
                                <span className="text-charcoal-500">
                                  Customer:
                                </span>{" "}
                                <span className="font-medium text-charcoal-900">
                                  {selectedJob
                                    .customer
                                    ?.company_name ??
                                    "No customer"}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* LINE ITEMS */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-600">
                          Kickback Line Items
                        </h3>

                        <p className="mt-1 text-xs text-charcoal-400">
                          Add each kickback item with its price per kg and quantity.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={addItem}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-600 transition hover:bg-cyan-100 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />

                        Add Line
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-charcoal-200">
                      <div className="hidden grid-cols-[1fr_150px_150px_150px_48px] gap-3 border-b border-charcoal-200 bg-charcoal-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-500 md:grid">
                        <div>
                          Description
                        </div>

                        <div>
                          Price / kg
                        </div>

                        <div>
                          Quantity kg
                        </div>

                        <div className="text-right">
                          Line Total
                        </div>

                        <div />
                      </div>

                      <div className="divide-y divide-charcoal-100">
                        {formData.items.map(
                          (
                            item,
                            index
                          ) => {
                            const lineTotal =
                              getLineTotal(
                                item
                              );

                            return (
                              <div
                                key={
                                  item.id ??
                                  `new-${index}`
                                }
                                className="grid grid-cols-1 gap-4 bg-white p-4 md:grid-cols-[1fr_150px_150px_150px_48px] md:items-center md:gap-3"
                              >
                                <div>
                                  <label className="mb-2 block text-xs font-medium text-charcoal-500 md:hidden">
                                    Description
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      item.description
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateItem(
                                        index,
                                        "description",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="e.g. General waste kickback"
                                    disabled={
                                      saving
                                    }
                                    className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none placeholder:text-charcoal-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-50"
                                  />
                                </div>

                                <div>
                                  <label className="mb-2 block text-xs font-medium text-charcoal-500 md:hidden">
                                    Price / kg
                                  </label>

                                  <div className="relative">
                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-charcoal-400">
                                      R
                                    </span>

                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={
                                        item.rate_per_kg
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateItem(
                                          index,
                                          "rate_per_kg",
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      placeholder="0.00"
                                      disabled={
                                        saving
                                      }
                                      className="w-full rounded-lg border border-charcoal-200 bg-white py-2.5 pl-7 pr-3 text-right text-sm text-charcoal-900 outline-none placeholder:text-charcoal-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-50"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-2 block text-xs font-medium text-charcoal-500 md:hidden">
                                    Quantity kg
                                  </label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={
                                      item.quantity_kg
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateItem(
                                        index,
                                        "quantity_kg",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="0.000"
                                    disabled={
                                      saving
                                    }
                                    className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-right text-sm text-charcoal-900 outline-none placeholder:text-charcoal-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-50"
                                  />
                                </div>

                                <div>
                                  <label className="mb-2 block text-xs font-medium text-charcoal-500 md:hidden">
                                    Line Total
                                  </label>

                                  <div className="rounded-lg border border-charcoal-200 bg-charcoal-50 px-3 py-2.5 text-right text-sm font-semibold text-cyan-600">
                                    {formatCurrency(
                                      lineTotal
                                    )}
                                  </div>
                                </div>

                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItem(
                                        index
                                      )
                                    }
                                    disabled={
                                      saving ||
                                      formData
                                        .items
                                        .length ===
                                        1
                                    }
                                    className="rounded-lg border border-charcoal-200 p-2 text-charcoal-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                                    title="Remove line"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>

                      {/* GRAND TOTAL */}
                      <div className="flex items-center justify-between border-t border-charcoal-200 bg-charcoal-50 px-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-charcoal-900">
                            Grand Total
                          </p>

                          <p className="text-xs text-charcoal-400">
                            {formData.items.length}{" "}
                            {formData.items.length ===
                            1
                              ? "line item"
                              : "line items"}
                          </p>
                        </div>

                        <div className="text-2xl font-bold text-cyan-600">
                          {formatCurrency(
                            grandTotal
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ADDITIONAL INFORMATION */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-600">
                      Additional Information
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-charcoal-700">
                          Reason
                        </label>

                        <input
                          type="text"
                          value={
                            formData.reason
                          }
                          onChange={(event) =>
                            setFormData(
                              (current) => ({
                                ...current,
                                reason:
                                  event.target
                                    .value,
                              })
                            )
                          }
                          placeholder="Reason for kickback"
                          disabled={saving}
                          className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm text-charcoal-900 outline-none placeholder:text-charcoal-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-charcoal-700">
                          Notes
                        </label>

                        <input
                          type="text"
                          value={
                            formData.notes
                          }
                          onChange={(event) =>
                            setFormData(
                              (current) => ({
                                ...current,
                                notes:
                                  event.target
                                    .value,
                              })
                            )
                          }
                          placeholder="Additional notes"
                          disabled={saving}
                          className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm text-charcoal-900 outline-none placeholder:text-charcoal-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex flex-col-reverse gap-3 border-t border-charcoal-200 bg-charcoal-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-charcoal-500">
                  Total:{" "}
                  <span className="font-bold text-cyan-600">
                    {formatCurrency(
                      grandTotal
                    )}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-charcoal-200 bg-white px-5 py-2.5 text-sm font-semibold text-charcoal-600 transition hover:bg-charcoal-100 hover:text-charcoal-900 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleSave()
                    }
                    disabled={
                      saving ||
                      grandTotal <= 0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />

                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />

                        {editingId
                          ? "Update Kickback"
                          : "Save Kickback"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}