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
  type: string;
}

interface QuoteItem {
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [site, setSite] = useState("");

  const [notes, setNotes] = useState("");

  const [quoteItems, setQuoteItems] =
    useState<QuoteItem[]>([]);

  /*
   * VAT SETTINGS
   */

  const [vatEnabled, setVatEnabled] =
    useState(false);

  const [vatRate, setVatRate] =
    useState(15);

  /*
   * DATES
   */

  const quoteDate =
    new Date().toISOString().split("T")[0];

  const validUntil = (() => {
    const date = new Date();

    date.setDate(date.getDate() + 30);

    return date.toISOString().split("T")[0];
  })();

  /*
   * ADD PRODUCT
   */

  function addProduct(product: Product) {
    setQuoteItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        description:
          product.description ||
          product.product_name,
        quantity: 1,
        unit_price:
          Number(product.selling_price),
      },
    ]);
  }

  /*
   * UPDATE QUOTE ITEM
   */

  function updateItem(
    index: number,
    field: keyof QuoteItem,
    value: string | number
  ) {
    setQuoteItems((prev) =>
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

  /*
   * REMOVE QUOTE ITEM
   */

  function removeItem(index: number) {
    setQuoteItems((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  /*
   * SUBTOTAL
   */

  const subtotal = useMemo(() => {
    return quoteItems.reduce(
      (total, item) =>
        total +
        Number(item.quantity) *
          Number(item.unit_price),
      0
    );
  }, [quoteItems]);

  /*
   * VAT
   */

  const vatAmount = useMemo(() => {
    if (!vatEnabled) {
      return 0;
    }

    return subtotal * (Number(vatRate) / 100);
  }, [subtotal, vatEnabled, vatRate]);

  /*
   * TOTAL
   */

  const total = useMemo(() => {
    return subtotal + vatAmount;
  }, [subtotal, vatAmount]);

  /*
   * SAVE QUOTE
   */

  async function saveQuote() {
    if (!customer) {
      alert("Please select a customer.");
      return;
    }

    if (
      vatEnabled &&
      (Number(vatRate) < 0 ||
        Number(vatRate) > 100)
    ) {
      alert(
        "Please enter a valid VAT rate between 0% and 100%."
      );
      return;
    }

    setSaving(true);

    /*
     * CREATE QUOTE
     */

    const { data: quote, error } =
      await supabase
        .from("quotes")
        .insert({
          customer_id: customer.id,
          quote_date: quoteDate,
          valid_until: validUntil,

          site: site.trim() || null,

          subtotal: subtotal,
          total: total,
          notes: notes.trim() || null,
          status: "Draft",

          /*
           * VAT
           */

          vat_enabled: vatEnabled,
          vat_rate: vatEnabled
            ? Number(vatRate)
            : 0,
        })
        .select()
        .single();

    if (error || !quote) {
      console.error(error);

      alert(
        error?.message ??
          "Failed to create quote."
      );

      setSaving(false);
      return;
    }

    /*
     * CREATE QUOTE ITEMS
     */

    if (quoteItems.length > 0) {
      const quoteLines = quoteItems.map(
        (item) => ({
          quote_id: quote.id,
          product_id: item.product_id,
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          line_total:
            Number(item.quantity) *
            Number(item.unit_price),
        })
      );

      const { error: itemError } =
        await supabase
          .from("quote_items")
          .insert(quoteLines);

      if (itemError) {
        console.error(itemError);

        alert(itemError.message);

        setSaving(false);
        return;
      }
    }

    /*
     * GO TO QUOTE
     */

    router.push(
      `/quotes/${quote.id}`
    );
  }

  return (
    <DashboardShell
      title="New Quote"
      subtitle="Create a customer quotation"
    >
      <div className="mx-auto max-w-6xl p-4 sm:p-6">

        {/* ===================================================== */}
        {/* PAGE HEADER */}
        {/* ===================================================== */}

        <div className="mb-6">

          <h1 className="text-2xl font-bold text-charcoal-900">
            New Quote
          </h1>

          <p className="mt-1 text-sm text-charcoal-500">
            Create a customer quotation
          </p>

        </div>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* =================================================== */}
          {/* LEFT COLUMN */}
          {/* =================================================== */}

          <div className="space-y-8 lg:col-span-2">

            {/* ================================================= */}
            {/* CUSTOMER */}
            {/* ================================================= */}

            <CustomerSelector
              value={customer?.id ?? ""}
              onChange={(selectedCustomer) =>
                setCustomer(
                  selectedCustomer as
                    Customer | null
                )
              }
            />

            {/* ================================================= */}
            {/* QUOTE DETAILS */}
            {/* ================================================= */}

            <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-sm">

              <h2 className="mb-6 text-xl font-bold text-charcoal-900">
                Quote Details
              </h2>

              <div className="grid gap-5 md:grid-cols-3">

                {/* QUOTE DATE */}

                <div>
                  <label
                    htmlFor="quote-date"
                    className="mb-1 block text-sm font-medium text-charcoal-700"
                  >
                    Quote Date
                  </label>

                  <input
                    id="quote-date"
                    type="date"
                    value={quoteDate}
                    readOnly
                    className="w-full rounded-lg border border-charcoal-200 bg-gray-50 px-3 py-2.5 text-sm text-charcoal-700 outline-none"
                  />
                </div>

                {/* VALID UNTIL */}

                <div>
                  <label
                    htmlFor="valid-until"
                    className="mb-1 block text-sm font-medium text-charcoal-700"
                  >
                    Valid Until
                  </label>

                  <input
                    id="valid-until"
                    type="date"
                    value={validUntil}
                    readOnly
                    className="w-full rounded-lg border border-charcoal-200 bg-gray-50 px-3 py-2.5 text-sm text-charcoal-700 outline-none"
                  />
                </div>

                {/* STATUS */}

                <div>
                  <label
                    htmlFor="status"
                    className="mb-1 block text-sm font-medium text-charcoal-700"
                  >
                    Status
                  </label>

                  <input
                    id="status"
                    type="text"
                    value="Draft"
                    readOnly
                    className="w-full rounded-lg border border-charcoal-200 bg-gray-50 px-3 py-2.5 text-sm text-charcoal-700 outline-none"
                  />
                </div>

              </div>

              {/* ================================================= */}
              {/* SITE SECTION */}
              {/* ================================================= */}

              <div className="mt-5">

                <label
                  htmlFor="site"
                  className="mb-1 block text-sm font-medium text-charcoal-700"
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
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
                />

                <p className="mt-1 text-xs text-charcoal-400">
                  Enter the site or section this quote relates to.
                </p>

              </div>

            </div>

            {/* ================================================= */}
            {/* PRODUCTS */}
            {/* ================================================= */}

            <ProductSelector
              onSelect={(product) =>
                addProduct(
                  product as Product
                )
              }
            />

            {/* ================================================= */}
            {/* QUOTE ITEMS */}
            {/* ================================================= */}

            <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-sm">

              <div className="mb-6 flex items-center justify-between">

                <h2 className="text-xl font-bold text-charcoal-900">
                  Quote Items
                </h2>

                {quoteItems.length > 0 && (
                  <span className="text-sm text-charcoal-500">
                    {quoteItems.length}{" "}
                    {quoteItems.length === 1
                      ? "item"
                      : "items"}
                  </span>
                )}

              </div>

              {quoteItems.length === 0 ? (

                <div className="rounded-lg border border-dashed border-charcoal-200 p-10 text-center text-charcoal-500">

                  No products added yet.

                  <p className="mt-2 text-sm">
                    Select a product above to add
                    it to the quote.
                  </p>

                </div>

              ) : (

                <div className="space-y-6">

                  {quoteItems.map(
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

            {/* ================================================= */}
            {/* NOTES */}
            {/* ================================================= */}

            <div className="rounded-xl border border-charcoal-100 bg-white p-6 shadow-sm">

              <h2 className="mb-4 text-xl font-bold text-charcoal-900">
                Notes
              </h2>

              <textarea
                rows={5}
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }
                placeholder="Notes for the customer..."
                className="w-full rounded-lg border border-charcoal-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

          {/* =================================================== */}
          {/* RIGHT COLUMN */}
          {/* =================================================== */}

          <div>

            <div className="sticky top-6 rounded-xl border border-charcoal-100 bg-white p-6 shadow-sm">

              <h2 className="mb-6 text-xl font-bold text-charcoal-900">
                Quote Summary
              </h2>

              <div className="space-y-5">

                {/* ================================================= */}
                {/* CUSTOMER */}
                {/* ================================================= */}

                {customer && (

                  <div className="rounded-lg bg-blue-50 p-4">

                    <div className="font-semibold text-charcoal-900">
                      {customer.company_name}
                    </div>

                    {customer.contact_person && (
                      <div className="text-sm text-gray-600">
                        {customer.contact_person}
                      </div>
                    )}

                    {customer.phone && (
                      <div className="text-sm text-gray-600">
                        {customer.phone}
                      </div>
                    )}

                    {customer.email && (
                      <div className="text-sm text-gray-600">
                        {customer.email}
                      </div>
                    )}

                  </div>

                )}

                {/* ================================================= */}
                {/* SITE */}
                {/* ================================================= */}

                {site.trim() && (

                  <div className="rounded-lg border border-charcoal-100 bg-gray-50 p-4">

                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Site Section
                    </p>

                    <p className="mt-1 font-medium text-charcoal-900">
                      {site}
                    </p>

                  </div>

                )}

                <hr />

                {/* ================================================= */}
                {/* VAT CONTROL */}
                {/* ================================================= */}

                <div className="rounded-xl border bg-gray-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-gray-900">
                        VAT
                      </p>

                      <p className="text-xs text-gray-500">
                        Add VAT to this quotation
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setVatEnabled(
                          !vatEnabled
                        )
                      }
                      aria-pressed={vatEnabled}
                      className={`relative h-7 w-12 rounded-full transition ${
                        vatEnabled
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                    >

                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                          vatEnabled
                            ? "left-6"
                            : "left-1"
                        }`}
                      />

                    </button>

                  </div>

                  {vatEnabled && (

                    <div className="mt-4">

                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        VAT Rate
                      </label>

                      <div className="relative">

                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={vatRate}
                          onChange={(e) =>
                            setVatRate(
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-lg border bg-white px-4 py-3 pr-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                          %
                        </span>

                      </div>

                    </div>

                  )}

                  {!vatEnabled && (

                    <p className="mt-3 text-xs text-gray-500">
                      VAT is currently hidden
                      from this quotation.
                    </p>

                  )}

                </div>

                {/* ================================================= */}
                {/* SUBTOTAL */}
                {/* ================================================= */}

                <div className="flex justify-between text-lg">

                  <span className="text-gray-600">
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

                {/* ================================================= */}
                {/* VAT AMOUNT */}
                {/* ================================================= */}

                {vatEnabled && (

                  <div className="flex justify-between text-lg">

                    <span className="text-gray-600">
                      VAT{" "}
                      {Number(vatRate).toFixed(2)}%
                    </span>

                    <span className="font-semibold">
                      R{" "}
                      {vatAmount.toLocaleString(
                        "en-ZA",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>

                  </div>

                )}

                {/* ================================================= */}
                {/* TOTAL */}
                {/* ================================================= */}

                <div className="border-t pt-4">

                  <div className="flex justify-between text-2xl font-bold">

                    <span>
                      Total
                    </span>

                    <span className="text-blue-700">
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

                {/* ================================================= */}
                {/* CREATE BUTTON */}
                {/* ================================================= */}

                <button
                  type="button"
                  onClick={saveQuote}
                  disabled={saving}
                  className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating Quote..."
                    : "Create Quote"}
                </button>

                {/* CANCEL */}
                <button
                  type="button"
                  onClick={() =>
                    router.push("/quotes")
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-charcoal-200 bg-white py-3 font-semibold text-charcoal-700 transition hover:bg-charcoal-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    </DashboardShell>
  );
}