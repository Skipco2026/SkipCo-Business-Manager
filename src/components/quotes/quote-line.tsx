"use client";

import { Trash2 } from "lucide-react";

export interface QuoteLine {
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface QuoteLineProps {
  line: QuoteLine;
  index: number;
  onChange: (
    index: number,
    field: keyof QuoteLine,
    value: string | number
  ) => void;
  onRemove: (index: number) => void;
}

export default function QuoteLine({
  line,
  index,
  onChange,
  onRemove,
}: QuoteLineProps) {
  const lineTotal = line.quantity * line.unit_price;

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">
          Quote Item {index + 1}
        </h3>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-600 hover:text-red-700"
          aria-label={`Remove quote item ${index + 1}`}
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Description
          </label>

          <textarea
            rows={3}
            value={line.description}
            onChange={(e) =>
              onChange(index, "description", e.target.value)
            }
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Quantity
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={line.quantity}
              onChange={(e) =>
                onChange(index, "quantity", Number(e.target.value))
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Unit Price
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={line.unit_price}
              onChange={(e) =>
                onChange(index, "unit_price", Number(e.target.value))
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Line Total
            </label>

            <div className="rounded-lg border bg-gray-50 px-4 py-3 text-lg font-bold text-green-600">
              R{" "}
              {lineTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}