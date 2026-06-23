import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import InterviewerOrb from "../components/InterviewerOrb";

export default function ProfileSetup() {
  const { firebaseUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(firebaseUser?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await client.put("/users/me", {
        name: name.trim(),
      });

      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not save your profile. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-12">
      <div className="app-backdrop" />

      <GlassCard strong className="w-full max-w-lg p-8">
        <div className="flex flex-col items-center text-center gap-4 mb-7">
          <InterviewerOrb state="idle" size={72} />

          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/5 rounded-full px-3 py-1 mb-4">
              <Sparkles size={13} />
              Profile Setup
            </div>

            <h1 className="font-display text-3xl font-semibold">
              Welcome to InterviewPilot
            </h1>

            <p className="text-muted mt-2">
              What should we call you?
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-muted mb-1.5 block">
              Full Name
            </label>

            <input
              required
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus-ring w-full bg-white/5 border border-line rounded-xl px-4 py-3 text-ink placeholder:text-muted/60"
              placeholder="Aqsa Khan"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="focus-ring w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Continue"}
            <ArrowRight size={16} />
          </button>
        </form>
      </GlassCard>
    </div>
  );
}