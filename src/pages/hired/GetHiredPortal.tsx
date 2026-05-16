import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume } from "../../contexts/ResumeContext";
import {
  FileText,
  UploadCloud,
  Plus,
  History,
  ArrowRight,
  Briefcase,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  Target,
  Trophy,
  Search,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";

export default function GetHiredPortal() {
  const navigate = useNavigate();
  const { resumeData, revisionHistory, setWorkspaceMode, resetWorkspace } =
    useResume();

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
      description:
        "Manage your application funnel and keep track of every stage.",
      icon: <LayoutDashboard className="w-6 h-6 text-emerald-400" />,
      action: () => navigate("tracker"),
      badges: ["Kanban Board", "Status Tracking"],
      color: "emerald",
    },
    {
      title: "Interview Intelligence",
      description:
        "Predict company rounds and analyze skill gaps before you interview.",
      icon: <Target className="w-6 h-6 text-purple-400" />,
      action: () => navigate("prep"),
      badges: ["Round Analysis", "Prep Kits"],
      color: "purple",
    },
    {
      title: "Cover Letter Engine",
      description:
        "Generate highly tailored cover letters for any job description.",
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      action: () => navigate("cover-letter"),
      badges: ["Tone Control", "One-Click Generate"],
      color: "amber",
    },
    {
      title: "Market Intelligence",
      description:
        "Research companies on Reddit, Hacker News, and the web for interview insights.",
      icon: <Search className="w-6 h-6 text-indigo-400" />,
      action: () => navigate("research"),
      badges: ["Reddit Search", "Interview Reviews"],
      color: "indigo",
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden">
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-16 py-12 px-4 sm:px-6 lg:px-8">
          {/* HEADER SECTION */}
          <div className="space-y-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-xs font-black tracking-[0.3em] text-zinc-500 uppercase">
                Get Hired • Command Center
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter leading-[1.1]">
              Your Career, <span className="text-zinc-600">Accelerated.</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl font-medium leading-relaxed">
              Everything you need to land your next role. From high-precision
              resumes to deep interview intelligence and application tracking.
            </p>
          </div>

          {/* RESUME STATUS BANNER — UX-03 */}
          {!hasResume ? (
            <div className="flex items-center gap-3 bg-amber-500/[0.07] border border-amber-500/20 rounded-2xl px-5 py-3.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300/80 font-medium flex-1">
                No resume loaded. Upload or build your resume first — AI Prep
                Kit and Cover Letter require it.
              </p>
              <button
                onClick={() => navigate("resume")}
                className="text-[11px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
              >
                Load Resume →
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-500/[0.05] border border-emerald-500/15 rounded-2xl px-5 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500/70 shrink-0" />
              <p className="text-xs text-emerald-400/70 font-bold">
                Resume loaded — {resumeData.personal_info.name} · All AI
                features active
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={feature.action}
                className="group relative border border-white/[0.08] hover:border-white/[0.15] rounded-[32px] p-8 bg-white/[0.02] backdrop-blur-3xl cursor-pointer transition-all duration-300"
              >
                <div
                  className={`absolute -top-12 -right-12 w-48 h-48 bg-${feature.color}-500/5 rounded-full blur-[80px] group-hover:bg-${feature.color}-500/10 transition-all duration-500`}
                />

                <div className="relative space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-white/20 shadow-xl">
                    {feature.icon}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                      {feature.title}
                      <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-zinc-500" />
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
