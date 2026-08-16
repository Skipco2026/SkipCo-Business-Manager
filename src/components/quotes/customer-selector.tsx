"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Customer {
  id: string;
  customer_number: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  physical_address: string;
}

interface CustomerSelectorProps {
  value: string;
  onChange: (customer: Customer | null) => void;
}

export default function CustomerSelector({
  value,
  onChange,
}: CustomerSelectorProps) {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select(
        `
        id,
        customer_number,
        company_name,
        contact_person,
        email,
        phone,
        physical_address
      `
      )
      .order("company_name", { ascending: true });

    if (error) {
      console.error("Error loading customers:", error);
      return;
    }

    setCustomers((data as Customer[]) ?? []);
  }

  const filteredCustomers = customers.filter((customer) =>
    [
      customer.company_name,
      customer.contact_person,
      customer.customer_number,
      customer.email,
      customer.phone,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold">Select Customer</h2>

      <input
        type="text"
        placeholder="Search customer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border px-4 py-3"
      />

      <div className="max-h-80 overflow-y-auto rounded-lg border">
        {filteredCustomers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No customers found.
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => onChange(customer)}
              className={`w-full border-b p-4 text-left transition hover:bg-blue-50 ${
                value === customer.id
                  ? "bg-blue-100 border-blue-300"
                  : "bg-white"
              }`}
            >
              <div className="font-semibold text-gray-900">
                {customer.company_name}
              </div>

              <div className="mt-1 text-sm text-gray-600">
                {customer.contact_person}
              </div>

              <div className="text-sm text-gray-500">
                {customer.phone}
              </div>

              <div className="text-sm text-gray-500">
                {customer.email}
              </div>

              <div className="mt-2 text-xs text-gray-400">
                {customer.customer_number}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}