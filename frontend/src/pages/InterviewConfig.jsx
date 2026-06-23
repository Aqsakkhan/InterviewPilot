import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Code2, MessageSquare, FolderKanban, BookOpen, Sparkles } from "lucide-react";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import InterviewerOrb from "../components/InterviewerOrb";

const TYPES = [
  { value: "hr", label: "HR Interview", icon: MessageSquare },
  { value: "technical", label: "Technical Interview", icon: BookOpen },
  { value: "dsa", label: "DSA Interview", icon: Code2 },
  { value: "project_viva", label: "Project Viva", icon: FolderKanban },
  { value: "full_placement", label: "Full Placement Interview", icon: Sparkles },
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const DURATIONS = [10, 20, 30];

export default function InterviewConfig() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [type, setType] = useState(params.get("type") || "full_placement");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      const { data } = await client.post("/interviews", { type, difficulty, durationMinutes });
      navigate(`/interview/${data.interview._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't start the interview. Try again.");
      setStarting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <InterviewerOrb state={starting ? "thinking" : "idle"} size={56} />
        <div>
          <h1 className="font-display text-2xl font-semibold">Set up your interview</h1>
          <p className="text-muted text-sm">Pick a round, a difficulty, and how long you've got.</p>
        </div>
      </div>

      <GlassCard className="p-6 space-y-6">
        <div>
          <label className="text-sm text-muted mb-2 block">Interview type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`focus-ring text-left p-3 rounded-xl border transition-colors ${
                  type === value ? "border-primary bg-primary/10" : "border-line hover:bg-white/5"
                }`}
              >
                <Icon size={16} className={type === value ? "text-primary" : "text-muted"} />
                <p className="text-sm mt-2">{label}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-muted mb-2 block">Difficulty</label>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`focus-ring capitalize p-2.5 rounded-xl border text-sm transition-colors ${
                  difficulty === d ? "border-secondary bg-secondary/10 text-ink" : "border-line text-muted hover:bg-white/5"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-muted mb-2 block">Duration</label>
          <div className="grid grid-cols-3 gap-3">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDurationMinutes(d)}
                className={`focus-ring p-2.5 rounded-xl border text-sm transition-colors ${
                  durationMinutes === d ? "border-accent bg-accent/10 text-ink" : "border-line text-muted hover:bg-white/5"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleStart}
          disabled={starting}
          className="focus-ring w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors disabled:opacity-60"
        >
          {starting ? "Preparing your first question..." : "Start interview"} <ArrowRight size={16} />
        </button>
      </GlassCard>
    </div>
  );
}
