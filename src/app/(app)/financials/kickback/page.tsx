
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowDownToLine,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const KickbackPDFDownloadButton = dynamic(
  () => import("@/components/kickbacks/kickback-pdf-download"),
  { ssr: false }
);

const KickbackStatementPDFDownloadButton = dynamic(
  () => import("@/components/kickbacks/kickback-statement-pdf"),
  { ssr: false }
);

interface Customer {
  id: string;
  company_name: string;
  trading_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  physical_address?: string | null;
}

interface Job {
  id: string;
  job_number: string;
  job_type?: string | null;
  description?: string | null;
  customer_id?: string | null;
  customer?: Customer | null;
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
  customer_id?: string | null;
  site?: string | null;
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
  customer_id: string;
  site: string;
  vat_enabled: boolean;
  vat_rate: string;
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
  customer_id: string | null;
  site: string | null;
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

const emptyForm: FormData = {
  reference: "",
  transaction_date: new Date().toISOString().split("T")[0],
  description: "",
  amount: "",
  notes: "",
  job_id: "",
  customer_id: "",
  site: "",
  vat_enabled: false,
  vat_rate: "15",
};

const emptyItem: FormItem = {
  description: "",
  rate_per_kg: "",
  quantity_kg: "",
};

function getSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value || 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(`${value.split("T")[0]}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCustomerName(customer?: Customer | null) {
  if (!customer) return "No customer";
  return customer.trading_name || customer.company_name || "Unnamed customer";
}

function calculateItems(items: FormItem[]) {
  return items.map((item) => {
    const rate = Number(item.rate_per_kg) || 0;
    const quantity = Number(item.quantity_kg) || 0;

    return {
      description: item.description.trim(),
      rate_per_kg: rate,
      quantity_kg: quantity,
      line_total: Number((rate * quantity).toFixed(2)),
    };
  });
}

export default function KickbackPage() {
  const supabase = createClient();

  const [kickbacks, setKickbacks] = useState<Kickback[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingKickback, setEditingKickback] = useState<Kickback | null>(
    null
  );
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formItems, setFormItems] = useState<FormItem[]>([
    { ...emptyItem },
  ]);

  const [statementCustomerId, setStatementCustomerId] = useState("");
  const [statementFromDate, setStatementFromDate] = useState(
    `${new Date().getFullYear()}-01-01`
  );
  const [statementToDate, setStatementToDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: customerRows, error: customerError } = await supabase
        .from("customers")
        .select(
          "id, company_name, trading_name, contact_person, email, phone, physical_address"
        )
        .order("company_name", { ascending: true });

      if (customerError) throw customerError;

      const loadedCustomers = (customerRows || []) as Customer[];
      setCustomers(loadedCustomers);

      const customerById = new Map(
        loadedCustomers.map((customer) => [customer.id, customer])
      );

      const { data: transactionRows, error: transactionError } =
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
              customer_id,
              site,
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

      if (transactionError) throw transactionError;

      const { data: itemRows, error: itemError } = await supabase
        .from("kickback_items")
        .select(
          "id, kickback_id, description, rate_per_kg, quantity_kg, line_total, created_at"
        )
        .order("created_at", { ascending: true });

      if (itemError) throw itemError;

      const { data: jobRows, error: jobError } = await supabase
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
        .order("job_number", { ascending: false });

      if (jobError) throw jobError;

      const loadedJobs: Job[] = ((jobRows || []) as unknown as JobRow[]).map(
        (row) => ({
          id: row.id,
          job_number: row.job_number || "—",
          job_type: row.job_type,
          description: row.description,
          customer_id: row.customer_id,
          customer: getSingle(row.customers),
        })
      );

      setJobs(loadedJobs);

      const itemsByKickback = new Map<string, KickbackItem[]>();

      ((itemRows || []) as KickbackItemRow[]).forEach((item) => {
        if (!item.kickback_id) return;

        const existing = itemsByKickback.get(item.kickback_id) || [];

        existing.push({
          id: item.id,
          description: item.description || "",
          rate_per_kg: Number(item.rate_per_kg) || 0,
          quantity_kg: Number(item.quantity_kg) || 0,
          line_total: Number(item.line_total) || 0,
        });

        itemsByKickback.set(item.kickback_id, existing);
      });

      const formattedKickbacks: Kickback[] = (
        (transactionRows || []) as unknown as KickbackRow[]
      ).map((row) => {
        const relatedJobRow = getSingle(row.jobs);

        const jobCustomerFromRelation = getSingle(
          relatedJobRow?.customers
        );

        const directCustomer = row.customer_id
          ? customerById.get(row.customer_id) || null
          : null;

        const jobCustomer =
          (relatedJobRow?.customer_id
            ? customerById.get(relatedJobRow.customer_id)
            : null) ||
          (jobCustomerFromRelation
            ? customerById.get(jobCustomerFromRelation.id) ||
              jobCustomerFromRelation
            : null);

        const customer = directCustomer || jobCustomer;

        const job: Job | null = relatedJobRow
          ? {
              id: relatedJobRow.id,
              job_number: relatedJobRow.job_number || "—",
              job_type: relatedJobRow.job_type,
              description: relatedJobRow.description,
              customer_id:
                relatedJobRow.customer_id || jobCustomer?.id || null,
              customer: jobCustomer,
            }
          : null;

        return {
          id: row.id,
          reference: row.reference || "—",
          transaction_date: row.transaction_date,
          description: row.description || "",
          amount: Number(row.amount) || 0,
          notes: row.notes,
          vat_enabled: Boolean(row.vat_enabled),
          vat_rate: Number(row.vat_rate ?? 15),
          job_id: row.job_id,
          customer_id: row.customer_id || customer?.id || null,
          site: row.site,
          job,
          customer,
          items: itemsByKickback.get(row.id) || [],
        };
      });

      setKickbacks(formattedKickbacks);
    } catch (err) {
      console.error("Failed to load kickbacks:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load kickback records."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredKickbacks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return kickbacks.filter((kickback) => {
      const customerName = getCustomerName(kickback.customer).toLowerCase();

      const matchesSearch =
        !query ||
        kickback.reference.toLowerCase().includes(query) ||
        kickback.description.toLowerCase().includes(query) ||
        customerName.includes(query) ||
        (kickback.site || "").toLowerCase().includes(query) ||
        (kickback.job?.job_number || "").toLowerCase().includes(query);

      const matchesMonth =
        !monthFilter ||
        kickback.transaction_date.slice(0, 7) === monthFilter;

      return matchesSearch && matchesMonth;
    });
  }, [kickbacks, search, monthFilter]);

  const totalKickbacks = useMemo(
    () => kickbacks.reduce((total, item) => total + item.amount, 0),
    [kickbacks]
  );

  const currentMonthTotal = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    return kickbacks
      .filter((item) => item.transaction_date.slice(0, 7) === currentMonth)
      .reduce((total, item) => total + item.amount, 0);
  }, [kickbacks]);

  const totalQuantity = useMemo(
    () =>
      kickbacks.reduce(
        (total, kickback) =>
          total +
          kickback.items.reduce((itemTotal, item) => {
            return itemTotal + item.quantity_kg;
          }, 0),
        0
      ),
    [kickbacks]
  );

  const selectedStatementCustomer = useMemo(
    () =>
      customers.find((customer) => customer.id === statementCustomerId) ||
      null,
    [customers, statementCustomerId]
  );

  const statementKickbacks = useMemo(() => {
    if (!statementCustomerId) return [];

    return kickbacks
      .filter((kickback) => {
        const date = kickback.transaction_date.slice(0, 10);

        return (
          kickback.customer_id === statementCustomerId &&
          date >= statementFromDate &&
          date <= statementToDate
        );
      })
      .sort((a, b) =>
        a.transaction_date.localeCompare(b.transaction_date)
      )
      .map((kickback) => ({
        id: kickback.id,
        reference: kickback.reference,
        transaction_date: kickback.transaction_date,
        description: kickback.description,
        amount: kickback.amount,
        vat_enabled: kickback.vat_enabled,
        vat_rate: kickback.vat_rate,
        site: kickback.site || null,
        notes: kickback.notes || null,
      }));
  }, [
    kickbacks,
    statementCustomerId,
    statementFromDate,
    statementToDate,
  ]);

  const statementTotal = useMemo(
    () =>
      statementKickbacks.reduce(
        (total, kickback) => total + kickback.amount,
        0
      ),
    [statementKickbacks]
  );

  const statementDateRangeValid =
    Boolean(statementFromDate) &&
    Boolean(statementToDate) &&
    statementFromDate <= statementToDate;

  const customerJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          !form.customer_id || job.customer_id === form.customer_id
      ),
    [jobs, form.customer_id]
  );

  function updateForm<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateItem(
    index: number,
    field: keyof FormItem,
    value: string
  ) {
    setFormItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setFormItems((current) => [...current, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setFormItems((current) => {
      if (current.length <= 1) return current;
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function openAddModal() {
    setEditingKickback(null);
    setError("");
    setSuccess("");

    const nextNumber =
      kickbacks.reduce((highest, kickback) => {
        const match = kickback.reference.match(/^KB-(\d+)$/i);
        return match ? Math.max(highest, Number(match[1])) : highest;
      }, 0) + 1;

    setForm({
      ...emptyForm,
      reference: `KB-${String(nextNumber).padStart(4, "0")}`,
      transaction_date: new Date().toISOString().split("T")[0],
    });

    setFormItems([{ ...emptyItem }]);
    setModalOpen(true);
  }

  function openEditModal(kickback: Kickback) {
    setEditingKickback(kickback);
    setError("");
    setSuccess("");

    setForm({
      reference: kickback.reference,
      transaction_date: kickback.transaction_date,
      description: kickback.description,
      amount: String(kickback.amount),
      notes: kickback.notes || "",
      job_id: kickback.job_id || "",
      customer_id: kickback.customer_id || kickback.customer?.id || "",
      site: kickback.site || "",
      vat_enabled: kickback.vat_enabled,
      vat_rate: String(kickback.vat_rate || 15),
    });

    setFormItems(
      kickback.items.length
        ? kickback.items.map((item) => ({
            description: item.description,
            rate_per_kg: String(item.rate_per_kg),
            quantity_kg: String(item.quantity_kg),
          }))
        : [{ ...emptyItem }]
    );

    setModalOpen(true);
  }

  async function saveKickback() {
    setError("");
    setSuccess("");

    if (!form.reference.trim()) {
      setError("Please enter a kickback reference.");
      return;
    }

    if (!form.customer_id) {
      setError("Please select a customer for this kickback.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!form.transaction_date) {
      setError("Please select a transaction date.");
      return;
    }

    const validItems = calculateItems(formItems).filter(
      (item) =>
        item.description &&
        Number.isFinite(item.rate_per_kg) &&
        Number.isFinite(item.quantity_kg) &&
        item.rate_per_kg >= 0 &&
        item.quantity_kg > 0
    );

    if (validItems.length === 0) {
      setError(
        "Please add at least one item with a description and a quantity greater than zero."
      );
      return;
    }

    const calculatedAmount = Number(
      validItems
        .reduce((total, item) => total + item.line_total, 0)
        .toFixed(2)
    );

    const vatRate = Number(form.vat_rate);

    if (
      form.vat_enabled &&
      (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100)
    ) {
      setError("Please enter a valid VAT rate between 0 and 100.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        reference: form.reference.trim(),
        transaction_date: form.transaction_date,
        description: form.description.trim(),
        amount: calculatedAmount,
        notes: form.notes.trim() || null,
        job_id: form.job_id || null,
        customer_id: form.customer_id || null,
        site: form.site.trim() || null,
        type: "kickback",
        vat_enabled: form.vat_enabled,
        vat_rate: form.vat_enabled ? vatRate : 15,
      };

      let kickbackId = editingKickback?.id;

      if (editingKickback) {
        const { error: updateError } = await supabase
          .from("financial_transactions")
          .update(payload)
          .eq("id", editingKickback.id)
          .eq("type", "kickback");

        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("financial_transactions")
          .insert(payload)
          .select("id")
          .single();

        if (insertError) throw insertError;

        kickbackId = inserted.id;
      }

      if (!kickbackId) {
        throw new Error("Could not determine the kickback record ID.");
      }

      if (editingKickback) {
        const { error: deleteItemsError } = await supabase
          .from("kickback_items")
          .delete()
          .eq("kickback_id", kickbackId);

        if (deleteItemsError) throw deleteItemsError;
      }

      const itemPayload = validItems.map((item) => ({
        kickback_id: kickbackId,
        description: item.description,
        rate_per_kg: item.rate_per_kg,
        quantity_kg: item.quantity_kg,
        line_total: item.line_total,
      }));

      const { error: itemsInsertError } = await supabase
        .from("kickback_items")
        .insert(itemPayload);

      if (itemsInsertError) throw itemsInsertError;

      setModalOpen(false);
      setSuccess(
        editingKickback
          ? "Kickback updated successfully."
          : "Kickback created successfully."
      );

      await loadData();
    } catch (err) {
      console.error("Failed to save kickback:", err);
      setError(
        err instanceof Error ? err.message : "Unable to save kickback."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteKickback(kickback: Kickback) {
    const confirmed = window.confirm(
      `Delete kickback ${kickback.reference}? This will also delete its line items.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const { error: itemsError } = await supabase
        .from("kickback_items")
        .delete()
        .eq("kickback_id", kickback.id);

      if (itemsError) throw itemsError;

      const { error: transactionError } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", kickback.id)
        .eq("type", "kickback");

      if (transactionError) throw transactionError;

      setSuccess(`${kickback.reference} was deleted.`);
      await loadData();
    } catch (err) {
      console.error("Failed to delete kickback:", err);
      setError(
        err instanceof Error ? err.message : "Unable to delete kickback."
      );
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-teal-900";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kickback
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage recycling rebates, customer records and kickback reports.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus size={18} />
            Add Kickback
          </button>
        </div>

        {error && !modalOpen && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <X size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300">
            <Check size={18} className="mt-0.5 shrink-0" />
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto"
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Existing kickback summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Kickbacks
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalKickbacks)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {kickbacks.length} recorded{" "}
              {kickbacks.length === 1 ? "kickback" : "kickbacks"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This Month
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(currentMonthTotal)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Kickbacks recorded this month
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:col-span-2 xl:col-span-1"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Quantity
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat("en-ZA", {
                maximumFractionDigits: 2,
              }).format(totalQuantity)}{" "}
              kg
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Across recorded kickback items
            </p>
          </motion.div>
        </div>

        {/* Kickback Statement PDF section */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kickback Statement
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Generate a PDF record of a customer&apos;s kickbacks for a
                selected period. This is a separate report and does not change
                invoice statements or balances.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className={labelClass}>Customer</label>
              <select
                value={statementCustomerId}
                onChange={(event) =>
                  setStatementCustomerId(event.target.value)
                }
                className={inputClass}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {getCustomerName(customer)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>From Date</label>
              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={statementFromDate}
                  max={statementToDate || undefined}
                  onChange={(event) =>
                    setStatementFromDate(event.target.value)
                  }
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>To Date</label>
              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={statementToDate}
                  min={statementFromDate || undefined}
                  onChange={(event) =>
                    setStatementToDate(event.target.value)
                  }
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>

          {statementFromDate &&
            statementToDate &&
            !statementDateRangeValid && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                The start date must be on or before the end date.
              </p>
            )}

          <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedStatementCustomer
                  ? `Statement for ${getCustomerName(selectedStatementCustomer)}`
                  : "Select a customer to view their kickback statement."}
              </p>
              {selectedStatementCustomer && statementDateRangeValid && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {statementKickbacks.length}{" "}
                  {statementKickbacks.length === 1 ? "record" : "records"}{" "}
                  · Total:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(statementTotal)}
                  </span>
                </p>
              )}
            </div>

            {selectedStatementCustomer && statementDateRangeValid && (
              <KickbackStatementPDFDownloadButton
                customer={selectedStatementCustomer}
                kickbacks={statementKickbacks}
                fromDate={statementFromDate}
                toDate={statementToDate}
              />
            )}
          </div>

          {selectedStatementCustomer &&
            statementDateRangeValid &&
            statementKickbacks.length === 0 && (
              <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                No kickbacks were found for this customer in the selected
                date range. You can still generate a statement showing the
                selected period.
              </p>
            )}
        </section>

        {/* Existing kickback records */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kickback Records
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Search, edit, download or delete existing kickbacks.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search kickbacks..."
                  className={`${inputClass} pl-9 sm:w-64`}
                />
              </div>

              <input
                type="month"
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                className={inputClass}
                aria-label="Filter kickbacks by month"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              Loading kickbacks...
            </div>
          ) : filteredKickbacks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">
                <FileText size={22} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                No kickbacks found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {search || monthFilter
                  ? "Try changing your search or month filter."
                  : "Add a kickback to start recording recycling rebates."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/70 dark:text-gray-400">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Reference</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Customer</th>
                      <th className="px-5 py-3 font-semibold">Site</th>
                      <th className="px-5 py-3 font-semibold">Description</th>
                      <th className="px-5 py-3 text-right font-semibold">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredKickbacks.map((kickback) => (
                      <tr
                        key={kickback.id}
                        className="transition hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-900 dark:text-white">
                          {kickback.reference}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-300">
                          {formatDate(kickback.transaction_date)}
                        </td>
                        <td className="px-5 py-4 text-gray-700 dark:text-gray-200">
                          <div className="font-medium">
                            {getCustomerName(kickback.customer)}
                          </div>
                          {kickback.job && (
                            <div className="mt-1 text-xs text-gray-500">
                              Job {kickback.job.job_number}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                          {kickback.site || "—"}
                        </td>
                        <td className="max-w-xs px-5 py-4 text-gray-600 dark:text-gray-300">
                          <span className="line-clamp-2">
                            {kickback.description}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(kickback.amount)}
                          {kickback.vat_enabled && (
                            <div className="mt-1 text-xs font-normal text-gray-500">
                              VAT {kickback.vat_rate}%
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <KickbackPDFDownloadButton
                              kickback={{
                                reference: kickback.reference,
                                transaction_date: kickback.transaction_date,
                                description: kickback.description,
                                site: kickback.site,
                                amount: kickback.amount,
                                notes: kickback.notes,
                                vat_enabled: kickback.vat_enabled,
                                vat_rate: kickback.vat_rate,
                                customer: kickback.customer,
                                job: kickback.job,
                                items: kickback.items,
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => openEditModal(kickback)}
                              title="Edit kickback"
                              aria-label={`Edit ${kickback.reference}`}
                              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-teal-950/40"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteKickback(kickback)}
                              title="Delete kickback"
                              aria-label={`Delete ${kickback.reference}`}
                              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-red-950/40"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 lg:hidden">
                {filteredKickbacks.map((kickback) => (
                  <div
                    key={kickback.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {kickback.reference}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(kickback.transaction_date)}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(kickback.amount)}
                      </p>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm">
                      <p className="text-gray-700 dark:text-gray-200">
                        <span className="text-gray-500">Customer: </span>
                        {getCustomerName(kickback.customer)}
                      </p>
                      <p className="text-gray-700 dark:text-gray-200">
                        <span className="text-gray-500">Site: </span>
                        {kickback.site || "—"}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {kickback.description}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                      <KickbackPDFDownloadButton
                        kickback={{
                          reference: kickback.reference,
                          transaction_date: kickback.transaction_date,
                          description: kickback.description,
                          site: kickback.site,
                          amount: kickback.amount,
                          notes: kickback.notes,
                          vat_enabled: kickback.vat_enabled,
                          vat_rate: kickback.vat_rate,
                          customer: kickback.customer,
                          job: kickback.job,
                          items: kickback.items,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => openEditModal(kickback)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteKickback(kickback)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 dark:border-red-900"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 px-5 py-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Showing {filteredKickbacks.length} of {kickbacks.length}{" "}
                kickback records
              </div>
            </>
          )}
        </section>
      </div>

      {/* Add / edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingKickback ? "Edit Kickback" : "Add Kickback"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Record the customer, site and recycling rebate details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[75vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Reference *</label>
                  <input
                    value={form.reference}
                    onChange={(event) =>
                      updateForm("reference", event.target.value)
                    }
                    placeholder="KB-0001"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Transaction Date *</label>
                  <input
                    type="date"
                    value={form.transaction_date}
                    onChange={(event) =>
                      updateForm("transaction_date", event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                {/* Customer selection */}
                <div>
                  <label className={labelClass}>Customer *</label>
                  <div className="relative">
                    <select
                      value={form.customer_id}
                      onChange={(event) => {
                        const customerId = event.target.value;

                        setForm((current) => ({
                          ...current,
                          customer_id: customerId,
                          job_id: "",
                        }));
                      }}
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      <option value="">Select customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {getCustomerName(customer)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This links the kickback to the customer for statements.
                  </p>
                </div>

                {/* Site directly below customer */}
                <div>
                  <label className={labelClass}>Site</label>
                  <input
                    value={form.site}
                    onChange={(event) =>
                      updateForm("site", event.target.value)
                    }
                    placeholder="Enter site or collection location"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Job (optional)</label>
                  <div className="relative">
                    <select
                      value={form.job_id}
                      onChange={(event) =>
                        updateForm("job_id", event.target.value)
                      }
                      disabled={!form.customer_id}
                      className={`${inputClass} appearance-none pr-9 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800`}
                    >
                      <option value="">
                        {form.customer_id
                          ? "No job selected"
                          : "Select a customer first"}
                      </option>
                      {customerJobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.job_number}
                          {job.job_type ? ` · ${job.job_type}` : ""}
                          {job.description ? ` · ${job.description}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                  {form.customer_id && customerJobs.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      No jobs are linked to this customer. You can still
                      record the kickback without a job.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Description *</label>
                  <input
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="e.g. Recycling rebate for collected material"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Kickback line items */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Kickback Items
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Each line total is calculated using rate × quantity.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-teal-200 px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50 dark:border-teal-900 dark:text-teal-300 dark:hover:bg-teal-950/40"
                  >
                    <Plus size={15} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4 p-4">
                  {formItems.map((item, index) => {
                    const lineTotal =
                      (Number(item.rate_per_kg) || 0) *
                      (Number(item.quantity_kg) || 0);

                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Item {index + 1}
                          </p>
                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                              aria-label={`Remove item ${index + 1}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="sm:col-span-3">
                            <label className={labelClass}>Description</label>
                            <input
                              value={item.description}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  "description",
                                  event.target.value
                                )
                              }
                              placeholder="e.g. Paper, plastic or cans"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>
                              Rate per kg (R)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate_per_kg}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  "rate_per_kg",
                                  event.target.value
                                )
                              }
                              placeholder="0.00"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Quantity (kg)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity_kg}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  "quantity_kg",
                                  event.target.value
                                )
                              }
                              placeholder="0.00"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Line Total</label>
                            <div className="flex min-h-[42px] items-center rounded-lg bg-gray-50 px-3 text-sm font-semibold text-gray-900 dark:bg-gray-800 dark:text-white">
                              {formatCurrency(lineTotal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-800/40 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Amount before VAT
                  </span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(
                      calculateItems(formItems).reduce(
                        (total, item) => total + item.line_total,
                        0
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* VAT options */}
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Add VAT on top of the kickback amount
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      VAT is included in the individual PDF calculations when
                      enabled.
                    </p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.vat_enabled}
                      onChange={(event) =>
                        updateForm("vat_enabled", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable VAT
                    </span>
                  </label>
                </div>

                {form.vat_enabled && (
                  <div className="mt-4 max-w-xs">
                    <label className={labelClass}>VAT Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.vat_rate}
                      onChange={(event) =>
                        updateForm("vat_rate", event.target.value)
                      }
                      className={inputClass}
                    />

                    <div className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                      <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-300">
                        <span>Subtotal</span>
                        <span>
                          {formatCurrency(
                            calculateItems(formItems).reduce(
                              (total, item) => total + item.line_total,
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-300">
                        <span>VAT ({Number(form.vat_rate) || 0}%)</span>
                        <span>
                          {formatCurrency(
                            calculateItems(formItems).reduce(
                              (total, item) => total + item.line_total,
                              0
                            ) * ((Number(form.vat_rate) || 0) / 100)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 border-t border-gray-200 pt-2 font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
                        <span>Total including VAT</span>
                        <span>
                          {formatCurrency(
                            calculateItems(formItems).reduce(
                              (total, item) => total + item.line_total,
                              0
                            ) *
                              (1 + (Number(form.vat_rate) || 0) / 100)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateForm("notes", event.target.value)
                  }
                  rows={3}
                  placeholder="Additional notes..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void saveKickback()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    {editingKickback ? "Save Changes" : "Create Kickback"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}