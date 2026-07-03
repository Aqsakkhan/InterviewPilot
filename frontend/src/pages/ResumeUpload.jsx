import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import InterviewerOrb from "../components/InterviewerOrb";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [hasExistingResume, setHasExistingResume] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadStage, setUploadStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    client
      .get("/resume/me")
      .then(() => setHasExistingResume(true))
      .catch(() => setHasExistingResume(false))
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

    setUploading(true);
    setProgress(0);
    setUploadStage("Uploading Resume...");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      await client.post("/resume/upload", formData, {
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
      setTimeout(() => setUploadStage("Completed Successfully"), 1500);
      // Full analysis (ATS score, strengths, projects, etc.) already has a
      // dedicated page - send them there instead of duplicating it here.
      setTimeout(() => navigate("/resume-report"), 2200);
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
      setUploading(false);
      setUploadStage("");
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
    <div className="min-h-screen flex flex-col items-center px-6 py-12 gap-6">
      <div className="app-backdrop" />

      <GlassCard strong className="w-full max-w-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <InterviewerOrb state={uploading ? "thinking" : "idle"} size={56} />
          <div>
            <h1 className="font-display text-2xl font-bold">
              {hasExistingResume ? "Replace Your Resume" : "Upload Your Resume"}
            </h1>
            <p className="text-muted text-sm">
              Upload your resume in PDF format. Our AI will extract your skills, projects and experience automatically.
            </p>
          </div>
        </div>

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

        {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
      </GlassCard>
    </div>
  );
}
