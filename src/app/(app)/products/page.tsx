"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  product_code: string | null;
  product_name: string;
  description: string | null;
  category: string | null;
  type: string | null;
  unit: string | null;
  cost_price: number | null;
  selling_price: number | null;
  vat_rate: number | null;
  status: string | null;
  notes: string | null;
}

export default function ProductsPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("product_name");

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setProducts((data ?? []) as Product[]);
    }

    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return products;
    }

    return products.filter((product) =>
      [
        product.product_code,
        product.product_name,
        product.category,
        product.type,
        product.unit,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchText)
    );
  }, [products, search]);

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => (product.status ?? "Active") === "Active"
  ).length;

  const services = products.filter(
    (product) => product.type === "Service"
  ).length;

  const sellingValue = products.reduce(
    (total, product) =>
      total + Number(product.selling_price ?? 0),
    0
  );

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.product_name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      console.error(error);
      alert(error.message);
      setDeletingId(null);
      return;
    }

    setProducts((prev) =>
      prev.filter((item) => item.id !== product.id)
    );

    setDeletingId(null);
  }

  function formatCurrency(value: number | null) {
    return `R ${Number(value ?? 0).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <DashboardShell
      title="Products & Services"
      subtitle="Manage your products and services"
    >
      <div className="space-y-6">

        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Products & Services
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your products, services, pricing and categories.
            </p>
          </div>

          <Link
            href="/products/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Add Product
          </Link>

        </div>

        {/* Compact Summary */}

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

          <div className="grid grid-cols-2 divide-x sm:grid-cols-4">

            <div className="px-4 py-4 sm:px-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total Products
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalProducts}
              </p>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Active
              </p>

              <p className="mt-1 text-2xl font-bold text-green-600">
                {activeProducts}
              </p>
            </div>

            <div className="border-t px-4 py-4 sm:border-t-0 sm:px-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Services
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-600">
                {services}
              </p>
            </div>

            <div className="border-t px-4 py-4 sm:border-t-0 sm:px-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Selling Value
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatCurrency(sellingValue)}
              </p>
            </div>

          </div>

        </div>

        {/* Search */}

        <div className="rounded-xl border bg-white p-4 shadow-sm">

          <div className="relative">

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, codes, categories or services..."
              className="w-full rounded-lg border px-4 py-3 pr-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            )}

          </div>

        </div>

        {/* Product List */}

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

          <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-semibold text-gray-900">
                Product List
              </h2>

              <p className="text-sm text-gray-500">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1
                  ? "item"
                  : "items"}
                {search && ` matching "${search}"`}
              </p>
            </div>

          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 text-center">

              <div className="text-4xl">
                📦
              </div>

              <h3 className="mt-3 font-semibold text-gray-900">
                {search
                  ? "No products found"
                  : "No products yet"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try a different search."
                  : "Add your first product or service to get started."}
              </p>

              {!search && (
                <Link
                  href="/products/new"
                  className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                  + Add Product
                </Link>
              )}

            </div>
          ) : (
            <>

              {/* Desktop Table */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full">

                  <thead className="border-b bg-gray-50">

                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                      <th className="px-5 py-4">
                        Code
                      </th>

                      <th className="px-5 py-4">
                        Product / Service
                      </th>

                      <th className="px-5 py-4">
                        Category
                      </th>

                      <th className="px-5 py-4">
                        Type
                      </th>

                      <th className="px-5 py-4 text-right">
                        Selling Price
                      </th>

                      <th className="px-5 py-4 text-center">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y">

                    {filteredProducts.map((product) => (

                      <tr
                        key={product.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                          {product.product_code || "—"}
                        </td>

                        <td className="px-5 py-4">

                          <Link
                            href={`/products/${product.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {product.product_name}
                          </Link>

                          <div className="mt-1 text-xs text-gray-500">
                            Unit: {product.unit || "Each"}
                          </div>

                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {product.category || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {product.type || "Product"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(product.selling_price)}
                        </td>

                        <td className="px-5 py-4 text-center">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              (product.status ?? "Active") === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {product.status ?? "Active"}
                          </span>

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right">

                          <div className="flex justify-end gap-2">

                            <Link
                              href={`/products/${product.id}`}
                              className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-gray-100"
                            >
                              View
                            </Link>

                            <Link
                              href={`/products/${product.id}/edit`}
                              className="rounded-md border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(product)
                              }
                              disabled={
                                deletingId === product.id
                              }
                              className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId === product.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>

                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

              {/* Mobile List */}

              <div className="divide-y md:hidden">

                {filteredProducts.map((product) => (

                  <div
                    key={product.id}
                    className="p-4"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <Link
                          href={`/products/${product.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {product.product_name}
                        </Link>

                        <p className="mt-1 text-xs text-gray-500">
                          {product.product_code || "No code"}
                        </p>

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          (product.status ?? "Active") === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.status ?? "Active"}
                      </span>

                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">

                      <div>
                        <p className="text-xs text-gray-500">
                          Category
                        </p>

                        <p className="font-medium text-gray-700">
                          {product.category || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Type
                        </p>

                        <p className="font-medium text-gray-700">
                          {product.type || "Product"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Unit
                        </p>

                        <p className="font-medium text-gray-700">
                          {product.unit || "Each"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Selling Price
                        </p>

                        <p className="font-semibold text-gray-900">
                          {formatCurrency(
                            product.selling_price
                          )}
                        </p>
                      </div>

                    </div>

                    <div className="mt-4 flex gap-2">

                      <Link
                        href={`/products/${product.id}`}
                        className="flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium hover:bg-gray-100"
                      >
                        View
                      </Link>

                      <Link
                        href={`/products/${product.id}/edit`}
                        className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(product)
                        }
                        disabled={
                          deletingId === product.id
                        }
                        className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === product.id
                          ? "..."
                          : "Delete"}
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            </>
          )}

        </div>

      </div>
    </DashboardShell>
  );
}