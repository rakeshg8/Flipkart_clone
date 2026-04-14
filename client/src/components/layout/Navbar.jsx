import { Heart, Menu, Search, ShoppingCart, User2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useState } from "react";

const Navbar = ({ onMenuOpen }) => {
  const { user, session, signOut } = useAuth();
  const { count } = useCart();
  const [q, setQ] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/products?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-fkBlue text-white shadow">
      <div className="container-main flex h-14 items-center gap-3">
        <button type="button" className="md:hidden" onClick={onMenuOpen}>
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="text-xl font-bold italic">
          Flipkart
          <span className="ml-1 text-xs text-fkYellow">Explore Plus</span>
        </Link>

        <form onSubmit={submitSearch} className="hidden flex-1 md:block">
          <div className="flex items-center rounded-sm bg-white px-3">
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search for products, brands and more"
              className="h-10 w-full bg-transparent text-sm text-slate-900 outline-none"
            />
            <button type="submit" className="text-fkBlue">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        <Link to="/seller" className="hidden text-sm font-medium md:block">
          Become a Seller
        </Link>

        <Link to="/cart" className="relative flex items-center gap-1 text-sm font-semibold">
          <ShoppingCart className="h-5 w-5" />
          Cart
          {count > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-fkYellow px-1.5 text-[10px] font-bold text-fkBlue">
              {count}
            </span>
          )}
        </Link>

        {session && (
          <Link to="/wishlist" className="hidden items-center gap-1 text-sm font-semibold md:flex">
            <Heart className="h-5 w-5" />
            Wishlist
          </Link>
        )}

        {!session ? (
          <Link to="/auth" className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-fkBlue">
            Login
          </Link>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setProfileMenuOpen(true)}
            onMouseLeave={() => setProfileMenuOpen(false)}
          >
            <button type="button" className="flex items-center gap-1 text-sm font-medium">
              <User2 className="h-4 w-4" />
              {user?.full_name || user?.email?.split("@")[0]}
            </button>
            <div
              className={`absolute right-0 top-full pt-1 transition ${
                profileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              <div className="w-44 rounded bg-white p-2 text-sm text-slate-700 shadow">
                <Link
                  className="block rounded px-2 py-1 hover:bg-slate-100"
                  to="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                >
                Profile
                </Link>
                <Link
                  className="block rounded px-2 py-1 hover:bg-slate-100"
                  to="/orders"
                  onClick={() => setProfileMenuOpen(false)}
                >
                Orders
                </Link>
                <Link
                  className="block rounded px-2 py-1 hover:bg-slate-100"
                  to="/wishlist"
                  onClick={() => setProfileMenuOpen(false)}
                >
                Wishlist
                </Link>
                {user?.role === "admin" && (
                  <Link
                    className="block rounded px-2 py-1 hover:bg-slate-100"
                    to="/admin"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  className="mt-1 block w-full rounded px-2 py-1 text-left hover:bg-slate-100"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    signOut();
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="container-main pb-2 md:hidden">
        <form onSubmit={submitSearch} className="flex items-center rounded-sm bg-white px-3">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search products"
            className="h-9 w-full bg-transparent text-sm text-slate-900 outline-none"
          />
          <button type="submit" className="text-fkBlue">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
};

export default Navbar;
