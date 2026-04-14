import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/http";

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

const AdminOrdersPage = () => {
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState([]);

  const loadOrders = async (nextStatus = "") => {
    const { data } = await api.get("/admin/orders", { params: { status: nextStatus, limit: 50 } });
    setOrders(data.data || []);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (orderId, nextStatus) => {
    await api.put(`/admin/orders/${orderId}/status`, { status: nextStatus });
    toast.success("Order status updated");
    await loadOrders(status);
  };

  return (
    <div className="fk-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-base font-semibold">Orders</h1>
        <select
          value={status}
          onChange={(event) => {
            const next = event.target.value;
            setStatus(next);
            loadOrders(next);
          }}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="px-3 py-2">#{order.id}</td>
                <td className="px-3 py-2">{order.users?.email}</td>
                <td className="px-3 py-2">₹{Number(order.total).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2">{order.status}</td>
                <td className="px-3 py-2">
                  <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)} className="rounded border px-2 py-1 text-xs">
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
