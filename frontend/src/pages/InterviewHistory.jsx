import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import client from "../api/client";
import GlassCard from "../components/GlassCard";

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(mins) {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const TYPE_LABEL = {
  hr: "HR Interview",
  technical: "Technical Interview",
  dsa: "DSA Interview",
  project_viva: "Project Viva",
  full_placement: "Full Placement Interview",
};

export default function InterviewHistory() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/interviews").then(({ data }) => {
      setInterviews(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-muted">Loading history...</p>;

  if (!interviews.length) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="text-ink font-medium">No interviews yet</p>
        <p className="text-muted text-sm mt-1">Start your first one from the dashboard.</p>
        <Link
          to="/interview/new"
          className="focus-ring inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors"
        >
          Start an interview
        </Link>
      </GlassCard>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Interview history</h1>
      <div className="space-y-3">
        {interviews.map((iv) => (
          <Link key={iv._id} to={iv.status === "completed" ? `/report/${iv._id}` : `/interview/${iv._id}`}>
            <GlassCard className="p-5 flex items-center justify-between hover:bg-white/[0.06] transition-colors">
              <div className="min-w-0">
                <p className="font-medium">{TYPE_LABEL[iv.type] || iv.type}</p>
                {(iv.company || iv.jobRole) && (
                  <p className="text-xs text-accent mt-1 truncate">
                    {[iv.company, iv.jobRole].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="text-xs text-muted mt-1 font-mono uppercase">
                  {[iv.difficulty, formatDate(iv.createdAt), formatDuration(iv.durationMinutes)]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {iv.status === "completed" ? (
                  <span className="font-display text-xl font-semibold">{Math.round(iv.evaluation?.overallScore ?? 0)}</span>
                ) : (
                  <span className="text-xs text-warning font-mono uppercase border border-warning/30 bg-warning/5 rounded-full px-2.5 py-1">
                    In progress
                  </span>
                )}
                <ArrowUpRight size={16} className="text-muted" />
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}