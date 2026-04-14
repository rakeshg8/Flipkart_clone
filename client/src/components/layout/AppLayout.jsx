import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import ChatWidget from "../chat/ChatWidget";

const AppLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar onMenuOpen={() => setMenuOpen(true)} />
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-72 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-500">Menu</h3>
            <nav className="mt-3 space-y-2">
              <Link className="block rounded px-2 py-2 hover:bg-slate-100" to="/" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <Link className="block rounded px-2 py-2 hover:bg-slate-100" to="/products" onClick={() => setMenuOpen(false)}>
                Products
              </Link>
              <Link className="block rounded px-2 py-2 hover:bg-slate-100" to="/orders" onClick={() => setMenuOpen(false)}>
                Orders
              </Link>
              <Link className="block rounded px-2 py-2 hover:bg-slate-100" to="/wishlist" onClick={() => setMenuOpen(false)}>
                Wishlist
              </Link>
              <Link className="block rounded px-2 py-2 hover:bg-slate-100" to="/profile" onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
            </nav>
          </aside>
        </div>
      )}
      <main className="pb-10">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
};

export default AppLayout;
