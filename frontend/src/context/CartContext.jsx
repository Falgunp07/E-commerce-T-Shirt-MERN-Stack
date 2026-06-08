import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('cart');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  function addItem(item) {
    // Strict matching: treat size (including undefined) as part of identity
    const itemSize = item.size ?? null;
    setCart((prev) => {
      const foundIndex = prev.findIndex((p) => p.id === item.id && (p.size ?? null) === itemSize);
      if (foundIndex >= 0) {
        const copy = [...prev];
        copy[foundIndex] = { ...copy[foundIndex], qty: (copy[foundIndex].qty || 0) + (item.qty || 1) };
        return copy;
      }
      return [...prev, { ...item, size: itemSize, qty: item.qty || 1 }];
    });
  }

  function removeItem(id, size) {
    const targetSize = size ?? null;
    setCart((prev) => prev.filter((p) => !(p.id === id && (p.size ?? null) === targetSize)));
  }

  function updateItemQty(id, size, qty) {
    const targetSize = size ?? null;
    setCart((prev) =>
      prev
        .map((p) => {
          if (p.id === id && (p.size ?? null) === targetSize) return { ...p, qty };
          return p;
        })
        .filter((p) => p.qty > 0)
    );
  }

  function clear() {
    setCart([]);
  }

  const total = cart.reduce((s, p) => s + (p.price || 0) * (p.qty || 1), 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateItemQty, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

export default CartContext;
