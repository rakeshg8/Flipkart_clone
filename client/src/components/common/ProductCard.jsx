import { Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import RatingStars from "./RatingStars";
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
    <div className="fk-card group relative overflow-hidden p-3 transition hover:-translate-y-0.5 hover:shadow-lg">
      <button
        type="button"
        onClick={() =>
          handleProtectedAction(async () => {
            await toggleWishlist(product.id);
            toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
          })
        }
        className="absolute right-3 top-3 z-10 rounded-full bg-white p-1.5 shadow"
      >
        <Heart className={`h-4 w-4 ${inWishlist ? "fill-red-500 text-red-500" : "text-slate-500"}`} />
      </button>

      <Link to={`/products/${product.slug}`}>
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="h-44 w-full object-contain transition group-hover:scale-105"
        />
      </Link>

      <Link to={`/products/${product.slug}`} className="mt-2 line-clamp-2 block text-sm font-medium text-slate-800">
        {product.name}
      </Link>

      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        <RatingStars rating={product.rating} />
        <span>({product.review_count})</span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-base font-semibold">₹{Number(product.price).toLocaleString("en-IN")}</span>
        <span className="text-xs text-slate-400 line-through">₹{Number(product.mrp).toLocaleString("en-IN")}</span>
        <span className="text-xs font-semibold text-green-700">{discountPct}% off</span>
      </div>

      <button
        type="button"
        onClick={() =>
          handleProtectedAction(async () => {
            await addToCart({ product_id: product.id, quantity: 1 });
            toast.success("Added to cart");
          })
        }
        className="mt-3 w-full rounded bg-fkBlue py-2 text-sm font-semibold text-white"
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
