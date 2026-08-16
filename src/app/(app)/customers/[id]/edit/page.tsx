"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] = useState<Customer>({
    id: "",
    customer_number: "",
    company_name: "",
    trading_name: "",
    contact_person: "",
    email: "",
    phone: "",
    mobile: "",
    vat_number: "",
    registration_number: "",
    physical_address: "",
    postal_address: "",
    city: "",
    province: "",
    postal_code: "",
    country: "",
    payment_terms: "30 Days",
    credit_limit: 0,
    status: "Active",
    notes: "",
  });

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
      return;
    }

    setCustomer({
      ...customer,
      ...data,
    });

    setLoading(false);
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setCustomer({
      ...customer,
      [e.target.name]:
        e.target.name === "credit_limit"
          ? Number(e.target.value)
          : e.target.value,
    });
  }
    async function handleSave() {
    setSaving(true);

    const { error } = await supabase
      .from("customers")
      .update({
        customer_number: customer.customer_number,
        company_name: customer.company_name,
        trading_name: customer.trading_name,
        contact_person: customer.contact_person,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        vat_number: customer.vat_number,
        registration_number: customer.registration_number,
        physical_address: customer.physical_address,
        postal_address: customer.postal_address,
        city: customer.city,
        province: customer.province,
        postal_code: customer.postal_code,
        country: customer.country,
        payment_terms: customer.payment_terms,
        credit_limit: customer.credit_limit,
        status: customer.status,
        notes: customer.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customer.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Customer updated successfully!");

    router.push(`/customers/${customer.id}`);
  }

  if (loading) {
    return (
      <DashboardShell
        title="Edit Customer"
        subtitle="Loading..."
      >
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          Loading customer...
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Edit Customer"
      subtitle="Update customer information"
    >
      <div className="max-w-5xl mx-auto rounded-xl border bg-white p-8 shadow-sm">

        <h1 className="mb-8 text-3xl font-bold">
          Edit Customer
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">          <div>
            <label className="block mb-2 font-medium">
              Customer Number
            </label>

            <input
              name="customer_number"
              value={customer.customer_number}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Company Name *
            </label>

            <input
              name="company_name"
              value={customer.company_name}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Trading Name
            </label>

            <input
              name="trading_name"
              value={customer.trading_name}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Contact Person
            </label>

            <input
              name="contact_person"
              value={customer.contact_person}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={customer.email}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Phone
            </label>

            <input
              name="phone"
              value={customer.phone}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Mobile
            </label>

            <input
              name="mobile"
              value={customer.mobile}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              VAT Number
            </label>

            <input
              name="vat_number"
              value={customer.vat_number}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Registration Number
            </label>

            <input
              name="registration_number"
              value={customer.registration_number}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Credit Limit
            </label>

            <input
              type="number"
              name="credit_limit"
              value={customer.credit_limit}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Payment Terms
            </label>

            <select
              name="payment_terms"
              value={customer.payment_terms}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            >
              <option>COD</option>
              <option>7 Days</option>
              <option>14 Days</option>
              <option>30 Days</option>
              <option>60 Days</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Status
            </label>

            <select
              name="status"
              value={customer.status}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
                    <div className="md:col-span-2">
            <label className="block mb-2 font-medium">
              Physical Address
            </label>

            <input
              name="physical_address"
              value={customer.physical_address}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2 font-medium">
              Postal Address
            </label>

            <input
              name="postal_address"
              value={customer.postal_address}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              City
            </label>

            <input
              name="city"
              value={customer.city}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Province
            </label>

            <input
              name="province"
              value={customer.province}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Postal Code
            </label>

            <input
              name="postal_code"
              value={customer.postal_code}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Country
            </label>

            <input
              name="country"
              value={customer.country}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2 font-medium">
              Notes
            </label>

            <textarea
              name="notes"
              rows={5}
              value={customer.notes}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

        </div>

        <div className="mt-10 flex justify-end gap-4">

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

        </div>

      </div>
    </DashboardShell>
  );
}