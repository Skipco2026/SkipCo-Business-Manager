"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  description: string;
  selling_price: number;
  type: string;
}

interface ProductSelectorProps {
  onSelect: (product: Product) => void;
}

export default function ProductSelector({
  onSelect,
}: ProductSelectorProps) {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("status", "Active")
      .order("product_name");

    if (data) {
      setProducts(data);
    }
  }

  const filteredProducts = products.filter((product) =>
    product.product_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">

      <h2 className="mb-4 text-xl font-bold">
        Products & Services
      </h2>

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border px-4 py-3"
      />
            <div className="max-h-80 overflow-y-auto rounded-lg border">

        {filteredProducts.length === 0 ? (

          <div className="p-4 text-center text-gray-500">
            No products found.
          </div>

        ) : (

          filteredProducts.map((product) => (

            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product)}
              className="w-full border-b p-4 text-left transition hover:bg-blue-50"
            >

              <div className="flex items-center justify-between">

                <div>

                  <div className="font-semibold">
                    {product.product_name}
                  </div>

                  <div className="text-sm text-gray-500">
                    {product.product_code}
                  </div>

                  <div className="text-sm text-gray-500">
                    {product.type}
                  </div>

                </div>

                <div className="text-right">

                  <div className="text-lg font-bold text-green-600">
                    R {Number(product.selling_price).toLocaleString()}
                  </div>

                </div>

              </div>

            </button>

          ))

        )}

      </div>

    </div>
  );
}