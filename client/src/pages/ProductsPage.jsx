import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/http";
import ProductCard from "../components/common/ProductCard";
import SkeletonCard from "../components/common/SkeletonCard";
import Pagination from "../components/common/Pagination";

const ProductsPage = () => {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const minPrice = params.get("min_price") || "";
  const maxPrice = params.get("max_price") || "";
  const brand = params.get("brand") || "";
  const minRating = params.get("min_rating") || "";
  const page = Number(params.get("page") || "1");

  const setQuery = (next) => {
    const merged = {
      q,
      category,
      min_price: minPrice,
      max_price: maxPrice,
      brand,
      min_rating: minRating,
      ...next
    };

    const cleaned = Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== "" && value !== undefined && value !== null));
    setParams(cleaned);
  };

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/products", { params: { limit: 100 } })]).then(([catRes, prodRes]) => {
      setCategories(catRes.data.data || []);
      setAllProducts(prodRes.data.data || []);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/products", {
          params: {
            q,
            category,
            min_price: minPrice,
            max_price: maxPrice,
            brand,
            min_rating: minRating,
            page,
            limit: 12
          }
        });
        setProducts(data.data || []);
        setMeta(data.meta || { page: 1, totalPages: 1 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [q, category, minPrice, maxPrice, brand, minRating, page]);

  const brands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))].sort();

  return (
    <div className="container-main py-4">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="fk-card h-fit p-4">
          <h3 className="mb-3 text-sm font-semibold">Filters</h3>
          <div className="space-y-2 border-b pb-4">
            <p className="text-xs font-semibold text-slate-500">Category</p>
            <button
              type="button"
              onClick={() => setQuery({ category: "", page: 1 })}
              className={`block text-left text-sm ${!category ? "text-fkBlue" : ""}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setQuery({ category: cat.slug, page: 1 })}
                className={`block text-left text-sm ${category === cat.slug ? "text-fkBlue" : ""}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="space-y-2 border-b py-4">
            <p className="text-xs font-semibold text-slate-500">Price Range</p>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(event) => setQuery({ min_price: event.target.value, page: 1 })}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(event) => setQuery({ max_price: event.target.value, page: 1 })}
              className="w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <div className="space-y-2 border-b py-4">
            <p className="text-xs font-semibold text-slate-500">Brand</p>
            {brands.map((b) => (
              <label key={b} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={brand === b}
                  onChange={(event) => setQuery({ brand: event.target.checked ? b : "", page: 1 })}
                />
                {b}
              </label>
            ))}
          </div>
          <div className="space-y-2 py-4">
            <p className="text-xs font-semibold text-slate-500">Customer Ratings</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="min_rating"
                checked={minRating === "4"}
                onChange={() => setQuery({ min_rating: "4", page: 1 })}
              />
              4★ & above
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="min_rating"
                checked={minRating === "3"}
                onChange={() => setQuery({ min_rating: "3", page: 1 })}
              />
              3★ & above
            </label>
            <button type="button" onClick={() => setQuery({ min_rating: "", page: 1 })} className="text-xs text-fkBlue">
              Clear rating
            </button>
          </div>
        </aside>

        <section>
          <div className="mb-3 fk-card p-3 text-sm text-slate-600">
            Showing {products.length} items {q ? `for "${q}"` : ""}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />) : products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <Pagination
            page={meta.page || 1}
            totalPages={meta.totalPages || 1}
            onPageChange={(newPage) => setQuery({ page: String(newPage) })}
          />
        </section>
      </div>
    </div>
  );
};

export default ProductsPage;
