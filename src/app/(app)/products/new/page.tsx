"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);

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

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSaving(true);

    const { error } = await supabase
      .from("products")
      .insert({
        ...form,
        cost_price: Number(form.cost_price || 0),
        selling_price: Number(form.selling_price || 0),
        vat_rate: Number(form.vat_rate || 15),
      });

    if (error) {
      console.error(error);
      alert(error.message);
      setSaving(false);
      return;
    }

    router.push("/products");
    router.refresh();
  }

  return (
    <DashboardShell
      title="New Product"
      subtitle="Create a new product or service"
    >

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
              <div className="grid gap-8 lg:grid-cols-2">

          {/* Product Details */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Product Details
            </h2>

            <div className="space-y-4">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Code
                </label>

                <input
                  type="text"
                  value={form.product_code}
                  onChange={(e) =>
                    updateField("product_code", e.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Name
                </label>

                <input
                  type="text"
                  value={form.product_name}
                  onChange={(e) =>
                    updateField("product_name", e.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category
                </label>

                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    updateField("category", e.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

            </div>

          </div>

          {/* Pricing & Settings */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Pricing & Settings
            </h2>

            <div className="space-y-4">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Type
                </label>

                <select
                  value={form.type}
                  onChange={(e) =>
                    updateField("type", e.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                >
                  <option>Product</option>
                  <option>Service</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Unit
                </label>

                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) =>
                    updateField("unit", e.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Cost Price
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    value={form.cost_price}
                    onChange={(e) =>
                      updateField("cost_price", e.target.value)
                    }
                    className="w-full rounded-lg border px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Selling Price
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    value={form.selling_price}
                    onChange={(e) =>
                      updateField("selling_price", e.target.value)
                    }
                    className="w-full rounded-lg border px-4 py-3"
                  />
                </div>

              </div>
                            <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    VAT Rate (%)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    value={form.vat_rate}
                    onChange={(e) =>
                      updateField("vat_rate", e.target.value)
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
                      updateField("status", e.target.value)
                    }
                    className="w-full rounded-lg border px-4 py-3"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
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
              updateField("notes", e.target.value)
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
            {saving ? "Saving..." : "Save Product"}
          </button>

        </div>

      </form>

    </DashboardShell>
  );
}