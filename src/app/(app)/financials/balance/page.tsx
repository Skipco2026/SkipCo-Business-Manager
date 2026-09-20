"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Loader2,
  MinusCircle,
  Search,
  Wallet,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";

type TransactionType = "income" | "expense" | "kickback";

interface FinancialTransaction {
  id: string;
  transaction_date: string;
  reference: string;
  type: TransactionType;
  description: string;
  amount: number;
  customer_id: string | null;
  job_id: string | null;
  supplier: string | null;
  invoice_number: string | null;
  payment_status: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

interface StatementRow extends FinancialTransaction {
  income: number;
  expense: number;
  kickback: number;
  runningBalance: number;
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

function getTransactionLabel(type: TransactionType) {
  switch (type) {
    case "income":
      return "Income";

    case "expense":
      return "Expense";

    case "kickback":
      return "Kickback";

    default:
      return type;
  }
}

function getTransactionClasses(type: TransactionType) {
  switch (type) {
    case "income":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";

    case "expense":
      return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";

    case "kickback":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";

    default:
      return "bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300";
  }
}

function getTransactionIcon(type: TransactionType) {
  switch (type) {
    case "income":
      return <ArrowUpCircle className="h-4 w-4" />;

    case "expense":
      return <ArrowDownCircle className="h-4 w-4" />;

    case "kickback":
      return <MinusCircle className="h-4 w-4" />;

    default:
      return <FileText className="h-4 w-4" />;
  }
}

export default function BalancePage() {
  const supabase = createClient();

  const [transactions, setTransactions] = useState<
    FinancialTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(
    getCurrentMonth()
  );

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<
    "all" | TransactionType
  >("all");

  const [message, setMessage] = useState<string | null>(null);

  async function loadTransactions() {
    try {
      setLoading(true);
      setMessage(null);

      const { data, error } = await supabase
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
            supplier,
            invoice_number,
            payment_status,
            due_date,
            notes,
            created_at
          `
        )
        .order("transaction_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      const normalizedTransactions: FinancialTransaction[] = (
        (data ?? []) as FinancialTransaction[]
      ).map((transaction) => ({
        ...transaction,
        amount: Number(transaction.amount) || 0,
      }));

      setTransactions(normalizedTransactions);
    } catch (error) {
      console.error("Error loading financial transactions:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load financial transactions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  /*
   * Transactions for the selected month.
   */
  const monthTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        !selectedMonth ||
        transaction.transaction_date?.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  /*
   * Summary totals for the selected month.
   */
  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );
  }, [monthTransactions]);

  const totalExpenses = useMemo(() => {
    return monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );
  }, [monthTransactions]);

  const totalKickbacks = useMemo(() => {
    return monthTransactions
      .filter((transaction) => transaction.type === "kickback")
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );
  }, [monthTransactions]);

  const balance = totalIncome - totalExpenses - totalKickbacks;

  /*
   * Search and type filtering.
   */
  const filteredTransactions = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return monthTransactions.filter((transaction) => {
      const matchesType =
        typeFilter === "all" ||
        transaction.type === typeFilter;

      const searchable = [
        transaction.reference,
        transaction.description,
        transaction.supplier ?? "",
        transaction.invoice_number ?? "",
        transaction.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue || searchable.includes(searchValue);

      return matchesType && matchesSearch;
    });
  }, [
    monthTransactions,
    search,
    typeFilter,
  ]);

  /*
   * Running balance.
   *
   * We calculate the balance chronologically, regardless of
   * whether the table is later displayed newest-first.
   */
  const statementRows = useMemo<StatementRow[]>(() => {
    const chronological = [...filteredTransactions].sort(
      (a, b) => {
        const dateComparison =
          a.transaction_date.localeCompare(
            b.transaction_date
          );

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return a.created_at.localeCompare(b.created_at);
      }
    );

    let runningBalance = 0;

    const rows = chronological.map((transaction) => {
      const amount = Number(transaction.amount || 0);

      const income =
        transaction.type === "income" ? amount : 0;

      const expense =
        transaction.type === "expense" ? amount : 0;

      const kickback =
        transaction.type === "kickback" ? amount : 0;

      runningBalance += income - expense - kickback;

      return {
        ...transaction,
        income,
        expense,
        kickback,
        runningBalance,
      };
    });

    /*
     * Display newest transactions first.
     */
    return rows.reverse();
  }, [filteredTransactions]);

  return (
    <DashboardShell
      title="Balance & Statement"
      subtitle="View your financial position and transaction statement"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">
            Balance & Statement
          </h1>

          <p className="mt-1 text-sm text-charcoal-500 dark:text-charcoal-400">
            Review income, expenses, kickbacks and your running
            financial balance.
          </p>
        </div>

        {/* Month Selector */}
        <div className="rounded-2xl border border-charcoal-200 bg-white p-4 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-charcoal-900 dark:text-white">
                Statement Period
              </p>

              <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
                Select the month you want to view.
              </p>
            </div>

            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

              <input
                type="month"
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(event.target.value)
                }
                className="rounded-xl border border-charcoal-200 bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Income */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900"
          >
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
                <ArrowUpCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </motion.div>

          {/* Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">
                  Total Expenses
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>

              <div className="rounded-xl bg-red-100 p-3 dark:bg-red-950/40">
                <ArrowDownCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </motion.div>

          {/* Kickbacks */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">
                  Total Kickbacks
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(totalKickbacks)}
                </p>
              </div>

              <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-950/40">
                <MinusCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </motion.div>

          {/* Balance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">
                  Net Balance
                </p>

                <p
                  className={`mt-2 text-2xl font-bold ${
                    balance >= 0
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(balance)}
                </p>
              </div>

              <div className="rounded-xl bg-cyan-100 p-3 dark:bg-cyan-950/40">
                <Wallet className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Statement */}
        <div className="overflow-hidden rounded-2xl border border-charcoal-200 bg-white shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
          {/* Statement Header */}
          <div className="border-b border-charcoal-200 p-5 dark:border-charcoal-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold text-charcoal-900 dark:text-white">
                  Financial Statement
                </h2>

                <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
                  {filteredTransactions.length} transaction
                  {filteredTransactions.length === 1
                    ? ""
                    : "s"} for the selected period
                </p>
              </div>

              {/* Search */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search statement..."
                    className="w-full rounded-xl border border-charcoal-200 bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal-900 outline-none transition placeholder:text-charcoal-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 sm:w-64 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                  />
                </div>

                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(
                        event.target.value as
                          | "all"
                          | TransactionType
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-charcoal-200 bg-white py-2.5 pl-4 pr-10 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 sm:w-40 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expenses</option>
                    <option value="kickback">Kickbacks</option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full bg-charcoal-100 p-4 dark:bg-charcoal-800">
                <CircleDollarSign className="h-7 w-7 text-charcoal-400" />
              </div>

              <h3 className="mt-4 font-semibold text-charcoal-900 dark:text-white">
                No transactions found
              </h3>

              <p className="mt-1 max-w-md text-sm text-charcoal-500 dark:text-charcoal-400">
                There are no financial transactions matching the
                selected month and filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-charcoal-200 bg-charcoal-50 text-left dark:border-charcoal-800 dark:bg-charcoal-950/50">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Ref / Job
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Type
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Description
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Income
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Expense
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Kickback
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Running Balance
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
                  {statementRows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-charcoal-50 dark:hover:bg-charcoal-950/50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-charcoal-600 dark:text-charcoal-300">
                        {formatDate(row.transaction_date)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-semibold text-charcoal-900 dark:text-white">
                          {row.reference}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getTransactionClasses(
                            row.type
                          )}`}
                        >
                          {getTransactionIcon(row.type)}
                          {getTransactionLabel(row.type)}
                        </span>
                      </td>

                      <td className="max-w-[280px] px-5 py-4">
                        <p className="truncate text-sm text-charcoal-700 dark:text-charcoal-300">
                          {row.description}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {row.income > 0
                          ? formatCurrency(row.income)
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                        {row.expense > 0
                          ? formatCurrency(row.expense)
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-amber-600 dark:text-amber-400">
                        {row.kickback > 0
                          ? formatCurrency(row.kickback)
                          : "—"}
                      </td>

                      <td
                        className={`whitespace-nowrap px-5 py-4 text-right text-sm font-bold ${
                          row.runningBalance >= 0
                            ? "text-charcoal-900 dark:text-white"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(row.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Totals */}
                <tfoot>
                  <tr className="border-t-2 border-charcoal-200 bg-charcoal-50 dark:border-charcoal-700 dark:bg-charcoal-950/70">
                    <td
                      colSpan={4}
                      className="px-5 py-4 text-right text-sm font-bold text-charcoal-900 dark:text-white"
                    >
                      Totals
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalIncome)}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(totalExpenses)}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(totalKickbacks)}
                    </td>

                    <td
                      className={`px-5 py-4 text-right text-sm font-bold ${
                        balance >= 0
                          ? "text-charcoal-900 dark:text-white"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(balance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}