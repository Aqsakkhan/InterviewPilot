import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, Square, Send, Volume2 } from "lucide-react";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import InterviewerOrb from "../components/InterviewerOrb";
import InterviewContextBar from "../components/InterviewContextBar";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";

const CATEGORY_STYLE = {
  dsa: "text-accent border-accent/30 bg-accent/5",
  hr: "text-secondary border-secondary/30 bg-secondary/5",
  project: "text-success border-success/30 bg-success/5",
  theory: "text-primary border-primary/30 bg-primary/5",
  general: "text-muted border-line bg-white/5",
};

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const speechRec = useSpeechRecognition();
  const speechSyn = useSpeechSynthesis();
  const hasAutoSpokenRef = useRef(null);

  useEffect(() => {
    client.get(`/interviews/${id}`).then(({ data }) => {
      setInterview(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const currentQuestion = interview?.qa?.[interview.currentIndex];

  // Speak each new question once, automatically.
  useEffect(() => {
    if (!currentQuestion) return;
    const key = `${interview._id}-${interview.currentIndex}`;
    if (hasAutoSpokenRef.current === key) return;
    hasAutoSpokenRef.current = key;
    speechSyn.speak(currentQuestion.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  useEffect(() => {
    if (speechRec.fullTranscript) setAnswerText(speechRec.fullTranscript);
  }, [speechRec.fullTranscript]);

  const toggleMic = () => {
    if (speechRec.isListening) {
      speechRec.stop();
    } else {
      speechRec.resetTranscript();
      setAnswerText("");
      speechSyn.cancel();
      speechRec.start();
    }
  };

  const submitAnswer = async () => {
    if (!answerText.trim()) return;
    speechRec.stop();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await client.post(`/interviews/${id}/answer`, { answer: answerText.trim() });
      if (data.isComplete) {
        navigate(`/report/${id}`);
        return;
      }
      setInterview(data.interview);
      setAnswerText("");
      speechRec.resetTranscript();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit that answer. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const endEarly = async () => {
    if (!window.confirm("End this interview now and get your report?")) return;
    setSubmitting(true);
    try {
      await client.post(`/interviews/${id}/complete`);
      navigate(`/report/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't end the interview.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <InterviewerOrb state="thinking" size={80} />
      </div>
    );
  }

  if (!interview) return <p className="text-muted">Interview not found.</p>;

  const orbState = submitting ? "thinking" : speechSyn.isSpeaking ? "speaking" : speechRec.isListening ? "listening" : "idle";

  return (
    <div className="max-w-2xl mx-auto">
      <InterviewContextBar
        company={interview.company}
        jobRole={interview.jobRole}
        type={interview.type}
        difficulty={interview.difficulty}
        currentCount={interview.qa.length}
        targetCount={interview.targetQuestionCount}
        onEndInterview={endEarly}
      />

      <div className="flex flex-col items-center gap-5 mb-8">
        <InterviewerOrb state={orbState} size={140} />
        {currentQuestion && (
          <span
            className={`text-xs font-mono uppercase tracking-wide border rounded-full px-2.5 py-1 ${CATEGORY_STYLE[currentQuestion.category] || CATEGORY_STYLE.general
              }`}
          >
            {currentQuestion.category}
          </span>
        )}
      </div>

      <GlassCard strong className="p-6">
        <div className="flex items-start gap-2">
          <p className="font-display text-lg leading-snug flex-1">{currentQuestion?.question}</p>
          <button
            onClick={() => speechSyn.speak(currentQuestion.question)}
            className="focus-ring p-2 rounded-lg text-muted hover:text-accent hover:bg-white/5 transition-colors shrink-0"
            title="Replay question"
          >
            <Volume2 size={18} />
          </button>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wide text-muted">Your answer</span>
            {speechRec.isSupported && (
              <button
                onClick={toggleMic}
                className={`focus-ring flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${speechRec.isListening
                    ? "border-accent text-accent bg-accent/10"
                    : "border-line text-muted hover:bg-white/5"
                  }`}
              >
                {speechRec.isListening ? <Square size={12} /> : <Mic size={12} />}
                {speechRec.isListening ? "Stop" : "Speak"}
              </button>
            )}
          </div>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={5}
            placeholder={speechRec.isSupported ? "Speak, or type your answer here..." : "Type your answer here..."}
            className="focus-ring w-full bg-white/5 border border-line rounded-xl p-3 text-ink placeholder:text-muted/60 resize-none"
          />
          {!speechRec.isSupported && (
            <p className="text-xs text-muted mt-1.5">
              Voice input isn't supported in this browser - typing works the same way.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        <button
          onClick={submitAnswer}
          disabled={submitting || !answerText.trim()}
          className="focus-ring w-full mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors disabled:opacity-50"
        >
          {submitting ? "Thinking of a follow-up..." : "Submit answer"} <Send size={15} />
        </button>
      </GlassCard>

      {interview.qa.length > 1 && (
        <div className="mt-8">
          <h3 className="text-xs font-mono uppercase tracking-wide text-muted mb-3">Earlier in this interview</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {interview.qa.slice(0, -1).map((qa, i) => (
              <GlassCard key={i} className="p-4">
                <p className="text-sm text-ink">{qa.question}</p>
                {qa.answer && <p className="text-sm text-muted mt-1.5">{qa.answer}</p>}
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}