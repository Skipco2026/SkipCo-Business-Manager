"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import CustomerSelector, {
  Customer,
} from "@/components/quotes/customer-selector";
import ProductSelector from "@/components/quotes/product-selector";
import QuoteLine, {
  QuoteLine as InvoiceLine,
} from "@/components/quotes/quote-line";

import { createClient } from "@/lib/supabase/client";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  total: number;
  status: string;
  notes: string | null;
  site: string | null;
}

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  description: string;
  selling_price: number;
  type: string;
}

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const invoiceId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerId, setCustomerId] = useState("");

  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Draft");

  // Site Section
  const [site, setSite] = useState("");

  const [notes, setNotes] = useState("");

  const [invoiceItems, setInvoiceItems] = useState<InvoiceLine[]>([]);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  async function loadInvoice() {
    setLoading(true);

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error || !data) {
      console.error("Error loading invoice:", error);
      alert("Unable to load this invoice.");
      router.push("/invoices");
      return;
    }

    const loadedInvoice = data as Invoice;

    setInvoice(loadedInvoice);

    setCustomerId(loadedInvoice.customer_id ?? "");
    setInvoiceDate(loadedInvoice.invoice_date ?? "");
    setDueDate(loadedInvoice.due_date ?? "");
    setStatus(loadedInvoice.status ?? "Draft");

    // Load Site Section from invoices.site
    setSite(loadedInvoice.site ?? "");

    setNotes(loadedInvoice.notes ?? "");

    if (loadedInvoice.customer_id) {
      await loadCustomer(loadedInvoice.customer_id);
    }

    await loadInvoiceItems();

    setLoading(false);
  }

  async function loadCustomer(id: string) {
    const { data, error } = await supabase
      .from("customers")
      .select(
        `
        id,
        customer_number,
        company_name,
        contact_person,
        email,
        phone,
        physical_address
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading customer:", error);
      return;
    }

    if (data) {
      setCustomer(data as Customer);
    }
  }

  async function loadInvoiceItems() {
    const { data, error } = await supabase
      .from("invoice_items")
      .select(
        `
        id,
        invoice_id,
        product_id,
        description,
        quantity,
        unit_price,
        line_total,
        created_at
      `
      )
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading invoice items:", error);
      return;
    }

    const lines: InvoiceLine[] = (data ?? []).map((item) => ({
      product_id: item.product_id ?? "",
      description: item.description ?? "",
      quantity: Number(item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? 0),
    }));

    setInvoiceItems(lines);
  }

  function handleCustomerChange(
    selectedCustomer: Customer | null
  ) {
    setCustomer(selectedCustomer);
    setCustomerId(selectedCustomer?.id ?? "");
  }

  function addProduct(product: Product) {
    const newLine: InvoiceLine = {
      product_id: product.id,
      description:
        product.description?.trim() ||
        product.product_name ||
        "",
      quantity: 1,
      unit_price: Number(product.selling_price ?? 0),
    };

    setInvoiceItems((current) => [
      ...current,
      newLine,
    ]);
  }

  function updateItem(
    index: number,
    field: keyof InvoiceLine,
    value: string | number
  ) {
    setInvoiceItems((current) =>
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

  function removeItem(index: number) {
    setInvoiceItems((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  }

  const subtotal = useMemo(() => {
    return invoiceItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;

      return sum + quantity * unitPrice;
    }, 0);
  }, [invoiceItems]);

  const total = subtotal;

  async function saveInvoice() {
    if (!invoice) {
      return;
    }

    if (!customerId) {
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

    setSaving(true);

    try {
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          customer_id: customerId,
          invoice_date: invoiceDate,
          due_date: dueDate,
          subtotal,
          total,
          status,

          // Save Site Section
          site: site.trim() || null,

          notes: notes.trim() || null,
        })
        .eq("id", invoice.id);

      if (invoiceError) {
        console.error(
          "Invoice update error:",
          invoiceError
        );

        alert(
          `Unable to update invoice: ${invoiceError.message}`
        );

        return;
      }

      const { error: deleteItemsError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoice.id);

      if (deleteItemsError) {
        console.error(
          "Invoice items delete error:",
          deleteItemsError
        );

        alert(
          `Invoice was updated, but the old invoice items could not be replaced: ${deleteItemsError.message}`
        );

        return;
      }

      if (invoiceItems.length > 0) {
        const itemsToInsert = invoiceItems.map(
          (item) => {
            const quantity =
              Number(item.quantity) || 0;

            const unitPrice =
              Number(item.unit_price) || 0;

            return {
              invoice_id: invoice.id,
              product_id: item.product_id || null,
              description:
                item.description?.trim() || null,
              quantity,
              unit_price: unitPrice,
              line_total:
                quantity * unitPrice,
            };
          }
        );

        const { error: itemsError } =
          await supabase
            .from("invoice_items")
            .insert(itemsToInsert);

        if (itemsError) {
          console.error(
            "Invoice items insert error:",
            itemsError
          );

          alert(
            `Invoice was updated, but the invoice items could not be saved: ${itemsError.message}`
          );

          return;
        }
      }

      alert("Invoice updated successfully!");

      router.push(`/invoices/${invoice.id}`);
      router.refresh();
    } catch (error) {
      console.error(
        "Unexpected invoice update error:",
        error
      );

      alert(
        "Something went wrong while updating the invoice."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <div className="text-sm text-charcoal-500">
            Loading invoice...
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!invoice) {
    return (
      <DashboardShell>
        <div className="p-6">
          <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-charcoal-900">
              Invoice not found
            </h1>

            <Link
              href="/invoices"
              className="mt-4 inline-block rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white"
            >
              Back to Invoices
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-charcoal-500">
              Invoices
            </p>

            <h1 className="text-2xl font-bold text-charcoal-900 sm:text-3xl">
              Edit Invoice
            </h1>

            <p className="mt-1 text-sm text-charcoal-500">
              {invoice.invoice_number}
            </p>
          </div>

          <Link
            href={`/invoices/${invoice.id}`}
            className="rounded-lg border border-charcoal-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
          >
            Cancel
          </Link>
        </div>

        {/* Customer */}
        <div className="mb-6">
          <CustomerSelector
            value={customerId}
            onChange={handleCustomerChange}
          />
        </div>

        {/* Invoice Details */}
        <div className="mb-6 rounded-xl border border-charcoal-100 bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-bold text-charcoal-900">
            Invoice Details
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            {/* Invoice Date */}
            <div>
              <label
                htmlFor="invoice-date"
                className="mb-2 block text-sm font-medium text-charcoal-700"
              >
                Invoice Date
              </label>

              <input
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(event) =>
                  setInvoiceDate(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label
                htmlFor="due-date"
                className="mb-2 block text-sm font-medium text-charcoal-700"
              >
                Due Date
              </label>

              <input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-charcoal-700"
              >
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
              >
                <option value="Draft">
                  Draft
                </option>

                <option value="Sent">
                  Sent
                </option>

                <option value="Paid">
                  Paid
                </option>

                <option value="Overdue">
                  Overdue
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>
              </select>
            </div>

            {/* Site Section */}
            <div className="md:col-span-2">

              <label
                htmlFor="site"
                className="mb-2 block text-sm font-semibold text-charcoal-900"
              >
                Site Section
              </label>

              <input
                id="site"
                type="text"
                value={site}
                onChange={(event) =>
                  setSite(event.target.value)
                }
                placeholder="Enter site section"
                className="w-full rounded-lg border-2 border-charcoal-300 bg-white px-4 py-3 text-sm text-charcoal-900 outline-none focus:border-charcoal-500"
              />

              <p className="mt-2 text-xs text-charcoal-500">
                Enter the site, project, property, or
                section this invoice relates to.
              </p>

            </div>

          </div>
        </div>

        {/* Products */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">

          <ProductSelector
            onSelect={addProduct}
          />

          <div className="space-y-4">

            {invoiceItems.length === 0 ? (

              <div className="rounded-xl border border-dashed border-charcoal-200 bg-white p-8 text-center text-sm text-charcoal-500">

                No products or services added yet.

                <br />

                Select a product or service to add it
                to this invoice.

              </div>

            ) : (

              invoiceItems.map(
                (item, index) => (

                  <QuoteLine
                    key={`${item.product_id}-${index}`}
                    line={item}
                    index={index}
                    onChange={updateItem}
                    onRemove={removeItem}
                  />

                )
              )

            )}

          </div>

        </div>

        {/* Notes + Summary */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Notes */}
          <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-sm">

            <h2 className="mb-4 text-xl font-bold text-charcoal-900">
              Notes
            </h2>

            <textarea
              rows={7}
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Add notes to this invoice..."
              className="w-full rounded-lg border border-charcoal-200 px-4 py-3 text-sm outline-none focus:border-charcoal-500"
            />

          </div>

          {/* Summary */}
          <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-xl font-bold text-charcoal-900">
              Invoice Summary
            </h2>

            {/* Customer Summary */}
            {customer && (
              <div className="mb-5 rounded-lg bg-charcoal-50 p-4">

                <p className="text-xs font-medium uppercase tracking-wide text-charcoal-500">
                  Customer
                </p>

                <p className="mt-1 font-semibold text-charcoal-900">
                  {customer.company_name}
                </p>

                {customer.contact_person && (
                  <p className="text-sm text-charcoal-600">
                    {customer.contact_person}
                  </p>
                )}

              </div>
            )}

            {/* Site Summary */}
            {site.trim() && (
              <div className="mb-5 rounded-lg bg-charcoal-50 p-4">

                <p className="text-xs font-medium uppercase tracking-wide text-charcoal-500">
                  Site Section
                </p>

                <p className="mt-1 font-semibold text-charcoal-900">
                  {site}
                </p>

              </div>
            )}

            {/* Totals */}
            <div className="space-y-3 border-t border-charcoal-100 pt-4">

              <div className="flex items-center justify-between text-sm">

                <span className="text-charcoal-600">
                  Subtotal
                </span>

                <span className="font-medium text-charcoal-900">
                  R{" "}
                  {subtotal.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between text-sm">

                <span className="text-charcoal-600">
                  VAT
                </span>

                <span className="font-medium text-charcoal-900">
                  Not Registered
                </span>

              </div>

              <div className="flex items-center justify-between border-t border-charcoal-100 pt-3">

                <span className="text-lg font-bold text-charcoal-900">
                  Total
                </span>

                <span className="text-xl font-bold text-green-600">
                  R{" "}
                  {total.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

            </div>

            <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              VAT is not included because the business is
              not VAT registered.
            </div>

          </div>

        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <Link
            href={`/invoices/${invoice.id}`}
            className="rounded-lg border border-charcoal-200 bg-white px-5 py-3 text-center text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={saveInvoice}
            disabled={saving}
            className="rounded-lg bg-charcoal-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Invoice"}
          </button>

        </div>

      </div>
    </DashboardShell>
  );
}