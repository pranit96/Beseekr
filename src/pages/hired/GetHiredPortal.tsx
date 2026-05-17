import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume } from "../../contexts/ResumeContext";
import {
  FileText,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Target,
  Trophy,
  Search,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import HiredShell from "./HiredShell";

export default function GetHiredPortal() {
  const navigate = useNavigate();
  const { resumeData } = useResume();
  const hasResume = Boolean(resumeData?.personal_info?.name);

  const features = [
    {
      title: "Resume Intelligence",
      description: "Build, score, and optimize your resume for ATS success.",
      icon: <FileText className="w-6 h-6 text-sky-400" />,
      action: () => navigate("resume"),
      badges: ["ATS Scoring", "AI Rewriting"],
      color: "sky",
    },
    {
      title: "Job Tracker",
      description: "Manage your application funnel and track every stage.",
      icon: <LayoutDashboard className="w-6 h-6 text-emerald-400" />,
      action: () => navigate("tracker"),
      badges: ["Kanban Board", "Status Tracking"],
      color: "emerald",
    },
    {
      title: "Interview Intelligence",
      description:
        "Predict interview rounds, practice questions, and research company insights across Reddit and the web.",
      icon: <Target className="w-6 h-6 text-purple-400" />,
      action: () => navigate("prep"),
      badges: ["Round Analysis", "Reddit Insights", "Web Research"],
      color: "purple",
      requiresResume: true,
    },
    {
      title: "Cover Letter Engine",
      description:
        "Generate tailored cover letters matched to any job description.",
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      action: () => navigate("cover-letter"),
      badges: ["Tone Control", "One-Click Generate"],
      color: "amber",
      requiresResume: true,
    },
  ];

  return (
    <HiredShell>
      <div className="max-w-6xl mx-auto space-y-12 py-10 px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
              Get Hired · Command Center
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter leading-tight">
            Your Career, <span className="text-zinc-500">Accelerated.</span>
          </h1>
          <p className="text-zinc-400 text-base max-w-xl font-medium leading-relaxed">
            Everything you need to land your next role — from precision resumes
            to deep interview intelligence and application tracking.
          </p>
        </div>

        {/* RESUME STATUS BANNER */}
        {!hasResume ? (
          <div className="flex items-center gap-3 bg-amber-500/[0.06] border border-amber-500/20 rounded-2xl px-5 py-3.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300/80 font-medium flex-1">
              No resume loaded.{" "}
              <span className="font-bold text-amber-300">AI Prep Kit</span> and{" "}
              <span className="font-bold text-amber-300">Cover Letter</span>{" "}
              require one to function.
            </p>
            <button
              onClick={() => navigate("resume")}
              className="text-[11px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
            >
              Load Resume →
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-2xl px-5 py-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500/70 shrink-0" />
            <p className="text-xs text-emerald-400/70 font-bold">
              Resume loaded — {resumeData.personal_info.name} · All AI features
              active
            </p>
          </div>
        )}

        {/* FEATURE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-8">
          {features.map((feature, idx) => {
            const locked = feature.requiresResume && !hasResume;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                whileHover={{ y: locked ? 0 : -3 }}
                onClick={locked ? () => navigate("resume") : feature.action}
                className={`group relative border rounded-[28px] p-7 backdrop-blur-3xl cursor-pointer transition-all duration-300 ${
                  locked
                    ? "border-white/[0.05] bg-white/[0.01] opacity-60"
                    : "border-white/[0.07] hover:border-white/[0.14] bg-white/[0.02]"
                }`}
              >
                <div
                  className={`absolute -top-10 -right-10 w-40 h-40 bg-${feature.color}-500/5 rounded-full blur-[60px] group-hover:bg-${feature.color}-500/10 transition-all duration-500`}
                />
                <div className="relative space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-white/20">
                    {feature.icon}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      {feature.title}
                      {locked ? (
                        <span className="text-[10px] font-black text-amber-500/70 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
                          Needs Resume
                        </span>
                      ) : (
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-zinc-500" />
                      )}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {feature.badges.map((b) => (
                      <Badge
                        key={b}
                        className="bg-white/[0.04] text-zinc-500 border-transparent text-[10px] font-bold px-2.5 py-0.5 rounded-lg"
                      >
                        {b}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </HiredShell>
  );
}
