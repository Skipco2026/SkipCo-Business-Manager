"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  WalletCards,
  TrendingUp,
  CalendarDays,
  ReceiptText,
  Power,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const KickbackPDFDownloadButton = dynamic(
  () => import("@/components/kickbacks/kickback-pdf-download"),
  {
    ssr: false,
  }
);

interface Customer {
  id: string;
  company_name: string;
  trading_name?: string | null;
}

interface Job {
  id: string;
  job_number: string;
  job_type?: string | null;
  description?: string | null;
  customer_id?: string | null;
  customer?: Customer | null;
}

interface KickbackItemRow {
  id: string;
  kickback_id: string | null;
  description: string | null;
  rate_per_kg: number | null;
  quantity_kg: number | null;
  line_total: number | null;
  created_at: string;
}

interface KickbackJobRow {
  id: string;
  job_number: string | null;
  job_type: string | null;
  description: string | null;
  customer_id: string | null;
  customers: Customer | Customer[] | null;
}

interface KickbackRow {
  id: string;
  reference: string | null;
  transaction_date: string;
  description: string | null;
  amount: number | null;
  notes: string | null;
  vat_enabled: boolean | null;
  vat_rate: number | null;
  job_id: string | null;
  jobs: KickbackJobRow | KickbackJobRow[] | null;
}

interface JobRow {
  id: string;
  job_number: string | null;
  job_type: string | null;
  description: string | null;
  customer_id: string | null;
  customers: Customer | Customer[] | null;
}

interface KickbackItem {
  id?: string;
  description: string;
  rate_per_kg: number;
  quantity_kg: number;
  line_total: number;
}

interface Kickback {
  id: string;
  reference: string;
  transaction_date: string;
  description: string;
  amount: number;
  notes?: string | null;
  vat_enabled: boolean;
  vat_rate: number;
  job_id?: string | null;
  job?: Job | null;
  customer?: Customer | null;
  items: KickbackItem[];
}

interface FormItem {
  description: string;
  rate_per_kg: string;
  quantity_kg: string;
}

interface FormData {
  reference: string;
  transaction_date: string;
  description: string;
  amount: string;
  notes: string;
  job_id: string;
  vat_enabled: boolean;
  vat_rate: string;
}

const emptyForm: FormData = {
  reference: "",
  transaction_date: new Date().toISOString().split("T")[0],
  description: "",
  amount: "",
  notes: "",
  job_id: "",
  vat_enabled: false,
  vat_rate: "15",
};

const emptyItem: FormItem = {
  description: "",
  rate_per_kg: "",
  quantity_kg: "",
};

export default function KickbackPage() {
  const supabase = createClient();

  const [kickbacks, setKickbacks] = useState<Kickback[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);
  const [formItems, setFormItems] = useState<FormItem[]>([
    emptyItem,
  ]);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const { data: kickbackRows, error: kickbackError } =
        await supabase
          .from("financial_transactions")
          .select(
            `
              id,
              reference,
              transaction_date,
              description,
              amount,
              notes,
              vat_enabled,
              vat_rate,
              job_id,
              jobs (
                id,
                job_number,
                job_type,
                description,
                customer_id,
                customers (
                  id,
                  company_name,
                  trading_name
                )
              )
            `
          )
          .eq("type", "kickback")
          .order("transaction_date", { ascending: false });

      if (kickbackError) {
        throw kickbackError;
      }

      const { data: itemRows, error: itemError } =
        await supabase
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
          .order("created_at", { ascending: true });

      if (itemError) {
        throw itemError;
      }

      const itemMap = new Map<string, KickbackItem[]>();

      (itemRows || []).forEach((item: KickbackItemRow) => {
        const kickbackId = item.kickback_id;

        if (!kickbackId) return;

        if (!itemMap.has(kickbackId)) {
          itemMap.set(kickbackId, []);
        }

        itemMap.get(kickbackId)!.push({
          id: item.id,
          description: item.description || "",
          rate_per_kg: Number(item.rate_per_kg || 0),
          quantity_kg: Number(item.quantity_kg || 0),
          line_total: Number(item.line_total || 0),
        });
      });

      const formattedKickbacks: Kickback[] = (
        kickbackRows || []
      ).map((row: KickbackRow) => {
        const job = Array.isArray(row.jobs)
          ? row.jobs[0]
          : row.jobs;

        const customer = job?.customers
          ? Array.isArray(job.customers)
            ? job.customers[0]
            : job.customers
          : null;

        return {
          id: row.id,
          reference: row.reference || "",
          transaction_date: row.transaction_date,
          description: row.description || "",
          amount: Number(row.amount || 0),
          notes: row.notes || null,
          vat_enabled: row.vat_enabled === true,
          vat_rate: Number(row.vat_rate ?? 15),
          job_id: row.job_id || null,

          job: job
            ? {
                id: job.id,
                job_number: job.job_number || "",
                job_type: job.job_type || null,
                description: job.description || null,
                customer_id: job.customer_id || null,
                customer: customer || null,
              }
            : null,

          customer,

          items: itemMap.get(row.id) || [],
        };
      });

      setKickbacks(formattedKickbacks);

      const { data: jobRows, error: jobError } =
        await supabase
          .from("jobs")
          .select(
            `
              id,
              job_number,
              job_type,
              description,
              customer_id,
              customers (
                id,
                company_name,
                trading_name
              )
            `
          )
          .order("created_at", { ascending: false });

      if (!jobError) {
        const formattedJobs: Job[] = (jobRows || []).map(
          (row: JobRow) => {
            const customer = row.customers
              ? Array.isArray(row.customers)
                ? row.customers[0]
                : row.customers
              : null;

            return {
              id: row.id,
              job_number: row.job_number || "",
              job_type: row.job_type || null,
              description: row.description || null,
              customer_id: row.customer_id || null,
              customer,
            };
          }
        );

        setJobs(formattedJobs);
      }
    } catch (err) {
      console.error("Failed to load kickbacks:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load kickbacks."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /*
   * AUTOMATIC KICKBACK NUMBER
   *
   * Existing numbers:
   * KB-0001
   * KB-0002
   * KB-0003
   *
   * Next number:
   * KB-0004
   */
  function getNextKickbackNumber() {
    let highestNumber = 0;

    kickbacks.forEach((kickback) => {
      const match = kickback.reference
        .trim()
        .match(/^KB-(\d+)$/i);

      if (match) {
        const number = Number(match[1]);

        if (Number.isFinite(number)) {
          highestNumber = Math.max(
            highestNumber,
            number
          );
        }
      }
    });

    return `KB-${String(highestNumber + 1).padStart(
      4,
      "0"
    )}`;
  }

  function openAddModal() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      reference: getNextKickbackNumber(),
      transaction_date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setFormItems([{ ...emptyItem }]);

    setError(null);
    setMessage(null);
    setShowModal(true);
  }

  function openEditModal(kickback: Kickback) {
    setEditingId(kickback.id);

    setForm({
      reference: kickback.reference,
      transaction_date: kickback.transaction_date,
      description: kickback.description,
      amount: String(kickback.amount),
      notes: kickback.notes || "",
      job_id: kickback.job_id || "",
      vat_enabled: kickback.vat_enabled === true,
      vat_rate: String(kickback.vat_rate ?? 15),
    });

    /*
     * Load all existing items into the edit form.
     */
    if (kickback.items.length > 0) {
      setFormItems(
        kickback.items.map((item) => ({
          description: item.description || "",
          rate_per_kg: String(
            item.rate_per_kg ?? ""
          ),
          quantity_kg: String(
            item.quantity_kg ?? ""
          ),
        }))
      );
    } else {
      /*
       * Older kickbacks that don't have line items
       * still remain editable.
       */
      setFormItems([{ ...emptyItem }]);
    }

    setError(null);
    setMessage(null);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormItems([{ ...emptyItem }]);
  }

  function updateForm<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateItem(
    index: number,
    field: keyof FormItem,
    value: string
  ) {
    setFormItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function addItem() {
    setFormItems((current) => [
      ...current,
      { ...emptyItem },
    ]);
  }

  function removeItem(index: number) {
    setFormItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (_, itemIndex) => itemIndex !== index
      );
    });
  }

  const calculatedItems = useMemo(() => {
    return formItems.map((item) => {
      const quantity = Number(
        item.quantity_kg || 0
      );

      const rate = Number(
        item.rate_per_kg || 0
      );

      return {
        ...item,
        quantity,
        rate,
        total: quantity * rate,
      };
    });
  }, [formItems]);

  const calculatedItemsTotal = useMemo(() => {
    return calculatedItems.reduce(
      (sum, item) => sum + item.total,
      0
    );
  }, [calculatedItems]);

  useEffect(() => {
    if (!showModal) return;

    setForm((current) => ({
      ...current,
      amount: calculatedItemsTotal
        ? calculatedItemsTotal.toFixed(2)
        : current.amount,
    }));
  }, [calculatedItemsTotal, showModal]);

  async function saveKickback(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setMessage(null);

    if (!form.reference.trim()) {
      setError("Please enter a reference.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter a description.");
      return;
    }

    const validItems = formItems.filter(
      (item) =>
        item.description.trim() ||
        item.quantity_kg.trim() ||
        item.rate_per_kg.trim()
    );

    if (validItems.length === 0) {
      setError(
        "Please add at least one kickback item."
      );
      return;
    }

    for (let index = 0; index < validItems.length; index++) {
      const item = validItems[index];

      if (!item.description.trim()) {
        setError(
          `Please enter a description for item ${
            index + 1
          }.`
        );
        return;
      }

      const quantity = Number(
        item.quantity_kg
      );

      const rate = Number(item.rate_per_kg);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        setError(
          `Please enter a valid quantity for item ${
            index + 1
          }.`
        );
        return;
      }

      if (
        !Number.isFinite(rate) ||
        rate < 0
      ) {
        setError(
          `Please enter a valid rate for item ${
            index + 1
          }.`
        );
        return;
      }
    }

    const amount = validItems.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity_kg || 0) *
          Number(item.rate_per_kg || 0),
      0
    );

    const vatRate = Number(form.vat_rate);

    if (
      form.vat_enabled &&
      (!Number.isFinite(vatRate) || vatRate < 0)
    ) {
      setError("Please enter a valid VAT rate.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        reference: form.reference.trim(),
        transaction_date: form.transaction_date,
        description: form.description.trim(),
        amount,
        notes: form.notes.trim() || null,
        job_id: form.job_id || null,
        type: "kickback",
        vat_enabled: form.vat_enabled,
        vat_rate: form.vat_enabled
          ? vatRate
          : 15,
      };

      let transactionId = editingId;

      if (editingId) {
        const { error: updateError } =
          await supabase
            .from("financial_transactions")
            .update(payload)
            .eq("id", editingId)
            .eq("type", "kickback");

        if (updateError) {
          throw updateError;
        }

        /*
         * Remove the old items before saving
         * the new complete item list.
         */
        const { error: oldItemsError } =
          await supabase
            .from("kickback_items")
            .delete()
            .eq("kickback_id", editingId);

        if (oldItemsError) {
          throw oldItemsError;
        }
      } else {
        const { data, error: insertError } =
          await supabase
            .from("financial_transactions")
            .insert(payload)
            .select("id")
            .single();

        if (insertError) {
          throw insertError;
        }

        transactionId = data.id;
      }

      if (!transactionId) {
        throw new Error(
          "Could not determine the kickback ID."
        );
      }

      /*
       * Save ALL kickback items.
       */
      const itemPayload = validItems.map(
        (item) => {
          const quantity = Number(
            item.quantity_kg
          );

          const rate = Number(
            item.rate_per_kg
          );

          return {
            kickback_id: transactionId,
            description:
              item.description.trim(),
            rate_per_kg: rate,
            quantity_kg: quantity,
            line_total: quantity * rate,
          };
        }
      );

      const { error: itemInsertError } =
        await supabase
          .from("kickback_items")
          .insert(itemPayload);

      if (itemInsertError) {
        throw itemInsertError;
      }

      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      setFormItems([{ ...emptyItem }]);

      await loadData();

      setMessage(
        editingId
          ? "Kickback updated successfully."
          : "Kickback added successfully."
      );
    } catch (err) {
      console.error(
        "Failed to save kickback:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not save the kickback."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteKickback(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this kickback?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError(null);
    setMessage(null);

    try {
      const { error: itemDeleteError } =
        await supabase
          .from("kickback_items")
          .delete()
          .eq("kickback_id", id);

      if (itemDeleteError) {
        throw itemDeleteError;
      }

      const { error: deleteError } =
        await supabase
          .from("financial_transactions")
          .delete()
          .eq("id", id)
          .eq("type", "kickback");

      if (deleteError) {
        throw deleteError;
      }

      await loadData();

      setMessage(
        "Kickback deleted successfully."
      );
    } catch (err) {
      console.error(
        "Failed to delete kickback:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not delete the kickback."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredKickbacks = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return kickbacks;
    }

    return kickbacks.filter((kickback) => {
      const customerName =
        kickback.customer?.trading_name ||
        kickback.customer?.company_name ||
        "";

      const jobNumber =
        kickback.job?.job_number || "";

      return [
        kickback.reference,
        kickback.description,
        kickback.notes || "",
        customerName,
        jobNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [kickbacks, search]);

  const totals = useMemo(() => {
    const base = kickbacks.reduce(
      (sum, kickback) =>
        sum + Number(kickback.amount || 0),
      0
    );

    const vat = kickbacks.reduce(
      (sum, kickback) => {
        if (!kickback.vat_enabled) {
          return sum;
        }

        return (
          sum +
          Number(kickback.amount || 0) *
            (Number(
              kickback.vat_rate || 15
            ) / 100)
        );
      },
      0
    );

    return {
      base,
      vat,
      total: base + vat,
    };
  }, [kickbacks]);

  const previewAmount =
    calculatedItemsTotal ||
    Number(form.amount || 0);

  const previewVatRate = Number(
    form.vat_rate || 15
  );

  const previewVat = form.vat_enabled
    ? previewAmount *
      (previewVatRate / 100)
    : 0;

  const previewTotal =
    previewAmount + previewVat;

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(value: string) {
    if (!value) return "-";

    const date = new Date(
      `${value}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function getCustomerName(
    kickback: Kickback
  ) {
    return (
      kickback.customer?.trading_name ||
      kickback.customer?.company_name ||
      "No customer"
    );
  }

  return (
    <DashboardShell
      title="Kickbacks"
      subtitle="Manage kickback transactions and financial adjustments."
    >
      <div className="space-y-6">
        <AnimatePresence>
          {message && (
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
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              {message}
            </motion.div>
          )}

          {error && (
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
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-950 dark:text-white">
              Kickbacks
            </h1>

            <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
              Record and manage kickback transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4" />
            Add Kickback
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 dark:border-charcoal-800 dark:bg-charcoal-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                  Kickbacks
                </p>

                <p className="mt-1 text-2xl font-bold text-charcoal-950 dark:text-white">
                  {kickbacks.length}
                </p>
              </div>

              <div className="rounded-xl bg-cyan-50 p-3 dark:bg-cyan-950/30">
                <WalletCards className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 dark:border-charcoal-800 dark:bg-charcoal-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                  Base Amount
                </p>

                <p className="mt-1 text-xl font-bold text-charcoal-950 dark:text-white">
                  {formatCurrency(totals.base)}
                </p>
              </div>

              <div className="rounded-xl bg-charcoal-100 p-3 dark:bg-charcoal-800">
                <TrendingUp className="h-5 w-5 text-charcoal-700 dark:text-charcoal-200" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 dark:border-charcoal-800 dark:bg-charcoal-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                  VAT
                </p>

                <p className="mt-1 text-xl font-bold text-charcoal-950 dark:text-white">
                  {formatCurrency(totals.vat)}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                <ReceiptText className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 dark:border-charcoal-800 dark:bg-charcoal-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                  Total
                </p>

                <p className="mt-1 text-xl font-bold text-cyan-600">
                  {formatCurrency(totals.total)}
                </p>
              </div>

              <div className="rounded-xl bg-cyan-50 p-3 dark:bg-cyan-950/30">
                <CalendarDays className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>

        {/* KICKBACK LIST */}
        <div className="rounded-2xl border border-charcoal-200 bg-white dark:border-charcoal-800 dark:bg-charcoal-900">
          <div className="border-b border-charcoal-200 p-4 dark:border-charcoal-800">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search kickbacks..."
                className="w-full rounded-xl border border-charcoal-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-cyan-600" />
            </div>
          ) : filteredKickbacks.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <WalletCards className="h-10 w-10 text-charcoal-300 dark:text-charcoal-700" />

              <h3 className="mt-4 text-base font-semibold text-charcoal-900 dark:text-white">
                {search
                  ? "No kickbacks found"
                  : "No kickbacks yet"}
              </h3>

              <p className="mt-1 max-w-sm text-sm text-charcoal-500 dark:text-charcoal-400">
                {search
                  ? "Try changing your search."
                  : "Add your first kickback transaction to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Kickback
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-charcoal-200 text-left dark:border-charcoal-800">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Reference
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Description
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      VAT
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Total
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
                  {filteredKickbacks.map(
                    (kickback) => {
                      const vatAmount =
                        kickback.vat_enabled
                          ? Number(
                              kickback.amount || 0
                            ) *
                            (Number(
                              kickback.vat_rate ||
                                15
                            ) /
                              100)
                          : 0;

                      const total =
                        Number(
                          kickback.amount || 0
                        ) + vatAmount;

                      return (
                        <tr
                          key={kickback.id}
                          className="transition hover:bg-charcoal-50 dark:hover:bg-charcoal-950/50"
                        >
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="font-semibold text-charcoal-900 dark:text-white">
                              {kickback.reference}
                            </div>

                            {kickback.job
                              ?.job_number && (
                              <div className="mt-0.5 text-xs text-charcoal-500">
                                {
                                  kickback.job
                                    .job_number
                                }
                              </div>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-charcoal-600 dark:text-charcoal-300">
                            {formatDate(
                              kickback.transaction_date
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="max-w-[180px] truncate text-sm font-medium text-charcoal-800 dark:text-charcoal-200">
                              {getCustomerName(
                                kickback
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="max-w-[220px] truncate text-sm text-charcoal-600 dark:text-charcoal-300">
                              {
                                kickback.description
                              }
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            {kickback.vat_enabled ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                <Power className="h-3 w-3" />
                                ON{" "}
                                {
                                  kickback.vat_rate
                                }
                                %
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-charcoal-100 px-2.5 py-1 text-xs font-semibold text-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-300">
                                OFF
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-charcoal-800 dark:text-charcoal-200">
                            {formatCurrency(
                              Number(
                                kickback.amount ||
                                  0
                              )
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-charcoal-950 dark:text-white">
                            {formatCurrency(total)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <KickbackPDFDownloadButton
                                kickback={{
                                  reference:
                                    kickback.reference,
                                  transaction_date:
                                    kickback.transaction_date,
                                  description:
                                    kickback.description,
                                  amount: Number(
                                    kickback.amount ||
                                      0
                                  ),
                                  notes:
                                    kickback.notes,
                                  vat_enabled:
                                    kickback.vat_enabled,
                                  vat_rate: Number(
                                    kickback.vat_rate ||
                                      15
                                  ),
                                  customer:
                                    kickback.customer ||
                                    null,
                                  job: kickback.job
                                    ? {
                                        job_number:
                                          kickback
                                            .job
                                            .job_number,
                                        job_type:
                                          kickback
                                            .job
                                            .job_type,
                                        description:
                                          kickback
                                            .job
                                            .description,
                                      }
                                    : null,
                                  items:
                                    kickback.items,
                                }}
                                onError={(
                                  downloadError
                                ) =>
                                  setError(
                                    downloadError
                                  )
                                }
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    kickback
                                  )
                                }
                                title="Edit Kickback"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-charcoal-200 bg-white text-charcoal-700 transition hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-700 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-charcoal-200 dark:hover:border-cyan-500 dark:hover:bg-cyan-950/30"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteKickback(
                                    kickback.id
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  kickback.id
                                }
                                title="Delete Kickback"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-charcoal-900 dark:text-red-400 dark:hover:bg-red-950/30"
                              >
                                {deletingId ===
                                kickback.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 20,
                scale: 0.98,
              }}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-charcoal-900"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal-200 bg-white px-6 py-4 dark:border-charcoal-800 dark:bg-charcoal-900">
                <div>
                  <h2 className="text-lg font-bold text-charcoal-950 dark:text-white">
                    {editingId
                      ? "Edit Kickback"
                      : "Add Kickback"}
                  </h2>

                  <p className="mt-0.5 text-sm text-charcoal-500 dark:text-charcoal-400">
                    Enter the kickback transaction
                    details.
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
                onSubmit={saveKickback}
                className="space-y-5 p-6"
              >
                {/* REFERENCE + DATE */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-charcoal-800 dark:text-charcoal-200">
                      Kickback Number
                    </label>

                    <input
                      type="text"
                      value={form.reference}
                      readOnly
                      className="w-full rounded-xl border border-charcoal-200 bg-charcoal-50 px-3.5 py-2.5 text-sm font-semibold text-charcoal-700 outline-none dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-charcoal-200"
                    />

                    {!editingId && (
                      <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
                        Automatically generated.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-charcoal-800 dark:text-charcoal-200">
                      Date
                    </label>

                    <input
                      type="date"
                      value={form.transaction_date}
                      onChange={(event) =>
                        updateForm(
                          "transaction_date",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* JOB */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal-800 dark:text-charcoal-200">
                    Job
                  </label>

                  <select
                    value={form.job_id}
                    onChange={(event) =>
                      updateForm(
                        "job_id",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-charcoal-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                  >
                    <option value="">
                      No job selected
                    </option>

                    {jobs.map((job) => {
                      const customerName =
                        job.customer?.trading_name ||
                        job.customer?.company_name;

                      return (
                        <option
                          key={job.id}
                          value={job.id}
                        >
                          {job.job_number}
                          {customerName
                            ? ` — ${customerName}`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal-800 dark:text-charcoal-200">
                    Description
                  </label>

                  <input
                    type="text"
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Kickback description"
                    className="w-full rounded-xl border border-charcoal-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                  />
                </div>

                {/* MULTIPLE ITEMS */}
                <div className="rounded-2xl border border-charcoal-200 bg-charcoal-50/50 p-4 dark:border-charcoal-700 dark:bg-charcoal-950/50">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-charcoal-900 dark:text-white">
                        Kickback Items
                      </h3>

                      <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
                        Add one or more materials/items to
                        this kickback.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formItems.map(
                      (item, index) => {
                        const quantity =
                          Number(
                            item.quantity_kg ||
                              0
                          );

                        const rate =
                          Number(
                            item.rate_per_kg ||
                              0
                          );

                        const lineTotal =
                          quantity * rate;

                        return (
                          <div
                            key={index}
                            className="rounded-xl border border-charcoal-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-900"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wide text-charcoal-500">
                                Item {index + 1}
                              </span>

                              {formItems.length >
                                1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeItem(
                                      index
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_150px_140px]">
                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-charcoal-700 dark:text-charcoal-300">
                                  Description
                                </label>

                                <input
                                  type="text"
                                  value={
                                    item.description
                                  }
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "description",
                                      event.target
                                        .value
                                    )
                                  }
                                  placeholder="e.g. Scrap metal"
                                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-charcoal-700 dark:text-charcoal-300">
                                  Quantity (kg)
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    item.quantity_kg
                                  }
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "quantity_kg",
                                      event.target
                                        .value
                                    )
                                  }
                                  placeholder="0"
                                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-charcoal-700 dark:text-charcoal-300">
                                  Rate / kg
                                </label>

                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-charcoal-400">
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
                                        event.target
                                          .value
                                      )
                                    }
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-charcoal-200 bg-white py-2.5 pl-7 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-charcoal-700 dark:text-charcoal-300">
                                  Line Total
                                </label>

                                <div className="flex h-[42px] items-center rounded-lg border border-charcoal-200 bg-charcoal-50 px-3 text-sm font-bold text-charcoal-800 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white">
                                  {formatCurrency(
                                    lineTotal
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-charcoal-200 pt-4 dark:border-charcoal-700">
                    <span className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                      Items Total
                    </span>

                    <span className="text-lg font-bold text-charcoal-950 dark:text-white">
                      {formatCurrency(
                        calculatedItemsTotal
                      )}
                    </span>
                  </div>
                </div>

                {/* VAT */}
                <div className="rounded-2xl border border-charcoal-200 bg-charcoal-50 p-4 dark:border-charcoal-700 dark:bg-charcoal-950">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Power
                          className={`h-4 w-4 ${
                            form.vat_enabled
                              ? "text-emerald-600"
                              : "text-charcoal-400"
                          }`}
                        />

                        <span className="text-sm font-semibold text-charcoal-900 dark:text-white">
                          Add VAT
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
                        Turn VAT on or off for this
                        kickback.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "vat_enabled",
                          !form.vat_enabled
                        )
                      }
                      aria-pressed={
                        form.vat_enabled
                      }
                      className={`relative h-7 w-12 rounded-full transition ${
                        form.vat_enabled
                          ? "bg-cyan-600"
                          : "bg-charcoal-300 dark:bg-charcoal-700"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                          form.vat_enabled
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {form.vat_enabled && (
                    <div className="mt-4">
                      <label className="mb-1.5 block text-sm font-medium text-charcoal-800 dark:text-charcoal-200">
                        VAT Rate
                      </label>

                      <div className="relative max-w-[180px]">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.vat_rate}
                          onChange={(event) =>
                            updateForm(
                              "vat_rate",
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-charcoal-200 bg-white px-3.5 py-2.5 pr-9 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                        />

                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-charcoal-400">
                          %
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-2 border-t border-charcoal-200 pt-4 dark:border-charcoal-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-charcoal-500 dark:text-charcoal-400">
                        Base amount
                      </span>

                      <span className="font-medium text-charcoal-800 dark:text-charcoal-200">
                        {formatCurrency(
                          previewAmount
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-charcoal-500 dark:text-charcoal-400">
                        VAT
                        {form.vat_enabled
                          ? ` (${previewVatRate}%)`
                          : " (OFF)"}
                      </span>

                      <span className="font-medium text-charcoal-800 dark:text-charcoal-200">
                        {formatCurrency(
                          previewVat
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-charcoal-200 pt-2 dark:border-charcoal-700">
                      <span className="font-semibold text-charcoal-900 dark:text-white">
                        Total
                      </span>

                      <span className="text-lg font-bold text-cyan-600">
                        {formatCurrency(
                          previewTotal
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* NOTES */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal-800 dark:text-charcoal-200">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm(
                        "notes",
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Optional notes..."
                    className="w-full resize-none rounded-xl border border-charcoal-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                  />
                </div>

                {/* BUTTONS */}
                <div className="flex flex-col-reverse gap-3 border-t border-charcoal-200 pt-5 sm:flex-row sm:justify-end dark:border-charcoal-800">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-charcoal-200 bg-white px-5 py-2.5 text-sm font-semibold text-charcoal-700 transition hover:bg-charcoal-50 disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-charcoal-200 dark:hover:bg-charcoal-800"
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

                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Kickback"
                        : "Add Kickback"}
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