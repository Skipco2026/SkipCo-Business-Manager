"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

interface Customer {
  id: string;
  customer_number: string;
  company_name: string;
  trading_name: string;
  contact_person: string;
  email: string;
  phone: string;
  mobile: string;
  vat_number: string;
  registration_number: string;
  physical_address: string;
  postal_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  payment_terms: string;
  credit_limit: number;
  status: string;
  notes: string;
}

export default function CustomerPage() {
  const params = useParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomer();
  }, []);

  async function loadCustomer() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      console.error(error);
    } else {
      setCustomer(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <DashboardShell title="Customer" subtitle="Loading...">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          Loading customer...
        </div>
      </DashboardShell>
    );
  }

  if (!customer) {
    return (
      <DashboardShell title="Customer" subtitle="Not Found">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          Customer not found.
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={customer.company_name}
      subtitle={`Customer #${customer.customer_number}`}
    >
      <div className="space-y-8">

        {/* Header */}

        <div className="rounded-xl border bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-4">

                <h1 className="text-3xl font-bold">
                  {customer.company_name}
                </h1>

                <span
                  className={`rounded-full px-4 py-1 text-sm font-medium ${
                    customer.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {customer.status}
                </span>

              </div>

              <p className="mt-2 text-gray-500">
                Customer Number: {customer.customer_number}
              </p>

              {customer.trading_name && (
                <p className="mt-1 text-gray-500">
                  Trading Name: {customer.trading_name}
                </p>
              )}

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href={`/customers/${customer.id}/edit`}
                className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
              >
                ✏ Edit Customer
              </Link>

              <button className="rounded-lg border px-5 py-3 hover:bg-gray-100">
                📄 New Quote
              </button>

              <button className="rounded-lg border px-5 py-3 hover:bg-gray-100">
                🔨 New Job
              </button>

              <button className="rounded-lg border px-5 py-3 hover:bg-gray-100">
                🧾 New Invoice
              </button>

            </div>

          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-2">
                      {/* Contact Information */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Contact Information
            </h2>

            <div className="space-y-4">

              <div>
                <p className="text-sm text-gray-500">Contact Person</p>
                <p className="font-medium">{customer.contact_person || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{customer.email || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{customer.phone || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Mobile</p>
                <p className="font-medium">{customer.mobile || "-"}</p>
              </div>

            </div>

          </div>

          {/* Business Information */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Business Information
            </h2>

            <div className="space-y-4">

              <div>
                <p className="text-sm text-gray-500">VAT Number</p>
                <p className="font-medium">{customer.vat_number || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Registration Number</p>
                <p className="font-medium">
                  {customer.registration_number || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p className="font-medium">{customer.payment_terms || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Credit Limit</p>
                <p className="font-medium">
                  R {Number(customer.credit_limit).toLocaleString()}
                </p>
              </div>

            </div>

          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Address */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Address
            </h2>

            <div className="space-y-4">

              <div>
                <p className="text-sm text-gray-500">
                  Physical Address
                </p>
                <p className="font-medium whitespace-pre-line">
                  {customer.physical_address || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Postal Address
                </p>
                <p className="font-medium whitespace-pre-line">
                  {customer.postal_address || "-"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-medium">{customer.city || "-"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Province</p>
                  <p className="font-medium">{customer.province || "-"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Postal Code</p>
                  <p className="font-medium">{customer.postal_code || "-"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Country</p>
                  <p className="font-medium">{customer.country || "-"}</p>
                </div>

              </div>

            </div>

          </div>

          {/* Notes */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">
              Notes
            </h2>

            <div className="min-h-[220px] rounded-lg bg-gray-50 p-4">

              <p className="whitespace-pre-line text-gray-700">
                {customer.notes || "No notes available."}
              </p>

            </div>

          </div>

        </div>

      </div>

    </DashboardShell>
  );
}