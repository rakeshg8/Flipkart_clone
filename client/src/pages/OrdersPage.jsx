import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/http";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-sky-100 text-sky-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-rose-100 text-rose-700"
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders").then((res) => setOrders(res.data.data || []));
  }, []);

  return (
    <div className="container-main py-4">
      <h1 className="mb-4 text-xl font-semibold">My Orders</h1>
      {!orders.length && (
        <div className="fk-card p-8 text-center">
          <p className="text-4xl">😊</p>
          <h2 className="mt-2 text-lg font-semibold">No orders yet</h2>
          <p className="mt-1 text-sm text-slate-500">Looks like you have not placed an order yet. Buy some products and they will show up here.</p>
          <Link to="/products" className="mt-4 inline-block rounded bg-fkBlue px-4 py-2 text-sm font-semibold text-white">
            Start Shopping
          </Link>
        </div>
      )}
      <div className="space-y-3">
        {orders.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`} className="fk-card block p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Order #{order.id}</p>
                <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`rounded px-2 py-1 text-xs font-semibold ${statusColor[order.status] || "bg-slate-100"}`}>
                {order.status}
              </span>
              <p className="text-sm font-semibold">₹{Number(order.total).toLocaleString("en-IN")}</p>
            </div>
            <div className="mt-3 flex gap-2">
              {(order.order_items || []).slice(0, 4).map((item) => (
                <img key={item.products.slug} src={item.products.images?.[0]} alt={item.products.name} className="h-12 w-12 rounded object-cover" />
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
