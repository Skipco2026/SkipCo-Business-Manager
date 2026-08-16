"use client";

interface ProductSummaryProps {
  totalProducts: number;
  activeProducts: number;
  services: number;
  inventoryValue: number;
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
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

export function ProductSummary({
  totalProducts,
  activeProducts,
  services,
  inventoryValue,
}: ProductSummaryProps) {
  return (
    <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">

      <SummaryCard
        title="Total Items"
        value={totalProducts.toString()}
        subtitle="Products & Services"
      />

      <SummaryCard
        title="Active"
        value={activeProducts.toString()}
        subtitle="Currently Active"
      />

      <SummaryCard
        title="Services"
        value={services.toString()}
        subtitle="Service Items"
      />

      <SummaryCard
        title="Selling Value"
        value={`R ${inventoryValue.toLocaleString()}`}
        subtitle="Combined Selling Price"
      />

    </div>
  );
}