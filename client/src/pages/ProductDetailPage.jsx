import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/http";
import RatingStars from "../components/common/RatingStars";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    api.get(`/products/${slug}`).then((res) => setProduct(res.data.data));
  }, [slug]);

  const discountPct = useMemo(() => {
    if (!product) return 0;
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }, [product]);

  if (!product) {
    return <div className="container-main py-8">Loading product...</div>;
  }

  const doAction = async (action) => {
    if (!session) {
      navigate("/auth");
      return;
    }
    await action();
  };

  return (
    <div className="container-main py-4">
      <div className="grid gap-4 lg:grid-cols-[480px_1fr]">
        <div className="fk-card p-4">
          <img src={product.images?.[activeImage]} alt={product.name} className="h-80 w-full object-contain" />
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {product.images?.map((image, idx) => (
              <button
                type="button"
                key={image}
                onClick={() => setActiveImage(idx)}
                className={`h-16 w-16 rounded border p-1 ${activeImage === idx ? "border-fkBlue" : "border-slate-300"}`}
              >
                <img src={image} alt="thumb" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                doAction(async () => {
                  await addToCart({ product_id: product.id, quantity });
                  toast.success("Added to cart");
                })
              }
              className="rounded border-2 border-fkBlue bg-white py-3 text-sm font-bold text-fkBlue"
            >
              ADD TO CART
            </button>
            <button
              type="button"
              onClick={() =>
                doAction(async () => {
                  await addToCart({ product_id: product.id, quantity });
                  navigate("/checkout");
                })
              }
              className="rounded bg-fkOrange py-3 text-sm font-bold text-white"
            >
              BUY NOW
            </button>
          </div>
        </div>

        <div className="fk-card p-4">
          <h1 className="text-xl font-medium">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <RatingStars rating={product.rating} />
            <span className="text-sm text-slate-500">{product.review_count} ratings</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-2xl font-semibold">₹{Number(product.price).toLocaleString("en-IN")}</span>
            <span className="text-slate-400 line-through">₹{Number(product.mrp).toLocaleString("en-IN")}</span>
            <span className="text-green-700">{discountPct}% off</span>
          </div>
          <p className="mt-2 text-sm text-slate-700">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center rounded border">
              <button type="button" className="px-3 py-1" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                -
              </button>
              <span className="px-4 py-1 text-sm">{quantity}</span>
              <button type="button" className="px-3 py-1" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>
                +
              </button>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-semibold">Description</h3>
            <p className="mt-2 text-sm text-slate-600">{product.description}</p>
          </div>

          <details className="mt-4 rounded border p-3" open>
            <summary className="cursor-pointer text-sm font-semibold">Specifications</summary>
            <div className="mt-2 space-y-1 text-sm">
              {Object.entries(product.specifications || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 border-b py-1">
                  <span className="capitalize text-slate-500">{key.replace(/_/g, " ")}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
