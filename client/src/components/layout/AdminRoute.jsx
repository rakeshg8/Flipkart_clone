import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="container-main py-10">Loading...</div>;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
