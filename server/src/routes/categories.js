import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
