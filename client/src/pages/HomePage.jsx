import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/http";
import ProductCard from "../components/common/ProductCard";
import SkeletonCard from "../components/common/SkeletonCard";

const banners = [
  {
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1600&auto=format&fit=crop",
    title: "Electronics Sale",
    subtitle: "Up to 70% off on laptops & mobiles"
  },
  {
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop",
    title: "Fashion Week",
    subtitle: "Trending styles from top brands"
  },
  {
    image:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1600&auto=format&fit=crop",
    title: "Home & Kitchen",
    subtitle: "Transform your home"
  },
  {
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1600&auto=format&fit=crop",
    title: "Books Festival",
    subtitle: "Bestsellers at best prices"
  },
  {
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop",
    title: "Sports Carnival",
    subtitle: "Gear up for fitness"
  }
];

const categoryTiles = [
  { name: "For You", slug: "electronics", emoji: "🛍️" },
  { name: "Fashion", slug: "fashion", emoji: "👕" },
  { name: "Mobiles", slug: "electronics", emoji: "📱" },
  { name: "Beauty", slug: "fashion", emoji: "💄" },
  { name: "Electronics", slug: "electronics", emoji: "💻" },
  { name: "Home", slug: "home-kitchen", emoji: "🏠" },
  { name: "Appliances", slug: "home-kitchen", emoji: "📺" },
  { name: "Toys", slug: "sports", emoji: "🧸" },
  { name: "Food & Health", slug: "sports", emoji: "🍯" },
  { name: "Auto", slug: "sports", emoji: "🛵" },
  { name: "Sports", slug: "sports", emoji: "🏏" },
  { name: "Books", slug: "books", emoji: "📚" },
  { name: "Furniture", slug: "home-kitchen", emoji: "🛋️" }
];

const HomePage = () => {
  const [, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  const sectionRefs = useRef({});

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const visibleBanners = useMemo(
    () => [0, 1, 2].map((offset) => banners[(bannerIndex + offset) % banners.length]),
    [bannerIndex]
  );

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

  const SectionRail = ({ title, items, sectionKey, sectionClass = "fk-card p-4" }) => (
    <section className={sectionClass}>
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
      <section className="border-b bg-white py-3">
        <div className="flex gap-8 overflow-x-auto px-3">
          {categoryTiles.map((category) => (
            <Link
              key={`${category.name}-${category.slug}`}
              to={`/products?category=${category.slug}`}
              className="flex min-w-[72px] flex-col items-center gap-1 text-center"
            >
              <div className="flex h-10 w-10 items-center justify-center text-3xl">
                <span>{category.emoji}</span>
              </div>
              <p className="max-w-[84px] text-xs font-medium text-gray-800 hover:underline">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="group rounded-md bg-transparent">
        <div className="relative grid gap-3 lg:grid-cols-3">
          {visibleBanners.map((banner, idx) => (
            <article key={`${banner.title}-${bannerIndex}-${idx}`} className="relative overflow-hidden rounded-md bg-white">
              <img src={banner.image} alt={banner.title} className="h-[250px] w-full object-cover transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-4 text-white">
                <h3 className="text-2xl font-semibold leading-tight">{banner.title}</h3>
                <p className="mt-1 text-sm text-white/90">{banner.subtitle}</p>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={() => setBannerIndex((v) => (v - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-sm bg-white/90 p-2 opacity-0 shadow transition-opacity group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setBannerIndex((v) => (v + 1) % banners.length)}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-sm bg-white/90 p-2 opacity-0 shadow transition-opacity group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBannerIndex(i)}
              className={`h-2 w-2 rounded-full ${i === bannerIndex ? "bg-gray-700" : "bg-gray-300"}`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      </section>

      <SectionRail
        title="Still looking for these?"
        items={grouped.topDeals}
        sectionKey="topDeals"
        sectionClass="rounded-md bg-[#dfe7f7] p-4"
      />
      <SectionRail title="Electronics" items={grouped.electronics} sectionKey="electronics" />
      <SectionRail title="Fashion" items={grouped.fashion} sectionKey="fashion" />
    </div>
  );
};

export default HomePage;
