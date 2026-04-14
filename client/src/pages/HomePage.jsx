import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/http";
import ProductCard from "../components/common/ProductCard";
import SkeletonCard from "../components/common/SkeletonCard";

const banners = [
  "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1400&auto=format&fit=crop"
];

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  const sectionRefs = useRef({});

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [categoriesRes, productsRes] = await Promise.all([api.get("/categories"), api.get("/products", { params: { limit: 100 } })]);
        setCategories(categoriesRes.data.data || []);
        setProducts(productsRes.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const topDeals = products;
    const electronics = products.filter((p) => p.categories?.slug === "electronics");
    const fashion = products.filter((p) => p.categories?.slug === "fashion");
    return { topDeals, electronics, fashion };
  }, [products]);

  const scrollSection = (key, direction) => {
    const section = sectionRefs.current[key];
    if (!section) return;
    section.scrollBy({ left: direction * 360, behavior: "smooth" });
  };

  const SectionRail = ({ title, items, sectionKey }) => (
    <section className="fk-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => scrollSection(sectionKey, -1)} className="rounded border bg-white p-1.5">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => scrollSection(sectionKey, 1)} className="rounded border bg-white p-1.5">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div ref={(node) => (sectionRefs.current[sectionKey] = node)} className="flex gap-3 overflow-x-auto pb-2">
          {items.map((p) => (
            <div key={p.id} className="min-w-[220px] max-w-[220px] flex-shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="container-main space-y-4 pt-4">
      <section className="fk-card p-3">
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-8">
          {categories.map((category) => (
            <Link key={category.id} to={`/products?category=${category.slug}`} className="text-center text-xs font-semibold text-slate-700">
              <img src={category.image_url} alt={category.name} className="mx-auto h-14 w-14 rounded-full object-cover" />
              <p className="mt-1 line-clamp-1">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded bg-white shadow-card">
        <img src={banners[bannerIndex]} alt="Flipkart banner" className="h-48 w-full object-cover md:h-72" />
        <button
          type="button"
          onClick={() => setBannerIndex((v) => (v - 1 + banners.length) % banners.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-white/80 p-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setBannerIndex((v) => (v + 1) % banners.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/80 p-2"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      <SectionRail title="Top Deals" items={grouped.topDeals} sectionKey="topDeals" />
      <SectionRail title="Electronics" items={grouped.electronics} sectionKey="electronics" />
      <SectionRail title="Fashion" items={grouped.fashion} sectionKey="fashion" />
    </div>
  );
};

export default HomePage;
