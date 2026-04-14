import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../api/http";
import { useAuth } from "../contexts/AuthContext";

const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    setFullName(user?.full_name || "");
  }, [user?.full_name]);

  useEffect(() => {
    api.get("/addresses").then((res) => setAddresses(res.data.data || []));
  }, []);

  const saveProfile = async () => {
    try {
      await api.put("/me", { full_name: fullName, avatar_url: user?.avatar_url || null });
      await refreshProfile();
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update profile");
    }
  };

  return (
    <div className="container-main grid gap-4 py-4 md:grid-cols-[2fr_1fr]">
      <div className="fk-card p-4">
        <h1 className="text-lg font-semibold">Profile Information</h1>
        <div className="mt-3 max-w-md">
          <label className="text-xs font-medium text-slate-500">Full Name</label>
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          <p className="mt-2 text-xs text-slate-500">Email: {user?.email}</p>
          <button type="button" onClick={saveProfile} className="mt-3 rounded bg-fkBlue px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="fk-card p-4">
          <h2 className="text-sm font-semibold">Quick Links</h2>
          <div className="mt-2 space-y-2 text-sm">
            <Link to="/orders" className="block text-fkBlue">
              My Orders
            </Link>
            <Link to="/checkout" className="block text-fkBlue">
              Manage Addresses
            </Link>
          </div>
        </div>
        <div className="fk-card p-4">
          <h2 className="text-sm font-semibold">Saved Addresses</h2>
          <div className="mt-2 space-y-2 text-xs">
            {addresses.map((a) => (
              <p key={a.id} className="rounded bg-slate-50 p-2">
                {a.full_name}, {a.line1}, {a.city}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
