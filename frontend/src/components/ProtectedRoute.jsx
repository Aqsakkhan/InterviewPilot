import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";
import Navbar from "./Navbar";

export default function ProtectedRoute({ children, requireProfile = true }) {
  const { firebaseUser, profile, loading } = useAuth();

  if (loading) return <Loader label="Checking your session..." />;

  if (!firebaseUser) return <Navigate to="/" replace />;

  if (requireProfile && profile && !profile.profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </>
  );
}
