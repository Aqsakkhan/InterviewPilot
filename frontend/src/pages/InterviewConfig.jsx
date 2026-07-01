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
const COMPANIES = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Apple",
  "Netflix",
  "Adobe",
  "Oracle",
  "Salesforce",
  "JP Morgan Chase",
  "Goldman Sachs",
  "Deloitte",
  "Accenture",
  "Infosys",
  "TCS",
];
const JOB_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Java Developer",
  "Python Developer",
  "React Developer",
  "Node.js Developer",
  "Android Developer",
  "Flutter Developer",
  "AI / ML Engineer",
  "Data Analyst",
  "Data Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Cybersecurity Engineer",
  "QA Engineer (SDET)",
  "Product Engineer",
  "System Engineer",
  "Embedded Software Engineer",
];

const EXPERIENCE_LEVELS = [
  "Fresher",
  "0-1 Years",
  "1-3 Years",
  "3-5 Years",
];
export default function InterviewConfig() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [type, setType] = useState(params.get("type") || "full_placement");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [company, setCompany] = useState("Google");
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      const { data } = await client.post("/interviews", {
        type, difficulty, durationMinutes, company,
        jobRole,
        experienceLevel
      });
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
                className={`focus-ring text-left p-3 rounded-xl border transition-colors ${type === value ? "border-primary bg-primary/10" : "border-line hover:bg-white/5"
                  }`}
              >
                <Icon size={16} className={type === value ? "text-primary" : "text-muted"} />
                <p className="text-sm mt-2">{label}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-muted mb-2 block">
            Company
          </label>

          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="focus-ring w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm"
          >
            {COMPANIES.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-muted mb-2 block">
            Job Role
          </label>

          <select
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            className="focus-ring w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm"
          >
            {JOB_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-muted mb-2 block">
            Experience Level
          </label>

          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="focus-ring w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm"
          >
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-muted mb-2 block">Difficulty</label>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`focus-ring capitalize p-2.5 rounded-xl border text-sm transition-colors ${difficulty === d ? "border-secondary bg-secondary/10 text-ink" : "border-line text-muted hover:bg-white/5"
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
                className={`focus-ring p-2.5 rounded-xl border text-sm transition-colors ${durationMinutes === d ? "border-accent bg-accent/10 text-ink" : "border-line text-muted hover:bg-white/5"
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
