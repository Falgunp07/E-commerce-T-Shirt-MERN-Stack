import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FiHeart, FiLogOut, FiMail, FiMapPin, FiPackage, FiShield, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import {
  validateAddress,
  validateName,
  validatePassword,
  validatePhone,
} from '../utils/validation';

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function emptyAddress() {
  return {
    label: 'Home',
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  };
}

export default function Profile() {
  const { user, loading, logout, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', addresses: [] });
  const [profileErrors, setProfileErrors] = useState({ name: '', phone: '', addresses: [] });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const addresses = user.addresses?.length ? user.addresses.map((address) => ({ ...address })) : [emptyAddress()];
    setProfileForm({
      name: user.name || '',
      phone: user.phone || '',
      addresses,
    });
    setProfileErrors({
      name: '',
      phone: '',
      addresses: addresses.map(() => ({})),
    });
    setSelectedAddressIndex(0);
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'orders', 'addresses', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('authToken');
    setOrdersLoading(true);
    setOrdersError('');
    fetch('http://localhost:5000/api/account/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load orders');
        setOrders(data.orders || []);
      })
      .catch((error) => {
        setOrdersError(error.message);
      })
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const totalSpent = useMemo(() => orders.reduce((sum, order) => sum + Number(order.amount || 0), 0), [orders]);
  const defaultAddress = profileForm.addresses.find((address) => address.isDefault) || profileForm.addresses[0];
  const selectedAddress = profileForm.addresses[selectedAddressIndex] || profileForm.addresses[0];
  const selectedAddressErrors = profileErrors.addresses[selectedAddressIndex] || {};

  if (loading) {
    return <main className="flex min-h-[70vh] items-center justify-center text-sm text-slate-500">Loading account...</main>;
  }
  if (!user) return <Navigate to="/login" state={{ from: '/profile' }} replace />;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function handleTabChange(tabId) {
    setActiveTab(tabId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', tabId);
      return next;
    }, { replace: true });
  }

  function updateAddress(index, key, value) {
    setProfileForm((current) => ({
      ...current,
      addresses: current.addresses.map((address, addressIndex) =>
        addressIndex === index ? { ...address, [key]: value } : address
      ),
    }));
    setProfileErrors((current) => ({
      ...current,
      addresses: current.addresses.map((addressErrors, addressIndex) =>
        addressIndex === index ? { ...addressErrors, [key]: '' } : addressErrors || {}
      ),
    }));
  }

  function addAddress() {
    const nextAddress = emptyAddress();
    setProfileForm((current) => ({
      ...current,
      addresses: [...current.addresses, nextAddress],
    }));
    setProfileErrors((current) => ({
      ...current,
      addresses: [...current.addresses, {}],
    }));
    setSelectedAddressIndex(profileForm.addresses.length);
  }

  function removeAddress(index) {
    setProfileForm((current) => {
      const nextAddresses = current.addresses.filter((_, addressIndex) => addressIndex !== index);
      if (nextAddresses.length && !nextAddresses.some((address) => address.isDefault)) {
        nextAddresses[0].isDefault = true;
      }
      return {
        ...current,
        addresses: nextAddresses.length ? nextAddresses : [emptyAddress()],
      };
    });
    setProfileErrors((current) => ({
      ...current,
      addresses: current.addresses.filter((_, addressIndex) => addressIndex !== index),
    }));
    setSelectedAddressIndex((current) => Math.max(0, Math.min(current, profileForm.addresses.length - 2)));
  }

  function setDefaultAddress(index) {
    setProfileForm((current) => ({
      ...current,
      addresses: current.addresses.map((address, addressIndex) => ({
        ...address,
        isDefault: addressIndex === index,
      })),
    }));
  }

  function validateProfileForm() {
    const nextErrors = {
      name: validateName(profileForm.name, 'Full name'),
      phone: profileForm.phone.trim() ? validatePhone(profileForm.phone) : '',
      addresses: profileForm.addresses.map((address) => validateAddress(address)),
    };
    setProfileErrors(nextErrors);
    const hasAddressErrors = nextErrors.addresses.some((addressErrors) => Object.values(addressErrors).some(Boolean));
    return !(nextErrors.name || nextErrors.phone || hasAddressErrors);
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage({ text: '', type: '' });
    if (!validateProfileForm()) {
      setSavingProfile(false);
      setProfileMessage({ text: 'Please fix the highlighted fields before saving', type: 'error' });
      return;
    }
    try {
      await updateProfile(profileForm);
      setProfileMessage({ text: 'Profile updated successfully', type: 'success' });
    } catch (error) {
      setProfileMessage({ text: error.message, type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    const currentPasswordError = validatePassword(passwordForm.currentPassword, 'Current password');
    const newPasswordError = validatePassword(passwordForm.newPassword, 'New password');
    setPasswordMessage({ text: '', type: '' });
    if (currentPasswordError) {
      setPasswordMessage({ text: currentPasswordError, type: 'error' });
      return;
    }
    if (newPasswordError) {
      setPasswordMessage({ text: newPasswordError, type: 'error' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: 'New password and confirm password must match', type: 'error' });
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage({ text: 'Password updated successfully', type: 'success' });
    } catch (error) {
      setPasswordMessage({ text: error.message, type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FiUser /> },
    { id: 'orders', label: 'Orders', icon: <FiPackage /> },
    { id: 'addresses', label: 'Addresses', icon: <FiMapPin /> },
    { id: 'security', label: 'Security', icon: <FiShield /> },
  ];

  return (
    <main className="mx-auto min-h-[72vh] max-w-7xl px-4 py-12 sm:px-6">
      <div className="border-b border-slate-200 pb-7">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">My account</div>
        <h1 className="mt-2 text-4xl font-black text-brand-ink">Profile</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Manage your personal details, saved delivery addresses, order history, and account security from one place.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-black text-2xl text-white">
                <FiUser />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black text-brand-ink">{user.name}</h2>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <FiMail />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Orders</div>
                <div className="mt-2 text-2xl font-black text-brand-ink">{orders.length}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Spent</div>
                <div className="mt-2 text-2xl font-black text-brand-ink">{formatPrice(totalSpent)}</div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    activeTab === tab.id ? 'bg-black text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <Link to="/wishlist" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <FiHeart />
                Wishlist
              </Link>
              {['admin', 'catalog_manager', 'logistics_manager'].includes(user.role) ? (
                <Link to="/admin/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Open admin dashboard
                </Link>
              ) : null}
              <button type="button" onClick={handleLogout} className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                <FiLogOut />
                Log out
              </button>
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          {activeTab === 'overview' ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Account info</div>
                  <h2 className="mt-2 text-2xl font-black text-brand-ink">Personal details</h2>
                </div>
                <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleProfileSave}>
                  <label className="text-sm font-semibold text-brand-ink">
                    Full name
                    <input value={profileForm.name} onChange={(e) => {
                      setProfileForm((current) => ({ ...current, name: e.target.value }));
                      setProfileErrors((current) => ({ ...current, name: '' }));
                    }} className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 font-normal outline-none focus:bg-white ${profileErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                    {profileErrors.name ? <p className="mt-2 text-sm font-semibold text-red-500">{profileErrors.name}</p> : null}
                  </label>
                  <label className="text-sm font-semibold text-brand-ink">
                    Phone number
                    <input value={profileForm.phone} onChange={(e) => {
                      setProfileForm((current) => ({ ...current, phone: e.target.value }));
                      setProfileErrors((current) => ({ ...current, phone: '' }));
                    }} className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 font-normal outline-none focus:bg-white ${profileErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                    {profileErrors.phone ? <p className="mt-2 text-sm font-semibold text-red-500">{profileErrors.phone}</p> : null}
                  </label>
                  <label className="text-sm font-semibold text-brand-ink md:col-span-2">
                    Email address
                    <input value={user.email} disabled className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 font-normal text-slate-500 outline-none" />
                  </label>
                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <button type="submit" disabled={savingProfile} className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                      {savingProfile ? 'Saving...' : 'Save profile'}
                    </button>
                    {profileMessage.text ? (
                      <p className={`text-sm font-semibold ${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{profileMessage.text}</p>
                    ) : null}
                  </div>
                </form>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Default address</div>
                  <h2 className="mt-2 text-2xl font-black text-brand-ink">Delivery snapshot</h2>
                  {defaultAddress ? (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      <div className="font-semibold text-brand-ink">{defaultAddress.fullName || user.name}</div>
                      <div>{defaultAddress.phone || profileForm.phone || 'Add a phone number'}</div>
                      <div className="mt-2">
                        {[defaultAddress.line1, defaultAddress.line2, defaultAddress.city, defaultAddress.state, defaultAddress.postalCode, defaultAddress.country]
                          .filter(Boolean)
                          .join(', ') || 'No default address saved yet.'}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Quick actions</div>
                  <h2 className="mt-2 text-2xl font-black text-brand-ink">Shopping shortcuts</h2>
                  <div className="mt-5 grid gap-3">
                    <button type="button" onClick={() => setActiveTab('orders')} className="rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                      View my orders
                    </button>
                    <button type="button" onClick={() => setActiveTab('addresses')} className="rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                      Manage saved addresses
                    </button>
                    <Link to="/wishlist" className="rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                      Review wishlist items
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {activeTab === 'orders' ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Orders</div>
              <h2 className="mt-2 text-2xl font-black text-brand-ink">Order history</h2>
              {ordersLoading ? <p className="mt-6 text-sm text-slate-500">Loading your orders...</p> : null}
              {ordersError ? <p className="mt-6 text-sm font-semibold text-red-500">{ordersError}</p> : null}
              {!ordersLoading && !ordersError && orders.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
                  You haven&apos;t placed an order yet.
                </div>
              ) : null}
              <div className="mt-6 space-y-4">
                {orders.map((order) => (
                  <article key={order._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Order ID</div>
                        <div className="mt-1 font-semibold text-brand-ink">{order._id}</div>
                        <div className="mt-2 text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-ink">{order.status}</div>
                        <div className="mt-3 text-lg font-black text-brand-ink">{formatPrice(order.amount)}</div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(order.cart || []).map((item, index) => (
                        <div key={`${order._id}-${index}`} className="flex items-center justify-between gap-3 text-sm text-slate-600">
                          <div>
                            <div className="font-semibold text-brand-ink">{item.title}</div>
                            <div className="mt-1">Qty {item.qty}{item.size ? ` • Size ${item.size}` : ''}</div>
                          </div>
                          <div className="font-semibold text-brand-ink">{formatPrice((item.price || 0) * (item.qty || 1))}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-500">
                      Delivery address: <span className="font-medium text-slate-700">{order.customer?.address || 'Not available'}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === 'addresses' ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Addresses</div>
                  <h2 className="mt-2 text-2xl font-black text-brand-ink">Saved delivery addresses</h2>
                </div>
                <button type="button" onClick={addAddress} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Add address
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {profileForm.addresses.map((address, index) => (
                  <button
                    key={`${address.id || 'address'}-${index}`}
                    type="button"
                    onClick={() => setSelectedAddressIndex(index)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedAddressIndex === index ? 'border-black bg-slate-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-brand-ink">{address.label || `Address ${index + 1}`}</div>
                        <div className="mt-1 text-sm font-medium text-slate-700">{address.fullName || 'Unnamed address'}</div>
                      </div>
                      {address.isDefault ? <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold text-white">Default</span> : null}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-600">
                      {[address.line1, address.city, address.state, address.postalCode].filter(Boolean).join(', ') || 'Tap to complete this address'}
                    </div>
                  </button>
                ))}
              </div>

              {selectedAddress ? (
                <form className="mt-6 space-y-5" onSubmit={handleProfileSave}>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-semibold text-brand-ink">Edit selected address</div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setDefaultAddress(selectedAddressIndex)} className={`rounded-full px-4 py-2 text-xs font-semibold ${selectedAddress.isDefault ? 'bg-black text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>
                          {selectedAddress.isDefault ? 'Default address' : 'Set as default'}
                        </button>
                        {profileForm.addresses.length > 1 ? (
                          <button type="button" onClick={() => removeAddress(selectedAddressIndex)} className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600">
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="text-sm font-semibold text-brand-ink">
                        Label
                        <input value={selectedAddress.label} onChange={(e) => updateAddress(selectedAddressIndex, 'label', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 font-normal outline-none ${selectedAddressErrors.label ? 'border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                        {selectedAddressErrors.label ? <p className="mt-2 text-sm font-semibold text-red-500">{selectedAddressErrors.label}</p> : null}
                      </label>
                      <label className="text-sm font-semibold text-brand-ink">
                        Full name
                        <input value={selectedAddress.fullName} onChange={(e) => updateAddress(selectedAddressIndex, 'fullName', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 font-normal outline-none ${selectedAddressErrors.fullName ? 'border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                        {selectedAddressErrors.fullName ? <p className="mt-2 text-sm font-semibold text-red-500">{selectedAddressErrors.fullName}</p> : null}
                      </label>
                      <label className="text-sm font-semibold text-brand-ink">
                        Phone
                        <input value={selectedAddress.phone} onChange={(e) => updateAddress(selectedAddressIndex, 'phone', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 font-normal outline-none ${selectedAddressErrors.phone ? 'border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                        {selectedAddressErrors.phone ? <p className="mt-2 text-sm font-semibold text-red-500">{selectedAddressErrors.phone}</p> : null}
                      </label>
                      <label className="text-sm font-semibold text-brand-ink">
                        Country
                        <input value={selectedAddress.country} onChange={(e) => updateAddress(selectedAddressIndex, 'country', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 font-normal outline-none ${selectedAddressErrors.country ? 'border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                        {selectedAddressErrors.country ? <p className="mt-2 text-sm font-semibold text-red-500">{selectedAddressErrors.country}</p> : null}
                      </label>
                      <label className="text-sm font-semibold text-brand-ink md:col-span-2">
                        Address line 1
                        <input value={selectedAddress.line1} onChange={(e) => updateAddress(selectedAddressIndex, 'line1', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 font-normal outline-none ${selectedAddressErrors.line1 ? 'border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                        {selectedAddressErrors.line1 ? <p className="mt-2 text-sm font-semibold text-red-500">{selectedAddressErrors.line1}</p> : null}
                      </label>
                      <label className="text-sm font-semibold text-brand-ink md:col-span-2">
                        Address line 2
                        <input value={selectedAddress.line2} onChange={(e) => updateAddress(selectedAddressIndex, 'line2', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 font-normal outline-none ${selectedAddressErrors.line2 ? 'border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                        {selectedAddressErrors.line2 ? <p className="mt-2 text-sm font-semibold text-red-500">{selectedAddressErrors.line2}</p> : null}
                      </label>
                      <label className="text-sm font-semibold text-brand-ink">
                        City
                        <input value={selectedAddress.city} onChange={(e) => updateAddress(selectedAddressIndex, 'city', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 font-normal outline-none ${selectedAddressErrors.city ? 'border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                        {selectedAddressErrors.city ? <p className="mt-2 text-sm font-semibold text-red-500">{selectedAddressErrors.city}</p> : null}
                      </label>
                      <label className="text-sm font-semibold text-brand-ink">
                        State
                        <input value={selectedAddress.state} onChange={(e) => updateAddress(selectedAddressIndex, 'state', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 font-normal outline-none ${selectedAddressErrors.state ? 'border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                        {selectedAddressErrors.state ? <p className="mt-2 text-sm font-semibold text-red-500">{selectedAddressErrors.state}</p> : null}
                      </label>
                      <label className="text-sm font-semibold text-brand-ink">
                        Postal code
                        <input value={selectedAddress.postalCode} onChange={(e) => updateAddress(selectedAddressIndex, 'postalCode', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 font-normal outline-none ${selectedAddressErrors.postalCode ? 'border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                        {selectedAddressErrors.postalCode ? <p className="mt-2 text-sm font-semibold text-red-500">{selectedAddressErrors.postalCode}</p> : null}
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="submit" disabled={savingProfile} className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                      {savingProfile ? 'Saving...' : 'Save addresses'}
                    </button>
                    {profileMessage.text ? (
                      <p className={`text-sm font-semibold ${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{profileMessage.text}</p>
                    ) : null}
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'security' ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Security</div>
              <h2 className="mt-2 text-2xl font-black text-brand-ink">Change password</h2>
              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handlePasswordSave}>
                <label className="text-sm font-semibold text-brand-ink md:col-span-2">
                  Current password
                  <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, currentPassword: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-brand-ink focus:bg-white" />
                </label>
                <label className="text-sm font-semibold text-brand-ink">
                  New password
                  <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-brand-ink focus:bg-white" />
                </label>
                <label className="text-sm font-semibold text-brand-ink">
                  Confirm new password
                  <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-brand-ink focus:bg-white" />
                </label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                  <button type="submit" disabled={savingPassword} className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {savingPassword ? 'Updating...' : 'Update password'}
                  </button>
                  {passwordMessage.text ? (
                    <p className={`text-sm font-semibold ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{passwordMessage.text}</p>
                  ) : null}
                </div>
              </form>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
