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
          <p className="mt-1 text-sm text-slate-500">Review registered customers, delivery addresses, and account-level order totals.</p>
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
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredCustomers.map((customer) => {
            const defaultAddress = customer.addresses?.find((address) => address.isDefault) || customer.addresses?.[0];
            return (
              <article key={customer.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{customer.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{customer.email}</p>
                    <p className="mt-1 text-sm text-slate-500">{customer.phone || 'No phone added yet'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Orders</div>
                    <div className="mt-1 text-2xl font-black text-slate-900">{customer.ordersCount}</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total spent</div>
                    <div className="mt-2 text-lg font-black text-slate-900">{formatPrice(customer.totalSpent || 0)}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Joined</div>
                    <div className="mt-2 text-sm font-semibold text-slate-700">{new Date(customer.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Default address</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    {defaultAddress ? (
                      <>
                        <div className="font-semibold text-slate-900">{defaultAddress.fullName || customer.name}</div>
                        <div>{defaultAddress.phone || customer.phone || 'No phone saved'}</div>
                        <div className="mt-1">
                          {[defaultAddress.line1, defaultAddress.line2, defaultAddress.city, defaultAddress.state, defaultAddress.postalCode, defaultAddress.country]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </>
                    ) : (
                      <div>No saved address yet.</div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
