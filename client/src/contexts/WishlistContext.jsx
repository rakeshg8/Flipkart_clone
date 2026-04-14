import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/http";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { session } = useAuth();
  const [items, setItems] = useState([]);

  const fetchWishlist = async () => {
    if (!session) {
      setItems([]);
      return;
    }
    try {
      const { data } = await api.get("/wishlist");
      setItems(data.data || []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [session]);

  const productIds = items.map((item) => item.products?.id).filter(Boolean);

  const value = useMemo(
    () => ({
      items,
      productIds,
      fetchWishlist,
      toggleWishlist: async (product_id) => {
        await api.post("/wishlist", { product_id });
        await fetchWishlist();
      }
    }),
    [items]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
