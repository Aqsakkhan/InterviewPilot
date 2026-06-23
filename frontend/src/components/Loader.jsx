import InterviewerOrb from "./InterviewerOrb";

export default function Loader({ label = "Loading..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <InterviewerOrb state="thinking" size={96} />
      <p className="text-muted font-mono text-sm tracking-wide">{label}</p>
    </div>
  );
}
