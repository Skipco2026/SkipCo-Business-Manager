"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

interface Customer {
  company_name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total: number;
  status: string;
  customer: Customer;
}

export default function InvoicesPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        customer:customers (
          company_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setInvoices(data ?? []);
    setLoading(false);
  }

  function statusColour(status: string) {
    switch (status) {
      case "Draft":
        return "bg-yellow-100 text-yellow-700";

      case "Sent":
        return "bg-blue-100 text-blue-700";

      case "Paid":
        return "bg-green-100 text-green-700";

      case "Overdue":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  return (
    <DashboardShell
      title="Invoices"
      subtitle="Manage customer invoices"
    >
      <div className="space-y-6">

        <div className="flex justify-end">

          <Link
            href="/invoices/new"
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + New Invoice
          </Link>

        </div>
                {loading ? (

          <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
            Loading invoices...
          </div>

        ) : invoices.length === 0 ? (

          <div className="rounded-xl border bg-white p-10 text-center shadow-sm">

            <h2 className="text-xl font-semibold">
              No invoices found
            </h2>

            <p className="mt-2 text-gray-500">
              Create your first invoice to get started.
            </p>

          </div>

        ) : (

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>

                  <th className="px-6 py-4 text-left">
                    Invoice
                  </th>

                  <th className="px-6 py-4 text-left">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left">
                    Date
                  </th>

                  <th className="px-6 py-4 text-left">
                    Due Date
                  </th>

                  <th className="px-6 py-4 text-right">
                    Total
                  </th>

                  <th className="px-6 py-4 text-center">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {invoices.map((invoice) => (

                  <tr
                    key={invoice.id}
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="px-6 py-5 font-semibold">
                      {invoice.invoice_number}
                    </td>

                    <td className="px-6 py-5">
                      {invoice.customer.company_name}
                    </td>

                    <td className="px-6 py-5">
                      {invoice.invoice_date}
                    </td>

                    <td className="px-6 py-5">
                      {invoice.due_date}
                    </td>

                    <td className="px-6 py-5 text-right font-semibold">
                      R{" "}
                      {Number(invoice.total).toLocaleString(
                        "en-ZA",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>

                    <td className="px-6 py-5 text-center">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColour(
                          invoice.status
                        )}`}
                      >
                        {invoice.status}
                      </span>

                    </td>

                    <td className="px-6 py-5 text-right">

                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        View
                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </DashboardShell>
  );
}