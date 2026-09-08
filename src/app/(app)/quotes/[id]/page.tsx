"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PDFDownloadLink } from "@react-pdf/renderer";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";
import QuotePDF from "@/components/pdf/QuotePDF";

interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  physical_address: string;
}

interface QuoteItem {
  id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Quote {
  id: string;
  customer_id: string;
  quote_number: string;
  quote_date: string;
  valid_until: string;
  subtotal: number;
  total: number;
  status: string;
  notes: string;
  site: string | null;
  customer: Customer;
}

export default function QuotePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);

  useEffect(() => {
    loadQuote();
  }, []);

  async function loadQuote() {
    setLoading(true);

    const quoteId = String(params.id);

    const { data, error } = await supabase
      .from("quotes")
      .select(`
        *,
        customer:customers(
          id,
          company_name,
          contact_person,
          email,
          phone,
          physical_address
        )
      `)
      .eq("id", quoteId)
      .single();

    if (error) {
      console.error("Error loading quote:", error);
      setLoading(false);
      return;
    }

    const { data: quoteItems, error: itemsError } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at");

    if (itemsError) {
      console.error("Error loading quote items:", itemsError);
    }

    setQuote(data as Quote);
    setItems((quoteItems ?? []) as QuoteItem[]);
    setLoading(false);
  }

  async function convertToInvoice() {
    if (!quote) {
      return;
    }

    const confirmed = window.confirm(
      "Convert this quote into an invoice?"
    );

    if (!confirmed) {
      return;
    }

    const today = new Date();
    const due = new Date();

    due.setDate(due.getDate() + 30);

    const { data: invoice, error: invoiceError } =
      await supabase
        .from("invoices")
        .insert({
          customer_id: quote.customer_id,
          invoice_date: today
            .toISOString()
            .split("T")[0],
          due_date: due
            .toISOString()
            .split("T")[0],
          subtotal: quote.subtotal,
          total: quote.total,
          notes: quote.notes,
          status: "Draft",
        })
        .select()
        .single();

    if (invoiceError || !invoice) {
      console.error("Invoice creation error:", invoiceError);
      alert("Failed to create invoice.");
      return;
    }

    const invoiceItems = items.map((item) => ({
      invoice_id: invoice.id,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    }));

    if (invoiceItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) {
        console.error(
          "Invoice items creation error:",
          itemsError
        );

        alert("Failed to copy quote items.");
        return;
      }
    }

    const { error: quoteUpdateError } = await supabase
      .from("quotes")
      .update({
        status: "Converted",
      })
      .eq("id", quote.id);

    if (quoteUpdateError) {
      console.error(
        "Quote status update error:",
        quoteUpdateError
      );
    }

    router.push(`/invoices/${invoice.id}`);
  }

  function formatCurrency(value: number) {
    return `R ${Number(value || 0).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "Draft":
        return "bg-yellow-100 text-yellow-700";

      case "Accepted":
        return "bg-green-100 text-green-700";

      case "Converted":
        return "bg-purple-100 text-purple-700";

      case "Declined":
        return "bg-red-100 text-red-700";

      default:
        return "bg-blue-100 text-blue-700";
    }
  }

  if (loading) {
    return (
      <DashboardShell
        title="Quote"
        subtitle="Loading..."
      >
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          Loading quotation...
        </div>
      </DashboardShell>
    );
  }

  if (!quote) {
    return (
      <DashboardShell
        title="Quote"
        subtitle="Not Found"
      >
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <p className="text-gray-700">
            Quote not found.
          </p>

          <Link
            href="/quotes"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700"
          >
            Back to Quotes
          </Link>
        </div>
      </DashboardShell>
    );
  }

  /*
   * QuotePDF expects the Site to be a string.
   * Supabase can return NULL, so we convert NULL
   * into an empty string when creating the PDF.
   */
  const pdfQuote = {
    ...quote,
    site: quote.site ?? "",
  };

  return (
    <DashboardShell
      title={quote.quote_number}
      subtitle={quote.customer.company_name}
    >
      <div className="mx-auto max-w-7xl space-y-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="rounded-xl border bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">

            <div>

              <p className="mb-2 text-xs font-medium text-gray-500">
                DDW Consolidate t/a SkipCo Solutions
              </p>

              <h1 className="text-3xl font-bold text-blue-700">
                SkipCo Solutions
              </h1>

              <p className="mt-2 text-gray-600">
                Skip Hire & Waste Removal
              </p>

              <div className="mt-6 space-y-1 text-sm text-gray-500">
                <p>Pellesier, Bloemfontein</p>
                <p>ddw.trading@outlook.com</p>
                <p>062 737 9728</p>
              </div>

            </div>

            <div className="text-right">

              <h2 className="text-4xl font-bold">
                QUOTATION
              </h2>

              <div className="mt-6 space-y-2 text-sm">

                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">
                    Quote No
                  </span>

                  <span className="font-semibold">
                    {quote.quote_number}
                  </span>
                </div>

                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">
                    Date
                  </span>

                  <span>
                    {quote.quote_date}
                  </span>
                </div>

                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">
                    Valid Until
                  </span>

                  <span>
                    {quote.valid_until}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-8">
                  <span className="text-gray-500">
                    Status
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      quote.status
                    )}`}
                  >
                    {quote.status}
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            CUSTOMER
        ===================================================== */}

        <div className="rounded-xl border bg-white p-8 shadow-sm">

          <div className="flex items-center justify-between gap-4">

            <h2 className="text-xl font-bold">
              Customer
            </h2>

            <Link
              href={`/quotes/${quote.id}/edit`}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700"
            >
              Edit Quote
            </Link>

          </div>

          <div className="mt-6 space-y-2">

            <h3 className="text-2xl font-semibold">
              {quote.customer.company_name}
            </h3>

            {quote.customer.contact_person && (
              <p>
                {quote.customer.contact_person}
              </p>
            )}

            {quote.customer.email && (
              <p>
                {quote.customer.email}
              </p>
            )}

            {quote.customer.phone && (
              <p>
                {quote.customer.phone}
              </p>
            )}

            {quote.customer.physical_address && (
              <p className="whitespace-pre-line">
                {quote.customer.physical_address}
              </p>
            )}

          </div>

        </div>

        {/* =====================================================
            SITE
        ===================================================== */}

        <div className="rounded-xl border bg-white p-8 shadow-sm">

          <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-600">
            Site
          </h2>

          {quote.site ? (
            <p className="mt-2 text-xl font-semibold text-gray-900">
              {quote.site}
            </p>
          ) : (
            <p className="mt-2 text-gray-400">
              No site specified
            </p>
          )}

        </div>

        {/* =====================================================
            QUOTE ITEMS
        ===================================================== */}

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
                    {formatCurrency(item.unit_price)}
                  </td>

                  <td className="px-6 py-5 text-right font-semibold">
                    {formatCurrency(item.line_total)}
                  </td>

                </tr>

              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No items have been added to this quote.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* =====================================================
            NOTES
        ===================================================== */}

        {quote.notes && (

          <div className="rounded-xl border bg-white p-8 shadow-sm">

            <h2 className="mb-4 text-xl font-bold">
              Notes
            </h2>

            <div className="whitespace-pre-line text-gray-700">
              {quote.notes}
            </div>

          </div>

        )}

        {/* =====================================================
            TOTALS
        ===================================================== */}

        <div className="flex justify-end">

          <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Quote Totals
            </h2>

            <div className="space-y-4">

              <div className="flex justify-between">

                <span className="text-gray-600">
                  Subtotal
                </span>

                <span className="font-semibold">
                  {formatCurrency(quote.subtotal)}
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

                  <span>
                    Total
                  </span>

                  <span className="text-blue-700">
                    {formatCurrency(quote.total)}
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
                this quotation.
              </p>

            </div>

          </div>

        </div>

        {/* =====================================================
            ACTION BUTTONS
        ===================================================== */}

        <div className="flex flex-wrap justify-end gap-4">

          <Link
            href="/quotes"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Back to Quotes
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-gray-700 px-6 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            Print Quote
          </button>

          <PDFDownloadLink
            document={
              <QuotePDF
                quote={pdfQuote}
                items={items}
              />
            }
            fileName={`${quote.quote_number}.pdf`}
          >
            {({ loading: pdfLoading }) => (
              <button
                type="button"
                className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700"
              >
                {pdfLoading
                  ? "Generating..."
                  : "Download PDF"}
              </button>
            )}
          </PDFDownloadLink>

          <button
            type="button"
            onClick={convertToInvoice}
            className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition hover:bg-green-700"
          >
            Convert to Invoice
          </button>

          <button
            type="button"
            onClick={() =>
              alert("Email functionality coming soon.")
            }
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Email Quote
          </button>

        </div>

      </div>
    </DashboardShell>
  );
}