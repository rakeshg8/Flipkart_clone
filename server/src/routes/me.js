import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, avatar_url, role, created_at")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const { full_name, avatar_url } = req.body;

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ full_name, avatar_url })
      .eq("id", req.user.id)
      .select("id, email, full_name, avatar_url, role, created_at")
      .single();

    if (error) throw error;
    res.json({ data, message: "Profile updated" });
  } catch (error) {
    next(error);
  }
});

export default router;
