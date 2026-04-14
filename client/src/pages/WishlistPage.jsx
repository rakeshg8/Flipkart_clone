import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useWishlist } from "../contexts/WishlistContext";
import { useCart } from "../contexts/CartContext";

const WishlistPage = () => {
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!items.length) {
    return (
      <div className="container-main py-10">
        <div className="mx-auto max-w-lg fk-card p-8 text-center">
          <Heart className="mx-auto h-12 w-12 text-rose-500" />
          <h1 className="mt-3 text-xl font-semibold">Your wishlist is empty</h1>
          <p className="mt-2 text-sm text-slate-500">Save items you love and move them to cart anytime.</p>
          <Link to="/products" className="mt-5 inline-block rounded bg-fkBlue px-4 py-2 text-sm font-semibold text-white">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main py-4">
      <h1 className="mb-4 text-xl font-semibold">My Wishlist</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="fk-card flex flex-col gap-3 p-4 sm:flex-row">
            <img src={item.products.images?.[0]} alt={item.products.name} className="h-28 w-28 object-contain" />
            <div className="flex-1">
              <Link to={`/products/${item.products.slug}`} className="line-clamp-2 text-sm font-medium">
                {item.products.name}
              </Link>
              <p className="mt-2 text-sm font-semibold">₹{Number(item.products.price).toLocaleString("en-IN")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await addToCart({ product_id: item.products.id, quantity: 1 });
                    toast.success("Added to cart");
                  }}
                  className="inline-flex items-center gap-1 rounded bg-fkOrange px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await toggleWishlist(item.products.id);
                    toast.success("Removed from wishlist");
                  }}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
