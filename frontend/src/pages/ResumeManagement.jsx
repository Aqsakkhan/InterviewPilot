import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileText,
    Brain,
    FolderKanban,
    Briefcase,
    UploadCloud,
    CheckCircle,
} from "lucide-react";

import GlassCard from "../components/GlassCard";
import { useEffect, useState } from "react";
import client from "../api/client";

export default function ResumeManagement() {
    const navigate = useNavigate();
    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadResume() {
            try {
                const { data } = await client.get("/resume/me");
                setResume(data);
            } catch (err) {
                console.error(err);

                if (err.response?.status !== 404) {
                    alert("Failed to load resume.");
                }
            } finally {
                setLoading(false);
            }
        }

        loadResume();
    }, []);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto py-10 text-center">
                Loading Resume...
            </div>
        );
    }

    const displayResumeName =
        resume?.fileName?.length > 40
            ? resume.fileName.slice(0, 40) + "..."
            : resume?.fileName;

    return (
        <div className="max-w-6xl mx-auto py-8 space-y-6">

            {/* Back */}

            <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 text-muted hover:text-white transition-colors"
            >
                <ArrowLeft size={18} />
                Back to Profile
            </button>

            {/* Header */}

            <div>
                <h1 className="font-display text-3xl font-semibold">
                    Resume Center
                </h1>

                <p className="text-muted mt-2">
                    Manage your uploaded resume and AI analysis.
                </p>
            </div>

            {/* Resume */}

            <GlassCard className="p-8">

                {resume ? (

                    <div className="space-y-8">

                        <div>

                            <p className="text-xs uppercase tracking-wide text-muted">
                                Uploaded Resume
                            </p>

                            <div className="flex items-center gap-3 mt-3">

                                <FileText
                                    className="text-accent"
                                    size={20}
                                />

                                <span
                                    className="font-medium"
                                    title={resume.fileName}
                                >
                                    {displayResumeName}
                                </span>

                            </div>

                        </div>

                        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">

                            <p className="flex items-center gap-2 font-semibold text-green-400">

                                <CheckCircle size={18} />

                                Ready for AI Interviews

                            </p>

                            <p className="text-sm text-green-300 mt-2">
                                Your resume has been analyzed successfully.
                            </p>

                        </div>

                        <div className="grid md:grid-cols-3 gap-5">

                            <div className="rounded-xl bg-surface-2 p-6 text-center">

                                <Brain
                                    className="mx-auto text-accent mb-3"
                                    size={22}
                                />

                                <h3 className="text-3xl font-bold">
                                    {resume.skills.length}
                                </h3>

                                <p className="text-muted mt-2">
                                    Skills
                                </p>

                            </div>

                            <div className="rounded-xl bg-surface-2 p-6 text-center">

                                <FolderKanban
                                    className="mx-auto text-accent mb-3"
                                    size={22}
                                />

                                <h3 className="text-3xl font-bold">
                                    {resume.projects.length}
                                </h3>

                                <p className="text-muted mt-2">
                                    Projects
                                </p>

                            </div>

                            <div className="rounded-xl bg-surface-2 p-6 text-center">

                                <Briefcase
                                    className="mx-auto text-accent mb-3"
                                    size={22}
                                />

                                <h3 className="text-3xl font-bold">
                                    {resume.internships.length}
                                </h3>

                                <p className="text-muted mt-2">
                                    Internships
                                </p>

                            </div>

                        </div>

                        <div className="border-t border-line pt-6">

                            <h2 className="font-semibold mb-5">
                                Actions
                            </h2>

                            <button
                                onClick={() => navigate("/resume-upload")}
                                className="focus-ring flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition"
                            >

                                <UploadCloud size={18} />

                                Upload New Resume

                            </button>

                        </div>

                    </div>

                ) : (

                    <div className="text-center py-12">

                        <UploadCloud
                            className="mx-auto text-muted mb-5"
                            size={48}
                        />

                        <h2 className="text-xl font-semibold">
                            No Resume Uploaded
                        </h2>

                        <p className="text-muted mt-3 mb-6">
                            Upload your resume to unlock AI-powered interviews.
                        </p>

                        <button
                            onClick={() => navigate("/resume-upload")}
                            className="focus-ring px-6 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition"
                        >
                            Upload Resume
                        </button>

                    </div>

                )}

            </GlassCard>

        </div>
    );
}