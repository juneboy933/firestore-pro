import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Still checking if user is logged in
  if (loading) {
    return <p>Loading...</p>; // You can replace with a spinner or loader
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/" />;
  }

  // Otherwise, show protected content
  return children;
};

export default ProtectedRoute;
