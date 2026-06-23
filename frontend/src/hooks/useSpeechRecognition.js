import { useState, useRef, useCallback, useEffect } from "react";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);

  const isSupported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!isSupported) return;
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += piece + " ";
        } else {
          interimChunk += piece;
        }
      }
      if (finalChunk) {
        setTranscript((prev) => (prev + " " + finalChunk).trim());
      }
      setInterimTranscript(interimChunk);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
    };
  }, [isSupported]);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setInterimTranscript("");
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.warn("Could not start recognition:", err.message);
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isSupported: Boolean(isSupported),
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: `${transcript} ${interimTranscript}`.trim(),
    start,
    stop,
    resetTranscript,
  };
}
