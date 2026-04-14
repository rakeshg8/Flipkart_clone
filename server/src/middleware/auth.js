import { supabaseAuth, supabaseAdmin } from "../config/supabase.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing auth token" });
    }

    const token = authHeader.split(" ")[1];
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: profile?.role || "customer"
    };

    next();
  } catch (error) {
    next(error);
  }
};
