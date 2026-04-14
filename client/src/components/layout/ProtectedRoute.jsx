import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="container-main py-10">Loading...</div>;
  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
};

export default ProtectedRoute;
