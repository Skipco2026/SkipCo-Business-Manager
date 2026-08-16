export default function CustomersPage() {
    return (
      <main className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-gray-500">
              Manage all your SkipCo Solutions customers.
            </p>
          </div>
  
          <button className="rounded-lg bg-teal-600 px-5 py-3 text-white hover:bg-teal-700">
            + Add Customer
          </button>
        </div>
  
        <div className="rounded-xl border bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Status</th>
              </tr>
            </thead>
  
            <tbody>
              <tr className="border-t">
                <td className="p-4">ABC Construction</td>
                <td className="p-4">082 123 4567</td>
                <td className="p-4">accounts@abc.co.za</td>
                <td className="p-4">
                  <span className="rounded bg-green-100 px-3 py-1 text-green-700">
                    Active
                  </span>
                </td>
              </tr>
  
              <tr className="border-t">
                <td className="p-4">XYZ Engineering</td>
                <td className="p-4">083 555 2211</td>
                <td className="p-4">info@xyz.co.za</td>
                <td className="p-4">
                  <span className="rounded bg-yellow-100 px-3 py-1 text-yellow-700">
                    Pending
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    );
  }