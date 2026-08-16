"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/client";

interface Customer {
  id: string;
  company_name: string;
  trading_name?: string | null;
}

interface Payment {
  id: string;
  payment_number: string;
  customer_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference?: string | null;
  notes?: string | null;
  created_at?: string;
  customer?: Customer | null;
}

const PAYMENT_METHODS = [
  "EFT",
  "Cash",
  "Card",
  "Debit Order",
  "Other",
];

export default function PaymentsPage() {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("EFT");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [
      customersResult,
      paymentsResult,
    ] = await Promise.all([
      supabase
        .from("customers")
        .select(
          "id, company_name, trading_name"
        )
        .order("company_name", {
          ascending: true,
        }),

      supabase
        .from("payments")
        .select("*")
        .order("payment_date", {
          ascending: false,
        }),
    ]);

    if (customersResult.error) {
      console.error(
        "Customer loading error:",
        customersResult.error
      );

      setError(
        "Unable to load customers."
      );
    } else {
      setCustomers(
        customersResult.data ?? []
      );
    }

    if (paymentsResult.error) {
      console.error(
        "Payment loading error:",
        paymentsResult.error
      );

      setError(
        "Unable to load payments."
      );
    } else {
      const paymentData =
        paymentsResult.data ?? [];

      const customerMap = new Map(
        (customersResult.data ?? []).map(
          (customer) => [
            customer.id,
            customer,
          ]
        )
      );

      const paymentsWithCustomers =
        paymentData.map((payment) => ({
          ...payment,
          customer:
            customerMap.get(
              payment.customer_id
            ) ?? null,
        }));

      setPayments(
        paymentsWithCustomers
      );
    }

    setLoading(false);
  }

  /* =========================================================
     FORM RESET
  ========================================================= */

  function resetForm() {
    setCustomerId("");
    setPaymentDate("");
    setAmount("");
    setPaymentMethod("EFT");
    setReference("");
    setNotes("");
    setError("");
  }

  /* =========================================================
     OPEN FORM
  ========================================================= */

  function openForm() {
    resetForm();

    const today =
      new Date().toISOString().split("T")[0];

    setPaymentDate(today);
    setShowForm(true);
    setSuccess("");
  }

  /* =========================================================
     CLOSE FORM
  ========================================================= */

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  }

  /* =========================================================
     CREATE PAYMENT NUMBER
  ========================================================= */

  function generatePaymentNumber() {
    const timestamp =
      Date.now().toString().slice(-8);

    return `PAY-${timestamp}`;
  }

  /* =========================================================
     SAVE PAYMENT
  ========================================================= */

  async function savePayment() {
    setError("");
    setSuccess("");

    if (!customerId) {
      setError(
        "Please select a customer."
      );
      return;
    }

    if (!paymentDate) {
      setError(
        "Please select a payment date."
      );
      return;
    }

    const numericAmount =
      Number(amount);

    if (
      !amount ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid payment amount."
      );
      return;
    }

    if (!paymentMethod) {
      setError(
        "Please select a payment method."
      );
      return;
    }

    setSaving(true);

    const paymentNumber =
      generatePaymentNumber();

    const { error } =
      await supabase
        .from("payments")
        .insert({
          payment_number:
            paymentNumber,

          customer_id:
            customerId,

          payment_date:
            paymentDate,

          amount:
            numericAmount,

          payment_method:
            paymentMethod,

          reference:
            reference.trim() || null,

          notes:
            notes.trim() || null,
        });

    if (error) {
      console.error(
        "Payment save error:",
        error
      );

      setError(
        `Unable to save payment: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    resetForm();

    setSuccess(
      `Payment ${paymentNumber} saved successfully.`
    );

    await loadData();
  }

  /* =========================================================
     DELETE PAYMENT
  ========================================================= */

  async function deletePayment(
    payment: Payment
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete payment ${payment.payment_number}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error } =
      await supabase
        .from("payments")
        .delete()
        .eq("id", payment.id);

    if (error) {
      console.error(
        "Payment delete error:",
        error
      );

      setError(
        `Unable to delete payment: ${error.message}`
      );

      return;
    }

    setSuccess(
      `Payment ${payment.payment_number} deleted successfully.`
    );

    await loadData();
  }

  /* =========================================================
     FORMAT CURRENCY
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

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  function formatDate(
    value: string
  ) {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

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
     TOTAL PAYMENTS
  ========================================================= */

  const totalPayments =
    payments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.amount || 0
        ),
      0
    );

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <DashboardShell
      title="Payments"
      subtitle="Record and manage customer payments"
    >
      <PageHeader
        title="Payments"
        description="Record payments received from your customers."
        icon={CreditCard}
        action={{
          label: "Add Payment",
          href: "#",
        }}
      />

      <div className="space-y-6">

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid gap-4 md:grid-cols-2">

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-charcoal-500">
              Total Payments
            </p>

            <p className="mt-2 text-2xl font-bold text-charcoal-900">
              {payments.length}
            </p>

          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-charcoal-500">
              Total Received
            </p>

            <p className="mt-2 text-2xl font-bold text-[#20AEB8]">
              {formatCurrency(
                totalPayments
              )}
            </p>

          </div>

        </div>

        {/* =================================================
            ADD PAYMENT BUTTON
        ================================================= */}

        {!showForm && (
          <div className="flex justify-end">

            <button
              type="button"
              onClick={openForm}
              className="inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-charcoal-800"
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </button>

          </div>
        )}

        {/* =================================================
            PAYMENT FORM
        ================================================= */}

        {showForm && (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold text-charcoal-900">
                  Record Payment
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Record a payment received from a customer.
                </p>

              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-50 hover:text-charcoal-900"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* CUSTOMER */}

              <div>

                <label
                  htmlFor="payment-customer"
                  className="mb-2 block text-sm font-medium text-charcoal-700"
                >
                  Customer *
                </label>

                <select
                  id="payment-customer"
                  value={customerId}
                  onChange={(event) =>
                    setCustomerId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100"
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.company_name}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* PAYMENT DATE */}

              <div>

                <label
                  htmlFor="payment-date"
                  className="mb-2 block text-sm font-medium text-charcoal-700"
                >
                  Payment Date *
                </label>

                <input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(event) =>
                    setPaymentDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100"
                />

              </div>

              {/* AMOUNT */}

              <div>

                <label
                  htmlFor="payment-amount"
                  className="mb-2 block text-sm font-medium text-charcoal-700"
                >
                  Amount *
                </label>

                <input
                  id="payment-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100"
                />

              </div>

              {/* PAYMENT METHOD */}

              <div>

                <label
                  htmlFor="payment-method"
                  className="mb-2 block text-sm font-medium text-charcoal-700"
                >
                  Payment Method *
                </label>

                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100"
                >
                  {PAYMENT_METHODS.map(
                    (method) => (
                      <option
                        key={method}
                        value={method}
                      >
                        {method}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* REFERENCE */}

              <div>

                <label
                  htmlFor="payment-reference"
                  className="mb-2 block text-sm font-medium text-charcoal-700"
                >
                  Reference
                </label>

                <input
                  id="payment-reference"
                  type="text"
                  value={reference}
                  onChange={(event) =>
                    setReference(
                      event.target.value
                    )
                  }
                  placeholder="Bank reference / proof of payment"
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100"
                />

              </div>

              {/* NOTES */}

              <div>

                <label
                  htmlFor="payment-notes"
                  className="mb-2 block text-sm font-medium text-charcoal-700"
                >
                  Notes
                </label>

                <input
                  id="payment-notes"
                  type="text"
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  placeholder="Optional notes"
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100"
                />

              </div>

            </div>

            {/* FORM ACTIONS */}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-charcoal-200 px-5 py-2.5 text-sm font-medium text-charcoal-700 transition hover:bg-charcoal-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={savePayment}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1897a0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Save Payment
                  </>
                )}
              </button>

            </div>

          </div>
        )}

        {/* =================================================
            PAYMENTS TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm">

          <div className="border-b border-charcoal-100 p-6">

            <h2 className="text-lg font-semibold text-charcoal-900">
              Payment History
            </h2>

            <p className="mt-1 text-sm text-charcoal-500">
              Payments received from your customers.
            </p>

          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16">

              <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />

              <span className="ml-3 text-sm text-charcoal-500">
                Loading payments...
              </span>

            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-charcoal-50">
                <CreditCard className="h-6 w-6 text-charcoal-400" />
              </div>

              <h3 className="text-base font-semibold text-charcoal-900">
                No payments yet
              </h3>

              <p className="mt-1 max-w-md text-sm text-charcoal-500">
                Record your first customer payment
                to start tracking received payments.
              </p>

              <button
                type="button"
                onClick={openForm}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-800"
              >
                <Plus className="h-4 w-4" />
                Add Payment
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="border-b border-charcoal-100 bg-charcoal-50 text-left">

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Payment
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Customer
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Date
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Method
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Reference
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Amount
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-charcoal-100">

                  {payments.map(
                    (payment) => (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-charcoal-50/50"
                      >

                        <td className="px-6 py-4 text-sm font-medium text-charcoal-900">
                          {payment.payment_number}
                        </td>

                        <td className="px-6 py-4 text-sm text-charcoal-700">
                          {payment.customer
                            ?.company_name ??
                            "Unknown customer"}
                        </td>

                        <td className="px-6 py-4 text-sm text-charcoal-600">
                          {formatDate(
                            payment.payment_date
                          )}
                        </td>

                        <td className="px-6 py-4">

                          <span className="inline-flex rounded-full bg-charcoal-100 px-2.5 py-1 text-xs font-medium text-charcoal-700">
                            {payment.payment_method}
                          </span>

                        </td>

                        <td className="px-6 py-4 text-sm text-charcoal-600">
                          {payment.reference ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-semibold text-[#20AEB8]">
                          {formatCurrency(
                            payment.amount
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              deletePayment(
                                payment
                              )
                            }
                            className="inline-flex rounded-lg p-2 text-charcoal-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete payment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </DashboardShell>
  );
}