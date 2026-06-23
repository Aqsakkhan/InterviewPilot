import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import InterviewerOrb from "../components/InterviewerOrb";

const ROLES = ["Frontend Developer", "Backend Developer", "Full Stack Developer", "SDE", "Data Analyst", "Other"];

export default function ProfileSetup() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: profile?.name || "",
    college: "",
    branch: "",
    graduationYear: new Date().getFullYear() + 1,
    targetRole: "Full Stack Developer",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await client.put("/users/me", {
        ...form,
        graduationYear: Number(form.graduationYear),
      });
      await refreshProfile();
      navigate("/resume-upload");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="app-backdrop" />
      <GlassCard strong className="w-full max-w-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          <InterviewerOrb state="idle" size={56} />
          <div>
            <h1 className="font-display text-xl font-semibold">Quick profile setup</h1>
            <p className="text-muted text-sm">One-time - helps us pick the right questions for you.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted mb-1 block">Full name</label>
            <input
              required
              name="name"
              value={form.name}
              onChange={handleChange}
              className="focus-ring w-full bg-white/5 border border-line rounded-lg px-3 py-2.5 text-ink placeholder:text-muted/60"
              placeholder="Aqsa Khan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted mb-1 block">College</label>
              <input
                required
                name="college"
                value={form.college}
                onChange={handleChange}
                className="focus-ring w-full bg-white/5 border border-line rounded-lg px-3 py-2.5 text-ink placeholder:text-muted/60"
                placeholder="e.g. NIT Surat"
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Branch</label>
              <input
                required
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="focus-ring w-full bg-white/5 border border-line rounded-lg px-3 py-2.5 text-ink placeholder:text-muted/60"
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Graduation year</label>
              <input
                required
                type="number"
                name="graduationYear"
                value={form.graduationYear}
                onChange={handleChange}
                min={2024}
                max={2032}
                className="focus-ring w-full bg-white/5 border border-line rounded-lg px-3 py-2.5 text-ink"
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Target role</label>
              <select
                name="targetRole"
                value={form.targetRole}
                onChange={handleChange}
                className="focus-ring w-full bg-white/5 border border-line rounded-lg px-3 py-2.5 text-ink"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-surface">
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="focus-ring w-full inline-flex items-center justify-center gap-2 mt-2 px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Continue to resume upload"} <ArrowRight size={16} />
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
