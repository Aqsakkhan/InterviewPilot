import { AlertCircle, RotateCcw } from "lucide-react";
import GlassCard from "./GlassCard";

/**
 * ErrorState - shown when a page's data fetch fails, with a retry button.
 * Usage: <ErrorState message="Couldn't load your dashboard." onRetry={fetchData} />
 */
export default function ErrorState({ message = "Something went wrong.", onRetry }) {
    return (
        <GlassCard className="p-10 text-center">
            <AlertCircle className="mx-auto text-red-400" size={28} />
            <p className="text-ink font-medium mt-3">{message}</p>
            <p className="text-muted text-sm mt-1">Check your connection and try again.</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="focus-ring inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors"
                >
                    <RotateCcw size={14} /> Retry
                </button>
            )}
        </GlassCard>
    );
}
