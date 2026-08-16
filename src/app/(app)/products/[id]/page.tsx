"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  description: string;
  category: string;
  type: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  vat_rate: number;
  status: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export default function ProductPage() {
  const params = useParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProduct();
  }, []);

  async function loadProduct() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      console.error(error);
    } else {
      setProduct(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <DashboardShell
        title="Product"
        subtitle="Loading..."
      >
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          Loading product...
        </div>
      </DashboardShell>
    );
  }

  if (!product) {
    return (
      <DashboardShell
        title="Product"
        subtitle="Not Found"
      >
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          Product not found.
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={product.product_name}
      subtitle={product.product_code}
    >
      <div className="space-y-8">
                {/* Header */}

        <div className="rounded-xl border bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-4">

                <h1 className="text-3xl font-bold">
                  {product.product_name}
                </h1>

                <span
                  className={`rounded-full px-4 py-1 text-sm font-medium ${
                    product.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {product.status}
                </span>

              </div>

              <p className="mt-2 text-gray-500">
                Product Code: {product.product_code}
              </p>

              <p className="mt-1 text-gray-500">
                {product.type} • {product.category || "Uncategorized"}
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href={`/products/${product.id}/edit`}
                className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
              >
                ✏ Edit Product
              </Link>

              <button
                className="rounded-lg border px-5 py-3 hover:bg-gray-100"
              >
                🧾 Use on Quote
              </button>

            </div>

          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-2">
                      {/* Product Information */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Product Information
            </h2>

            <div className="space-y-4">

              <div>
                <p className="text-sm text-gray-500">
                  Description
                </p>

                <p className="font-medium whitespace-pre-line">
                  {product.description || "-"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-sm text-gray-500">
                    Category
                  </p>

                  <p className="font-medium">
                    {product.category || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Type
                  </p>

                  <p className="font-medium">
                    {product.type}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Unit
                  </p>

                  <p className="font-medium">
                    {product.unit}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    VAT Rate
                  </p>

                  <p className="font-medium">
                    {product.vat_rate}%
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* Pricing */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Pricing
            </h2>

            <div className="space-y-6">

              <div>
                <p className="text-sm text-gray-500">
                  Cost Price
                </p>

                <p className="text-2xl font-bold">
                  R {Number(product.cost_price).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Selling Price
                </p>

                <p className="text-3xl font-bold text-green-600">
                  R {Number(product.selling_price).toLocaleString()}
                </p>
              </div>

            </div>

          </div>

        </div>
                {/* Notes */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="mb-6 text-xl font-bold">
            Notes
          </h2>

          <div className="rounded-lg bg-gray-50 p-4 min-h-[150px]">

            <p className="whitespace-pre-line text-gray-700">
              {product.notes || "No notes available."}
            </p>

          </div>

        </div>

        {/* Audit Information */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="mb-6 text-xl font-bold">
            Record Information
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <p className="text-sm text-gray-500">
                Created
              </p>

              <p className="font-medium">
                {product.created_at
                  ? new Date(product.created_at).toLocaleString()
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Last Updated
              </p>

              <p className="font-medium">
                {product.updated_at
                  ? new Date(product.updated_at).toLocaleString()
                  : "-"}
              </p>
            </div>

          </div>

        </div>

      </div>

    </DashboardShell>
  );
}