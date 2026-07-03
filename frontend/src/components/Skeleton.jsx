/**
 * Skeleton - a pulsing placeholder block shown while content loads.
 * Usage: <Skeleton className="h-4 w-32 rounded" />
 */
export default function Skeleton({ className = "" }) {
    return <div className={`skeleton rounded-lg ${className}`} />;
}
