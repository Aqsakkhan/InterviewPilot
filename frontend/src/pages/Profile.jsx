import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import {
    User,
    Mail,
    CheckCircle,
    Pencil,
    FileText,
    UploadCloud,
    Briefcase,
    FolderKanban,
    Brain,
} from "lucide-react";

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

    const navigate = useNavigate();

    const [resume, setResume] = useState(null);

    useEffect(() => {
        client
            .get("/resume/me")
            .then(({ data }) => setResume(data))
            .catch(() => setResume(null));
    }, []);

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-6">
            {/* Header */}
            <h1 className="font-display text-3xl font-semibold">
                My Profile
            </h1>

            {/* Profile Card */}
            <GlassCard className="p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
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

                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl font-semibold">
                            {name}
                        </h2>

                        <p className="text-muted mt-2">
                            {email}
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Account Information */}
            <GlassCard className="p-6">
                <h2 className="font-display text-xl font-semibold mb-6">
                    Account Information
                </h2>

                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <User className="text-accent" size={20} />

                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted">
                                Full Name
                            </p>

                            <p className="font-medium mt-1">
                                {name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Mail className="text-accent" size={20} />

                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted">
                                Email Address
                            </p>

                            <p className="font-medium mt-1">
                                {email}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <CheckCircle
                            className="text-green-500"
                            size={20}
                        />

                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted">
                                Account Status
                            </p>

                            <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium">
                                Active
                            </span>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="p-6">
                <h2 className="font-display text-xl font-semibold mb-6">
                    Quick Actions
                </h2>

                <div className="flex flex-wrap gap-4">
                    <button
                        disabled
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-line bg-surface-2 text-muted cursor-not-allowed opacity-70"
                    >
                        <Pencil size={18} />
                        Edit Profile
                        <span className="text-xs">(Coming Soon)</span>
                    </button>

                    <button
                        disabled
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-line bg-surface-2 text-muted cursor-not-allowed opacity-70"
                    >
                        <FileText size={18} />
                        Replace Resume
                        <span className="text-xs">(Coming Soon)</span>
                    </button>
                </div>
            </GlassCard>

            {/* Resume */}
            <GlassCard className="p-6">
                <h2 className="font-display text-xl font-semibold mb-6">
                    Resume
                </h2>

                {resume ? (
                    <>
                        <div className="space-y-5">

                            <div className="flex items-center gap-3">
                                <FileText className="text-accent" size={20} />

                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted">
                                        Resume File
                                    </p>

                                    <p className="font-medium">
                                        {resume.fileName}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">

                                <div className="text-center rounded-xl bg-surface-2 p-4">
                                    <Brain className="mx-auto text-accent mb-2" />
                                    <p className="text-xl font-semibold">
                                        {resume.skills?.length || 0}
                                    </p>
                                    <p className="text-xs text-muted">
                                        Skills
                                    </p>
                                </div>

                                <div className="text-center rounded-xl bg-surface-2 p-4">
                                    <FolderKanban className="mx-auto text-accent mb-2" />
                                    <p className="text-xl font-semibold">
                                        {resume.projects?.length || 0}
                                    </p>
                                    <p className="text-xs text-muted">
                                        Projects
                                    </p>
                                </div>

                                <div className="text-center rounded-xl bg-surface-2 p-4">
                                    <Briefcase className="mx-auto text-accent mb-2" />
                                    <p className="text-xl font-semibold">
                                        {resume.experience?.length || 0}
                                    </p>
                                    <p className="text-xs text-muted">
                                        Experience
                                    </p>
                                </div>

                            </div>

                            <div className="flex justify-between items-center border-t border-line pt-5">

                                <span className="inline-flex px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
                                    AI Analysis Completed
                                </span>

                                <button
                                    onClick={() => {
                                        const ok = window.confirm(
                                            "Replace your current resume?"
                                        );

                                        if (ok) {
                                            navigate("/resume-upload");
                                        }
                                    }}
                                    className="focus-ring flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dim transition-colors"
                                >
                                    <UploadCloud size={18} />
                                    Replace Resume
                                </button>

                            </div>

                        </div>
                    </>
                ) : (
                    <div className="text-center py-10">

                        <UploadCloud
                            className="mx-auto mb-4 text-muted"
                            size={42}
                        />

                        <p className="text-muted mb-5">
                            No resume uploaded yet.
                        </p>

                        <button
                            onClick={() => navigate("/resume-upload")}
                            className="focus-ring px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-dim transition-colors"
                        >
                            Upload Resume
                        </button>

                    </div>
                )}
            </GlassCard>
        </div>
    );
}