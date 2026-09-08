"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";

import CustomerSelector from "@/components/quotes/customer-selector";
import ProductSelector from "@/components/quotes/product-selector";
import QuoteLine from "@/components/quotes/quote-line";

import { createClient } from "@/lib/supabase/client";

interface Customer {
  id: string;
  customer_number: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  physical_address: string;
}

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  description: string;
  selling_price: number;
}

interface InvoiceItem {
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [site, setSite] = useState("");

  const [notes, setNotes] = useState("");

  const [invoiceItems, setInvoiceItems] =
    useState<InvoiceItem[]>([]);

  // Automatically start with today's date
  const [invoiceDate, setInvoiceDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );

  // Automatically start with 30 days from today
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();

    date.setDate(date.getDate() + 30);

    return date.toISOString().split("T")[0];
  });

  // VAT is OFF by default
  const [vatEnabled, setVatEnabled] =
    useState(false);

  const vatRate = 15;

  function addProduct(product: Product) {
    setInvoiceItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        description:
          product.description || product.product_name,
        quantity: 1,
        unit_price: Number(product.selling_price),
      },
    ]);
  }

  function updateItem(
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) {
    setInvoiceItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function removeItem(index: number) {
    setInvoiceItems((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  const subtotal = useMemo(() => {
    return invoiceItems.reduce(
      (total, item) =>
        total + item.quantity * item.unit_price,
      0
    );
  }, [invoiceItems]);

  const vatAmount = useMemo(() => {
    if (!vatEnabled) {
      return 0;
    }

    return subtotal * (vatRate / 100);
  }, [subtotal, vatEnabled]);

  const total = useMemo(() => {
    return subtotal + vatAmount;
  }, [subtotal, vatAmount]);

  async function saveInvoice() {
    if (!customer) {
      alert("Please select a customer.");
      return;
    }

    if (!invoiceDate) {
      alert("Please select an invoice date.");
      return;
    }

    if (!dueDate) {
      alert("Please select a due date.");
      return;
    }

    if (invoiceItems.length === 0) {
      alert("Please add at least one product.");
      return;
    }

    setSaving(true);

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        customer_id: customer.id,
        invoice_date: invoiceDate,
        due_date: dueDate,
        subtotal,
        total,
        vat_enabled: vatEnabled,
        vat_rate: vatRate,
        notes: notes.trim() || null,
        site: site.trim() || null,
        status: "Draft",
      })
      .select()
      .single();

    if (error || !invoice) {
      console.error(error);

      alert(
        error?.message ??
          "Failed to create invoice."
      );

      setSaving(false);
      return;
    }

    const invoiceLines = invoiceItems.map(
      (item) => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total:
          item.quantity * item.unit_price,
      })
    );

    const { error: itemError } =
      await supabase
        .from("invoice_items")
        .insert(invoiceLines);

    if (itemError) {
      console.error(itemError);

      alert(itemError.message);

      setSaving(false);
      return;
    }

    router.push(`/invoices/${invoice.id}`);
  }

  return (
    <DashboardShell
      title="New Invoice"
      subtitle="Create a customer invoice"
    >
      <div className="grid gap-8 lg:grid-cols-3">

        {/* LEFT COLUMN */}
        <div className="space-y-8 lg:col-span-2">

          {/* CUSTOMER */}
          <CustomerSelector
            value={customer?.id ?? ""}
            onChange={(selectedCustomer) =>
              setCustomer(
                selectedCustomer as Customer | null
              )
            }
          />

          {/* SITE */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-4 text-xl font-bold">
              Site Section
            </h2>

            <label
              htmlFor="site"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Site
            </label>

            <input
              id="site"
              type="text"
              value={site}
              onChange={(e) =>
                setSite(e.target.value)
              }
              placeholder="Enter site, project, property, or section"
              className="w-full rounded-lg border px-4 py-3"
            />

            <p className="mt-2 text-xs text-gray-500">
              Enter the site, project, property, or
              section this invoice relates to.
            </p>

          </div>

          {/* PRODUCTS SELECTOR */}
          <ProductSelector
            onSelect={(product) =>
              addProduct(product as Product)
            }
          />

          {/* PRODUCTS ON INVOICE */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Products & Services
            </h2>

            {invoiceItems.length === 0 ? (

              <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
                No products added yet.
              </div>

            ) : (

              <div className="space-y-6">

                {invoiceItems.map(
                  (item, index) => (
                    <QuoteLine
                      key={index}
                      line={item}
                      index={index}
                      onChange={updateItem}
                      onRemove={removeItem}
                    />
                  )
                )}

              </div>

            )}

          </div>

          {/* NOTES */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-4 text-xl font-bold">
              Notes
            </h2>

            <textarea
              rows={5}
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Notes for the customer..."
              className="w-full rounded-lg border px-4 py-3"
            />

          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div>

          <div className="sticky top-6 rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Invoice Summary
            </h2>

            <div className="space-y-5">

              {/* INVOICE DATE */}
              <div>

                <label
                  htmlFor="invoiceDate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Invoice Date
                </label>

                <input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) =>
                    setInvoiceDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />

              </div>

              {/* DUE DATE */}
              <div>

                <label
                  htmlFor="dueDate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Due Date
                </label>

                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />

              </div>

              {/* VAT SWITCH */}
              <div className="rounded-xl border bg-gray-50 p-4">

                <div className="flex items-center justify-between">

                  <div>

                    <div className="font-semibold text-gray-900">
                      VAT
                    </div>

                    <div className="text-sm text-gray-500">
                      {vatEnabled
                        ? `${vatRate}% VAT will be charged`
                        : "No VAT will be charged"}
                    </div>

                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={vatEnabled}
                    onClick={() =>
                      setVatEnabled(
                        (current) => !current
                      )
                    }
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                      vatEnabled
                        ? "bg-green-600"
                        : "bg-gray-300"
                    }`}
                  >

                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        vatEnabled
                          ? "translate-x-8"
                          : "translate-x-1"
                      }`}
                    />

                  </button>

                </div>

                <div className="mt-3 text-sm font-semibold">

                  {vatEnabled ? (
                    <span className="text-green-700">
                      VAT ON — {vatRate}%
                    </span>
                  ) : (
                    <span className="text-gray-600">
                      VAT OFF
                    </span>
                  )}

                </div>

              </div>

              {/* CUSTOMER SUMMARY */}
              {customer && (
                <div className="rounded-lg bg-blue-50 p-4">

                  <div className="font-semibold">
                    {customer.company_name}
                  </div>

                  <div className="text-sm text-gray-600">
                    {customer.contact_person}
                  </div>

                  <div className="text-sm text-gray-600">
                    {customer.phone}
                  </div>

                  <div className="text-sm text-gray-600">
                    {customer.email}
                  </div>

                </div>
              )}

              {/* SITE SUMMARY */}
              {site.trim() && (
                <div className="rounded-lg bg-gray-50 p-4">

                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Site
                  </div>

                  <div className="mt-1 font-semibold text-gray-900">
                    {site}
                  </div>

                </div>
              )}

              <hr />

              {/* SUBTOTAL */}
              <div className="flex justify-between text-lg">

                <span>
                  Subtotal
                </span>

                <span className="font-semibold">
                  R{" "}
                  {subtotal.toLocaleString(
                    "en-ZA",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

              {/* VAT */}
              <div className="flex justify-between text-lg">

                <span>
                  VAT
                  {vatEnabled
                    ? ` (${vatRate}%)`
                    : ""}
                </span>

                <span className="font-semibold">

                  {vatEnabled
                    ? `R ${vatAmount.toLocaleString(
                        "en-ZA",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`
                    : "Not Registered"}

                </span>

              </div>

              {/* TOTAL */}
              <div className="border-t pt-4">

                <div className="flex justify-between text-2xl font-bold">

                  <span>
                    Total
                  </span>

                  <span>
                    R{" "}
                    {total.toLocaleString(
                      "en-ZA",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>

                </div>

              </div>

              {/* VAT NOTICE */}
              {!vatEnabled ? (

                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">

                  <strong>
                    Notice
                  </strong>

                  <p className="mt-2">
                    VAT is currently switched
                    off for this invoice. No VAT
                    will be charged.
                  </p>

                </div>

              ) : (

                <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800">

                  <strong>
                    VAT Enabled
                  </strong>

                  <p className="mt-2">
                    VAT is switched on at{" "}
                    {vatRate}%. The VAT amount
                    will be added to the invoice
                    total.
                  </p>

                </div>

              )}

              {/* CREATE */}
              <button
                type="button"
                onClick={saveInvoice}
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating Invoice..."
                  : "Create Invoice"}
              </button>

            </div>

          </div>

        </div>

      </div>
    </DashboardShell>
  );
}