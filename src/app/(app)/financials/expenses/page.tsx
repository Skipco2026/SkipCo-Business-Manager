"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Edit,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";

type ExpenseType =
  | "General Expense"
  | "3rd Party Invoice"
  | "Fuel"
  | "Vehicle"
  | "Repairs & Maintenance"
  | "Equipment"
  | "Office"
  | "Other";

type PaymentStatus = "paid" | "partially_paid" | "unpaid";

interface Customer {
  id: string;
  customer_number: string | null;
  company_name: string | null;
  trading_name: string | null;
}

interface FinancialTransaction {
  id: string;
  transaction_date: string;
  reference: string;
  type: "income" | "expense" | "kickback";
  description: string;
  amount: number;
  customer_id: string | null;
  job_id: string | null;
  expense_type: string | null;
  supplier: string | null;
  invoice_number: string | null;
  payment_status: PaymentStatus | null;
  due_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer | Customer[] | null;
}

interface ExpenseFormData {
  transaction_date: string;
  reference: string;
  description: string;
  amount: string;
  expense_type: ExpenseType;
  supplier: string;
  invoice_number: string;
  payment_status: PaymentStatus;
  due_date: string;
  notes: string;
}

interface SupabaseErrorLike {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

const EXPENSE_TYPES: ExpenseType[] = [
  "General Expense",
  "3rd Party Invoice",
  "Fuel",
  "Vehicle",
  "Repairs & Maintenance",
  "Equipment",
  "Office",
  "Other",
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
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

function normalizeCustomer(
  customer: Customer | Customer[] | null | undefined
): Customer | null {
  if (!customer) return null;
  return Array.isArray(customer) ? customer[0] ?? null : customer;
}

function getCustomerName(customer: Customer | null) {
  if (!customer) return "—";

  return (
    customer.trading_name ||
    customer.company_name ||
    customer.customer_number ||
    "—"
  );
}

export default function ExpensesPage() {
  const supabase = createClient();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<FinancialTransaction | null>(null);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [form, setForm] = useState<ExpenseFormData>({
    transaction_date: getToday(),
    reference: "",
    description: "",
    amount: "",
    expense_type: "General Expense",
    supplier: "",
    invoice_number: "",
    payment_status: "unpaid",
    due_date: "",
    notes: "",
  });

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage(null);

    try {
      const [transactionsResult, customersResult] = await Promise.all([
        supabase
          .from("financial_transactions")
          .select(
            `
              id,
              transaction_date,
              reference,
              type,
              description,
              amount,
              customer_id,
              job_id,
              expense_type,
              supplier,
              invoice_number,
              payment_status,
              due_date,
              payment_method,
              notes,
              created_at,
              updated_at,
              customer:customers (
                id,
                customer_number,
                company_name,
                trading_name
              )
            `
          )
          .eq("type", "expense")
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false }),

        supabase
          .from("customers")
          .select(
            "id, customer_number, company_name, trading_name"
          )
          .order("company_name", { ascending: true }),
      ]);

      if (transactionsResult.error) {
        throw transactionsResult.error;
      }

      if (customersResult.error) {
        throw customersResult.error;
      }

      const normalizedTransactions = (
        transactionsResult.data ?? []
      ).map((transaction) => ({
        ...transaction,
        customer: normalizeCustomer(transaction.customer),
      })) as FinancialTransaction[];

      setTransactions(normalizedTransactions);
      setCustomers((customersResult.data ?? []) as Customer[]);
    } catch (error) {
      console.error(
        "Error loading expenses:",
        JSON.stringify(error, null, 2)
      );

      const supabaseError = error as SupabaseErrorLike;

      setMessage({
        type: "error",
        text:
          supabaseError?.message ||
          "Unable to load expenses. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingTransaction(null);

    setForm({
      transaction_date: getToday(),
      reference: "",
      description: "",
      amount: "",
      expense_type: "General Expense",
      supplier: "",
      invoice_number: "",
      payment_status: "unpaid",
      due_date: "",
      notes: "",
    });

    setMessage(null);
    setModalOpen(true);
  }

  function openEditModal(transaction: FinancialTransaction) {
    setEditingTransaction(transaction);

    setForm({
      transaction_date:
        transaction.transaction_date || getToday(),
      reference: transaction.reference || "",
      description: transaction.description || "",
      amount: String(transaction.amount ?? ""),
      expense_type:
        (transaction.expense_type as ExpenseType) ||
        "General Expense",
      supplier: transaction.supplier || "",
      invoice_number: transaction.invoice_number || "",
      payment_status:
        transaction.payment_status || "unpaid",
      due_date: transaction.due_date || "",
      notes: transaction.notes || "",
    });

    setMessage(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingTransaction(null);
  }

  function handleFormChange(
    field: keyof ExpenseFormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);

    if (!form.transaction_date) {
      setMessage({
        type: "error",
        text: "Please select an expense date.",
      });
      return;
    }

    if (!form.reference.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a reference.",
      });
      return;
    }

    if (!form.description.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a description.",
      });
      return;
    }

    const amount = Number(form.amount);

    if (!form.amount || !Number.isFinite(amount) || amount < 0) {
      setMessage({
        type: "error",
        text: "Please enter a valid amount.",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        transaction_date: form.transaction_date,
        reference: form.reference.trim(),
        description: form.description.trim(),
        amount,
        type: "expense",
        expense_type: form.expense_type,
        supplier: form.supplier.trim() || null,
        invoice_number: form.invoice_number.trim() || null,
        payment_status: form.payment_status || null,
        due_date: form.due_date || null,
        notes: form.notes.trim() || null,
      };

      if (editingTransaction) {
        const { data, error } = await supabase
          .from("financial_transactions")
          .update(payload)
          .eq("id", editingTransaction.id)
          .select(
            `
              id,
              transaction_date,
              reference,
              type,
              description,
              amount,
              customer_id,
              job_id,
              expense_type,
              supplier,
              invoice_number,
              payment_status,
              due_date,
              payment_method,
              notes,
              created_at,
              updated_at,
              customer:customers (
                id,
                customer_number,
                company_name,
                trading_name
              )
            `
          )
          .single();

        if (error) {
          console.error(
            "Supabase update error:",
            JSON.stringify(error, null, 2)
          );
          console.error("Update error message:", error.message);
          console.error("Update error details:", error.details);
          console.error("Update error hint:", error.hint);
          console.error("Update error code:", error.code);

          throw error;
        }

        const updatedTransaction = {
          ...data,
          customer: normalizeCustomer(data.customer),
        } as FinancialTransaction;

        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === updatedTransaction.id
              ? updatedTransaction
              : transaction
          )
        );

        setMessage({
          type: "success",
          text: "Expense updated successfully.",
        });
      } else {
        const { data, error } = await supabase
          .from("financial_transactions")
          .insert(payload)
          .select(
            `
              id,
              transaction_date,
              reference,
              type,
              description,
              amount,
              customer_id,
              job_id,
              expense_type,
              supplier,
              invoice_number,
              payment_status,
              due_date,
              payment_method,
              notes,
              created_at,
              updated_at,
              customer:customers (
                id,
                customer_number,
                company_name,
                trading_name
              )
            `
          )
          .single();

        if (error) {
          console.error(
            "Supabase insert error:",
            JSON.stringify(error, null, 2)
          );
          console.error("Insert error message:", error.message);
          console.error("Insert error details:", error.details);
          console.error("Insert error hint:", error.hint);
          console.error("Insert error code:", error.code);

          throw error;
        }

        const newTransaction = {
          ...data,
          customer: normalizeCustomer(data.customer),
        } as FinancialTransaction;

        setTransactions((current) => [
          newTransaction,
          ...current,
        ]);

        setMessage({
          type: "success",
          text: "Expense saved successfully.",
        });
      }

      setModalOpen(false);
      setEditingTransaction(null);

      window.setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error(
        "Error saving expense:",
        JSON.stringify(error, null, 2)
      );

      const supabaseError = error as SupabaseErrorLike;

      console.error("Error message:", supabaseError?.message);
      console.error("Error details:", supabaseError?.details);
      console.error("Error hint:", supabaseError?.hint);
      console.error("Error code:", supabaseError?.code);

      setMessage({
        type: "error",
        text:
          supabaseError?.message ||
          supabaseError?.details ||
          "Unable to save expense. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(transaction: FinancialTransaction) {
    const confirmed = window.confirm(
      `Are you sure you want to delete expense "${transaction.reference}"?`
    );

    if (!confirmed) return;

    setMessage(null);

    try {
      const { error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", transaction.id);

      if (error) {
        console.error(
          "Supabase delete error:",
          JSON.stringify(error, null, 2)
        );
        throw error;
      }

      setTransactions((current) =>
        current.filter(
          (item) => item.id !== transaction.id
        )
      );

      setMessage({
        type: "success",
        text: "Expense deleted successfully.",
      });

      window.setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error(
        "Error deleting expense:",
        JSON.stringify(error, null, 2)
      );

      const supabaseError = error as SupabaseErrorLike;

      setMessage({
        type: "error",
        text:
          supabaseError?.message ||
          "Unable to delete expense. Please try again.",
      });
    }
  }

  const filteredTransactions = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesMonth =
        transaction.transaction_date?.startsWith(
          selectedMonth
        );

      if (!matchesMonth) return false;

      if (!searchTerm) return true;

      const customer = normalizeCustomer(
        transaction.customer
      );

      const searchableText = [
        transaction.reference,
        transaction.description,
        transaction.expense_type,
        transaction.supplier,
        transaction.invoice_number,
        transaction.notes,
        customer?.customer_number,
        customer?.company_name,
        customer?.trading_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [transactions, selectedMonth, search]);

  const summary = useMemo(() => {
    const total = filteredTransactions.reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount || 0),
      0
    );

    const paid = filteredTransactions
      .filter(
        (transaction) =>
          transaction.payment_status === "paid"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );

    const partiallyPaid = filteredTransactions
      .filter(
        (transaction) =>
          transaction.payment_status ===
          "partially_paid"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );

    const unpaid = filteredTransactions
      .filter(
        (transaction) =>
          transaction.payment_status === "unpaid"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );

    return {
      total,
      paid,
      partiallyPaid,
      unpaid,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  return (
    <DashboardShell
      title="Expenses"
      subtitle="Track business expenses, supplier invoices and payments"
    >
      <div className="space-y-6">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                  Total Expenses
                </p>
                <p className="mt-2 text-2xl font-bold text-charcoal-900 dark:text-white">
                  {formatCurrency(summary.total)}
                </p>
              </div>

              <div className="rounded-xl bg-red-100 p-3 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                  Paid
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {formatCurrency(summary.paid)}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                  Partially Paid
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {formatCurrency(summary.partiallyPaid)}
                </p>
              </div>

              <div className="rounded-xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                  Unpaid
                </p>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {formatCurrency(summary.unpaid)}
                </p>
              </div>

              <div className="rounded-xl bg-red-100 p-3 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search expenses..."
                className="w-full rounded-xl border border-charcoal-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
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
                className="w-full rounded-xl border border-charcoal-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-charcoal-200 bg-white shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="border-b border-charcoal-200 bg-charcoal-50 dark:border-charcoal-800 dark:bg-charcoal-950/50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                    Date
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                    Reference
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                    Description
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                    Type
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                    Supplier
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center"
                    >
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-600" />
                      <p className="mt-3 text-sm text-charcoal-500">
                        Loading expenses...
                      </p>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center"
                    >
                      <FileText className="mx-auto h-8 w-8 text-charcoal-300 dark:text-charcoal-600" />

                      <p className="mt-3 text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                        No expenses found
                      </p>

                      <p className="mt-1 text-sm text-charcoal-500">
                        Add your first expense for this month.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-charcoal-50/70 dark:hover:bg-charcoal-800/40"
                    >
                      <td className="px-5 py-4 text-sm text-charcoal-700 dark:text-charcoal-300">
                        {formatDate(
                          transaction.transaction_date
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-charcoal-900 dark:text-white">
                        {transaction.reference}
                      </td>

                      <td className="px-5 py-4 text-sm text-charcoal-700 dark:text-charcoal-300">
                        <div className="max-w-[260px]">
                          <p className="truncate">
                            {transaction.description}
                          </p>

                          {transaction.invoice_number && (
                            <p className="mt-1 text-xs text-charcoal-400">
                              Invoice:{" "}
                              {transaction.invoice_number}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-charcoal-700 dark:text-charcoal-300">
                        {transaction.expense_type || "Other"}
                      </td>

                      <td className="px-5 py-4 text-sm text-charcoal-700 dark:text-charcoal-300">
                        {transaction.supplier || "—"}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(
                          Number(transaction.amount || 0)
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
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
                              openEditModal(transaction)
                            }
                            className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-teal-600 dark:hover:bg-charcoal-800"
                            title="Edit expense"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(transaction)
                            }
                            className="rounded-lg p-2 text-charcoal-500 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40"
                            title="Delete expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {!loading && filteredTransactions.length > 0 && (
                <tfoot className="border-t border-charcoal-200 bg-charcoal-50 dark:border-charcoal-800 dark:bg-charcoal-950/50">
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-4 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                    >
                      {summary.count} expense
                      {summary.count === 1 ? "" : "s"}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(summary.total)}
                    </td>

                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

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
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-charcoal-200 bg-white shadow-2xl dark:border-charcoal-800 dark:bg-charcoal-900"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal-200 bg-white px-6 py-5 dark:border-charcoal-800 dark:bg-charcoal-900">
                <div>
                  <h2 className="text-lg font-bold text-charcoal-900 dark:text-white">
                    {editingTransaction
                      ? "Edit Expense"
                      : "Add Expense"}
                  </h2>

                  <p className="mt-1 text-sm text-charcoal-500">
                    Record a business expense.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-900 disabled:opacity-50 dark:hover:bg-charcoal-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleSave}
                className="space-y-5 p-6"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Date *
                    </label>

                    <input
                      type="date"
                      value={form.transaction_date}
                      onChange={(event) =>
                        handleFormChange(
                          "transaction_date",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Reference *
                    </label>

                    <input
                      type="text"
                      value={form.reference}
                      onChange={(event) =>
                        handleFormChange(
                          "reference",
                          event.target.value
                        )
                      }
                      placeholder="EXP-001"
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Description *
                    </label>

                    <input
                      type="text"
                      value={form.description}
                      onChange={(event) =>
                        handleFormChange(
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Describe the expense"
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Amount *
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-charcoal-400">
                        R
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(event) =>
                          handleFormChange(
                            "amount",
                            event.target.value
                          )
                        }
                        placeholder="0.00"
                        className="w-full rounded-xl border border-charcoal-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Expense Type *
                    </label>

                    <select
                      value={form.expense_type}
                      onChange={(event) =>
                        handleFormChange(
                          "expense_type",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    >
                      {EXPENSE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Supplier
                    </label>

                    <input
                      type="text"
                      value={form.supplier}
                      onChange={(event) =>
                        handleFormChange(
                          "supplier",
                          event.target.value
                        )
                      }
                      placeholder="Supplier name"
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Invoice Number
                    </label>

                    <input
                      type="text"
                      value={form.invoice_number}
                      onChange={(event) =>
                        handleFormChange(
                          "invoice_number",
                          event.target.value
                        )
                      }
                      placeholder="Supplier invoice number"
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Payment Status
                    </label>

                    <select
                      value={form.payment_status}
                      onChange={(event) =>
                        handleFormChange(
                          "payment_status",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    >
                      <option value="paid">Paid</option>
                      <option value="partially_paid">
                        Partially Paid
                      </option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Due Date
                    </label>

                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(event) =>
                        handleFormChange(
                          "due_date",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Notes
                    </label>

                    <textarea
                      value={form.notes}
                      onChange={(event) =>
                        handleFormChange(
                          "notes",
                          event.target.value
                        )
                      }
                      rows={4}
                      placeholder="Additional notes..."
                      className="w-full resize-none rounded-xl border border-charcoal-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-charcoal-200 pt-5 sm:flex-row sm:justify-end dark:border-charcoal-800">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-charcoal-200 px-5 py-3 text-sm font-semibold text-charcoal-700 transition hover:bg-charcoal-50 disabled:opacity-50 dark:border-charcoal-700 dark:text-charcoal-300 dark:hover:bg-charcoal-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4" />
                        {editingTransaction
                          ? "Update Expense"
                          : "Save Expense"}
                      </>
                    )}
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