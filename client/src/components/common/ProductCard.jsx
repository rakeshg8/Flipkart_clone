import { Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { useAuth } from "../../contexts/AuthContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, productIds } = useWishlist();
  const { session } = useAuth();
  const navigate = useNavigate();

  const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const inWishlist = productIds.includes(product.id);

  const handleProtectedAction = async (fn) => {
    if (!session) {
      navigate("/auth");
      return;
    }
    await fn();
  };

  return (
    <div className="group relative cursor-pointer bg-white transition-shadow hover:shadow-[0_4px_15px_rgba(0,0,0,0.15)]">
      <button
        type="button"
        onClick={() =>
          handleProtectedAction(async () => {
            await toggleWishlist(product.id);
            toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
          })
        }
        className="absolute right-2 top-2 z-10 rounded-full p-1"
      >
        <Heart className={`h-5 w-5 ${inWishlist ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
      </button>

      <Link to={`/products/${product.slug}`}>
        <div className="flex h-[200px] items-center justify-center bg-white p-4">
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        </div>
      </Link>

      <div className="px-3 pb-3">
        <Link to={`/products/${product.slug}`} className="line-clamp-2 block text-sm font-medium text-gray-800">
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-sm bg-green-600 px-1.5 py-0.5 text-white">
            {Number(product.rating || 0).toFixed(1)} ★
          </span>
          <span className="text-gray-500">({product.review_count || 0})</span>
        </div>

        <div className="mt-2 flex items-center">
          <span className="text-lg font-medium text-gray-900">₹{Number(product.price).toLocaleString("en-IN")}</span>
          <span className="ml-2 text-sm text-gray-400 line-through">₹{Number(product.mrp).toLocaleString("en-IN")}</span>
          <span className="ml-2 text-sm font-medium text-green-600">{discountPct}% off</span>
        </div>

        <button
          type="button"
          onClick={() =>
            handleProtectedAction(async () => {
              await addToCart({ product_id: product.id, quantity: 1 });
              toast.success("Added to cart");
            })
          }
          className="mt-3 w-full bg-[#2874f0] py-2 text-sm font-semibold text-white"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
