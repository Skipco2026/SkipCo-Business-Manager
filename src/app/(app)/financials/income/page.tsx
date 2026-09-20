"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Edit,
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
  company_name: string | null;
  trading_name: string | null;
}

interface IncomeTransaction {
  id: string;
  transaction_date: string;
  reference: string;
  description: string;
  amount: number;
  customer_id: string | null;
  payment_status: string | null;
  notes: string | null;
  created_at: string;
  customer: Customer | null;
}

interface SupabaseIncomeTransaction {
  id: string;
  transaction_date: string;
  reference: string;
  description: string;
  amount: number;
  customer_id: string | null;
  payment_status: string | null;
  notes: string | null;
  created_at: string;
  customer: Customer | Customer[] | null;
}

interface IncomeFormData {
  transaction_date: string;
  reference: string;
  description: string;
  amount: string;
  customer_id: string;
  payment_status: string;
  notes: string;
}

interface SupabaseErrorLike {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
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

function formatDate(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case "paid":
      return "Paid";

    case "partially_paid":
      return "Partially Paid";

    case "unpaid":
      return "Unpaid";

    default:
      return "—";
  }
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";

    case "partially_paid":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";

    case "unpaid":
      return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";

    default:
      return "bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-300";
  }
}

function getErrorMessage(error: unknown) {
  const supabaseError = error as SupabaseErrorLike | null;

  if (supabaseError?.message) {
    return supabaseError.message;
  }

  if (supabaseError?.details) {
    return supabaseError.details;
  }

  return "Unable to save income.";
}

export default function IncomePage() {
  const supabase = createClient();

  const [transactions, setTransactions] = useState<
    IncomeTransaction[]
  >([]);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [showModal, setShowModal] = useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<IncomeTransaction | null>(null);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(
    null
  );

  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState<IncomeFormData>({
    transaction_date: getToday(),
    reference: "",
    description: "",
    amount: "",
    customer_id: "",
    payment_status: "paid",
    notes: "",
  });

  async function loadData() {
    try {
      setLoading(true);

      const [
        transactionsResponse,
        customersResponse,
      ] = await Promise.all([
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
              payment_status,
              notes,
              created_at,
              customer:customers (
                id,
                customer_number,
                company_name,
                trading_name
              )
            `
          )
          .eq("type", "income")
          .order("transaction_date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("customers")
          .select(
            `
              id,
              customer_number,
              company_name,
              trading_name
            `
          )
          .order("company_name", {
            ascending: true,
          }),
      ]);

      if (transactionsResponse.error) {
        throw transactionsResponse.error;
      }

      if (customersResponse.error) {
        throw customersResponse.error;
      }

      const transactionData =
        (transactionsResponse.data ??
          []) as SupabaseIncomeTransaction[];

      const normalized: IncomeTransaction[] =
        transactionData.map((transaction) => {
          const customer = Array.isArray(
            transaction.customer
          )
            ? transaction.customer[0] ?? null
            : transaction.customer;

          return {
            id: transaction.id,
            transaction_date:
              transaction.transaction_date,
            reference: transaction.reference,
            description: transaction.description,
            amount: Number(transaction.amount) || 0,
            customer_id: transaction.customer_id,
            payment_status:
              transaction.payment_status,
            notes: transaction.notes,
            created_at: transaction.created_at,
            customer,
          };
        });

      setTransactions(normalized);

      setCustomers(
        (customersResponse.data ?? []) as Customer[]
      );
    } catch (error) {
      console.error("Error loading income:", error);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return transactions.filter((transaction) => {
      const matchesMonth =
        !selectedMonth ||
        transaction.transaction_date?.startsWith(
          selectedMonth
        );

      const customerName =
        transaction.customer?.company_name ?? "";

      const tradingName =
        transaction.customer?.trading_name ?? "";

      const searchable = [
        transaction.reference,
        transaction.description,
        customerName,
        tradingName,
        transaction.notes ?? "",
        transaction.payment_status ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue ||
        searchable.includes(searchValue);

      return matchesMonth && matchesSearch;
    });
  }, [
    transactions,
    selectedMonth,
    search,
  ]);

  const totalIncome = useMemo(() => {
    return filteredTransactions.reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );
  }, [filteredTransactions]);

  function openAddModal() {
    setEditingTransaction(null);

    setForm({
      transaction_date: getToday(),
      reference: "",
      description: "",
      amount: "",
      customer_id: "",
      payment_status: "paid",
      notes: "",
    });

    setMessage(null);
    setShowModal(true);
  }

  function openEditModal(
    transaction: IncomeTransaction
  ) {
    setEditingTransaction(transaction);

    setForm({
      transaction_date:
        transaction.transaction_date,
      reference: transaction.reference,
      description: transaction.description,
      amount: String(transaction.amount),
      customer_id:
        transaction.customer_id ?? "",
      payment_status:
        transaction.payment_status ?? "paid",
      notes: transaction.notes ?? "",
    });

    setMessage(null);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingTransaction(null);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage(null);

    if (!form.transaction_date) {
      setMessage("Please select a date.");
      return;
    }

    if (!form.reference.trim()) {
      setMessage("Please enter a reference.");
      return;
    }

    if (!form.description.trim()) {
      setMessage("Please enter a description.");
      return;
    }

    const amount = Number(form.amount);

    if (Number.isNaN(amount) || amount < 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        transaction_date:
          form.transaction_date,
        reference: form.reference.trim(),
        description:
          form.description.trim(),
        amount,
        type: "income",
        customer_id:
          form.customer_id || null,

        // IMPORTANT:
        // These values must match the database
        // CHECK constraint exactly.
        payment_status:
          form.payment_status || null,

        notes:
          form.notes.trim() || null,
      };

      console.log(
        "Saving income transaction:",
        payload
      );

      if (editingTransaction) {
        const { data, error } = await supabase
          .from("financial_transactions")
          .update(payload)
          .eq("id", editingTransaction.id)
          .select()
          .single();

        if (error) {
          console.error(
            "Supabase update error:",
            JSON.stringify(error, null, 2)
          );

          throw error;
        }

        console.log(
          "Income updated successfully:",
          data
        );
      } else {
        const { data, error } = await supabase
          .from("financial_transactions")
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error(
            "Supabase insert error:",
            JSON.stringify(error, null, 2)
          );

          console.error(
            "Insert error message:",
            error.message
          );

          console.error(
            "Insert error details:",
            error.details
          );

          console.error(
            "Insert error hint:",
            error.hint
          );

          console.error(
            "Insert error code:",
            error.code
          );

          throw error;
        }

        console.log(
          "Income inserted successfully:",
          data
        );
      }

      setShowModal(false);
      setEditingTransaction(null);

      setForm({
        transaction_date: getToday(),
        reference: "",
        description: "",
        amount: "",
        customer_id: "",
        payment_status: "paid",
        notes: "",
      });

      await loadData();
    } catch (error) {
      console.error(
        "Error saving income:",
        JSON.stringify(error, null, 2)
      );

      const supabaseError =
        error as SupabaseErrorLike | null;

      console.error(
        "Error message:",
        supabaseError?.message
      );

      console.error(
        "Error details:",
        supabaseError?.details
      );

      console.error(
        "Error hint:",
        supabaseError?.hint
      );

      console.error(
        "Error code:",
        supabaseError?.code
      );

      setMessage(
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    id: string
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this income transaction?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setMessage(null);

      const { error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      await loadData();
    } catch (error) {
      console.error(
        "Error deleting income:",
        error
      );

      setMessage(
        getErrorMessage(error)
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardShell
      title="Income"
      subtitle="Manage income received by Skip Co"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">
              Income
            </h1>

            <p className="mt-1 text-sm text-charcoal-500 dark:text-charcoal-400">
              Record and manage money received by
              the business.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4" />
            Add Income
          </button>
        </div>

        {/* Message */}
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
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">
                  Total Income
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalIncome)}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-950/40">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">
              Transactions
            </p>

            <p className="mt-2 text-2xl font-bold text-charcoal-900 dark:text-white">
              {filteredTransactions.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-charcoal-200 bg-white p-4 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search income..."
                className="w-full rounded-xl border border-charcoal-200 bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
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
                className="rounded-xl border border-charcoal-200 bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-charcoal-200 bg-white shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <DollarSign className="h-10 w-10 text-charcoal-300" />

              <h3 className="mt-4 font-semibold text-charcoal-900 dark:text-white">
                No income found
              </h3>

              <p className="mt-1 text-sm text-charcoal-500 dark:text-charcoal-400">
                No income transactions match your
                current filters.
              </p>

              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4" />
                Add Income
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-charcoal-200 bg-charcoal-50 text-left dark:border-charcoal-800 dark:bg-charcoal-950/50">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Reference
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Description
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
                  {filteredTransactions.map(
                    (transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-charcoal-50 dark:hover:bg-charcoal-950/50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-charcoal-600 dark:text-charcoal-300">
                          {formatDate(
                            transaction.transaction_date
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-charcoal-900 dark:text-white">
                          {transaction.reference}
                        </td>

                        <td className="max-w-[250px] px-5 py-4 text-sm text-charcoal-700 dark:text-charcoal-300">
                          <span className="block truncate">
                            {transaction.description}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-charcoal-600 dark:text-charcoal-300">
                          {transaction.customer
                            ?.company_name ||
                            transaction.customer
                              ?.trading_name ||
                            "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(
                            transaction.amount
                          )}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              transaction.payment_status
                            )}`}
                          >
                            {getStatusLabel(
                              transaction.payment_status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  transaction
                                )
                              }
                              className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-cyan-600 dark:hover:bg-charcoal-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  transaction.id
                                )
                              }
                              disabled={
                                deletingId ===
                                transaction.id
                              }
                              className="rounded-lg p-2 text-charcoal-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30"
                              title="Delete"
                            >
                              {deletingId ===
                              transaction.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

                <tfoot>
                  <tr className="border-t-2 border-charcoal-200 bg-charcoal-50 dark:border-charcoal-700 dark:bg-charcoal-950/70">
                    <td
                      colSpan={4}
                      className="px-5 py-4 text-right text-sm font-bold text-charcoal-900 dark:text-white"
                    >
                      Total
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalIncome)}
                    </td>

                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
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
                scale: 0.96,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 10,
              }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-charcoal-900"
            >
              <div className="flex items-center justify-between border-b border-charcoal-200 px-6 py-4 dark:border-charcoal-800">
                <div>
                  <h2 className="text-lg font-bold text-charcoal-900 dark:text-white">
                    {editingTransaction
                      ? "Edit Income"
                      : "Add Income"}
                  </h2>

                  <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
                    Record an income transaction.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5 p-6"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Date
                    </label>

                    <input
                      type="date"
                      value={form.transaction_date}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          transaction_date:
                            event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Reference
                    </label>

                    <input
                      type="text"
                      value={form.reference}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          reference:
                            event.target.value,
                        }))
                      }
                      placeholder="INV-1001"
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                    Description
                  </label>

                  <input
                    type="text"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }))
                    }
                    placeholder="General waste collection"
                    className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Amount
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-charcoal-400">
                        R
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            amount:
                              event.target.value,
                          }))
                        }
                        placeholder="0.00"
                        className="w-full rounded-xl border border-charcoal-200 bg-white py-2.5 pl-8 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Payment Status
                    </label>

                    <select
                      value={form.payment_status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          payment_status:
                            event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    >
                      <option value="paid">
                        Paid
                      </option>

                      <option value="partially_paid">
                        Partially Paid
                      </option>

                      <option value="unpaid">
                        Unpaid
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                    Customer
                  </label>

                  <select
                    value={form.customer_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customer_id:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                  >
                    <option value="">
                      No customer
                    </option>

                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.company_name ||
                          customer.trading_name ||
                          customer.customer_number ||
                          "Customer"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Optional notes..."
                    className="w-full resize-none rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-charcoal-200 pt-5 sm:flex-row sm:justify-end dark:border-charcoal-800">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-charcoal-200 px-4 py-2.5 text-sm font-semibold text-charcoal-700 hover:bg-charcoal-50 disabled:opacity-50 dark:border-charcoal-700 dark:text-charcoal-300 dark:hover:bg-charcoal-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
                  >
                    {saving && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {editingTransaction
                      ? "Update Income"
                      : "Save Income"}
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