"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import CustomerSelector from "@/components/quotes/customer-selector";
import { createClient } from "@/lib/supabase/client";

type Customer = {
  id: string;
  customer_number?: string | null;
  company_name: string | null;
  trading_name?: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  mobile?: string | null;
  physical_address: string | null;
};

type Product = {
  id: string;
  product_code: string | null;
  product_name: string | null;
  description: string | null;
  category: string | null;
  type: string | null;
  unit: string | null;
  selling_price: number | null;
  vat_rate: number | null;
  status: string | null;
};

type EditableItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export default function NewQuotePage() {
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<EditableItem[]>([]);

  const [quoteDate, setQuoteDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [validUntil, setValidUntil] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  });

  const [site, setSite] = useState("");
  const [notes, setNotes] = useState("");
  const [status] = useState("Draft");

  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState(15);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      setError("");

      try {
        const supabase = createClient();

        const { data, error: productError } = await supabase
          .from("products")
          .select(`
            id,
            product_code,
            product_name,
            description,
            category,
            type,
            unit,
            selling_price,
            vat_rate,
            status
          `)
          .order("product_name", { ascending: true });

        if (productError) {
          throw productError;
        }

        setProducts((data ?? []) as Product[]);
      } catch (err) {
        console.error("Error loading products:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products and services."
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

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

  const selectProduct = (
    index: number,
    productId: string
  ) => {
    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return;
    }

    const productName =
      product.product_name?.trim() ||
      product.description?.trim() ||
      "";

    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          description: productName,
          unit_price: Number(product.selling_price ?? 0),
        };
      })
    );
  };

  const updateItem = (
    index: number,
    field: "quantity" | "unit_price",
    value: number
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

  const removeItem = (index: number) => {
    setItems((currentItems) =>
      currentItems.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  };

  const calculateItemTotal = (
    item: EditableItem
  ) => {
    return (
      Number(item.quantity || 0) *
      Number(item.unit_price || 0)
    );
  };

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + calculateItemTotal(item),
      0
    );
  }, [items]);

  const vatAmount = useMemo(() => {
    if (!vatEnabled) {
      return 0;
    }

    return subtotal * (Number(vatRate) / 100);
  }, [subtotal, vatEnabled, vatRate]);

  const total = subtotal + vatAmount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const saveQuote = async () => {
    setError("");

    if (!customer) {
      setError("Please select a customer.");
      return;
    }

    if (!quoteDate) {
      setError("Please enter a quote date.");
      return;
    }

    if (!validUntil) {
      setError("Please enter a valid until date.");
      return;
    }

    if (
      vatEnabled &&
      (Number(vatRate) < 0 ||
        Number(vatRate) > 100)
    ) {
      setError(
        "Please enter a valid VAT rate between 0% and 100%."
      );
      return;
    }

    for (const item of items) {
      if (!item.description.trim()) {
        setError(
          "Every quote item needs a product or service."
        );
        return;
      }

      if (Number(item.quantity) <= 0) {
        setError(
          "Quantity must be greater than zero."
        );
        return;
      }

      if (Number(item.unit_price) < 0) {
        setError(
          "Unit price cannot be negative."
        );
        return;
      }
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const { data: quote, error: quoteError } =
        await supabase
          .from("quotes")
          .insert({
            customer_id: customer.id,
            quote_date: quoteDate,
            valid_until: validUntil,
            site: site.trim() || null,
            subtotal,
            total,
            vat_enabled: vatEnabled,
            vat_rate: vatEnabled
              ? Number(vatRate)
              : 0,
            status,
            notes: notes.trim() || null,
          })
          .select()
          .single();

      if (quoteError) {
        throw quoteError;
      }

      if (!quote) {
        throw new Error(
          "Quote could not be created."
        );
      }

      if (items.length > 0) {
        const itemsToInsert = items.map(
          (item) => {
            const quantity = Number(
              item.quantity || 0
            );

            const unitPrice = Number(
              item.unit_price || 0
            );

            return {
              quote_id: quote.id,
              description:
                item.description.trim(),
              quantity,
              unit_price: unitPrice,
              total: quantity * unitPrice,
            };
          }
        );

        const { error: itemsError } =
          await supabase
            .from("quote_items")
            .insert(itemsToInsert);

        if (itemsError) {
          throw itemsError;
        }
      }

      alert("Quote created successfully!");

      router.push(`/quotes/${quote.id}`);
      router.refresh();
    } catch (err) {
      console.error(
        "Error creating quote:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the quote."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">

        {/* PAGE HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <Link
              href="/quotes"
              className="mb-3 inline-flex items-center gap-2 text-sm text-charcoal-500 hover:text-charcoal-900"
            >
              <ArrowLeft size={16} />
              Back to Quotes
            </Link>

            <h1 className="text-2xl font-bold text-charcoal-900">
              New Quote
            </h1>

            <p className="mt-1 text-sm text-charcoal-500">
              Create a customer quotation
            </p>
          </div>

          <button
            type="button"
            onClick={saveQuote}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-charcoal-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />
            {saving
              ? "Creating..."
              : "Create Quote"}
          </button>

        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold">
              Unable to create quote
            </p>

            <p className="mt-1 break-words">
              {error}
            </p>
          </div>
        )}

        <div className="space-y-6">

          {/* CUSTOMER */}

          <section className="rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm">

            <h2 className="mb-4 text-lg font-semibold text-charcoal-900">
              Customer
            </h2>

            <CustomerSelector
              value={customer?.id ?? ""}
              onChange={(selectedCustomer) =>
                setCustomer(
                  selectedCustomer as
                    Customer | null
                )
              }
            />

          </section>

          {/* QUOTE DETAILS */}

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
                  value="Generated on save"
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
                    setQuoteDate(
                      event.target.value
                    )
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
                    setValidUntil(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
                />
              </div>

            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <div>
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
                  disabled
                  className="w-full rounded-lg border border-charcoal-200 bg-charcoal-50 px-3 py-2.5 text-sm text-charcoal-500"
                />
              </div>

            </div>

          </section>

          {/* QUOTE ITEMS */}

          <section className="rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm">

            <div className="mb-4 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  Quote Items
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Select products or services from your Products & Services list.
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

            {loadingProducts && (
              <div className="mb-4 rounded-lg bg-charcoal-50 p-4 text-sm text-charcoal-500">
                Loading products and services...
              </div>
            )}

            <div className="space-y-4">

              {items.map((item, index) => (

                <div
                  key={`new-${index}`}
                  className="rounded-lg border border-charcoal-100 bg-charcoal-50 p-4"
                >

                  <div className="grid gap-4 md:grid-cols-[1fr_120px_160px_40px] md:items-end">

                    {/* PRODUCT */}

                    <div>

                      <label
                        htmlFor={`product-${index}`}
                        className="mb-1 block text-xs font-medium uppercase tracking-wide text-charcoal-500"
                      >
                        Product / Service
                      </label>

                      <select
                        id={`product-${index}`}
                        defaultValue=""
                        onChange={(event) =>
                          selectProduct(
                            index,
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
                      >

                        <option value="">
                          Select product / service
                        </option>

                        {products.map(
                          (product) => (
                            <option
                              key={product.id}
                              value={product.id}
                            >
                              {product.product_name ||
                                product.description ||
                                "Unnamed Product"}
                              {product.unit
                                ? ` — ${product.unit}`
                                : ""}
                            </option>
                          )
                        )}

                      </select>

                      {item.description && (
                        <p className="mt-2 text-sm text-charcoal-700">

                          <span className="font-medium">
                            Description:
                          </span>{" "}

                          {item.description}

                        </p>
                      )}

                    </div>

                    {/* QUANTITY */}

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
                            Number(
                              event.target.value
                            )
                          )
                        }
                        className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
                      />

                    </div>

                    {/* UNIT PRICE */}

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
                            Number(
                              event.target.value
                            )
                          )
                        }
                        className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
                      />

                    </div>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(index)
                      }
                      title="Remove item"
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                  <div className="mt-3 text-right text-sm font-semibold text-charcoal-700">
                    Item Total:{" "}
                    {formatCurrency(
                      calculateItemTotal(
                        item
                      )
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

          {/* NOTES + TOTALS */}

          <section className="grid gap-6 lg:grid-cols-2">

            {/* NOTES */}

            <div className="rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm">

              <h2 className="mb-4 text-lg font-semibold text-charcoal-900">
                Notes
              </h2>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                rows={7}
                placeholder="Add notes to this quote..."
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-charcoal-500"
              />

            </div>

            {/* TOTALS */}

            <div className="rounded-xl border border-charcoal-100 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center justify-between">

                <h2 className="text-lg font-semibold text-charcoal-900">
                  Totals
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setVatEnabled(
                      (current) => !current
                    )
                  }
                  className={`relative inline-flex h-10 w-24 items-center rounded-full px-1 transition ${
                    vatEnabled
                      ? "bg-[#20AEB8]"
                      : "bg-charcoal-300"
                  }`}
                  aria-pressed={vatEnabled}
                  aria-label={
                    vatEnabled
                      ? "Turn VAT off"
                      : "Turn VAT on"
                  }
                >

                  <span
                    className={`absolute h-8 w-8 rounded-full bg-white shadow-sm transition-transform ${
                      vatEnabled
                        ? "translate-x-14"
                        : "translate-x-0"
                    }`}
                  />

                  <span
                    className={`w-full text-xs font-bold ${
                      vatEnabled
                        ? "pr-8 text-white"
                        : "pl-8 text-charcoal-700"
                    }`}
                  >
                    {vatEnabled
                      ? "VAT ON"
                      : "VAT OFF"}
                  </span>

                </button>

              </div>

              {vatEnabled && (

                <div className="mb-4">

                  <label
                    htmlFor="vat-rate"
                    className="mb-1 block text-sm font-medium text-charcoal-700"
                  >
                    VAT Rate (%)
                  </label>

                  <input
                    id="vat-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={vatRate}
                    onChange={(event) =>
                      setVatRate(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-charcoal-500 sm:max-w-xs"
                  />

                </div>

              )}

              <div className="space-y-3 text-sm">

                <div className="flex justify-between">

                  <span className="text-charcoal-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-charcoal-900">
                    {formatCurrency(
                      subtotal
                    )}
                  </span>

                </div>

                {vatEnabled && (

                  <div className="flex justify-between">

                    <span className="text-charcoal-500">
                      VAT ({vatRate}%)
                    </span>

                    <span className="font-medium text-charcoal-900">
                      {formatCurrency(
                        vatAmount
                      )}
                    </span>

                  </div>

                )}

                <div className="border-t border-charcoal-100 pt-3">

                  <div className="flex justify-between">

                    <span className="font-semibold text-charcoal-900">
                      Total
                    </span>

                    <span className="text-xl font-bold text-charcoal-900">
                      {formatCurrency(
                        total
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* BOTTOM BUTTONS */}

          <div className="flex flex-col-reverse gap-3 border-t border-charcoal-100 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push("/quotes")
              }
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-charcoal-200 px-5 py-3 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveQuote}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-charcoal-900 px-5 py-3 text-sm font-semibold text-white hover:bg-charcoal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />

              {saving
                ? "Creating..."
                : "Create Quote"}

            </button>

          </div>

        </div>
      </div>
    </DashboardShell>
  );
}