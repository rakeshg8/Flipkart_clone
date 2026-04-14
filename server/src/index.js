import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requireAdmin } from "./middleware/admin.js";

import productsRoutes from "./routes/products.js";
import categoriesRoutes from "./routes/categories.js";
import cartRoutes from "./routes/cart.js";
import wishlistRoutes from "./routes/wishlist.js";
import orderRoutes from "./routes/orders.js";
import addressRoutes from "./routes/addresses.js";
import adminRoutes from "./routes/admin.js";
import chatRoutes from "./routes/chat.js";
import meRoutes from "./routes/me.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = env.corsOrigin.split(",").map((u) => u.trim());
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "flipkart-clone-server" });
});

app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/chat", chatRoutes);

app.use("/api/cart", requireAuth, cartRoutes);
app.use("/api/wishlist", requireAuth, wishlistRoutes);
app.use("/api/orders", requireAuth, orderRoutes);
app.use("/api/addresses", requireAuth, addressRoutes);
app.use("/api/me", requireAuth, meRoutes);
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
