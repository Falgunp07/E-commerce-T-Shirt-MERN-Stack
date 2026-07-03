import { useEffect, useMemo, useState } from 'react';

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch('http://localhost:5000/api/admin/customers', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load customers');
        setCustomers(data.customers || []);
      })
      .catch((nextError) => setError(nextError.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((customer) =>
      `${customer.name} ${customer.email} ${customer.phone || ''}`.toLowerCase().includes(needle)
    );
  }, [customers, query]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">View all registered customers and their order history.</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or phone"
          className="w-full max-w-sm rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
        />
      </div>

      {loading ? <div className="text-sm text-slate-500">Loading customers...</div> : null}
      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-600">{error}</div> : null}

      {!loading && !error ? (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Phone</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Orders</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Total Spent</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Joined</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Default Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const defaultAddress = customer.addresses?.find((address) => address.isDefault) || customer.addresses?.[0];
                  const addressStr = defaultAddress 
                    ? [defaultAddress.line1, defaultAddress.city, defaultAddress.state, defaultAddress.postalCode]
                        .filter(Boolean)
                        .join(', ')
                    : 'No address';
                  
                  return (
                    <tr key={customer.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{customer.name}</td>
                      <td className="px-6 py-4 text-slate-600">{customer.email}</td>
                      <td className="px-6 py-4 text-slate-600">{customer.phone || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{customer.ordersCount || 0}</td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{formatPrice(customer.totalSpent || 0)}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(customer.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{addressStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredCustomers.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              No customers found matching your search.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
