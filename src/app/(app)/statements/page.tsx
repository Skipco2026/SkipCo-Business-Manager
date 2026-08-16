"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Loader2,
  Printer,
  Search,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/client";

interface Customer {
  id: string;
  customer_number: string;
  company_name: string;
  trading_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  physical_address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  total: number;
  status: string;
  notes?: string | null;
}

interface Payment {
  id: string;
  payment_number: string;
  customer_id: string;
  payment_date: string;
  amount: number;
  payment_method?: string | null;
  reference?: string | null;
  notes?: string | null;
}

interface StatementTransaction {
  id: string;
  date: string;
  type: "Invoice" | "Payment";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  dueDate?: string | null;
  status?: string | null;
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getDefaultStartDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - 12);
  return date.toISOString().split("T")[0];
}

function getDefaultEndDate() {
  return getTodayString();
}

export default function StatementsPage() {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [statementDate, setStatementDate] =
    useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingStatement, setLoadingStatement] =
    useState(false);

  const [error, setError] = useState("");

  /* =========================================================
     LOAD CUSTOMERS
  ========================================================= */

  useEffect(() => {
    setStartDate(getDefaultStartDate());
    setEndDate(getDefaultEndDate());
    setStatementDate(getTodayString());
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("customers")
      .select(
        `
        id,
        customer_number,
        company_name,
        trading_name,
        contact_person,
        email,
        phone,
        physical_address,
        city,
        province,
        postal_code
        `
      )
      .order("company_name", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Customer loading error:",
        error
      );

      setError(
        `Unable to load customers: ${error.message}`
      );

      setLoading(false);
      return;
    }

    setCustomers(data ?? []);
    setLoading(false);
  }

  /* =========================================================
     LOAD INVOICES + PAYMENTS
  ========================================================= */

  async function loadStatementData(
    customerId: string
  ) {
    if (!customerId) {
      setInvoices([]);
      setPayments([]);
      return;
    }

    setLoadingStatement(true);
    setError("");

    const [
      invoicesResult,
      paymentsResult,
    ] = await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", customerId)
        .order("invoice_date", {
          ascending: true,
        }),

      supabase
        .from("payments")
        .select("*")
        .eq("customer_id", customerId)
        .order("payment_date", {
          ascending: true,
        }),
    ]);

    if (invoicesResult.error) {
      console.error(
        "Invoice loading error:",
        invoicesResult.error
      );

      setError(
        `Unable to load invoices: ${invoicesResult.error.message}`
      );

      setLoadingStatement(false);
      return;
    }

    if (paymentsResult.error) {
      console.error(
        "Payment loading error:",
        paymentsResult.error
      );

      setError(
        `Unable to load payments: ${paymentsResult.error.message}`
      );

      setLoadingStatement(false);
      return;
    }

    setInvoices(
      (invoicesResult.data ?? []) as Invoice[]
    );

    setPayments(
      (paymentsResult.data ?? []) as Payment[]
    );

    setLoadingStatement(false);
  }

  useEffect(() => {
    if (selectedCustomerId) {
      loadStatementData(selectedCustomerId);
    } else {
      setInvoices([]);
      setPayments([]);
    }
  }, [selectedCustomerId]);

  /* =========================================================
     CUSTOMER SEARCH
  ========================================================= */

  const filteredCustomers = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.company_name
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.trading_name
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.customer_number
          ?.toLowerCase()
          .includes(searchValue)
    );
  }, [customers, search]);

  /* =========================================================
     SELECTED CUSTOMER
  ========================================================= */

  const selectedCustomer =
    customers.find(
      (customer) =>
        customer.id === selectedCustomerId
    ) ?? null;

  /* =========================================================
     DATE HELPERS
  ========================================================= */

  function isBeforeDate(
    value: string,
    comparison: string
  ) {
    return value < comparison;
  }

  function isWithinDateRange(
    value: string
  ) {
    if (!startDate || !endDate) {
      return false;
    }

    return (
      value >= startDate &&
      value <= endDate
    );
  }

  /* =========================================================
     OPENING BALANCE
  ========================================================= */

  const openingBalance = useMemo(() => {
    if (!selectedCustomerId || !startDate) {
      return 0;
    }

    const invoicesBeforePeriod =
      invoices
        .filter((invoice) =>
          isBeforeDate(
            invoice.invoice_date,
            startDate
          )
        )
        .reduce(
          (total, invoice) =>
            total +
            Number(invoice.total || 0),
          0
        );

    const paymentsBeforePeriod =
      payments
        .filter((payment) =>
          isBeforeDate(
            payment.payment_date,
            startDate
          )
        )
        .reduce(
          (total, payment) =>
            total +
            Number(payment.amount || 0),
          0
        );

    return (
      invoicesBeforePeriod -
      paymentsBeforePeriod
    );
  }, [
    invoices,
    payments,
    selectedCustomerId,
    startDate,
  ]);

  /* =========================================================
     STATEMENT TRANSACTIONS
  ========================================================= */

  const transactions =
    useMemo<StatementTransaction[]>(() => {
      if (!selectedCustomerId) {
        return [];
      }

      const transactionList: StatementTransaction[] =
        [];

      invoices
        .filter((invoice) =>
          isWithinDateRange(
            invoice.invoice_date
          )
        )
        .forEach((invoice) => {
          transactionList.push({
            id: `invoice-${invoice.id}`,
            date: invoice.invoice_date,
            type: "Invoice",
            reference:
              invoice.invoice_number,
            description: "Invoice",
            debit: Number(
              invoice.total || 0
            ),
            credit: 0,
            balance: 0,
            dueDate: invoice.due_date,
            status: invoice.status,
          });
        });

      payments
        .filter((payment) =>
          isWithinDateRange(
            payment.payment_date
          )
        )
        .forEach((payment) => {
          transactionList.push({
            id: `payment-${payment.id}`,
            date: payment.payment_date,
            type: "Payment",
            reference:
              payment.payment_number,
            description:
              payment.payment_method
                ? `Payment - ${payment.payment_method}`
                : "Payment",
            debit: 0,
            credit: Number(
              payment.amount || 0
            ),
            balance: 0,
            status: null,
          });
        });

      transactionList.sort((a, b) => {
        if (a.date === b.date) {
          if (
            a.type === "Invoice" &&
            b.type === "Payment"
          ) {
            return -1;
          }

          if (
            a.type === "Payment" &&
            b.type === "Invoice"
          ) {
            return 1;
          }

          return 0;
        }

        return a.date.localeCompare(b.date);
      });

      let runningBalance =
        openingBalance;

      return transactionList.map(
        (transaction) => {
          runningBalance +=
            transaction.debit -
            transaction.credit;

          return {
            ...transaction,
            balance: runningBalance,
          };
        }
      );
    }, [
      invoices,
      payments,
      selectedCustomerId,
      startDate,
      endDate,
      openingBalance,
    ]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const totalInvoices =
    transactions.reduce(
      (total, transaction) =>
        total + transaction.debit,
      0
    );

  const totalPayments =
    transactions.reduce(
      (total, transaction) =>
        total + transaction.credit,
      0
    );

  const closingBalance =
    openingBalance +
    totalInvoices -
    totalPayments;

  const overdueAmount =
    useMemo(() => {
      if (!selectedCustomerId) {
        return 0;
      }

      const todayString =
        statementDate || getTodayString();

      const totalInvoiced = invoices
        .filter(
          (invoice) =>
            invoice.due_date < todayString &&
            Number(invoice.total || 0) > 0 &&
            invoice.status !== "Paid"
        )
        .reduce(
          (total, invoice) =>
            total + Number(invoice.total || 0),
          0
        );

      return Math.max(0, totalInvoiced);
    }, [
      invoices,
      selectedCustomerId,
      statementDate,
    ]);

  /* =========================================================
     FORMATTERS
  ========================================================= */

  function formatCurrency(
    value: number
  ) {
    return `R ${Number(
      value || 0
    ).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(
    value?: string | null
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(`${value}T00:00:00`);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-ZA",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  /* =========================================================
     PRINT
  ========================================================= */

  function printStatement() {
    if (!selectedCustomer) {
      return;
    }

    window.print();
  }

  /* =========================================================
     CLEAR
  ========================================================= */

  function clearStatement() {
    setSelectedCustomerId("");
    setSearch("");
    setInvoices([]);
    setPayments([]);
    setError("");
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <DashboardShell
      title="Statements"
      subtitle="Customer account statements and outstanding balances"
    >
      <PageHeader
        title="Customer Statements"
        description="View customer invoices, payments and account balances."
        icon={FileText}
        action={{
          label: "Print Statement",
          href: "#",
        }}
      />

      <div className="space-y-6">

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            CUSTOMER SELECTION
        ================================================= */}

        <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

          <div className="mb-5">

            <h2 className="text-lg font-semibold text-charcoal-900">
              Select Customer
            </h2>

            <p className="mt-1 text-sm text-charcoal-500">
              Choose a customer to view their account statement.
            </p>

          </div>

          <div className="grid gap-5 md:grid-cols-3">

            {/* Customer Search */}

            <div className="md:col-span-1">

              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Search Customer
              </label>

              <div className="relative">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search by name or number..."
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />

              </div>

            </div>

            {/* Customer */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Customer
              </label>

              <select
                value={selectedCustomerId}
                onChange={(event) =>
                  setSelectedCustomerId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
              >
                <option value="">
                  Select a customer
                </option>

                {filteredCustomers.map(
                  (customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.company_name} —{" "}
                      {
                        customer.customer_number
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            {/* Start Date */}

            <div>

              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Statement From
              </label>

              <div className="relative">

                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />

              </div>

            </div>

            {/* End Date */}

            <div>

              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Statement To
              </label>

              <div className="relative">

                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                <input
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />

              </div>

            </div>

            {/* Actions */}

            <div className="flex items-end gap-2">

              <button
                type="button"
                onClick={clearStatement}
                className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>

              <button
                type="button"
                onClick={printStatement}
                disabled={
                  !selectedCustomer ||
                  loadingStatement
                }
                className="inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-charcoal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loadingStatement && (
          <div className="flex items-center justify-center rounded-2xl border border-charcoal-100 bg-white px-6 py-16 shadow-sm">

            <Loader2 className="h-6 w-6 animate-spin text-[#20AEB8]" />

            <span className="ml-3 text-sm text-charcoal-500">
              Loading customer statement...
            </span>

          </div>
        )}

        {/* =================================================
            STATEMENT
        ================================================= */}

        {!loadingStatement &&
          selectedCustomer && (
            <div
              id="statement-print-area"
              className="space-y-6"
            >

              {/* Customer Header */}

              <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

                <div className="flex flex-col justify-between gap-6 md:flex-row">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                      Customer Statement
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-charcoal-900">
                      {
                        selectedCustomer.company_name
                      }
                    </h2>

                    {selectedCustomer.trading_name && (
                      <p className="mt-1 text-sm text-charcoal-500">
                        Trading as{" "}
                        {
                          selectedCustomer.trading_name
                        }
                      </p>
                    )}

                    <p className="mt-3 text-sm text-charcoal-600">
                      Customer No:{" "}
                      <span className="font-medium">
                        {
                          selectedCustomer.customer_number
                        }
                      </span>
                    </p>

                    {selectedCustomer.contact_person && (
                      <p className="mt-1 text-sm text-charcoal-600">
                        Contact:{" "}
                        {
                          selectedCustomer.contact_person
                        }
                      </p>
                    )}

                    {selectedCustomer.email && (
                      <p className="mt-1 text-sm text-charcoal-600">
                        {
                          selectedCustomer.email
                        }
                      </p>
                    )}

                    {selectedCustomer.phone && (
                      <p className="mt-1 text-sm text-charcoal-600">
                        {
                          selectedCustomer.phone
                        }
                      </p>
                    )}

                  </div>

                  <div className="text-left md:text-right">

                    <p className="text-sm text-charcoal-500">
                      Statement Period
                    </p>

                    <p className="mt-1 font-semibold text-charcoal-900">
                      {formatDate(startDate)}{" "}
                      –{" "}
                      {formatDate(endDate)}
                    </p>

                    <p className="mt-4 text-sm text-charcoal-500">
                      Statement Date
                    </p>

                    <p className="mt-1 font-semibold text-charcoal-900">
                      {statementDate
                        ? formatDate(statementDate)
                        : "—"}
                    </p>

                  </div>

                </div>

              </div>

              {/* Summary */}

              <div className="grid gap-4 md:grid-cols-4">

                <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

                  <p className="text-sm text-charcoal-500">
                    Opening Balance
                  </p>

                  <p className="mt-2 text-xl font-bold text-charcoal-900">
                    {formatCurrency(
                      openingBalance
                    )}
                  </p>

                </div>

                <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

                  <p className="text-sm text-charcoal-500">
                    Invoiced
                  </p>

                  <p className="mt-2 text-xl font-bold text-charcoal-900">
                    {formatCurrency(
                      totalInvoices
                    )}
                  </p>

                </div>

                <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

                  <p className="text-sm text-charcoal-500">
                    Payments
                  </p>

                  <p className="mt-2 text-xl font-bold text-[#20AEB8]">
                    {formatCurrency(
                      totalPayments
                    )}
                  </p>

                </div>

                <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

                  <p className="text-sm text-charcoal-500">
                    Outstanding
                  </p>

                  <p
                    className={`mt-2 text-xl font-bold ${
                      closingBalance > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCurrency(
                      closingBalance
                    )}
                  </p>

                </div>

              </div>

              {/* Overdue */}

              {overdueAmount > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">

                  <p className="text-sm font-semibold text-red-800">
                    Overdue Balance
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    This customer has{" "}
                    <span className="font-bold">
                      {formatCurrency(
                        overdueAmount
                      )}
                    </span>{" "}
                    in overdue invoices.
                  </p>

                </div>
              )}

              {/* Transactions */}

              <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm">

                <div className="border-b border-charcoal-100 p-6">

                  <h3 className="text-lg font-semibold text-charcoal-900">
                    Account Transactions
                  </h3>

                  <p className="mt-1 text-sm text-charcoal-500">
                    Invoices and payments for the selected period.
                  </p>

                </div>

                {transactions.length === 0 ? (
                  <div className="px-6 py-16 text-center">

                    <FileText className="mx-auto h-10 w-10 text-charcoal-300" />

                    <p className="mt-4 text-sm font-medium text-charcoal-700">
                      No transactions found
                    </p>

                    <p className="mt-1 text-sm text-charcoal-500">
                      There are no invoices or payments in this period.
                    </p>

                  </div>
                ) : (
                  <div className="overflow-x-auto">

                    <table className="w-full">

                      <thead>

                        <tr className="border-b border-charcoal-100 bg-charcoal-50 text-left">

                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                            Date
                          </th>

                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                            Type
                          </th>

                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                            Reference
                          </th>

                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                            Debit
                          </th>

                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                            Credit
                          </th>

                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                            Balance
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-charcoal-100">

                        {/* Opening */}

                        <tr className="bg-charcoal-50/50">

                          <td
                            colSpan={5}
                            className="px-6 py-4 text-sm font-medium text-charcoal-700"
                          >
                            Opening Balance
                          </td>

                          <td className="px-6 py-4 text-right text-sm font-semibold text-charcoal-900">
                            {formatCurrency(
                              openingBalance
                            )}
                          </td>

                        </tr>

                        {transactions.map(
                          (transaction) => (
                            <tr
                              key={
                                transaction.id
                              }
                              className="hover:bg-charcoal-50/50"
                            >

                              <td className="whitespace-nowrap px-6 py-4 text-sm text-charcoal-600">
                                {formatDate(
                                  transaction.date
                                )}
                              </td>

                              <td className="px-6 py-4">

                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                    transaction.type ===
                                    "Invoice"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {
                                    transaction.type
                                  }
                                </span>

                              </td>

                              <td className="px-6 py-4">

                                <div className="text-sm font-medium text-charcoal-900">
                                  {
                                    transaction.reference
                                  }
                                </div>

                                <div className="mt-1 text-xs text-charcoal-500">
                                  {
                                    transaction.description
                                  }
                                </div>

                              </td>

                              <td className="px-6 py-4 text-right text-sm font-medium text-charcoal-900">
                                {transaction.debit >
                                0
                                  ? formatCurrency(
                                      transaction.debit
                                    )
                                  : "—"}
                              </td>

                              <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                                {transaction.credit >
                                0
                                  ? formatCurrency(
                                      transaction.credit
                                    )
                                  : "—"}
                              </td>

                              <td className="px-6 py-4 text-right text-sm font-semibold text-charcoal-900">
                                {formatCurrency(
                                  transaction.balance
                                )}
                              </td>

                            </tr>
                          )
                        )}

                        {/* Closing */}

                        <tr className="border-t-2 border-charcoal-200 bg-charcoal-50">

                          <td
                            colSpan={3}
                            className="px-6 py-4 text-sm font-bold uppercase tracking-wide text-charcoal-900"
                          >
                            Closing Balance
                          </td>

                          <td className="px-6 py-4 text-right text-sm font-semibold text-charcoal-900">
                            {formatCurrency(
                              totalInvoices
                            )}
                          </td>

                          <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                            {formatCurrency(
                              totalPayments
                            )}
                          </td>

                          <td
                            className={`px-6 py-4 text-right text-sm font-bold ${
                              closingBalance >
                              0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {formatCurrency(
                              closingBalance
                            )}
                          </td>

                        </tr>

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

            </div>
          )}

        {/* =================================================
            NO CUSTOMER
        ================================================= */}

        {!loading &&
          !loadingStatement &&
          !selectedCustomer && (
            <div className="rounded-2xl border border-charcoal-100 bg-white px-6 py-20 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-charcoal-50">

                <FileText className="h-7 w-7 text-charcoal-400" />

              </div>

              <h2 className="mt-5 text-lg font-semibold text-charcoal-900">
                Select a customer
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-charcoal-500">
                Choose a customer above to view their invoices, payments and outstanding account balance.
              </p>

            </div>
          )}

      </div>

      {/* =====================================================
          PRINT STYLES
      ===================================================== */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          aside,
          nav,
          button,
          input,
          select,
          textarea,
          #statement-print-area
            ~ * {
            display: none !important;
          }

          #statement-print-area {
            display: block !important;
            width: 100% !important;
          }

          #statement-print-area * {
            visibility: visible !important;
          }

          .shadow-sm {
            box-shadow: none !important;
          }

          .border {
            border-color: #d1d5db !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
    </DashboardShell>
  );
}