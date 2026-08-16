"use client";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProductSearch({
  value,
  onChange,
}: ProductSearchProps) {
  return (
    <div className="mb-8">
      <input
        type="text"
        placeholder="Search products, services, category or code..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}