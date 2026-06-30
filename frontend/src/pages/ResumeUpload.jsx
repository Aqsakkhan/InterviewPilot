import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, ArrowRight, CheckCircle2, RefreshCcw } from "lucide-react";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import InterviewerOrb from "../components/InterviewerOrb";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [resume, setResume] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadStage, setUploadStage] = useState("");

  useEffect(() => {
    client
      .get("/resume/me")
      .then(({ data }) => setResume(data))
      .catch(() => setResume(null))
      .finally(() => setLoadingExisting(false));
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setFileName(file.name);
    setUploading(true);
    setUploading(true);
    setUploadStage("Uploading resume...");
    setError("");

    const formData = new FormData();
    setUploadStage("Extracting resume...");
    formData.append("resume", file);

    try {
      setUploadStage("Analyzing with AI...");
      const { data } = await client.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResume(data);
      setUploadStage("Resume uploaded successfully!");
    } catch (err) {
      if (!err.response) {
        setError("Network error. Please check your internet connection.");
      } else if (err.response.status === 400) {
        setError("Please upload a valid PDF file.");
      } else if (err.response.status === 413) {
        setError("Resume size exceeds the allowed limit.");
      } else {
        setError("Unable to analyze your resume. Please try again.");
      }
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadStage("");
      }, 600);
    }
  };

  if (loadingExisting) {
    return (
      <div className="min-h-screen grid place-items-center">
        <InterviewerOrb state="thinking" size={80} />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="app-backdrop" />
      <GlassCard strong className="w-full max-w-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <InterviewerOrb state={uploading ? "thinking" : "idle"} size={56} />
          <div>
            <h1 className="font-display text-xl font-semibold">
              {resume ? "Your resume is loaded" : "Upload your resume"}
            </h1>
            <p className="text-muted text-sm">
              {resume
                ? "We'll use this to build questions around your real projects and skills."
                : "PDF only. We extract skills, projects and internships automatically."}
            </p>
          </div>
        </div>

        {!resume && (
          <div
            onClick={() => {
              const ok = window.confirm(
                "Replace your current resume with a new one?"
              );

              if (ok) {
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              if (uploading) return;
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="border-2 border-dashed border-line rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <UploadCloud className="mx-auto text-accent" size={32} />
            <p className="mt-3 text-ink font-medium">
              {uploading ? uploadStage : "Click to upload or drag your resume here"}
            </p>
            <p className="text-muted text-sm mt-1">Supported Format: PDF

              Maximum Size: 8 MB

              AI extracts:
              • Skills
              • Projects
              • Experience
              • Education</p>
          </div>
        )}

        {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

        {resume && (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-success text-sm mb-4">
              <CheckCircle2 size={16} /> {resume.fileName}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-5">
              <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-5">
                <h3 className="font-medium text-success">
                  AI Analysis Completed
                </h3>

                <p className="text-sm text-muted mt-1">
                  Your resume has been analyzed successfully and interview
                  questions will now be personalized using your skills,
                  projects and experience.
                </p>
              </div>
              <Stat label="Projects" value={resume.projects?.length || 0} />
              <Stat label="Skills" value={resume.skills?.length || 0} />
              <Stat label="Internships" value={resume.internships?.length || 0} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <AreaList title="Strong areas" items={resume.strongAreas} tone="success" />
              <AreaList title="Areas to brush up" items={resume.weakAreas} tone="warning" />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (!uploading) {
                    fileInputRef.current?.click();
                  }
                }}
                className="focus-ring inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line text-ink hover:bg-white/5 transition-colors text-sm"
              >
                <RefreshCcw size={14} /> Replace resume
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
                Go to dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </GlassCard>
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
        <ul className="space-y-1 text-sm text-ink">
          {items.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">None detected</p>
      )}
    </div>
  );
}
