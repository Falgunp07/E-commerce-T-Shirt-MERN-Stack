import React, { createContext, useContext, useEffect, useState } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const raw = localStorage.getItem('wishlist');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  function toggleItem(item) {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) {
        return prev.filter((p) => p.id !== item.id);
      }
      return [...prev, { ...item }];
    });
  }

  function removeItem(id) {
    setWishlist((prev) => prev.filter((p) => p.id !== id));
  }

  function clear() {
    setWishlist([]);
  }

  return <WishlistContext.Provider value={{ wishlist, toggleItem, removeItem, clear }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}

export default WishlistContext;