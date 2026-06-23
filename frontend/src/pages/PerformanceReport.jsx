import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ThumbsUp, TrendingUp, ArrowRight, RotateCcw } from "lucide-react";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import ScoreRing from "../components/ScoreRing";

const SUB_SCORES = [
  { key: "technicalScore", label: "Technical" },
  { key: "communicationScore", label: "Communication" },
  { key: "confidenceScore", label: "Confidence" },
  { key: "dsaScore", label: "DSA" },
  { key: "hrScore", label: "HR" },
];

export default function PerformanceReport() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);

  useEffect(() => {
    client.get(`/interviews/${id}`).then(({ data }) => setInterview(data));
  }, [id]);

  if (!interview) {
    return <p className="text-muted">Loading your report...</p>;
  }

  const evalData = interview.evaluation || {};

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-wide text-muted">
          {interview.type.replace("_", " ")} - {interview.difficulty}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold mt-1">Your performance report</h1>
      </div>

      <GlassCard strong className="p-8 flex flex-col sm:flex-row items-center gap-8">
        <ScoreRing score={evalData.overallScore ?? 0} size={140} label="Overall score" />
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-5 flex-1">
          {SUB_SCORES.map(({ key, label }) => (
            <ScoreRing key={key} score={evalData[key] ?? 0} size={64} label={label} />
          ))}
        </div>
      </GlassCard>

      {evalData.summary && (
        <GlassCard className="p-6">
          <p className="text-ink leading-relaxed">{evalData.summary}</p>
        </GlassCard>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-success text-sm font-mono uppercase tracking-wide mb-3">
            <ThumbsUp size={14} /> Strengths
          </h3>
          <ul className="space-y-2 text-sm text-ink">
            {(evalData.strengths || []).map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-success">+</span> {s}
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-warning text-sm font-mono uppercase tracking-wide mb-3">
            <TrendingUp size={14} /> Improvements
          </h3>
          <ul className="space-y-2 text-sm text-ink">
            {(evalData.improvements || []).map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-warning">!</span> {s}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <div>
        <h3 className="text-xs font-mono uppercase tracking-wide text-muted mb-3">Full transcript</h3>
        <div className="space-y-3">
          {interview.qa.map((qa, i) => (
            <GlassCard key={i} className="p-4">
              <p className="text-xs text-accent font-mono uppercase mb-1">{qa.category}</p>
              <p className="text-sm text-ink font-medium">{qa.question}</p>
              <p className="text-sm text-muted mt-1.5">{qa.answer || "(no answer recorded)"}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          to={`/interview/new?type=${interview.type}`}
          className="focus-ring inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-line text-ink hover:bg-white/5 transition-colors"
        >
          <RotateCcw size={16} /> Practice this round again
        </Link>
        <Link
          to="/dashboard"
          className="focus-ring inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors"
        >
          Back to dashboard <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
