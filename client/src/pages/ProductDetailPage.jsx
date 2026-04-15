import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/http";
import RatingStars from "../components/common/RatingStars";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { trackProductView } from "../lib/recommendations";

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

  useEffect(() => {
    if (product) {
      trackProductView(product);
    }
  }, [product]);

  const discountPct = useMemo(() => {
    if (!product) return 0;
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }, [product]);

  const specs = useMemo(
    () => Object.entries(product?.specifications || {}).map(([key, value]) => ({ key: key.replace(/_/g, " "), value })),
    [product]
  );

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
              className="flex-1 border-2 border-[#ff9f00] bg-white py-4 text-base font-bold uppercase tracking-wide text-[#ff9f00] hover:bg-orange-50"
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
              className="flex-1 bg-[#fb641b] py-4 text-base font-bold uppercase tracking-wide text-white hover:bg-orange-600"
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
          <div className="mt-3 flex items-center">
            <span className="text-xl font-medium text-green-600">
              ↓{discountPct}%
            </span>
            <span className="ml-2 text-lg text-gray-400 line-through">
              ₹{Number(product.mrp).toLocaleString("en-IN")}
            </span>
            <span className="ml-2 text-3xl font-medium text-gray-900">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>
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
            <div className="mt-2 overflow-hidden rounded border border-gray-200">
              <table className="w-full text-sm">
                <tbody>
                  {specs.map((spec, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="w-1/3 border-b px-4 py-3 text-gray-500">{spec.key}</td>
                      <td className="border-b px-4 py-3 text-gray-800">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
