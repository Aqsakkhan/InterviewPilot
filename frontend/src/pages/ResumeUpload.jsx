import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  ArrowRight,
  CheckCircle2,
  RefreshCcw,
  Download,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import InterviewerOrb from "../components/InterviewerOrb";
import ScoreRing from "../components/ScoreRing";

const SKILL_CATEGORY_LABELS = {
  languages: "Languages",
  frameworks: "Frameworks",
  databases: "Databases",
  cloudDevops: "Cloud & DevOps",
  tools: "Tools",
  other: "Other",
};

export default function ResumeUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [resume, setResume] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadStage, setUploadStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    client
      .get("/resume/me")
      .then(({ data }) => setResume(data))
      .catch(() => setResume(null))
      .finally(() => setLoadingExisting(false));
  }, []);

  const handleFile = async (file) => {
    if (!file) return;

    setError("");

    if (file.type !== "application/pdf") {
      setError("Only PDF resumes are supported.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Maximum allowed file size is 8 MB.");
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setProgress(0);
    setUploadStage("Uploading Resume...");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const { data } = await client.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
          if (percent < 100) setUploadStage("Uploading Resume...");
        },
      });

      setProgress(100);
      setUploadStage("Extracting Resume...");

      setTimeout(() => setUploadStage("Analyzing Skills..."), 500);
      setTimeout(() => setUploadStage("Generating Interview Profile..."), 1000);
      setTimeout(() => {
        setResume(data);
        setUploadStage("Completed Successfully");
      }, 1500);
    } catch (err) {
      if (!err.response) {
        setError("Network error. Please check your connection.");
      } else if (err.response.status === 400) {
        setError("Please upload a valid PDF.");
      } else if (err.response.status === 413) {
        setError("Resume exceeds 8 MB.");
      } else {
        setError("Resume analysis failed. Please try again.");
      }
      setProgress(0);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadStage("");
      }, 2200);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    setError("");
    try {
      const { data } = await client.post("/resume/analyze");
      setResume(data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't re-analyze your resume.");
    } finally {
      setReanalyzing(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setError("");
    try {
      const response = await client.get("/resume/analysis/pdf", { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "resume-analysis.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Couldn't generate the analysis PDF. Try re-analyzing first.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loadingExisting) {
    return (
      <div className="min-h-screen grid place-items-center">
        <InterviewerOrb state="thinking" size={80} />
      </div>
    );
  }

  const analysis = resume?.analysis;

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12 gap-6">
      <div className="app-backdrop" />

      {/* ── Upload Card ── */}
      <GlassCard strong className="w-full max-w-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <InterviewerOrb state={uploading ? "thinking" : "idle"} size={56} />
          <div>
            <h1 className="font-display text-2xl font-bold">
              {resume ? "🎉 Resume Uploaded Successfully" : "Upload Your Resume"}
            </h1>
            <p className="text-muted text-sm">
              {resume
                ? "InterviewPilot AI has analyzed your resume and will personalize your interview using your skills, projects and experience."
                : "Upload your resume in PDF format. Our AI will extract your skills, projects and experience automatically."}
            </p>
          </div>
        </div>

        {/* Drop zone — only shown before a resume exists */}
        {!resume && (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (!uploading) handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${dragActive
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-line hover:border-primary/60 hover:bg-white/5"
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <UploadCloud className="mx-auto text-accent" size={32} />
            <p className="mt-4 font-semibold text-lg text-ink">
              {uploading ? uploadStage : "Drag & Drop Your Resume Here"}
            </p>
            <p className="text-primary mt-2 text-sm">or click to browse files</p>
            <p className="text-sm text-muted mt-3 leading-6">
              PDF only • Maximum Size 8 MB
              <br />
              AI automatically extracts Skills • Projects • Experience • Education
            </p>

            {uploading && (
              <div className="mt-6">
                <div className="flex justify-between text-xs text-muted mb-2">
                  <span>{uploadStage}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

        {/* Resume loaded state */}
        {resume && (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-success text-sm mb-4">
              <CheckCircle2 size={16} /> {resume.fileName}
            </div>

            <div className="bg-white/5 border border-line rounded-xl p-4 mb-4">
              <h3 className="font-medium mb-2">Uploaded Resume</h3>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{resume.fileName}</p>
                  <p className="text-xs text-success">✓ Uploaded Successfully</p>
                </div>
                <span className="text-muted text-sm">PDF Resume</span>
              </div>
            </div>

            <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-5">
              <h3 className="font-medium text-success">AI Analysis Completed</h3>
              <p className="text-sm text-muted mt-1">
                Your resume has been analyzed and interview questions will be personalized
                using your skills, projects and experience.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-5">
              <Stat label="Projects" value={resume.projects?.length || 0} />
              <Stat label="Skills" value={resume.skills?.length || 0} />
              <Stat label="Experience" value={resume.internships?.length || 0} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <AreaList title="Strong areas" items={resume.strongAreas} tone="success" />
              <AreaList title="Areas to brush up" items={resume.weakAreas} tone="warning" />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="focus-ring inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line text-ink hover:bg-white/5 transition-colors text-sm"
              >
                <RefreshCcw size={14} /> Upload New Resume
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                onClick={() => navigate("/dashboard")}
                className="focus-ring flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors"
              >
                Continue to Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── Phase 3: Resume Intelligence Dashboard ── */}
      {analysis && (
        <GlassCard strong className="w-full max-w-3xl p-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              <h2 className="font-display text-lg font-semibold">Resume Intelligence</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="focus-ring inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-ink text-xs hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                <RefreshCcw size={12} />
                {reanalyzing ? "Re-analyzing..." : "Re-analyze"}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="focus-ring inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs hover:bg-primary-dim transition-colors disabled:opacity-60"
              >
                <Download size={12} />
                {downloadingPdf ? "Preparing..." : "Download PDF"}
              </button>
            </div>
          </div>

          {/* Score rings */}
          <div className="flex flex-wrap items-center gap-8 mb-8">
            <ScoreRing score={analysis.atsScore} size={110} label="ATS Score" />
            <ScoreRing score={analysis.strengthScore} size={110} label="Resume Strength" />
            <div>
              <span className="text-xs font-mono uppercase tracking-wide text-muted">
                Experience Level
              </span>
              <p className="text-ink font-medium mt-1">{analysis.experienceLevel}</p>
              <span className="text-xs font-mono uppercase tracking-wide text-muted mt-3 block">
                Analyzed for
              </span>
              <p className="text-ink font-medium mt-1">{analysis.targetRole}</p>
            </div>
          </div>

          {/* Skill categories */}
          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {Object.entries(SKILL_CATEGORY_LABELS).map(([key, label]) => (
              <SkillCategoryCard
                key={key}
                title={label}
                items={analysis.skillCategories?.[key] || []}
              />
            ))}
            <SkillCategoryCard
              title="Soft Skills Detected"
              items={analysis.softSkillsDetected || []}
              tone="accent"
              emptyText="None detected from resume text."
            />
          </div>

          {/* Keyword match */}
          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            <SkillCategoryCard
              title={`Matched Keywords (${analysis.targetRole})`}
              items={analysis.matchedKeywords || []}
              tone="success"
              emptyText="No role keywords matched yet."
            />
            <SkillCategoryCard
              title="Missing Skills to Consider"
              items={analysis.missingSkills || []}
              tone="warning"
              emptyText="Nothing missing — great keyword coverage!"
            />
          </div>

          {/* Improvement tips */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted mb-3">
              <Lightbulb size={14} /> Improvement Tips
            </h3>
            <ul className="space-y-2 text-sm text-ink">
              {(analysis.improvementTips || []).length ? (
                analysis.improvementTips.map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent shrink-0">!</span> {tip}
                  </li>
                ))
              ) : (
                <li className="text-muted">No high-priority issues detected.</li>
              )}
            </ul>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/5 border border-line rounded-xl py-3">
      <div className="font-display text-xl font-semibold">{value}</div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}

function AreaList({ title, items, tone }) {
  const color = tone === "success" ? "text-success" : "text-warning";
  return (
    <div className="bg-white/5 border border-line rounded-xl p-4">
      <h4 className={`text-xs font-mono uppercase tracking-wide ${color} mb-2 flex items-center gap-1.5`}>
        <FileText size={12} /> {title}
      </h4>
      {items?.length ? (
        <ul className="flex flex-wrap gap-2">
          {items.slice(0, 5).map((item) => (
            <li
              key={item}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${tone === "success"
                ? "bg-success/10 border border-success/20"
                : "bg-yellow-500/10 border border-yellow-500/20"
                }`}
            >
              {tone === "success" ? "✓" : "⚠"} {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">None detected</p>
      )}
    </div>
  );
}

const CHIP_TONE = {
  default: "text-ink border-line bg-white/5",
  success: "text-success border-success/30 bg-success/5",
  warning: "text-warning border-warning/30 bg-warning/5",
  accent: "text-accent border-accent/30 bg-accent/5",
};

function SkillCategoryCard({ title, items = [], tone = "default", emptyText }) {
  if (!items.length && !emptyText) return null;
  const chipClass = CHIP_TONE[tone] || CHIP_TONE.default;
  return (
    <div>
      <h4 className="text-xs font-mono uppercase tracking-wide text-muted mb-2">{title}</h4>
      {items.length ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className={`text-xs px-2.5 py-1 rounded-full border ${chipClass}`}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">{emptyText}</p>
      )}
    </div>
  );
}
