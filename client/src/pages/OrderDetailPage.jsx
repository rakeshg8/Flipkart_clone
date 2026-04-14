import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/http";

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((res) => setOrder(res.data.data));
  }, [id]);

  if (!order) return <div className="container-main py-8">Loading...</div>;

  return (
    <div className="container-main py-4">
      <div className="fk-card p-4">
        <h1 className="text-lg font-semibold">Order #{order.id}</h1>
        <p className="mt-1 text-sm text-slate-500">Status: {order.status}</p>
        <p className="mt-1 text-sm text-slate-500">Placed on: {new Date(order.created_at).toLocaleString()}</p>

        <div className="mt-4 space-y-3">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex gap-3 border-b pb-3">
              <img src={item.products.images?.[0]} alt={item.products.name} className="h-16 w-16 rounded object-cover" />
              <div>
                <p className="text-sm font-medium">{item.products.name}</p>
                <p className="text-xs text-slate-500">
                  Qty: {item.quantity} | ₹{Number(item.price_at_purchase).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
