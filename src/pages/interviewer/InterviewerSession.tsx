import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GlobalHeader } from "@/components/GlobalHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowLeft,
  Award,
  Play,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Keyboard,
  Radio,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import {
  interviewerApi,
  InterviewSession,
  InterviewMessage,
} from "@/api/interviewer";
import {
  InterviewerAvatar,
  InterviewerState,
} from "./components/InterviewerAvatar";
import { AudioWaveform } from "./components/AudioWaveform";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function InterviewSessionRoom() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Audio playback state
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Text & Streaming state
  const [candidateText, setCandidateText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [interviewerState, setInterviewerState] =
    useState<InterviewerState>("idle");
  const [streamingText, setStreamingText] = useState("");
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Fetch full session details
  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["interviewer-session", sessionId],
    queryFn: () => (sessionId ? interviewerApi.getSession(sessionId) : null),
    enabled: Boolean(sessionId),
  });

  // Sync initial transcript & opening message
  useEffect(() => {
    if (!session) return;

    if (session.transcript && session.transcript.length > 0) {
      setMessages(session.transcript);
    } else if (session.openingMessage) {
      setMessages([session.openingMessage]);
    }

    if (session.status === "completed" || session.feedback) {
      setIsInterviewComplete(true);
    }

    // Play opening audio if exists and not already played
    if (session.openingMessage?.audio?.base64 && autoPlayAudio && messages.length === 0) {
      playBase64Audio(session.openingMessage.audio.base64);
    }
  }, [session]);

  // Scroll to bottom without UI stutter/sluggishness
  useEffect(() => {
    if (streamingText) {
      transcriptEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingText]);

  // Audio Playback Helper
  const playBase64Audio = (base64Audio: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsAudioPlaying(true);
        setInterviewerState("speaking");
      };

      audio.onended = () => {
        setIsAudioPlaying(false);
        setInterviewerState("idle");
      };

      audio.onerror = (e) => {
        console.warn("[Interviewer] Audio playback failed:", e);
        setIsAudioPlaying(false);
        setInterviewerState("idle");
      };

      audio.play().catch((err) => {
        console.log("[Interviewer] Autoplay prevented, user interaction required:", err);
        setIsAudioPlaying(false);
        setInterviewerState("idle");
      });
    } catch (e) {
      console.warn("[Interviewer] Audio init error:", e);
      setIsAudioPlaying(false);
      setInterviewerState("idle");
    }
  };

  // Replay text via TTS
  const handleReplayTTS = async (text: string) => {
    try {
      setInterviewerState("speaking");
      const blob = await interviewerApi.getTTSAudio(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsAudioPlaying(true);
      audio.onended = () => {
        setIsAudioPlaying(false);
        setInterviewerState("idle");
      };
      audio.play();
    } catch (err: any) {
      toast.error("Failed to replay audio");
      setInterviewerState("idle");
    }
  };

  // ── Recording Handlers ──────────────────────────────────────────
  const startRecording = async () => {
    if (isRecording || interviewerState === "speaking") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      setMediaStream(stream);
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setInterviewerState("listening");
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("[Interviewer] Mic access error:", err);
      toast.error("Microphone access denied. You can still type your answer below.");
      setShowTextInput(true);
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setIsRecording(false);

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || "audio/webm",
      });

      if (audioBlob.size < 500) {
        toast.error("Audio recording was too short. Please speak again.");
        setInterviewerState("idle");
        return;
      }

      setInterviewerState("transcribing");

      try {
        if (!sessionId) return;
        const transcribeRes = await interviewerApi.transcribeAudio(
          sessionId,
          audioBlob,
          "en",
        );

        const transcribed = transcribeRes.text.trim();
        if (!transcribed) {
          toast.warning("Whisper couldn't capture speech. Try again or type.");
          setInterviewerState("idle");
          return;
        }

        // Send turn directly
        await handleSendCandidateMessage(transcribed);
      } catch (err: any) {
        toast.error(err.message || "Failed to transcribe speech");
        setInterviewerState("idle");
      }
    };

    mediaRecorderRef.current.stop();
  };

  // ── Stream Turn to Interviewer ──────────────────────────────────
  const handleSendCandidateMessage = async (text: string) => {
    if (!text.trim() || !sessionId) return;

    // 1. Append candidate message immediately
    const candidateMsg: InterviewMessage = {
      role: "candidate",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, candidateMsg]);
    setCandidateText("");
    setStreamingText("");
    setInterviewerState("thinking");

    let currentAccumulated = "";

    try {
      await interviewerApi.streamTurn(sessionId, text, {
        onDelta: (delta) => {
          setInterviewerState("speaking");
          currentAccumulated += delta;
          setStreamingText(currentAccumulated);
        },
        onEnd: (fullText) => {
          const finalContent = fullText || currentAccumulated;
          const interviewerMsg: InterviewMessage = {
            role: "interviewer",
            content: finalContent,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, interviewerMsg]);
          setStreamingText("");
        },
        onAudio: (audio) => {
          if (autoPlayAudio && audio?.base64) {
            playBase64Audio(audio.base64);
          }
        },
        onComplete: () => {
          setIsInterviewComplete(true);
          toast.success("Interview finished! Ready for evaluation.");
        },
        onError: (err) => {
          toast.error(err);
          setInterviewerState("idle");
        },
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to send message to interviewer");
      setInterviewerState("idle");
    }
  };

  // ── Finish & Generate Feedback ──────────────────────────────────
  const handleFinishAndGenerateFeedback = async () => {
    if (!sessionId) return;
    try {
      setIsFinishing(true);
      await interviewerApi.generateFeedback(sessionId);
      toast.success("Hiring report generated!");
      navigate(`/interviewer/feedback/${sessionId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate feedback");
      setIsFinishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600 dark:text-violet-400 mx-auto" />
            <p className="text-sm text-muted-foreground font-medium">
              Connecting to Secure Voice Room...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl border border-border/50 bg-card text-center space-y-4 shadow-xl">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Interview Session Not Found</h2>
            <p className="text-sm text-muted-foreground">
              This interview session may have been deleted, completed, or expired.
            </p>
            <Button onClick={() => navigate("/interviewer")} className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold">
              Back to Interviewer Lobby
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const role = session.config?.role || "Software Engineer";
  const company = session.config?.company || "Tech Interview";
  const targetQuestions = session.config?.totalQuestions || 6;
  const interviewerQuestionsAsked = messages.filter(
    (m) => m.role === "interviewer",
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-violet-500/30">
      {/* ── GLOBAL TOPBAR WITH DARK/WHITE MODE & CONTEXTUAL NAVIGATION ── */}
      <GlobalHeader />

      {/* ── SECONDARY SESSION STATUS STRIP ── */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-md px-3 sm:px-6 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Back & Role */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/interviewer")}
              className="rounded-xl h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Return to Interviewer Lobby"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm md:text-base text-foreground tracking-tight line-clamp-1">
                  {role}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline-flex"
                >
                  {company}
                </Badge>
              </div>
              <div className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <Radio className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                <span className="hidden xs:inline">Encrypted Session</span>
                <span className="hidden xs:inline">•</span>
                <span>
                  Question {Math.min(interviewerQuestionsAsked, targetQuestions)} of {targetQuestions}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Audio toggle & Finish CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground bg-muted/40 px-2 sm:px-3 py-1.5 rounded-xl border border-border/40">
              {autoPlayAudio ? (
                <Volume2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="hidden sm:inline">Voice TTS</span>
              <Switch
                checked={autoPlayAudio}
                onCheckedChange={setAutoPlayAudio}
                className="scale-75"
              />
            </div>

            <Button
              onClick={handleFinishAndGenerateFeedback}
              disabled={isFinishing}
              variant={isInterviewComplete ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-xl text-xs font-semibold transition-all h-8 sm:h-9 px-3 sm:px-4",
                isInterviewComplete
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                  : "border-border/60 hover:bg-muted text-foreground",
              )}
            >
              {isFinishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
                  {isInterviewComplete ? "Get Feedback Report" : "End & Evaluate"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* CENTER INTERVIEW STAGE */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 pb-28 sm:pb-32">
        {/* AVATAR HERO SECTION */}
        <div className="py-4 flex flex-col items-center justify-center">
          <InterviewerAvatar
            state={interviewerState}
            interviewerName="AI Interviewer"
            role={role}
            company={company}
            isAudioPlaying={isAudioPlaying}
          />
        </div>

        {/* INTERVIEW COMPLETION BANNER */}
        <AnimatePresence>
          {isInterviewComplete && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Interview Concluded</h4>
                  <p className="text-xs text-muted-foreground">
                    Great work! Generate your comprehensive evaluation report with scores across 5 dimensions.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleFinishAndGenerateFeedback}
                disabled={isFinishing}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4"
              >
                {isFinishing ? "Generating Report..." : "View Hiring Report"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TRANSCRIPT TIMELINE */}
        <div className="flex-1 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/30 pb-2">
            <span>Interview Dialogue</span>
            <span>{messages.length} exchanges</span>
          </div>

          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isInterviewer = msg.role === "interviewer";

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col gap-1.5 max-w-[88%] sm:max-w-[78%]",
                    isInterviewer ? "mr-auto items-start" : "ml-auto items-end",
                  )}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1 font-medium">
                    <span>{isInterviewer ? "Interviewer" : "You (Candidate)"}</span>
                  </div>

                  <div
                    className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative group",
                      isInterviewer
                        ? "bg-card border border-border/60 text-foreground rounded-tl-sm shadow-sm"
                        : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm font-medium shadow-md shadow-violet-500/10",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Replay TTS button for interviewer messages */}
                    {isInterviewer && (
                      <button
                        onClick={() => {
                          if (msg.audio?.base64) {
                            playBase64Audio(msg.audio.base64);
                          } else {
                            handleReplayTTS(msg.content);
                          }
                        }}
                        className="mt-2.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
                      >
                        <Play className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                        Replay Voice
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* LIVE STREAMING INTERVIEWER TEXT */}
            {streamingText && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-1.5 max-w-[88%] sm:max-w-[78%] mr-auto items-start"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-400 px-1 font-medium">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span>Interviewer speaking...</span>
                </div>

                <div className="p-4 rounded-2xl text-sm leading-relaxed bg-card border border-violet-500/40 text-foreground rounded-tl-sm shadow-md shadow-violet-500/5">
                  <p className="whitespace-pre-wrap">{streamingText}</p>
                </div>
              </motion.div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        </div>
      </main>

      {/* BOTTOM CANDIDATE CONTROL CONSOLE */}
      <footer className="sticky bottom-0 z-40 w-full border-t border-border/40 bg-background/90 backdrop-blur-xl px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-3">
          {/* Active Audio Waveform when recording */}
          {isRecording && (
            <div className="w-full">
              <AudioWaveform
                isRecording={isRecording}
                stream={mediaStream}
                duration={recordingDuration}
              />
            </div>
          )}

          {/* Fallback Text Input */}
          {showTextInput ? (
            <div className="w-full flex items-end gap-2">
              <Textarea
                value={candidateText}
                onChange={(e) => setCandidateText(e.target.value)}
                placeholder="Type your response to the interviewer..."
                rows={2}
                disabled={interviewerState === "thinking" || interviewerState === "speaking"}
                className="bg-card border-border/60 text-foreground text-sm resize-none custom-scrollbar rounded-xl focus-visible:ring-violet-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendCandidateMessage(candidateText);
                  }
                }}
              />
              <Button
                onClick={() => handleSendCandidateMessage(candidateText)}
                disabled={!candidateText.trim() || interviewerState === "thinking"}
                size="icon"
                className="h-10 w-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shrink-0 shadow-md shadow-violet-500/20"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : null}

          {/* Voice Mic Record Button Console */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 w-full">
            <button
              type="button"
              onClick={() => setShowTextInput((prev) => !prev)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors font-medium px-2.5 py-1.5 rounded-lg hover:bg-muted"
            >
              <Keyboard className="w-4 h-4" />
              <span className="hidden xs:inline">{showTextInput ? "Hide Text" : "Type Answer"}</span>
            </button>

            {/* Glowing Primary Record Button */}
            <div className="relative flex items-center justify-center">
              {isRecording && (
                <motion.div
                  animate={{ scale: [1, 1.35, 1.1, 1.4, 1], opacity: [0.6, 0.2, 0.5, 0.1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -inset-2.5 rounded-full bg-rose-500/40 pointer-events-none"
                />
              )}

              <Button
                type="button"
                onClick={() => {
                  if (isRecording) {
                    stopRecordingAndTranscribe();
                  } else {
                    startRecording();
                  }
                }}
                disabled={
                  interviewerState === "thinking" ||
                  interviewerState === "transcribing" ||
                  isInterviewComplete
                }
                className={cn(
                  "relative h-14 w-14 sm:h-18 sm:w-18 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-300",
                  isRecording
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/40 scale-105"
                    : "bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 hover:scale-105 text-white shadow-violet-500/30",
                )}
              >
                {interviewerState === "transcribing" ? (
                  <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
                ) : (
                  <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground font-medium hidden sm:block w-28 text-left">
              {isRecording ? "Click to finish" : "Click to speak"}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
