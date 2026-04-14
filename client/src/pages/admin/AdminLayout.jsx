import { BarChart3, Package, ShoppingBag, Users } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="container-main py-4">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <aside className="fk-card h-fit p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-600">Admin Panel</h2>
          <nav className="space-y-1 text-sm">
            <Link to="/admin" className="flex items-center gap-2 rounded px-2 py-2 hover:bg-slate-100">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </Link>
            <Link to="/admin/users" className="flex items-center gap-2 rounded px-2 py-2 hover:bg-slate-100">
              <Users className="h-4 w-4" /> Users
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-2 rounded px-2 py-2 hover:bg-slate-100">
              <ShoppingBag className="h-4 w-4" /> Orders
            </Link>
            <Link to="/admin/products" className="flex items-center gap-2 rounded px-2 py-2 hover:bg-slate-100">
              <Package className="h-4 w-4" /> Products
            </Link>
          </nav>
        </aside>
        <section className="space-y-4">
          <Outlet />
        </section>
      </div>
    </div>
  );
};

export default AdminLayout;
