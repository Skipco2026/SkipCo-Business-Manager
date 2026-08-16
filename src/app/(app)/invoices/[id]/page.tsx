"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PDFDownloadLink } from "@react-pdf/renderer";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

import InvoicePDF from "@/components/pdf/InvoicePDF";

interface Customer {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  physical_address: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  total: number;
  status: string;
  notes: string;
  customer: Customer;
}

export default function InvoicePage() {
  const params = useParams();

  const supabase = createClient();

  const [loading, setLoading] =
    useState(true);

  const [invoice, setInvoice] =
    useState<Invoice | null>(null);

  const [items, setItems] =
    useState<InvoiceItem[]>([]);

  useEffect(() => {
    loadInvoice();
  }, []);

  async function loadInvoice() {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        customer:customers (
          company_name,
          contact_person,
          email,
          phone,
          physical_address
        )
      `)
      .eq("id", params.id)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const { data: invoiceItems } =
      await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", params.id)
        .order("created_at");

    setInvoice(data);
    setItems(invoiceItems ?? []);

    setLoading(false);
  }

  if (loading) {
    return (
      <DashboardShell
        title="Invoice"
        subtitle="Loading..."
      >
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          Loading invoice...
        </div>
      </DashboardShell>
    );
  }

  if (!invoice) {
    return (
      <DashboardShell
        title="Invoice"
        subtitle="Not Found"
      >
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          Invoice not found.
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={invoice.invoice_number}
      subtitle={invoice.customer.company_name}
    >
      <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}

        <div className="rounded-xl border bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">

            {/* Company */}

            <div>

              <h1 className="text-3xl font-bold text-blue-700">
                SkipCo Solutions
              </h1>

              <p className="mt-2 text-gray-600">
                Skip Hire & Waste Removal
              </p>

              <div className="mt-6 space-y-1 text-sm text-gray-500">

                <p>Johannesburg, South Africa</p>

                <p>info@skipco.co.za</p>

                <p>+27 XX XXX XXXX</p>

              </div>

            </div>

            {/* Invoice Information */}

            <div className="text-right">

              <h2 className="text-4xl font-bold">
                TAX INVOICE
              </h2>

              <div className="mt-6 space-y-2 text-sm">

                <div className="flex justify-between gap-8">

                  <span className="text-gray-500">
                    Invoice No
                  </span>

                  <span className="font-semibold">
                    {invoice.invoice_number}
                  </span>

                </div>

                <div className="flex justify-between gap-8">

                  <span className="text-gray-500">
                    Invoice Date
                  </span>

                  <span>
                    {invoice.invoice_date}
                  </span>

                </div>

                <div className="flex justify-between gap-8">

                  <span className="text-gray-500">
                    Due Date
                  </span>

                  <span>
                    {invoice.due_date}
                  </span>

                </div>

                <div className="flex justify-between gap-8">

                  <span className="text-gray-500">
                    Status
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      invoice.status === "Draft"
                        ? "bg-yellow-100 text-yellow-700"
                        : invoice.status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : invoice.status === "Overdue"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {invoice.status}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Customer */}

        <div className="rounded-xl border bg-white p-8 shadow-sm">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-bold">
              Customer
            </h2>

            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700"
            >
              Edit Invoice
            </Link>

          </div>

          <div className="mt-6 space-y-2">

            <h3 className="text-2xl font-semibold">
              {invoice.customer.company_name}
            </h3>

            <p>{invoice.customer.contact_person}</p>

            <p>{invoice.customer.email}</p>

            <p>{invoice.customer.phone}</p>

            <p className="whitespace-pre-line">
              {invoice.customer.physical_address}
            </p>

          </div>

        </div>
                {/* Invoice Items */}

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="px-6 py-4 text-left">
                  #
                </th>

                <th className="px-6 py-4 text-left">
                  Description
                </th>

                <th className="px-6 py-4 text-center">
                  Qty
                </th>

                <th className="px-6 py-4 text-right">
                  Unit Price
                </th>

                <th className="px-6 py-4 text-right">
                  Total
                </th>

              </tr>

            </thead>

            <tbody>

              {items.map((item, index) => (

                <tr
                  key={item.id}
                  className="border-t"
                >

                  <td className="px-6 py-5">
                    {index + 1}
                  </td>

                  <td className="px-6 py-5">

                    <div className="font-medium">
                      {item.description}
                    </div>

                  </td>

                  <td className="px-6 py-5 text-center">
                    {item.quantity}
                  </td>

                  <td className="px-6 py-5 text-right">
                    R{" "}
                    {Number(item.unit_price).toLocaleString(
                      "en-ZA",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </td>

                  <td className="px-6 py-5 text-right font-semibold">
                    R{" "}
                    {Number(item.line_total).toLocaleString(
                      "en-ZA",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {/* Notes */}

        {invoice.notes && (

          <div className="rounded-xl border bg-white p-8 shadow-sm">

            <h2 className="mb-4 text-xl font-bold">
              Notes
            </h2>

            <div className="whitespace-pre-line text-gray-700">
              {invoice.notes}
            </div>

          </div>

        )}
                {/* Totals */}

        <div className="flex justify-end">

          <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Invoice Totals
            </h2>

            <div className="space-y-4">

              <div className="flex justify-between">

                <span className="text-gray-600">
                  Subtotal
                </span>

                <span className="font-semibold">
                  R{" "}
                  {Number(invoice.subtotal).toLocaleString(
                    "en-ZA",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-600">
                  VAT
                </span>

                <span className="font-semibold text-orange-600">
                  Not Registered
                </span>

              </div>

              <div className="border-t pt-4">

                <div className="flex justify-between text-2xl font-bold">

                  <span>Total</span>

                  <span className="text-blue-700">
                    R{" "}
                    {Number(invoice.total).toLocaleString(
                      "en-ZA",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>

                </div>

              </div>

            </div>

            <div className="mt-8 rounded-lg border border-yellow-300 bg-yellow-50 p-4">

              <p className="font-semibold text-yellow-800">
                VAT Notice
              </p>

              <p className="mt-2 text-sm text-yellow-700">
                SkipCo Solutions is currently not VAT
                registered. No VAT has been charged on
                this invoice.
              </p>

            </div>

          </div>

        </div>

        {/* Action Buttons */}

        <div className="flex flex-wrap justify-end gap-4">

          <Link
            href="/invoices"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Back to Invoices
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-gray-700 px-6 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            Print Invoice
          </button>

          <PDFDownloadLink
            document={
              <InvoicePDF
                invoice={{
                  invoice_number: invoice.invoice_number,
                  invoice_date: invoice.invoice_date,
                  due_date: invoice.due_date,
                  status: invoice.status,
                  subtotal: invoice.subtotal,
                  total: invoice.total,
                  notes: invoice.notes,
                  customer: invoice.customer,
                }}
                items={items}
              />
            }
            fileName={`${invoice.invoice_number}.pdf`}
          >
            {({ loading }) => (
              <button
                type="button"
                className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700"
              >
                {loading
                  ? "Generating..."
                  : "Download PDF"}
              </button>
            )}
          </PDFDownloadLink>

          <button
            type="button"
            onClick={() =>
              alert("Email functionality coming soon.")
            }
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Email Invoice
          </button>

        </div>

      </div>

    </DashboardShell>
  );
}