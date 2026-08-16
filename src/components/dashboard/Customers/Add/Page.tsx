"use client";

import { useState } from "react";

export default function AddCustomerPage() {
  const [customer, setCustomer] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    alert("Next step: Save this customer to Supabase!");
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Add Customer</h1>

      <p className="text-gray-500 mb-8">
        Create a new customer for SkipCo Solutions.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">

        <input
          className="w-full border rounded-lg p-3"
          name="company_name"
          placeholder="Company Name"
          value={customer.company_name}
          onChange={handleChange}
        />

        <input
          className="w-full border rounded-lg p-3"
          name="contact_person"
          placeholder="Contact Person"
          value={customer.contact_person}
          onChange={handleChange}
        />

        <input
          className="w-full border rounded-lg p-3"
          name="email"
          placeholder="Email"
          value={customer.email}
          onChange={handleChange}
        />

        <input
          className="w-full border rounded-lg p-3"
          name="phone"
          placeholder="Phone Number"
          value={customer.phone}
          onChange={handleChange}
        />

        <input
          className="w-full border rounded-lg p-3"
          name="address"
          placeholder="Address"
          value={customer.address}
          onChange={handleChange}
        />

        <input
          className="w-full border rounded-lg p-3"
          name="city"
          placeholder="City"
          value={customer.city}
          onChange={handleChange}
        />

        <textarea
          className="w-full border rounded-lg p-3"
          rows={4}
          name="notes"
          placeholder="Notes"
          value={customer.notes}
          onChange={handleChange}
        />

        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-6 py-3 text-white hover:bg-teal-700"
        >
          Save Customer
        </button>

      </form>
    </main>
  );
}