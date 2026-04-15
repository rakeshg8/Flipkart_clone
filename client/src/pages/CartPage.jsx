import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

const CartPage = () => {
  const { items, updateQty, removeItem } = useCart();
  const { toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + Number(item.products.price) * item.quantity, 0);
  const mrpTotal = items.reduce((sum, item) => sum + Number(item.products.mrp) * item.quantity, 0);
  const discount = mrpTotal - subtotal;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!items.length) {
    return (
      <div className="min-h-screen bg-[#f1f3f6]">
        <div className="container-main">
          <div className="flex flex-col items-center justify-center py-20">
            <img
              src="https://rukminim2.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png"
              alt="empty cart"
              className="mb-4 h-32 w-32 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <h2 className="mb-2 text-xl font-medium text-gray-800">Your cart is empty!</h2>
            <p className="mb-6 text-gray-500">Add items to it now.</p>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="bg-[#2874f0] px-12 py-3 font-medium text-white hover:bg-blue-700"
            >
              Shop now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] py-4">
      <div className="container-main">
      <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
        <div className="flex-1">
          {items.map((item) => (
            <div key={item.id} className="mb-2 flex gap-4 bg-white p-4">
              <img src={item.products.images?.[0]} alt={item.products.name} className="h-[100px] w-[100px] object-contain" />
              <div className="flex-1">
                <h3 className="line-clamp-2 text-sm font-medium text-gray-800">{item.products.name}</h3>
                <p className="mt-1 text-xs text-gray-500">Sold by: {item.products.brand}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="font-semibold">₹{Number(item.products.price).toLocaleString("en-IN")}</span>
                  <span className="text-gray-400 line-through">₹{Number(item.products.mrp).toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center border">
                    <button type="button" className="border-r px-3 py-1" onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}>
                      -
                    </button>
                    <span className="px-3 text-sm">{item.quantity}</span>
                    <button type="button" className="border-l px-3 py-1" onClick={() => updateQty(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeItem(item.id);
                      toast.success("Item removed");
                    }}
                    className="text-xs font-medium text-[#2874f0]"
                  >
                    Remove
                  </button>
                  <span className="text-xs text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await toggleWishlist(item.products.id);
                      toast.success("Updated wishlist");
                    }}
                    className="text-xs font-medium text-[#2874f0]"
                  >
                    Save for later
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="sticky top-20 h-fit w-[350px] bg-white p-4">
          <h3 className="border-b pb-3 text-sm font-medium text-gray-500">PRICE DETAILS</h3>
          <div className="space-y-3 py-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Price ({itemCount} items)</span>
              <span>₹{mrpTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span>Discount</span>
              <span className="text-green-600">-₹{discount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span>Delivery Charges</span>
              <span className="font-medium text-green-600">FREE</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3 text-base font-semibold text-gray-900">
              <span>Total Amount</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="w-full bg-[#fb641b] py-4 font-medium text-white"
          >
            PLACE ORDER
          </button>
          <p className="mt-4 text-xs text-gray-500">🔒 Safe and Secure Payments. Easy returns. 100% Authentic products.</p>
        </aside>
      </div>
      </div>
    </div>
  );
};

export default CartPage;
