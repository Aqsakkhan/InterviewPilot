// state: "idle" | "listening" | "speaking" | "thinking"
export default function InterviewerOrb({ state = "idle", size = 160 }) {
  return (
    <div className="orb" data-state={state} style={{ "--orb-size": `${size}px` }}>
      <span className="orb-ring" />
      <span className="orb-ring" />
      <span className="orb-ring" />
      <div className="orb-core" />
    </div>
  );
}
