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
    const {
        profile,
        firebaseUser,
        refreshProfile,
    } = useAuth();

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
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [displayName, setDisplayName] = useState(name);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const displayResumeName =
        resume?.fileName?.length > 30
            ? resume.fileName.slice(0, 30) + "..."
            : resume?.fileName;

    useEffect(() => {
        client
            .get("/resume/me")
            .then(({ data }) => setResume(data))
            .catch(() => setResume(null));
    }, []);

    const handleSaveProfile = async () => {
        const trimmedName = displayName.trim();

        if (!trimmedName) {
            setSaveError("Full name is required.");
            return;
        }

        try {
            setSaving(true);
            setSaveError("");

            await client.put("/users/me", {
                name: trimmedName,
            });

            await refreshProfile();

            setShowEditModal(false);
        } catch (err) {
            setSaveError(
                err.response?.data?.message ||
                "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    };

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
                    Account Actions
                </h2>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => {
                            setDisplayName(name);
                            setSaveError("");
                            setShowEditModal(true);
                        }}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-line bg-surface-2 hover:bg-white/5 transition-colors"
                    >
                        <Pencil size={18} />
                        Edit Profile
                    </button>

                    <button
                        onClick={() => setShowResumeModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-line bg-surface-2 hover:bg-white/5 transition-colors"
                    >
                        <FileText size={18} />
                        Manage Resume
                    </button>

                    {showResumeModal && (
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                            <GlassCard className="w-full max-w-md p-6">

                                <h2 className="text-2xl font-semibold">
                                    Manage Resume
                                </h2>

                                <p className="text-sm text-muted mt-2">
                                    View your uploaded resume and AI analysis.
                                </p>

                                <div className="space-y-5">

                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted">
                                            Uploaded Resume
                                        </p>

                                        <p
                                            className="font-medium mt-2"
                                            title={resume?.fileName}
                                        >
                                            {displayResumeName || "No Resume Uploaded"}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">

                                        <div className="rounded-xl bg-surface-2 p-4 text-center">
                                            <p className="text-2xl font-bold">
                                                {resume?.skills?.length || 0}
                                            </p>

                                            <p className="text-xs text-muted">
                                                Skills
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-surface-2 p-4 text-center">
                                            <p className="text-2xl font-bold">
                                                {resume?.projects?.length || 0}
                                            </p>

                                            <p className="text-xs text-muted">
                                                Projects
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-surface-2 p-4 text-center">
                                            <p className="text-2xl font-bold">
                                                {resume?.internships?.length || 0}
                                            </p>

                                            <p className="text-xs text-muted">
                                                Internships
                                            </p>
                                        </div>

                                    </div>

                                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                                        <p className="font-semibold text-green-400">
                                            ✓ AI Analysis Completed
                                        </p>

                                        <p className="text-sm text-green-300 mt-1">
                                            Your resume is ready for interviews.
                                        </p>
                                    </div>

                                </div>

                                <div className="flex justify-end gap-3 mt-8">

                                    <button
                                        onClick={() => setShowResumeModal(false)}
                                        className="px-4 py-2 rounded-lg border border-line"
                                    >
                                        Close
                                    </button>

                                    <button
                                        onClick={() => {
                                            const ok = window.confirm(
                                                "Uploading a new resume will replace your existing resume. Continue?"
                                            );

                                            if (ok) {
                                                navigate("/resume-upload");
                                            }
                                        }}
                                        className="px-5 py-2 rounded-lg bg-primary text-white flex items-center gap-2"
                                    >
                                        <UploadCloud size={18} />
                                        Upload New Resume
                                    </button>

                                </div>

                            </GlassCard>
                        </div>
                    )}
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
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

                    <GlassCard className="w-full max-w-md p-6">

                        <h2 className="text-xl font-semibold mb-5">
                            Edit Profile
                        </h2>

                        <label className="text-sm text-muted">
                            Full Name
                        </label>

                        <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full mt-2 mb-6 rounded-lg bg-surface-2 border border-line px-4 py-3 outline-none"
                        />

                        {saveError && (
                            <p className="text-red-400 text-sm mb-4">
                                {saveError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3">

                            <button
                                onClick={() => {
                                    setDisplayName(name);
                                    setSaveError("");
                                    setShowEditModal(false);
                                }}
                                className="px-4 py-2 rounded-lg border border-line"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="px-5 py-2 rounded-lg bg-primary text-white disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>

                        </div>

                    </GlassCard>

                </div>
            )}
        </div>
    );
}