import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";

export default function Profile() {
    const { profile, firebaseUser } = useAuth();

    const name =
        profile?.name ||
        firebaseUser?.displayName ||
        "User";

    const email =
        profile?.email ||
        firebaseUser?.email ||
        "-";

    const photo =
        profile?.photoURL ||
        firebaseUser?.photoURL;

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="font-display text-3xl font-semibold mb-6">
                My Profile
            </h1>

            <GlassCard className="p-8">
                <div className="flex items-center gap-6">

                    {photo ? (
                        <img
                            src={photo}
                            alt={name}
                            className="w-24 h-24 rounded-full object-cover border border-line"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-surface-2 flex items-center justify-center text-3xl font-bold">
                            {name[0]?.toUpperCase()}
                        </div>
                    )}

                    <div>
                        <h2 className="text-2xl font-semibold">
                            {name}
                        </h2>

                        <p className="text-muted mt-2">
                            {email}
                        </p>
                    </div>

                </div>
            </GlassCard>
        </div>
    );
}