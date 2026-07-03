import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  LogOut,
  Sparkles,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onboarding = false }) {
  const { firebaseUser, profile, signOutUser } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOutUser();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line backdrop-blur-xl bg-navy/70">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to={onboarding ? "/profile-setup" : "/dashboard"}
          className="flex items-center gap-2 font-display font-semibold text-lg"
        >
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-linear-to-br from-primary to-secondary">
            <Sparkles size={16} className="text-white" />
          </span>

          InterviewPilot <span className="text-accent">AI</span>
        </Link>

        {!onboarding && (
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>

            <Link
              to="/interview/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
            >
              <Sparkles size={16} />
              New Interview
            </Link>

            <Link
              to="/progress"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
            >
              <TrendingUp size={16} />
              Progress
            </Link>

            <Link
              to="/history"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
            >
              <History size={16} />
              History
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {!onboarding && (
            <>
              <Link to="/profile">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile?.name || "Profile"}
                    className="w-8 h-8 rounded-full border border-line object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";

                      const fallback =
                        e.currentTarget.parentElement?.querySelector(".avatar-fallback");

                      if (fallback) {
                        fallback.style.display = "grid";
                      }
                    }}
                  />
                ) : null}

                <span
                  className="avatar-fallback w-8 h-8 rounded-full bg-surface-2 grid place-items-center text-xs font-semibold"
                  style={{
                    display: profile?.photoURL ? "none" : "grid",
                  }}
                >
                  {(
                    profile?.name ||
                    profile?.email ||
                    firebaseUser?.email ||
                    "?"
                  )[0]?.toUpperCase()}
                </span>
              </Link>
            </>
          )}

          {!onboarding && (
            <Link
              to="/settings"
              className="focus-ring p-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={18} />
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="focus-ring p-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}