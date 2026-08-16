"use client";

import Link from "next/link";

export interface Product {
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
}

interface ProductTableProps {
  products: Product[];
  loading: boolean;
}

export function ProductTable({
  products,
  loading,
}: ProductTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 shadow-sm">
        Loading products...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 shadow-sm text-center text-gray-500">
        No products found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-6 py-4 text-left">Code</th>

            <th className="px-6 py-4 text-left">
              Product / Service
            </th>

            <th className="px-6 py-4 text-left">
              Category
            </th>

            <th className="px-6 py-4 text-left">
              Type
            </th>

            <th className="px-6 py-4 text-right">
              Selling Price
            </th>

            <th className="px-6 py-4 text-center">
              Status
            </th>

          </tr>

        </thead>

        <tbody>

          {products.map((product) => (

            <tr
              key={product.id}
              className="border-t hover:bg-gray-50"
            >

              <td className="px-6 py-4">
                {product.product_code}
              </td>

              <td className="px-6 py-4">

                <Link
                  href={`/products/${product.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {product.product_name}
                </Link>

              </td>

              <td className="px-6 py-4">
                {product.category}
              </td>

              <td className="px-6 py-4">
                {product.type}
              </td>

              <td className="px-6 py-4 text-right">
                R {Number(product.selling_price).toLocaleString()}
              </td>

              <td className="px-6 py-4 text-center">

                <span
                  className={`rounded-full px-3 py-1 text-sm ${
                    product.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {product.status}
                </span>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}