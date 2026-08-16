"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";
import {
  Customer,
  CustomerTable,
} from "@/components/customers/customer-table";
import { CustomerSummary } from "@/components/customers/customer-summary";
import { CustomerSearch } from "@/components/customers/customer-search";

export default function CustomersPage() {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("company_name");

    if (error) {
      console.error("Customers loading error:", error);
    } else {
      setCustomers((data ?? []) as Customer[]);
    }

    setLoading(false);
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      [
        customer.customer_number,
        customer.company_name,
        customer.contact_person,
        customer.phone,
        customer.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [customers, search]);

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => (customer.status ?? "Active") === "Active"
  ).length;

  const newCustomers = customers.filter((customer) => {
    if (!customer.created_at) {
      return false;
    }

    const created = new Date(customer.created_at);
    const today = new Date();

    return (
      created.getMonth() === today.getMonth() &&
      created.getFullYear() === today.getFullYear()
    );
  }).length;

  const totalCreditLimit = customers.reduce((total, customer) => {
    return total + Number(customer.credit_limit ?? 0);
  }, 0);

  return (
    <DashboardShell
      title="Customers"
      subtitle="Manage your customer database"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Customers
          </h1>

          <p className="mt-1 text-gray-500">
            Manage all customer accounts
          </p>
        </div>

        <Link
          href="/customers/new"
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          + Add Customer
        </Link>
      </div>

      <CustomerSummary
        totalCustomers={totalCustomers}
        activeCustomers={activeCustomers}
        newCustomers={newCustomers}
        totalCreditLimit={totalCreditLimit}
      />

      <CustomerSearch
        value={search}
        onChange={setSearch}
      />

      <CustomerTable
        customers={filteredCustomers}
        loading={loading}
      />
    </DashboardShell>
  );
}