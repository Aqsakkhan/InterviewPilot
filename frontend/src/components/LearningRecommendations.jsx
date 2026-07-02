import { Link } from "react-router-dom";
import { BookOpen, Library, ListChecks, Gauge, Map } from "lucide-react";
import GlassCard from "./GlassCard";

const DIFFICULTY_STYLE = {
    beginner: "text-success border-success/30 bg-success/5",
    intermediate: "text-warning border-warning/30 bg-warning/5",
    advanced: "text-red-400 border-red-400/30 bg-red-400/5",
};

export default function LearningRecommendations({ recommendations, interviewType }) {
    const rec = recommendations || {};
    const hasContent =
        rec.topicsToLearn?.length ||
        rec.resources?.length ||
        rec.practiceQuestions?.length ||
        rec.roadmap?.length;

    if (!hasContent) return null;

    return (
        <div className="space-y-4">
            <h2 className="font-display text-lg font-medium">Learning recommendations</h2>

            {rec.topicsToLearn?.length > 0 && (
                <GlassCard className="p-6">
                    <h3 className="flex items-center gap-2 text-accent text-sm font-mono uppercase tracking-wide mb-3">
                        <BookOpen size={14} /> Topics to learn
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {rec.topicsToLearn.map((t, i) => (
                            <span
                                key={i}
                                className="text-xs font-mono border border-accent/30 text-accent bg-accent/5 rounded-full px-2.5 py-1"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </GlassCard>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
                {rec.resources?.length > 0 && (
                    <GlassCard className="p-6">
                        <h3 className="flex items-center gap-2 text-primary text-sm font-mono uppercase tracking-wide mb-3">
                            <Library size={14} /> Resources
                        </h3>
                        <ul className="space-y-2 text-sm text-ink">
                            {rec.resources.map((r, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-primary">•</span> {r}
                                </li>
                            ))}
                        </ul>
                    </GlassCard>
                )}

                {rec.practiceQuestions?.length > 0 && (
                    <GlassCard className="p-6">
                        <h3 className="flex items-center gap-2 text-secondary text-sm font-mono uppercase tracking-wide mb-3">
                            <ListChecks size={14} /> Practice questions
                        </h3>
                        <ol className="space-y-2 text-sm text-ink">
                            {rec.practiceQuestions.map((q, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-secondary font-mono">{i + 1}.</span> {q}
                                </li>
                            ))}
                        </ol>
                    </GlassCard>
                )}
            </div>

            {rec.nextDifficulty && (
                <GlassCard className="p-6">
                    <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted mb-3">
                        <Gauge size={14} /> Next interview difficulty
                    </h3>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <span
                                className={`text-xs font-mono uppercase tracking-wide border rounded-full px-2.5 py-1 ${DIFFICULTY_STYLE[rec.nextDifficulty] || DIFFICULTY_STYLE.intermediate
                                    }`}
                            >
                                {rec.nextDifficulty}
                            </span>
                            <p className="text-sm text-muted">{rec.nextDifficultyReason}</p>
                        </div>
                        <Link
                            to={`/interview/new?type=${interviewType}&difficulty=${rec.nextDifficulty}`}
                            className="focus-ring shrink-0 text-xs px-4 py-2 rounded-lg bg-primary text-white whitespace-nowrap hover:bg-primary-dim transition-colors"
                        >
                            Start at this difficulty
                        </Link>
                    </div>
                </GlassCard>
            )}

            {rec.roadmap?.length > 0 && (
                <GlassCard className="p-6">
                    <h3 className="flex items-center gap-2 text-accent text-sm font-mono uppercase tracking-wide mb-4">
                        <Map size={14} /> Roadmap
                    </h3>
                    <ol className="space-y-4">
                        {rec.roadmap.map((step) => (
                            <li key={step.step} className="flex gap-3">
                                <span className="shrink-0 grid place-items-center w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-mono">
                                    {step.step}
                                </span>
                                <div>
                                    <p className="text-sm text-ink font-medium">{step.title}</p>
                                    <p className="text-sm text-muted mt-0.5">{step.description}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </GlassCard>
            )}
        </div>
    );
}