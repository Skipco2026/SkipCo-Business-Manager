"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";
import { FileText } from "lucide-react";

interface Quote {
  id: string;
  quote_number: string;
  quote_date: string;
  valid_until: string | null;
  total: number;
  status: string;
  customers: {
    company_name: string;
  } | null;
}

export default function QuotesPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    loadQuotes();
  }, []);

  async function loadQuotes() {
    const { data, error } = await supabase
      .from("quotes")
      .select(`
        *,
        customers (
          company_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setQuotes(data ?? []);
    }

    setLoading(false);
  }

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const term = search.toLowerCase();

      return (
        quote.quote_number.toLowerCase().includes(term) ||
        quote.customers?.company_name
          ?.toLowerCase()
          .includes(term) ||
        quote.status.toLowerCase().includes(term)
      );
    });
  }, [quotes, search]);

  const draftCount = quotes.filter(
    (q) => q.status === "Draft"
  ).length;

  const acceptedCount = quotes.filter(
    (q) => q.status === "Accepted"
  ).length;

  const totalValue = quotes.reduce(
    (sum, q) => sum + Number(q.total),
    0
  );

  return (
    <DashboardShell
      title="Quotes"
      subtitle="Create and manage customer quotations"
    >
            {/* Summary Cards */}

      <div className="mb-8 grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Quotes</p>
          <h2 className="mt-2 text-3xl font-bold">
            {quotes.length}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Draft</p>
          <h2 className="mt-2 text-3xl font-bold text-yellow-600">
            {draftCount}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Accepted</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {acceptedCount}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Value</p>
          <h2 className="mt-2 text-3xl font-bold">
            R {totalValue.toLocaleString()}
          </h2>
        </div>

      </div>

      {/* Search & Button */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <input
          type="text"
          placeholder="Search quotes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 md:max-w-md"
        />

        <Link
          href="/quotes/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          <FileText size={18} />
          New Quote
        </Link>

      </div>

      {/* Quotes Table */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Quote #
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Customer
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Date
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Status
              </th>

              <th className="px-6 py-4 text-right text-sm font-semibold">
                Total
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center"
                >
                  Loading quotes...
                </td>
              </tr>

            ) : filteredQuotes.length === 0 ? (

              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No quotes found.
                </td>
              </tr>

            ) : (

              filteredQuotes.map((quote) => (

                <tr
                  key={quote.id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="px-6 py-4">

                    <Link
                      href={`/quotes/${quote.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {quote.quote_number}
                    </Link>

                  </td>

                  <td className="px-6 py-4">
                    {quote.customers?.company_name ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    {new Date(quote.quote_date).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    {quote.status}
                  </td>

                  <td className="px-6 py-4 text-right font-semibold">
                    R {Number(quote.total).toLocaleString()}
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </DashboardShell>
  );
}
