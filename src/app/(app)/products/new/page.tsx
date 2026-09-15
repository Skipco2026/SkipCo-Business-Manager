"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [productCode, setProductCode] = useState("");
  const [loadingCode, setLoadingCode] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    product_name: "",
    description: "",
    category: "",
    type: "Product",
    unit: "Each",
    cost_price: "",
    selling_price: "",
    vat_rate: "15",
    status: "Active",
    notes: "",
  });

  useEffect(() => {
    generateProductCode();
  }, []);

  async function generateProductCode() {
    setLoadingCode(true);

    const { data, error } = await supabase
      .from("products")
      .select("product_code");

    if (error) {
      console.error("Error generating product code:", error);
      setProductCode("PRD-0001");
      setLoadingCode(false);
      return;
    }

    let highestNumber = 0;

    for (const product of data ?? []) {
      const code = product.product_code;

      if (!code) continue;

      const match = String(code).match(/^PRD-(\d+)$/i);

      if (match) {
        const number = Number(match[1]);

        if (number > highestNumber) {
          highestNumber = number;
        }
      }
    }

    const nextNumber = highestNumber + 1;

    const newCode = `PRD-${String(nextNumber).padStart(4, "0")}`;

    setProductCode(newCode);
    setLoadingCode(false);
  }

  function handleChange(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!productCode) {
      alert("Product code has not been generated yet.");
      return;
    }

    if (!form.product_name.trim()) {
      alert("Please enter a product name.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("products").insert({
      product_code: productCode,
      product_name: form.product_name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      type: form.type,
      unit: form.unit,
      cost_price: form.cost_price
        ? Number(form.cost_price)
        : 0,
      selling_price: form.selling_price
        ? Number(form.selling_price)
        : 0,
      vat_rate: form.vat_rate
        ? Number(form.vat_rate)
        : 15,
      status: form.status,
      notes: form.notes.trim() || null,
    });

    if (error) {
      console.error("Error creating product:", error);
      alert(`Could not create product: ${error.message}`);
      setSaving(false);
      return;
    }

    alert("Product created successfully.");

    router.push("/products");
    router.refresh();
  }

  return (
    <DashboardShell
      title="Add Product"
      subtitle="Create a new product or service"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Add Product
          </h1>

          <p className="mt-1 text-gray-500">
            Create a new product or service
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Product Information */}
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-charcoal-900">
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              Product Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Product Code */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Code
                </label>

                <input
                  type="text"
                  value={productCode}
                  readOnly
                  placeholder="Generating..."
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-700 outline-none dark:border-gray-700 dark:bg-charcoal-800 dark:text-gray-200"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Automatically generated
                </p>
              </div>

              {/* Product Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Name *
                </label>

                <input
                  type="text"
                  value={form.product_name}
                  onChange={(e) =>
                    handleChange(
                      "product_name",
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-charcoal-800 dark:text-white"
                  placeholder="e.g. 6m³ Skip"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>

                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    handleChange(
                      "category",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-charcoal-800 dark:text-white"
                  placeholder="e.g. Skip Hire"
                />
              </div>

              {/* Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                </label>

                <select
                  value={form.type}
                  onChange={(e) =>
                    handleChange(
                      "type",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-charcoal-800 dark:text-white"
                >
                  <option value="Product">
                    Product
                  </option>
                  <option value="Service">
                    Service
                  </option>
                </select>
              </div>

              {/* Unit */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unit
                </label>

                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) =>
                    handleChange(
                      "unit",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-charcoal-800 dark:text-white"
                  placeholder="Each"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    handleChange(
                      "status",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-charcoal-800 dark:text-white"
                >
                  <option value="Active">
                    Active
                  </option>
                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  handleChange(
                    "description",
                    e.target.value
                  )
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-charcoal-800 dark:text-white"
                placeholder="Enter product or service description..."
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-charcoal-900">
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              Pricing
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Cost Price */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cost Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost_price}
                  onChange={(e) =>
                    handleChange(
                      "cost_price",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-charcoal-800 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selling Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.selling_price}
                  onChange={(e) =>
                    handleChange(
                      "selling_price",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-charcoal-800 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              {/* VAT Rate */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  VAT Rate (%)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.vat_rate}
                  onChange={(e) =>
                    handleChange(
                      "vat_rate",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-charcoal-800 dark:text-white"
                  placeholder="15"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-charcoal-900">
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              Notes
            </h2>

            <textarea
              value={form.notes}
              onChange={(e) =>
                handleChange(
                  "notes",
                  e.target.value
                )
              }
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-charcoal-800 dark:text-white"
              placeholder="Additional notes..."
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-charcoal-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || loadingCode}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : loadingCode
                ? "Generating Code..."
                : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}