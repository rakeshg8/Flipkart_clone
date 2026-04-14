import { useEffect, useState } from "react";
import api from "../../api/http";

const AdminUsersPage = () => {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);

  const load = async (search = "") => {
    const { data } = await api.get("/admin/users", { params: { q: search, limit: 30 } });
    setUsers(data.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="fk-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-base font-semibold">Users</h1>
        <input
          value={q}
          onChange={(event) => {
            const value = event.target.value;
            setQ(value);
            load(value);
          }}
          placeholder="Search users"
          className="rounded border px-3 py-2 text-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-3 py-2">{user.full_name || "-"}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">{user.role}</td>
                <td className="px-3 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
