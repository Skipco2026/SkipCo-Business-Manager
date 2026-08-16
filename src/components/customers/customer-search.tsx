"use client";

interface CustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomerSearch({
  value,
  onChange,
}: CustomerSearchProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Customers
        </h1>

        <p className="text-gray-500">
          Manage your customer database
        </p>
      </div>

      <div className="flex w-full md:w-auto">

        <input
          type="text"
          placeholder="Search company, contact, email, phone..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none md:w-96"
        />

      </div>

    </div>
  );
}