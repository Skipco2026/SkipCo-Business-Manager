"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

type Customer = {
  id: string;
  company_name: string | null;
  trading_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  physical_address: string | null;
};

type Quote = {
  id: string;
  quote_number: string;
  quote_date: string;
  valid_until: string | null;
  subtotal: number | null;
  total: number | null;
  status: string | null;
  notes: string | null;
  site: string | null;
  vat_enabled?: boolean | null;
  vat_rate?: number | null;
  customer_id: string | null;
  customer: Customer | null;
};

type QuoteItem = {
  id: string;
  quote_id: string;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
};

type EditableItem = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
};

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();

  const quoteId = String(params.id);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);

  const [quoteDate, setQuoteDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [site, setSite] = useState("");
  const [status, setStatus] = useState("Draft");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quoteId) {
      setError("Quote ID is missing.");
      setLoading(false);
      return;
    }

    const loadQuote = async () => {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const { data: quoteData, error: quoteError } = await supabase
          .from("quotes")
          .select(`
            *,
            customer:customers (
              id,
              company_name,
              trading_name,
              contact_person,
              email,
              phone,
              mobile,
              physical_address
            )
          `)
          .eq("id", quoteId)
          .single();

        if (quoteError) {
          throw quoteError;
        }

        const { data: itemData, error: itemError } = await supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", quoteId)
          .order("created_at", { ascending: true });

        if (itemError) {
          throw itemError;
        }

        const loadedQuote = quoteData as Quote;

        setQuote(loadedQuote);

        setQuoteDate(
          loadedQuote.quote_date
            ? String(loadedQuote.quote_date).slice(0, 10)
            : ""
        );

        setValidUntil(
          loadedQuote.valid_until
            ? String(loadedQuote.valid_until).slice(0, 10)
            : ""
        );

        setSite(loadedQuote.site ?? "");
        setStatus(loadedQuote.status ?? "Draft");
        setNotes(loadedQuote.notes ?? "");

        const loadedItems = (itemData ?? []) as QuoteItem[];

        setItems(
          loadedItems.map((item) => ({
            id: item.id,
            description: item.description ?? "",
            quantity: Number(item.quantity ?? 1),
            unit_price: Number(item.unit_price ?? 0),
          }))
        );
      } catch (err) {
        console.error("Error loading quote:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this quote."
        );
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [quoteId]);

  const updateItem = (
    index: number,
    field: "description" | "quantity" | "unit_price",
    value: string | number
  ) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const removeItem = async (index: number) => {
    const item = items[index];

    if (!item) {
      return;
    }

    if (item.id) {
      const confirmed = window.confirm(
        "Are you sure you want to remove this item?"
      );

      if (!confirmed) {
        return;
      }

      try {
        const supabase = createClient();

        const { error: deleteError } = await supabase
          .from("quote_items")
          .delete()
          .eq("id", item.id);

        if (deleteError) {
          throw deleteError;
        }
      } catch (err) {
        console.error("Error removing item:", err);

        alert(
          err instanceof Error
            ? err.message
            : "Unable to remove the item."
        );

        return;
      }
    }

    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const calculateItemTotal = (item: EditableItem) => {
    return Number(item.quantity || 0) * Number(item.unit_price || 0);
  };

  const subtotal = items.reduce((sum, item) => {
    return sum + calculateItemTotal(item);
  }, 0);

  const vatEnabled = quote?.vat_enabled ?? false;
  const vatRate = Number(quote?.vat_rate ?? 15);

  const vatAmount = vatEnabled
    ? subtotal * (vatRate / 100)
    : 0;

  const total = subtotal + vatAmount;

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) {
      return err.message;
    }

    if (err && typeof err === "object") {
      const supabaseError = err as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      };

      if (supabaseError.message) {
        return supabaseError.message;
      }

      if (supabaseError.details) {
        return supabaseError.details;
      }

      if (supabaseError.hint) {
        return supabaseError.hint;
      }

      try {
        return JSON.stringify(err);
      } catch {
        return "An unknown error occurred.";
      }
    }

    return "Unable to save the quote.";
  };

  const saveQuote = async () => {
    if (!quote) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (!quoteDate) {
        throw new Error("Please enter a quote date.");
      }

      if (!validUntil) {
        throw new Error("Please enter a valid until date.");
      }

      /*
       * IMPORTANT:
       * A quote is allowed to have zero items.
       * We therefore DO NOT require items.length > 0 here.
       */

      for (const item of items) {
        if (!item.description.trim()) {
          throw new Error(
            "Every quote item needs a description."
          );
        }

        if (Number(item.quantity) <= 0) {
          throw new Error(
            "Quantity must be greater than zero."
          );
        }

        if (Number(item.unit_price) < 0) {
          throw new Error(
            "Unit price cannot be negative."
          );
        }
      }

      const supabase = createClient();

      /*
       * SAVE THE MAIN QUOTE
       *
       * This includes the Site Section.
       */
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          quote_date: quoteDate,
          valid_until: validUntil,
          site: site.trim() || null,
          subtotal,
          total,
          status,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quoteId);

      if (quoteError) {
        console.error("QUOTE UPDATE ERROR:", quoteError);
        throw quoteError;
      }

      /*
       * DELETE OLD ITEMS
       *
       * This is safe even when the quote has no items.
       */
      const { error: deleteError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId);

      if (deleteError) {
        console.error(
          "QUOTE ITEMS DELETE ERROR:",
          deleteError
        );

        throw deleteError;
      }

      /*
       * INSERT ITEMS ONLY IF THERE ARE ITEMS.
       *
       * If there are zero items, we simply skip the insert.
       */
      if (items.length > 0) {
        const itemsToInsert = items.map((item) => {
          const quantity = Number(item.quantity || 0);
          const unitPrice = Number(item.unit_price || 0);

          return {
            quote_id: quoteId,
            description: item.description.trim(),
            quantity,
            unit_price: unitPrice,
            total: quantity * unitPrice,
          };
        });

        const { error: itemsError } = await supabase
          .from("quote_items")
          .insert(itemsToInsert);

        if (itemsError) {
          console.error(
            "QUOTE ITEMS INSERT ERROR:",
            itemsError
          );

          throw itemsError;
        }
      }

      alert("Quote updated successfully!");

      router.push(`/quotes/${quoteId}`);
      router.refresh();
    } catch (err) {
      console.error("FULL SAVE ERROR:", err);

      const errorMessage = getErrorMessage(err);

      console.error(
        "SAVE ERROR MESSAGE:",
        errorMessage
      );

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-charcoal-500">
            Loading quote...
          </p>
        </div>
      </DashboardShell>
    );
  }

  if (error && !quote) {
    return (
      <DashboardShell>
        <div className="p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-800">
              Unable to load quote
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <Link
              href="/quotes"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white"
            >
              <ArrowLeft size={16} />
              Back to Quotes
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!quote) {
    return (
      <DashboardShell>
        <div className="p-6">
          <p className="text-sm text-charcoal-600">
            Quote not found.
          </p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/quotes/${quoteId}`}
              className="mb-3 inline-flex items-center gap-2 text-sm text-charcoal-500 hover:text-charcoal-900"
            >
              <ArrowLeft size={16} />
              Back to Quote
            </Link>

            <h1 className="text-2xl font-bold text-charcoal-900">
              Edit Quote
            </h1>

            <p className="mt-1 text-sm text-charcoal-500">
              {quote.quote_number}
            </p>
          </div>

          <button
            type="button"
            onClick={saveQuote}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-charcoal-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold">
              Error saving quote
            </p>

            <p className="mt-1 break-words">
              {error}
            </p>
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-charcoal-900">
              Customer
            </h2>

            <div className="rounded-lg bg-charcoal-50 p-4">
              <p className="font-semibold text-charcoal-900">
                {quote.customer?.company_name ||
                  quote.customer?.trading_name ||
                  "No customer"}
              </p>

              {quote.customer?.contact_person && (
                <p className="mt-1 text-sm text-charcoal-600">
                  {quote.customer.contact_person}
                </p>
              )}

              {quote.customer?.email && (
                <p className="mt-1 text-sm text-charcoal-600">
                  {quote.customer.email}
                </p>
              )}

              {quote.customer?.phone && (
                <p className="mt-1 text-sm text-charcoal-600">
                  {quote.customer.phone}
                </p>
              )}

              {quote.customer?.physical_address && (
                <p className="mt-2 whitespace-pre-line text-sm text-charcoal-600">
                  {quote.customer.physical_address}
                </p>
              )}
            </div>

            <p className="mt-3 text-xs text-charcoal-400">
              Customer details are managed from the Customers
              section.
            </p>
          </section>

          <section className="rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-charcoal-900">
              Quote Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="quote-number"
                  className="mb-1 block text-sm font-medium text-charcoal-700"
                >
                  Quote Number
                </label>

                <input
                  id="quote-number"
                  type="text"
                  value={quote.quote_number}
                  disabled
                  className="w-full rounded-lg border border-charcoal-200 bg-charcoal-50 px-3 py-2.5 text-sm text-charcoal-500"
                />
              </div>

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
                  onChange={(event) =>
                    setQuoteDate(event.target.value)
                  }
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
                />
              </div>

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
                  onChange={(event) =>
                    setValidUntil(event.target.value)
                  }
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
                />
              </div>
            </div>

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

            <div className="mt-5">
              <label
                htmlFor="status"
                className="mb-1 block text-sm font-medium text-charcoal-700"
              >
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500 sm:max-w-xs"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </section>

          <section className="rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  Quote Items
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Edit the services or products included in this
                  quote.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200 px-3 py-2 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id ?? `new-${index}`}
                  className="rounded-lg border border-charcoal-100 bg-charcoal-50 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_120px_160px_40px] md:items-end">
                    <div>
                      <label
                        htmlFor={`description-${index}`}
                        className="mb-1 block text-xs font-medium uppercase tracking-wide text-charcoal-500"
                      >
                        Description
                      </label>

                      <input
                        id={`description-${index}`}
                        type="text"
                        value={item.description}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "description",
                            event.target.value
                          )
                        }
                        placeholder="Description"
                        className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`quantity-${index}`}
                        className="mb-1 block text-xs font-medium uppercase tracking-wide text-charcoal-500"
                      >
                        Quantity
                      </label>

                      <input
                        id={`quantity-${index}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "quantity",
                            Number(event.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`price-${index}`}
                        className="mb-1 block text-xs font-medium uppercase tracking-wide text-charcoal-500"
                      >
                        Unit Price
                      </label>

                      <input
                        id={`price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "unit_price",
                            Number(event.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      title="Remove item"
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mt-3 text-right text-sm font-semibold text-charcoal-700">
                    Item Total:{" "}
                    {formatCurrency(
                      calculateItemTotal(item)
                    )}
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-charcoal-200 p-8 text-center">
                  <p className="text-sm text-charcoal-500">
                    No quote items.
                  </p>

                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-3 text-sm font-semibold text-charcoal-900 underline"
                  >
                    Add your first item
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-charcoal-900">
                Notes
              </h2>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={7}
                placeholder="Add notes to this quote..."
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
              />
            </div>

            <div className="rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-charcoal-900">
                Totals
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-charcoal-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {vatEnabled && (
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">
                      VAT ({vatRate}%)
                    </span>

                    <span className="font-medium text-charcoal-900">
                      {formatCurrency(vatAmount)}
                    </span>
                  </div>
                )}

                <div className="border-t border-charcoal-100 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-charcoal-900">
                      Total
                    </span>

                    <span className="text-xl font-bold text-charcoal-900">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-charcoal-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              href={`/quotes/${quoteId}`}
              className="inline-flex items-center justify-center rounded-lg border border-charcoal-200 px-5 py-3 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={saveQuote}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-charcoal-900 px-5 py-3 text-sm font-semibold text-white hover:bg-charcoal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}