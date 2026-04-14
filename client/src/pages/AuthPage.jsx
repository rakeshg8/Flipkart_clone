import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const AuthPage = () => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password);
        if (error) throw error;
        toast.success("Welcome back");
        navigate(from, { replace: true });
      } else {
        const { error } = await signUp(form.email, form.password, form.fullName);
        if (error) throw error;
        toast.success("Signup successful. Please verify your email.");
        setIsLogin(true);
      }
    } catch (error) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-main py-8">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded bg-white shadow-card md:grid-cols-2">
        <div className="bg-fkBlue p-8 text-white">
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-blue-100">Get access to your Orders, Wishlist and Recommendations</p>
        </div>

        <div className="p-8">
          <form onSubmit={submit} className="space-y-3">
            {!isLogin && (
              <input
                placeholder="Full name"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
              required
            />

            <button type="submit" disabled={loading} className="w-full rounded bg-fkOrange py-2 text-sm font-semibold text-white">
              {loading ? "Please wait..." : isLogin ? "Login" : "Signup"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="mt-3 w-full rounded border py-2 text-sm font-medium"
          >
            Continue with Google
          </button>

          <button type="button" onClick={() => setIsLogin((v) => !v)} className="mt-4 text-sm text-fkBlue">
            {isLogin ? "New to Flipkart? Create an account" : "Existing user? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
