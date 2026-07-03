import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";
import Navbar from "./Navbar";

export default function ProtectedRoute({
  children,
  requireProfile = true,
}) {
  const {
    firebaseUser,
    profile,
    loading,
    profileChecked,
  } = useAuth();

  const profileComplete = Boolean(profile?.profileComplete);

  if (loading || (firebaseUser && !profileChecked)) {
    return <Loader label="Checking your session..." />;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && !profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  if (!requireProfile && profileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Navbar onboarding={!profileComplete} />

      <main
        className={`page-transition ${requireProfile ? "max-w-6xl mx-auto px-6 py-10" : ""}`}
      >
        {children}
      </main>
    </>
  );
}