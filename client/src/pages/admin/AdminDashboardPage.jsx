import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/http";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, totalProducts: 0, revenue: 0 });

  useEffect(() => {
    api.get("/admin/dashboard").then((res) => setStats(res.data.data));
  }, []);

  const chartData = [
    { name: "Users", value: stats.totalUsers },
    { name: "Orders", value: stats.totalOrders },
    { name: "Products", value: stats.totalProducts }
  ];

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="fk-card p-4">
          <p className="text-xs text-slate-500">Total Users</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalUsers}</p>
        </div>
        <div className="fk-card p-4">
          <p className="text-xs text-slate-500">Total Orders</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalOrders}</p>
        </div>
        <div className="fk-card p-4">
          <p className="text-xs text-slate-500">Total Products</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalProducts}</p>
        </div>
        <div className="fk-card p-4">
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="mt-1 text-2xl font-semibold">₹{Number(stats.revenue).toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="fk-card h-80 p-4">
        <h2 className="mb-2 text-sm font-semibold">Snapshot</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#2874f0" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default AdminDashboardPage;
