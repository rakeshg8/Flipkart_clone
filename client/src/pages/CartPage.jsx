import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import PriceSummary from "../components/common/PriceSummary";

const CartPage = () => {
  const { items, updateQty, removeItem } = useCart();
  const { toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + Number(item.products.price) * item.quantity, 0);
  const mrpTotal = items.reduce((sum, item) => sum + Number(item.products.mrp) * item.quantity, 0);
  const discount = mrpTotal - subtotal;

  if (!items.length) {
    return (
      <div className="container-main py-10 text-center">
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <Link to="/products" className="mt-4 inline-block rounded bg-fkBlue px-4 py-2 text-sm font-semibold text-white">
          Shop now
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main py-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="fk-card flex gap-3 p-4">
              <img src={item.products.images?.[0]} alt={item.products.name} className="h-28 w-28 object-contain" />
              <div className="flex-1">
                <h3 className="line-clamp-2 text-sm font-medium">{item.products.name}</h3>
                <p className="mt-1 text-xs text-slate-500">Seller: RetailNet</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="font-semibold">₹{Number(item.products.price).toLocaleString("en-IN")}</span>
                  <span className="text-slate-400 line-through">₹{Number(item.products.mrp).toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded border">
                    <button type="button" className="px-3 py-1" onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}>
                      -
                    </button>
                    <span className="px-3 text-sm">{item.quantity}</span>
                    <button type="button" className="px-3 py-1" onClick={() => updateQty(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeItem(item.id);
                      toast.success("Item removed");
                    }}
                    className="text-xs font-semibold text-slate-600"
                  >
                    REMOVE
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await toggleWishlist(item.products.id);
                      toast.success("Updated wishlist");
                    }}
                    className="text-xs font-semibold text-slate-600"
                  >
                    WISHLIST
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <PriceSummary subtotal={subtotal} discount={discount} total={subtotal} onPlaceOrder={() => navigate("/checkout")} />
      </div>
    </div>
  );
};

export default CartPage;
