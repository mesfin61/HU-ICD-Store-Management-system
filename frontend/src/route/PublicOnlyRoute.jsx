import { Navigate } from "react-router-dom";
import { useUser } from "../context/AuthContext";

export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : children;
}