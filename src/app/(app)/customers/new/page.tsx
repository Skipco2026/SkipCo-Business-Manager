"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

export default function NewCustomerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    mobile: "",
    vatNumber: "",
    registrationNumber: "",
    physicalAddress: "",
    postalAddress: "",
    paymentTerms: "30 Days",
    creditLimit: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!customer.companyName.trim()) {
      alert("Company Name is required.");
      return;
    }

    setSaving(true);

    try {
      const customerNumber = `CUS-${Date.now()}`;

      const { data, error } = await supabase
        .from("customers")
        .insert({
          customer_number: customerNumber,
          company_name: customer.companyName,
          contact_person: customer.contactPerson,
          email: customer.email,
          phone: customer.phone,
          mobile: customer.mobile,
          vat_number: customer.vatNumber,
          registration_number: customer.registrationNumber,
          physical_address: customer.physicalAddress,
          postal_address: customer.postalAddress,
          payment_terms: customer.paymentTerms,
          credit_limit: Number(customer.creditLimit || 0),
          notes: customer.notes,
        })
        .select();

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
        alert(error.message);
        return;
      }

      alert("Customer saved successfully!");

      router.push("/customers");
    } catch (err) {
      console.error(err);
      alert("Unexpected error while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      title="Add Customer"
      subtitle="Create a new customer account"
    >
      <div className="max-w-5xl mx-auto rounded-xl border bg-white p-8 shadow-sm">

        <h1 className="text-3xl font-bold mb-8">
          New Customer
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className="block mb-2 font-medium">
              Company Name *
            </label>
            <input
              className="w-full border rounded-lg p-3"
              name="companyName"
              value={customer.companyName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Contact Person
            </label>
            <input
              className="w-full border rounded-lg p-3"
              name="contactPerson"
              value={customer.contactPerson}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Email
            </label>
            <input
              type="email"
              className="w-full border rounded-lg p-3"
              name="email"
              value={customer.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Phone
            </label>
            <input
              className="w-full border rounded-lg p-3"
              name="phone"
              value={customer.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Mobile
            </label>
            <input
              className="w-full border rounded-lg p-3"
              name="mobile"
              value={customer.mobile}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              VAT Number
            </label>
            <input
              className="w-full border rounded-lg p-3"
              name="vatNumber"
              value={customer.vatNumber}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Registration Number
            </label>
            <input
              className="w-full border rounded-lg p-3"
              name="registrationNumber"
              value={customer.registrationNumber}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Credit Limit
            </label>
            <input
              type="number"
              className="w-full border rounded-lg p-3"
              name="creditLimit"
              value={customer.creditLimit}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2 font-medium">
              Physical Address
            </label>
            <textarea
              className="w-full border rounded-lg p-3"
              rows={3}
              name="physicalAddress"
              value={customer.physicalAddress}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2 font-medium">
              Postal Address
            </label>
            <textarea
              className="w-full border rounded-lg p-3"
              rows={3}
              name="postalAddress"
              value={customer.postalAddress}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Payment Terms
            </label>

            <select
              className="w-full border rounded-lg p-3"
              name="paymentTerms"
              value={customer.paymentTerms}
              onChange={handleChange}
            >
              <option>COD</option>
              <option>7 Days</option>
              <option>14 Days</option>
              <option>30 Days</option>
              <option>60 Days</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2 font-medium">
              Notes
            </label>

            <textarea
              className="w-full border rounded-lg p-3"
              rows={5}
              name="notes"
              value={customer.notes}
              onChange={handleChange}
            />
          </div>

        </div>

        <div className="flex justify-end gap-4 mt-10">

          <button
            onClick={() => router.push("/customers")}
            disabled={saving}
            className="px-6 py-3 rounded-lg border"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save Customer"}
          </button>

        </div>

      </div>
    </DashboardShell>
  );
}