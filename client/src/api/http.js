import axios from "axios";
import { supabase } from "../lib/supabase";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  timeout: 15000
});

const publicPrefixes = ["/products", "/categories", "/chat"];

const isPublicRequest = (url = "") => {
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return publicPrefixes.some((prefix) => normalized.startsWith(prefix));
};

api.interceptors.request.use(async (config) => {
  try {
    const sessionResult = isPublicRequest(config.url)
      ? await Promise.race([
          supabase.auth.getSession(),
          new Promise((resolve) => setTimeout(() => resolve(null), 1200))
        ])
      : await supabase.auth.getSession();

    const token = sessionResult?.data?.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Do not block public API calls if auth session lookup fails.
  }

  return config;
});

export default api;
