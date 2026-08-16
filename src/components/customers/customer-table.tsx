"use client";

import Link from "next/link";

export interface Customer {
  id: string;
  customer_number: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;

  // Additional customer fields used by the Customers page
  created_at: string | null;
  credit_limit: number | null;
}

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
}

export function CustomerTable({
  customers,
  loading,
}: CustomerTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
        Loading customers...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold">
          No customers found
        </h2>

        <p className="mt-2 text-gray-500">
          Click &quot;Add Customer&quot; to create your first customer.
        </p>

        <Link
          href="/customers/new"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          + Add Customer
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-4 text-left text-sm font-semibold">
                Customer No.
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold">
                Company
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold">
                Contact
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold">
                Phone
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold">
                Email
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold">
                Status
              </th>

              <th className="px-5 py-4 text-center text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="px-5 py-4 text-sm">
                  {customer.customer_number}
                </td>

                <td className="px-5 py-4 font-semibold">
                  {customer.company_name}
                </td>

                <td className="px-5 py-4 text-sm">
                  {customer.contact_person || "-"}
                </td>

                <td className="px-5 py-4 text-sm">
                  {customer.phone || "-"}
                </td>

                <td className="px-5 py-4 text-sm">
                  {customer.email || "-"}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      (customer.status ?? "Active") === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {customer.status || "Active"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-center gap-2">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      View
                    </Link>

                    <Link
                      href={`/customers/${customer.id}/edit`}
                      className="rounded bg-yellow-500 px-3 py-2 text-sm text-white hover:bg-yellow-600"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      onClick={() =>
                        alert(
                          "Delete customer feature coming next!"
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}