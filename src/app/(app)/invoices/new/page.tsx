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

  const [notes, setNotes] =
    useState("");

  const [invoiceItems, setInvoiceItems] =
    useState<InvoiceItem[]>([]);

  const invoiceDate =
    new Date().toISOString().split("T")[0];

  const dueDate = (() => {
    const date = new Date();

    date.setDate(date.getDate() + 30);

    return date.toISOString().split("T")[0];
  })();

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
    async function saveInvoice() {
    if (!customer) {
      alert("Please select a customer.");
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
        total: subtotal,
        notes,
        status: "Draft",
      })
      .select()
      .single();

    if (error || !invoice) {
      console.error(error);
      alert(error?.message ?? "Failed to create invoice.");
      setSaving(false);
      return;
    }

    const invoiceLines = invoiceItems.map((item) => ({
      invoice_id: invoice.id,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total:
        item.quantity * item.unit_price,
    }));

    const { error: itemError } = await supabase
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

        {/* Left Column */}

        <div className="space-y-8 lg:col-span-2">

          <CustomerSelector
            value={customer?.id ?? ""}
            onChange={(selectedCustomer) =>
              setCustomer(selectedCustomer as Customer | null)
            }
          />

          <ProductSelector
            onSelect={(product) =>
              addProduct(product as Product)
            }
          />
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

                {invoiceItems.map((item, index) => (

                  <QuoteLine
                    key={index}
                    line={item}
                    index={index}
                    onChange={updateItem}
                    onRemove={removeItem}
                  />

                ))}

              </div>

            )}

          </div>

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

        {/* Right Column */}

        <div>

          <div className="sticky top-6 rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Invoice Summary
            </h2>

            <div className="space-y-5">

              <div>

                <label className="text-sm text-gray-500">
                  Invoice Date
                </label>

                <div className="mt-1 rounded-lg border bg-gray-50 px-4 py-3">
                  {invoiceDate}
                </div>

              </div>

              <div>

                <label className="text-sm text-gray-500">
                  Due Date
                </label>

                <div className="mt-1 rounded-lg border bg-gray-50 px-4 py-3">
                  {dueDate}
                </div>

              </div>

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
                            <hr />

              <div className="flex justify-between text-lg">

                <span>Subtotal</span>

                <span className="font-semibold">
                  R{" "}
                  {subtotal.toLocaleString("en-ZA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>

              </div>

              <div className="flex justify-between text-lg">

                <span>VAT</span>

                <span className="font-semibold">
                  Not Registered
                </span>

              </div>

              <div className="border-t pt-4">

                <div className="flex justify-between text-2xl font-bold">

                  <span>Total</span>

                  <span>
                    R{" "}
                    {subtotal.toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>

                </div>

              </div>

              <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">

                <strong>Notice</strong>

                <p className="mt-2">
                  SkipCo Solutions is currently not VAT
                  registered. VAT will therefore not be
                  charged on this invoice.
                </p>

              </div>

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