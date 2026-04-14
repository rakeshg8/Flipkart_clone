import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/http";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { session } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!session) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      setItems(data.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [session]);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      count,
      loading,
      fetchCart,
      addToCart: async (payload) => {
        await api.post("/cart", payload);
        await fetchCart();
      },
      updateQty: async (id, quantity) => {
        await api.put(`/cart/${id}`, { quantity });
        await fetchCart();
      },
      removeItem: async (id) => {
        await api.delete(`/cart/${id}`);
        await fetchCart();
      },
      clearLocal: () => setItems([])
    }),
    [items, count, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
