import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  FileText,
  Code2,
  MessageSquare,
  FolderKanban,
  Gauge,
  ArrowRight,
  UploadCloud,
  ListChecks,
  Mic,
  ClipboardCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import InterviewerOrb from "../components/InterviewerOrb";
import GlassCard from "../components/GlassCard";

const FEATURES = [
  {
    icon: FileText,
    title: "Resume-Based Questions",
    desc: "Every question is grounded in your actual resume - your real projects, your real internships, your real stack.",
  },
  {
    icon: Code2,
    title: "DSA Mock Interviews",
    desc: "Explain your approach out loud, the way a panel actually expects - no editor, just reasoning and trade-offs.",
  },
  {
    icon: MessageSquare,
    title: "HR Interview Simulation",
    desc: "Strengths, weaknesses, leadership stories - practiced until they stop sounding rehearsed.",
  },
  {
    icon: FolderKanban,
    title: "Project Viva Practice",
    desc: "Defend your architecture choices and your 'why' before someone else makes you defend them live.",
  },
  {
    icon: Sparkles,
    title: "Personalized Feedback",
    desc: "Specific, evidence-based notes on what landed and what didn't - not generic platitudes.",
  },
  {
    icon: Gauge,
    title: "Interview Readiness Score",
    desc: "A single number that tracks whether you're actually getting better, round over round.",
  },
];

const STEPS = [
  { icon: UploadCloud, title: "Upload your resume", desc: "We read your projects, skills and internships." },
  { icon: ListChecks, title: "Pick a round", desc: "HR, technical, DSA, project viva, or the full panel." },
  { icon: Mic, title: "Talk it through", desc: "Answer out loud - the AI interviewer follows up like a real one." },
  { icon: ClipboardCheck, title: "Get scored", desc: "A readiness score plus exactly what to fix before the real thing." },
];

export default function LandingPage() {
  const { firebaseUser, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (firebaseUser && profile) {
      navigate(profile.profileComplete ? "/dashboard" : "/profile-setup");
    }
  }, [firebaseUser, profile, navigate]);

  return (
    <div className="relative overflow-hidden">
      <div className="app-backdrop" />

      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display font-semibold text-lg">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-linear-to-br from-primary to-secondary">
            <Sparkles size={16} className="text-white" />
          </span>
          InterviewPilot <span className="text-accent">AI</span>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="focus-ring text-sm px-4 py-2 rounded-lg border border-line text-ink hover:bg-white/5 transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/5 rounded-full px-3 py-1">
            AI Recruitment Center
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.1] mt-5">
            Practice real interviews
            <br />
            <span className="text-gradient">before the real one</span>
          </h1>
          <p className="text-muted text-lg mt-5 max-w-md">
            AI-powered mock interviews built from your own resume, skills, projects and target role -
            HR, technical, DSA and project viva.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button
              onClick={() => navigate("/login")}
              className="focus-ring inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors"
            >
              Start Interview <ArrowRight size={16} />
            </button>
            <a
              href="#how-it-works"
              className="focus-ring inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-line text-ink hover:bg-white/5 transition-colors"
            >
              See how it works
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="flex flex-col items-center gap-6"
        >
          <InterviewerOrb state="speaking" size={180} />
          <GlassCard className="px-5 py-4 max-w-sm">
            <div className="flex items-center gap-2 text-xs text-muted font-mono mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> AI INTERVIEWER
            </div>
            <p className="text-ink leading-relaxed">
              "Tell me about your ATS Resume Tracker project."
            </p>
            <div className="waveform mt-3">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-center">
          Everything a placement panel throws at you
        </h2>
        <p className="text-muted text-center mt-3 max-w-xl mx-auto">
          Not another question bank. A virtual interviewer that reacts to your actual answers.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <GlassCard key={title} className="p-6">
              <span className="grid place-items-center w-10 h-10 rounded-lg bg-white/5 border border-line mb-4">
                <Icon size={18} className="text-accent" />
              </span>
              <h3 className="font-display font-medium text-lg">{title}</h3>
              <p className="text-muted text-sm mt-2 leading-relaxed">{desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 pb-28">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-center">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative">
              <GlassCard className="p-6 h-full">
                <span className="font-mono text-xs text-accent">0{i + 1}</span>
                <span className="grid place-items-center w-10 h-10 rounded-lg bg-white/5 border border-line my-3">
                  <Icon size={18} className="text-secondary" />
                </span>
                <h3 className="font-display font-medium">{title}</h3>
                <p className="text-muted text-sm mt-1.5 leading-relaxed">{desc}</p>
              </GlassCard>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-28 text-center">
        <GlassCard strong className="p-10">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">Ready to walk in prepared?</h2>
          <p className="text-muted mt-3">Upload your resume and have your first AI interview in under five minutes.</p>
          <button
            onClick={() => navigate("/login")}
            className="focus-ring inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors"
          >
            Sign in <ArrowRight size={16} />
          </button>
        </GlassCard>
      </section>

      <footer className="max-w-6xl mx-auto px-6 pb-10 text-center text-muted text-sm">
        InterviewPilot AI - built for engineering students preparing for placements.
      </footer>
    </div>
  );
}
