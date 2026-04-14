import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { parsePagination } from "../utils/pagination.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { q = "", category, min_price, max_price, brand, min_rating } = req.query;
    const { from, to, page, limit } = parsePagination(req.query);

    let query = supabaseAdmin
      .from("products")
      .select("*, categories(name, slug)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`);
    }

    if (category) {
      const { data: cat } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", String(category))
        .single();

      if (cat?.id) {
        query = query.eq("category_id", cat.id);
      } else {
        return res.json({ data: [], meta: { page, limit, total: 0 } });
      }
    }

    if (min_price !== undefined && min_price !== "") {
      query = query.gte("price", Number(min_price));
    }

    if (max_price !== undefined && max_price !== "") {
      query = query.lte("price", Number(max_price));
    }

    if (brand) {
      query = query.eq("brand", String(brand));
    }

    if (min_rating !== undefined && min_rating !== "") {
      query = query.gte("rating", Number(min_rating));
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      data,
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, categories(name, slug)")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
