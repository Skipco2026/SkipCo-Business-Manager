"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";
import {
  Product,
  ProductTable,
} from "@/components/products/product-table";
import { ProductSummary } from "@/components/products/product-summary";
import { ProductSearch } from "@/components/products/product-search";

export default function ProductsPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
    } else {
      setProducts(data as Product[]);
    }

    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      [
        product.product_code,
        product.product_name,
        product.category,
        product.type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [products, search]);

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => (product.status ?? "Active") === "Active"
  ).length;

  const services = products.filter(
    (product) => product.type === "Service"
  ).length;

  const inventoryValue = products.reduce(
    (total, product) => total + Number(product.selling_price ?? 0),
    0
  );

  return (
    <DashboardShell
      title="Products & Services"
      subtitle="Manage products and services"
    >
      <div className="mb-8 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Products & Services
          </h1>

          <p className="mt-1 text-gray-500">
            Manage your products and services
          </p>

        </div>

        <Link
          href="/products/new"
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          + Add Product
        </Link>

      </div>

      <ProductSummary
        totalProducts={totalProducts}
        activeProducts={activeProducts}
        services={services}
        inventoryValue={inventoryValue}
      />

      <ProductSearch
        value={search}
        onChange={setSearch}
      />

      <ProductTable
        products={filteredProducts}
        loading={loading}
      />

    </DashboardShell>
  );
}