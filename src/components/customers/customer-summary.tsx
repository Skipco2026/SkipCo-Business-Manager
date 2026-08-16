"use client";

interface CustomerSummaryProps {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  totalCreditLimit: number;
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>

      <h2 className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

export function CustomerSummary({
  totalCustomers,
  activeCustomers,
  newCustomers,
  totalCreditLimit,
}: CustomerSummaryProps) {
  return (
    <div className="grid gap-6 mb-8 sm:grid-cols-2 xl:grid-cols-4">

      <SummaryCard
        title="Total Customers"
        value={totalCustomers.toString()}
        subtitle="All customers"
      />

      <SummaryCard
        title="Active Customers"
        value={activeCustomers.toString()}
        subtitle="Currently active"
      />

      <SummaryCard
        title="New This Month"
        value={newCustomers.toString()}
        subtitle="Recently added"
      />

      <SummaryCard
        title="Credit Limit"
        value={`R ${totalCreditLimit.toLocaleString()}`}
        subtitle="Combined credit limit"
      />

    </div>
  );
}