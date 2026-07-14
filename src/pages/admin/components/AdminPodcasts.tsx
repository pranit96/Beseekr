import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  Sparkles,
  Calendar,
  Heart,
  RefreshCw,
  Loader2,
  ExternalLink,
  Clock,
  Radio,
  Play,
  Pause,
  FileText,
  Volume2,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface PodcastConfig {
  id: string;
  day_index: number;
  day_name: string;
  topic: string;
  keyword: string;
  mood: string;
}

interface PodcastEpisode {
  id: string;
  slug: string;
  title: string;
  description: string;
  topic: string;
  mood: string;
  duration_seconds: number;
  publish_date: string;
  audio_url: string;
  script_json: Array<{ speaker: string; text: string; voice: string }>;
  likes_count: number;
  created_at: string;
}

// Estimated max generation time in seconds (12 turns × ~10s each)
const ESTIMATED_TOTAL_SECONDS = 120;

const DAYS_OF_WEEK = [
  { index: 0, name: "Sunday" },
  { index: 1, name: "Monday" },
  { index: 2, name: "Tuesday" },
  { index: 3, name: "Wednesday" },
  { index: 4, name: "Thursday" },
  { index: 5, name: "Friday" },
  { index: 6, name: "Saturday" },
];

const STAGE_LABELS: Record<number, string> = {
  0: "Initializing dialogue script engine...",
  8: "Stage 1/4: Structuring roundtable roles & drafting script...",
  20: "Stage 2/4: Sequentially synthesizing audio (Alex, Sam, Taylor, Morgan)...",
  60: "Stage 3/4: Merging dialogue tracks & stitching MP3 frames...",
  90: "Stage 4/4: Uploading audio to Supabase CDN...",
};

function getStageLabel(elapsed: number): string {
  const thresholds = Object.keys(STAGE_LABELS)
    .map(Number)
    .sort((a, b) => b - a); // descending
  for (const t of thresholds) {
    if (elapsed >= t) return STAGE_LABELS[t];
  }
  return STAGE_LABELS[0];
}

/**
 * Safely stop and release an Audio element to avoid network connection leaks.
 */
function releaseAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.pause();
  audio.src = "";
  audio.load();
}

export function AdminPodcasts() {
  const queryClient = useQueryClient();
  const [selectedDayIndex, setSelectedDayIndex] = useState<string>("0");
  const [customTopic, setCustomTopic] = useState("");
  const [customKeyword, setCustomKeyword] = useState("");
  const [customMood, setCustomMood] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  // Generation job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [jobError, setJobError] = useState<string>("");
  const elapsedRef = useRef(0);
  const [displayedElapsed, setDisplayedElapsed] = useState(0);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio player state
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const [viewingTranscript, setViewingTranscript] = useState<PodcastEpisode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseAudio(activeAudioRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Fetch configs
  const { data: configs = [], isLoading: loadingConfigs } = useQuery<PodcastConfig[]>({
    queryKey: ["admin", "podcastConfigs"],
    queryFn: async () => {
      const response = await apiClient.getPodcastConfigs();
      return response.data || [];
    },
  });

  // Fetch episodes
  const { data: episodes = [], isLoading: loadingEpisodes, refetch: refetchEpisodes } = useQuery<PodcastEpisode[]>({
    queryKey: ["admin", "podcastsList"],
    queryFn: async () => {
      const response = await apiClient.getPodcasts(1, 50);
      return response.data || [];
    },
  });

  const handleDaySelect = (indexStr: string) => {
    setSelectedDayIndex(indexStr);
    const index = parseInt(indexStr);
    const matched = configs.find((c) => c.day_index === index);
    if (matched) {
      setCustomTopic(matched.topic || "");
      setCustomKeyword(matched.keyword || "");
      setCustomMood(matched.mood || "");
    }
  };

  const handlePlayAudio = (url: string) => {
    if (activeAudioUrl === url) {
      // Toggle current audio
      if (audioPlaying) {
        activeAudioRef.current?.pause();
        setAudioPlaying(false);
      } else {
        activeAudioRef.current?.play();
        setAudioPlaying(true);
      }
    } else {
      // Switch to new audio — properly release previous
      releaseAudio(activeAudioRef.current);
      activeAudioRef.current = null;

      const audio = new Audio(url);
      audio.play().catch(() => {});
      activeAudioRef.current = audio;
      setActiveAudioUrl(url);
      setAudioPlaying(true);

      audio.onended = () => {
        setAudioPlaying(false);
        setActiveAudioUrl(null);
        releaseAudio(activeAudioRef.current);
        activeAudioRef.current = null;
      };
    }
  };

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((id: string) => {
    // Reset elapsed using ref (avoids stale closure)
    elapsedRef.current = 0;
    setDisplayedElapsed(0);

    // Tick elapsed timer every second using ref
    elapsedIntervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setDisplayedElapsed(elapsedRef.current);
    }, 1000);

    // Poll job status every 3 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await apiClient.getPodcastJobStatus(id) as any;
        if (!res.success) return;

        if (res.status === "completed") {
          stopPolling();
          setJobStatus("completed");
          queryClient.invalidateQueries({ queryKey: ["admin", "podcastsList"] });
          toast({
            title: "🎙️ Roundtable Published!",
            description: `"${res.data?.title}" is now live.`,
          });
          setCustomTitle("");
          setCustomDescription("");
          setSourceUrl("");
        } else if (res.status === "failed") {
          stopPolling();
          setJobStatus("failed");
          setJobError(res.error || "Unknown error during synthesis.");
          toast({
            variant: "destructive",
            title: "Generation Failed",
            description: res.error || "Unknown error during synthesis.",
          });
        }
      } catch {
        // Network blip — keep polling
      }
    }, 3000);
  }, [queryClient, stopPolling]);

  const handleGenerate = async () => {
    if (!customTopic.trim()) return;

    setJobStatus("running");
    setJobId(null);
    setJobError("");
    stopPolling();

    try {
      const res = await apiClient.triggerPodcastGeneration({
        dayIndex: selectedDayIndex ? parseInt(selectedDayIndex) : undefined,
        topic: customTopic.trim() || undefined,
        keyword: customKeyword.trim() || undefined,
        mood: customMood.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        title: customTitle.trim() || undefined,
        description: customDescription.trim() || undefined,
      }) as any;


      if (res.success && res.jobId) {
        setJobId(res.jobId);
        startPolling(res.jobId);
      } else {
        throw new Error(res.error || "Failed to start generation");
      }
    } catch (err: any) {
      setJobStatus("failed");
      setJobError(err.message || "Failed to contact the backend.");
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: err.message,
      });
    }
  };
  
  const handleCancel = async () => {
    stopPolling();
    const activeJobId = jobId;
    setJobStatus("idle");
    setJobId(null);
    setDisplayedElapsed(0);
    elapsedRef.current = 0;

    toast({
      title: "Monitoring Cancelled",
      description: "Podcast generation polling stopped.",
    });

    if (activeJobId) {
      try {
        await apiClient.cancelPodcastJob(activeJobId);
      } catch {
        // fail-soft
      }
    }
  };

  const isGenerating = jobStatus === "running";
  const stageLabel = getStageLabel(displayedElapsed);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-400" />
            Podcast Roundtable Builder
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Orchestrate weekly automated dialogues or generate custom 3-4 agent debate briefs in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchEpisodes()}
            disabled={loadingEpisodes}
            className="border-white/[0.08] hover:bg-white/[0.04] text-zinc-300 rounded-lg text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingEpisodes ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: MANUAL TRIGGER CONTROL PANEL */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0c0c0e] border border-white/[0.04] rounded-xl p-5 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Generate Roundtable Episode
              </h3>
              <p className="text-zinc-500 text-[11px] mt-0.5">
                Provide theme details or a URL source. Sequential TTS will construct a unified dialogue MP3.
              </p>
            </div>

            {/* Dropdown schedule seeds */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 block">
                Load Schedule Configuration Preset
              </label>
              <select
                value={selectedDayIndex}
                onChange={(e) => handleDaySelect(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-[#18181b] border border-white/[0.08] text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-red-500/50 outline-none"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.index} value={d.index}>
                    {d.name} Config {configs.find((c) => c.day_index === d.index) ? "✓" : "(Default fallback)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-white/[0.04] my-2" />

            {/* Title override */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 block">
                Episode Title (Optional override)
              </label>
              <Input
                type="text"
                placeholder="e.g. Deep Dive into Slow Travel"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                disabled={isGenerating}
                className="bg-[#18181b] border-white/[0.08] text-xs h-9 text-white focus-visible:ring-red-500/50"
              />
            </div>

            {/* Grounding Source URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 block flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-zinc-500" />
                Grounding Source URL (Optional)
              </label>
              <Input
                type="url"
                placeholder="e.g. https://news.ycombinator.com/item?id=..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                disabled={isGenerating}
                className="bg-[#18181b] border-white/[0.08] text-xs h-9 text-white focus-visible:ring-red-500/50"
              />
              <p className="text-[9px] text-zinc-600">
                Agents will debate the article content directly to prevent hallucinations.
              </p>
            </div>

            {/* Topic override */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 block">
                Core Topic Theme
              </label>
              <Input
                type="text"
                placeholder="e.g. Outdoor adventure & minimalism"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                disabled={isGenerating}
                className="bg-[#18181b] border-white/[0.08] text-xs h-9 text-white focus-visible:ring-red-500/50"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 block">
                Target Keywords
              </label>
              <Input
                type="text"
                placeholder="comma-separated tags"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                disabled={isGenerating}
                className="bg-[#18181b] border-white/[0.08] text-xs h-9 text-white focus-visible:ring-red-500/50"
              />
            </div>

            {/* Vibe/Mood */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 block">
                Conversational Mood
              </label>
              <Input
                type="text"
                placeholder="e.g. reflective, argumentative, humorous"
                value={customMood}
                onChange={(e) => setCustomMood(e.target.value)}
                disabled={isGenerating}
                className="bg-[#18181b] border-white/[0.08] text-xs h-9 text-white focus-visible:ring-red-500/50"
              />
            </div>

            {/* Action button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !customTopic.trim()}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-10 rounded-lg text-xs tracking-wide cursor-pointer transition-colors shadow-lg shadow-red-500/10 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Roundtable...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Synthesize & Publish
                </>
              )}
            </Button>

            {/* Live job progress during execution */}
            {isGenerating && (
              <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-3.5 space-y-2 mt-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-zinc-400">Current Phase:</span>
                  <span className="text-red-400 font-mono animate-pulse">
                    {displayedElapsed}s / ~{ESTIMATED_TOTAL_SECONDS}s
                  </span>
                </div>
                <p className="text-[10px] text-zinc-300 font-mono tracking-tight leading-relaxed">
                  {stageLabel}
                </p>
                <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(97, (displayedElapsed / ESTIMATED_TOTAL_SECONDS) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 pt-1">
                  {jobId ? (
                    <p className="text-[9px] text-zinc-600 font-mono truncate flex-1">
                      Job: {jobId}
                    </p>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer transition-colors shrink-0"
                  >
                    Cancel Generation
                  </button>
                </div>
              </div>
            )}

            {/* Completed status */}
            {jobStatus === "completed" && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Episode published successfully!
              </div>
            )}

            {/* Failed status */}
            {jobStatus === "failed" && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{jobError || "Synthesis failed. Check backend logs."}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PUBLISHED PODCASTS FEED LIST */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
              Published Episodes ({episodes.length})
            </span>
          </div>

          {loadingEpisodes ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              <span className="text-xs">Loading podcast feed...</span>
            </div>
          ) : episodes.length === 0 ? (
            <div className="bg-[#0c0c0e] border border-dashed border-white/[0.06] rounded-xl py-12 flex flex-col items-center justify-center text-zinc-500 text-center px-6">
              <Radio className="w-8 h-8 text-zinc-700 mb-3" />
              <span className="text-xs font-bold text-zinc-400">No episodes published yet</span>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-[280px]">
                Pre-configure themes or type in a topic outline on the left to trigger your first agent roundtable.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              {episodes.map((ep) => {
                const isCurrentPlaying = activeAudioUrl === ep.audio_url && audioPlaying;
                return (
                  <div
                    key={ep.id}
                    className="bg-[#0c0c0e] border border-white/[0.04] hover:border-white/[0.08] rounded-xl p-4 transition-all duration-200 relative group flex gap-4"
                  >
                    {/* Audio Play Trigger Circle */}
                    <button
                      onClick={() => handlePlayAudio(ep.audio_url)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                        isCurrentPlaying
                          ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/25"
                          : "bg-[#18181b] border-white/[0.08] hover:border-white/[0.2] text-white"
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white translate-x-0.5" />
                      )}
                    </button>

                    {/* Metadata & Actions */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-xs font-bold text-white leading-snug truncate">
                          {ep.title}
                        </h4>
                        <Badge variant="secondary" className="bg-[#18181b] border-white/[0.04] text-zinc-400 text-[9px] hover:bg-[#18181b] shrink-0 font-normal">
                          {ep.topic}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                        {ep.description}
                      </p>

                      {/* Info bar */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-500 pt-1 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {ep.publish_date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(ep.duration_seconds)}
                        </span>
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <Heart className="w-3.5 h-3.5 text-red-500/70" />
                          {ep.likes_count} likes
                        </span>
                      </div>
                    </div>

                    {/* Quick options */}
                    <div className="flex flex-col justify-between shrink-0 pl-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingTranscript(ep)}
                        className="h-7 px-2 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.04] text-[10px] gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Script
                      </Button>
                      <a
                        href={ep.audio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-md text-zinc-600 hover:text-zinc-400 self-end transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TRANSCRIPT VIEWING MODAL */}
      {viewingTranscript && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-white/[0.08] w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal header */}
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  Dialogue Script — {viewingTranscript.title}
                </h3>
                <span className="text-[10px] text-zinc-500">
                  Synthesized alternating voices: Alex (Host), Sam (Tech), Taylor (Pragmatic), Morgan (Philosophy)
                </span>
              </div>
              <button
                onClick={() => setViewingTranscript(null)}
                className="text-zinc-500 hover:text-white transition-colors text-xs font-bold px-2 py-1 rounded hover:bg-white/[0.04]"
              >
                Close
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[55vh] bg-[#0c0c0e]/50 font-mono text-[11px] leading-relaxed">
              {viewingTranscript.script_json?.map((turn, i) => {
                let speakerColor = "text-purple-400";
                if (turn.speaker === "Sam") speakerColor = "text-blue-400";
                if (turn.speaker === "Taylor") speakerColor = "text-emerald-400";
                if (turn.speaker === "Morgan") speakerColor = "text-amber-400";

                return (
                  <div key={i} className="border-l-2 border-white/[0.04] pl-3.5 py-1">
                    <span className={`font-bold ${speakerColor} uppercase text-[10px]`}>
                      {turn.speaker} ({turn.voice || "Kokoro"}):
                    </span>
                    <p className="text-zinc-300 mt-1">{turn.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/[0.06] bg-[#09090b] flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handlePlayAudio(viewingTranscript.audio_url);
                  setViewingTranscript(null);
                }}
                className="border-white/[0.08] hover:bg-white/[0.04] text-xs font-bold gap-2 text-white rounded-lg"
              >
                <Volume2 className="w-4 h-4 text-red-400" />
                Listen Episode
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
