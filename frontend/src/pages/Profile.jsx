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
    GraduationCap,
    BookOpen,
    Target,
    CalendarDays,
    AlertTriangle,
} from "lucide-react";

const TARGET_ROLES = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "SDE",
    "Data Analyst",
    "Other",
];

function formatMemberSince(date) {
    if (!date) return null;
    return new Date(date).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function Profile() {
    const {
        profile,
        firebaseUser,
        refreshProfile,
        signOutUser,
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
    const [resumeLoading, setResumeLoading] = useState(true);

    const [showEditModal, setShowEditModal] = useState(false);
    const [form, setForm] = useState({
        name,
        college: "",
        branch: "",
        graduationYear: "",
        targetRole: "Full Stack Developer",
    });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        client
            .get("/resume/me")
            .then(({ data }) => setResume(data))
            .catch(() => setResume(null))
            .finally(() => setResumeLoading(false));
    }, []);

    const openEditModal = () => {
        setForm({
            name,
            college: profile?.college || "",
            branch: profile?.branch || "",
            graduationYear: profile?.graduationYear || "",
            targetRole: profile?.targetRole || "Full Stack Developer",
        });
        setSaveError("");
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        const trimmedName = form.name.trim();

        if (!trimmedName) {
            setSaveError("Full name is required.");
            return;
        }

        try {
            setSaving(true);
            setSaveError("");

            await client.put("/users/me", {
                name: trimmedName,
                college: form.college,
                branch: form.branch,
                graduationYear: form.graduationYear,
                targetRole: form.targetRole,
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

    const handleDeleteAccount = async () => {
        try {
            setDeleting(true);
            setDeleteError("");
            await client.delete("/users/me");
            await signOutUser();
            navigate("/", { replace: true });
        } catch (err) {
            setDeleteError(
                err.response?.data?.message ||
                "Couldn't delete your account. Try again."
            );
            setDeleting(false);
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

                        {profile?.createdAt && (
                            <p className="text-xs text-muted mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                                <CalendarDays size={12} />
                                Member since {formatMemberSince(profile.createdAt)}
                            </p>
                        )}
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

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <GraduationCap className="text-accent" size={20} />
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted">College</p>
                                <p className="font-medium mt-1">{profile?.college || "Not set"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <BookOpen className="text-accent" size={20} />
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted">Branch</p>
                                <p className="font-medium mt-1">{profile?.branch || "Not set"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <CalendarDays className="text-accent" size={20} />
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted">Graduation Year</p>
                                <p className="font-medium mt-1">{profile?.graduationYear || "Not set"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Target className="text-accent" size={20} />
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted">Target Role</p>
                                <p className="font-medium mt-1">{profile?.targetRole || "Not set"}</p>
                            </div>
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
                <h2 className="font-display text-xl font-semibold mb-1">
                    Account Actions
                </h2>
                <p className="text-sm text-muted mb-6">
                    {resumeLoading
                        ? "Checking your resume status..."
                        : resume
                            ? `Resume on file: ${resume.fileName}`
                            : "No resume uploaded yet."}
                </p>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={openEditModal}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-line bg-surface-2 hover:bg-white/5 transition-colors"
                    >
                        <Pencil size={18} />
                        Edit Profile
                    </button>

                    <button
                        onClick={() => navigate(resume ? "/resume-report" : "/resume-upload")}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-line bg-surface-2 hover:bg-white/5 transition-colors"
                    >
                        <FileText size={18} />
                        {resume ? "View Resume Report" : "Upload Resume"}
                    </button>
                </div>
            </GlassCard>

            {/* Danger Zone */}
            <GlassCard className="p-6 border border-red-500/20">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-red-400 mb-1">
                    <AlertTriangle size={20} />
                    Danger Zone
                </h2>
                <p className="text-sm text-muted mb-6">
                    Permanently delete your account, resume, and all interview history. This cannot be undone.
                </p>

                <button
                    onClick={() => {
                        setDeleteConfirmText("");
                        setDeleteError("");
                        setShowDeleteModal(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <AlertTriangle size={18} />
                    Delete Account
                </button>
            </GlassCard>

            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">

                    <GlassCard className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">

                        <h2 className="text-xl font-semibold mb-5">
                            Edit Profile
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-muted">Full Name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full mt-2 rounded-lg bg-surface-2 border border-line px-4 py-3 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-muted">College</label>
                                <input
                                    value={form.college}
                                    onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))}
                                    placeholder="e.g. XYZ Institute of Technology"
                                    className="w-full mt-2 rounded-lg bg-surface-2 border border-line px-4 py-3 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-muted">Branch</label>
                                <input
                                    value={form.branch}
                                    onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                                    placeholder="e.g. Computer Science"
                                    className="w-full mt-2 rounded-lg bg-surface-2 border border-line px-4 py-3 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-muted">Graduation Year</label>
                                <input
                                    type="number"
                                    min="2000"
                                    max="2100"
                                    value={form.graduationYear}
                                    onChange={(e) => setForm((f) => ({ ...f, graduationYear: e.target.value }))}
                                    placeholder="e.g. 2026"
                                    className="w-full mt-2 rounded-lg bg-surface-2 border border-line px-4 py-3 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-muted">Target Role</label>
                                <select
                                    value={form.targetRole}
                                    onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
                                    className="w-full mt-2 rounded-lg bg-surface-2 border border-line px-4 py-3 outline-none"
                                >
                                    {TARGET_ROLES.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {saveError && (
                            <p className="text-red-400 text-sm mt-4">
                                {saveError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 mt-6">

                            <button
                                onClick={() => setShowEditModal(false)}
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

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                    <GlassCard className="w-full max-w-md p-6 border border-red-500/30">
                        <h2 className="flex items-center gap-2 text-xl font-semibold text-red-400 mb-2">
                            <AlertTriangle size={20} />
                            Delete your account?
                        </h2>
                        <p className="text-sm text-muted mb-4">
                            This permanently deletes your profile, resume, and every interview you've taken.
                            This cannot be undone. Type <span className="text-ink font-mono">DELETE</span> to confirm.
                        </p>

                        <input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full rounded-lg bg-surface-2 border border-line px-4 py-3 outline-none font-mono"
                        />

                        {deleteError && (
                            <p className="text-red-400 text-sm mt-3">{deleteError}</p>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-lg border border-line"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting || deleteConfirmText !== "DELETE"}
                                className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40"
                            >
                                {deleting ? "Deleting..." : "Permanently delete"}
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

        </div>
    );
}
