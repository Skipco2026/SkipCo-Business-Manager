"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: string;
  description: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [form, setForm] = useState({
    product_code: "",
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
    loadCategories();
    generateProductCode();
  }, []);

  async function loadCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("id, description")
      .order("description");

    if (error) {
      console.error(error);
      return;
    }

    setCategories(data ?? []);
  }

  function generateProductCode() {
    const code = `PROD-${Date.now().toString().slice(-6)}`;

    setForm((prev) => ({
      ...prev,
      product_code: code,
    }));
  }

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleAddCategory() {
    const description = newCategory.trim();

    if (!description) {
      alert("Please enter a category description.");
      return;
    }

    setAddingCategory(true);

    const { data, error } = await supabase
      .from("categories")
      .insert({
        description,
      })
      .select("id, description")
      .single();

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        alert("This category already exists.");
      } else {
        alert(error.message);
      }

      setAddingCategory(false);
      return;
    }

    if (data) {
      setCategories((prev) =>
        [...prev, data].sort((a, b) =>
          a.description.localeCompare(b.description)
        )
      );

      updateField("category", data.description);
    }

    setNewCategory("");
    setShowAddCategory(false);
    setAddingCategory(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.product_name.trim()) {
      alert("Please enter a product name.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("products")
      .insert({
        product_code: form.product_code.trim(),
        product_name: form.product_name.trim(),

        // Keep the existing database column populated,
        // but use Product Name as the quote description.
        description: form.product_name.trim(),

        category: form.category || null,
        type: form.type,
        unit: form.unit,
        cost_price: Number(form.cost_price || 0),
        selling_price: Number(form.selling_price || 0),
        vat_rate: Number(form.vat_rate || 15),
        status: form.status,
        notes: form.notes || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      alert(error.message);
      setSaving(false);
      return;
    }

    if (data) {
      router.push(`/products/${data.id}`);
      router.refresh();
    }
  }

  return (
    <DashboardShell
      title="Add Product"
      subtitle="Create a new product or service"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >

        {/* Product Details */}

        <div className="grid gap-8 lg:grid-cols-2">

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Product Details
            </h2>

            <div className="space-y-4">

              {/* Product Code */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Code
                </label>

                <input
                  type="text"
                  value={form.product_code}
                  onChange={(e) =>
                    updateField(
                      "product_code",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border px-4 py-3"
                  required
                />

                <p className="mt-1 text-xs text-gray-500">
                  A product code has been generated automatically. You can change it if needed.
                </p>
              </div>

              {/* Product Name */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Name
                </label>

                <input
                  type="text"
                  value={form.product_name}
                  onChange={(e) =>
                    updateField(
                      "product_name",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border px-4 py-3"
                  placeholder="e.g. 2m³ Skip Bin Hire"
                  required
                />

                <p className="mt-1 text-xs text-gray-500">
                  The product name will be used as the description on quotes.
                </p>
              </div>

              {/* Category */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category
                </label>

                <div className="flex gap-2">

                  <select
                    value={form.category}
                    onChange={(e) =>
                      updateField(
                        "category",
                        e.target.value
                      )
                    }
                    className="flex-1 rounded-lg border px-4 py-3"
                  >
                    <option value="">
                      Select Category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.description}
                      >
                        {category.description}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setNewCategory("");
                      setShowAddCategory(true);
                    }}
                    className="whitespace-nowrap rounded-lg border border-blue-600 px-4 py-3 text-blue-600 hover:bg-blue-50"
                  >
                    ＋ Add Category
                  </button>

                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Select an existing category or add a new one.
                </p>
              </div>

            </div>

          </div>

          {/* Pricing & Settings */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Pricing & Settings
            </h2>

            <div className="space-y-4">

              {/* Type */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Type
                </label>

                <select
                  value={form.type}
                  onChange={(e) =>
                    updateField(
                      "type",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border px-4 py-3"
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
                <label className="mb-2 block text-sm font-medium">
                  Unit
                </label>

                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) =>
                    updateField(
                      "unit",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border px-4 py-3"
                  placeholder="Each"
                />
              </div>

              {/* Prices */}

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Cost Price
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost_price}
                    onChange={(e) =>
                      updateField(
                        "cost_price",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-4 py-3"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Selling Price
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.selling_price}
                    onChange={(e) =>
                      updateField(
                        "selling_price",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-4 py-3"
                    placeholder="0.00"
                  />
                </div>

              </div>

              {/* VAT and Status */}

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    VAT Rate (%)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.vat_rate}
                    onChange={(e) =>
                      updateField(
                        "vat_rate",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      updateField(
                        "status",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-4 py-3"
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

            </div>

          </div>

        </div>

        {/* Notes */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="mb-6 text-xl font-bold">
            Notes
          </h2>

          <textarea
            rows={5}
            value={form.notes}
            onChange={(e) =>
              updateField(
                "notes",
                e.target.value
              )
            }
            className="w-full rounded-lg border px-4 py-3"
            placeholder="Additional notes..."
          />

        </div>

        {/* Buttons */}

        <div className="flex justify-end gap-4">

          <Link
            href="/products"
            className="rounded-lg border px-6 py-3 hover:bg-gray-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Product"}
          </button>

        </div>

      </form>

      {/* Add Category Modal */}

      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold">
                  Add Category
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the category description.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategory("");
                }}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Category Description
              </label>

              <input
                type="text"
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="e.g. Skip Bin Hire"
                className="w-full rounded-lg border px-4 py-3"
                autoFocus
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategory("");
                }}
                className="rounded-lg border px-5 py-3 hover:bg-gray-100"
                disabled={addingCategory}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddCategory}
                disabled={
                  addingCategory ||
                  !newCategory.trim()
                }
                className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addingCategory
                  ? "Adding..."
                  : "Add Category"}
              </button>

            </div>

          </div>

        </div>
      )}

    </DashboardShell>
  );
}