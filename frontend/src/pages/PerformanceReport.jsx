import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ThumbsUp,
  TrendingUp,
  ArrowRight,
  RotateCcw,
  Building2,
  Briefcase,
  MessageSquareQuote,
  Route,
  Star,
  AlertTriangle,
  Download,
} from "lucide-react";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import ScoreRing from "../components/ScoreRing";
import LearningRecommendations from "../components/LearningRecommendations";

const CORE_SCORES = [
  { key: "technicalScore", label: "Technical" },
  { key: "communicationScore", label: "Communication" },
  { key: "confidenceScore", label: "Confidence" },
  { key: "problemSolvingScore", label: "Problem Solving" },
];

const SECONDARY_SCORES = [
  { key: "vocabularyScore", label: "Vocabulary" },
  { key: "fluencyScore", label: "Fluency" },
  { key: "answerQualityScore", label: "Answer Quality" },
  { key: "hrScore", label: "HR" },
];

export default function PerformanceReport() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    client.get(`/interviews/${id}`).then(({ data }) => setInterview(data));
  }, [id]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setPdfError("");
    try {
      const response = await client.get(`/interviews/${id}/report/pdf`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `interview-report-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setPdfError("Couldn't generate the PDF. Try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!interview) {
    return <p className="text-muted">Loading your report...</p>;
  }

  const evalData = interview.evaluation || {};
  const companyReadiness = evalData.companyReadiness || {};
  const roleReadiness = evalData.roleReadiness || {};

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-muted">
            {interview.type.replace("_", " ")} - {interview.difficulty}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mt-1">Your performance report</h1>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="focus-ring shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line text-ink hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <Download size={14} />
          {downloadingPdf ? "Preparing..." : "Download PDF"}
        </button>
      </div>
      {pdfError && <p className="text-sm text-red-400 -mt-4">{pdfError}</p>}

      {/* Core scores */}
      <GlassCard strong className="p-8 flex flex-col sm:flex-row items-center gap-8">
        <ScoreRing score={evalData.overallScore ?? 0} size={140} label="Overall score" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 flex-1">
          {CORE_SCORES.map(({ key, label }) => (
            <ScoreRing key={key} score={evalData[key] ?? 0} size={64} label={label} />
          ))}
        </div>
      </GlassCard>

      {/* Secondary scores */}
      <GlassCard className="p-6">
        <h3 className="text-xs font-mono uppercase tracking-wide text-muted mb-4">Additional metrics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {SECONDARY_SCORES.map(({ key, label }) => (
            <ScoreRing key={key} score={evalData[key] ?? 0} size={56} label={label} />
          ))}
        </div>
      </GlassCard>

      {/* Readiness */}
      <div className="grid sm:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-accent text-sm font-mono uppercase tracking-wide mb-3">
            <Building2 size={14} /> Company readiness - {interview.company}
          </h3>
          <div className="flex items-center gap-4">
            <span className="font-display text-3xl font-semibold">
              {Math.round(companyReadiness.score ?? 0)}
            </span>
            <p className="text-sm text-muted leading-snug">{companyReadiness.verdict}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-primary text-sm font-mono uppercase tracking-wide mb-3">
            <Briefcase size={14} /> Role readiness - {interview.jobRole}
          </h3>
          <div className="flex items-center gap-4">
            <span className="font-display text-3xl font-semibold">
              {Math.round(roleReadiness.score ?? 0)}
            </span>
            <p className="text-sm text-muted leading-snug">{roleReadiness.verdict}</p>
          </div>
        </GlassCard>
      </div>

      {/* Recruiter feedback */}
      {evalData.recruiterFeedback && (
        <GlassCard className="p-6 border-l-2 border-l-accent">
          <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted mb-3">
            <MessageSquareQuote size={14} /> Recruiter feedback
          </h3>
          <p className="text-ink leading-relaxed italic">{evalData.recruiterFeedback}</p>
        </GlassCard>
      )}

      {/* Interview summary */}
      {evalData.summary && (
        <GlassCard className="p-6">
          <h3 className="text-xs font-mono uppercase tracking-wide text-muted mb-3">Interview summary</h3>
          <p className="text-ink leading-relaxed">{evalData.summary}</p>
        </GlassCard>
      )}

      {/* Strong / weak topic areas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-success text-sm font-mono uppercase tracking-wide mb-3">
            <Star size={14} /> Strong areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {(evalData.strongAreas || []).map((a, i) => (
              <span
                key={i}
                className="text-xs font-mono border border-success/30 text-success bg-success/5 rounded-full px-2.5 py-1"
              >
                {a}
              </span>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-warning text-sm font-mono uppercase tracking-wide mb-3">
            <AlertTriangle size={14} /> Weak areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {(evalData.weakAreas || []).map((a, i) => (
              <span
                key={i}
                className="text-xs font-mono border border-warning/30 text-warning bg-warning/5 rounded-full px-2.5 py-1"
              >
                {a}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Learning path */}
      {evalData.learningPath?.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-accent text-sm font-mono uppercase tracking-wide mb-3">
            <Route size={14} /> Suggested learning path
          </h3>
          <ol className="space-y-2 text-sm text-ink">
            {evalData.learningPath.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-accent font-mono">{i + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </GlassCard>
      )}

      <LearningRecommendations recommendations={evalData.recommendations} interviewType={interview.type} />

      {/* Coaching bullets */}
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
