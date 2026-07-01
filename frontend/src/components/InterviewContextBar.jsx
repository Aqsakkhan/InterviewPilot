import { Building2, Briefcase, FlagOff } from "lucide-react";

/**
 * Persistent reminder of what interview the candidate is taking, shown
 * throughout the session so context (company/role/type/difficulty) never
 * gets lost once the interview starts.
 */
export default function InterviewContextBar({
    company,
    jobRole,
    type,
    difficulty,
    currentCount,
    targetCount,
    onEndInterview,
}) {
    const progress = Math.min(currentCount, targetCount);
    const progressPct = targetCount ? (progress / targetCount) * 100 : 0;

    return (
        <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                    {company && (
                        <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide border border-line rounded-full px-2.5 py-1 text-ink bg-white/5">
                            <Building2 size={12} className="text-accent" />
                            {company}
                        </span>
                    )}
                    {jobRole && (
                        <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide border border-line rounded-full px-2.5 py-1 text-ink bg-white/5">
                            <Briefcase size={12} className="text-primary" />
                            {jobRole}
                        </span>
                    )}
                    <span className="text-xs font-mono uppercase tracking-wide border border-line rounded-full px-2.5 py-1 text-muted bg-white/5">
                        {type.replace("_", " ")}
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wide border border-line rounded-full px-2.5 py-1 text-muted bg-white/5">
                        {difficulty}
                    </span>
                </div>

                <button
                    onClick={onEndInterview}
                    className="focus-ring shrink-0 flex items-center gap-1.5 text-xs text-muted hover:text-red-400 transition-colors mt-1"
                >
                    <FlagOff size={14} /> End interview
                </button>
            </div>

            <p className="text-sm text-ink mb-2">
                Question {currentCount} of ~{targetCount}
            </p>

            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                    className="h-full bg-linear-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                />
            </div>
        </div>
    );
}