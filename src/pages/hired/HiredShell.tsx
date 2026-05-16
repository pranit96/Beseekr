import { useNavigate, useLocation } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import {
  Trophy,
  FileText,
  LayoutDashboard,
  Target,
  Sparkles,
  Search,
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";

interface HiredShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Overview", path: "/dashboard/hired", icon: Trophy, exact: true },
  { label: "Resume", path: "/dashboard/hired/resume", icon: FileText },
  { label: "Tracker", path: "/dashboard/hired/tracker", icon: LayoutDashboard },
  { label: "Interview Prep", path: "/dashboard/hired/prep", icon: Target },
  {
    label: "Cover Letter",
    path: "/dashboard/hired/cover-letter",
    icon: Sparkles,
  },
  { label: "Research", path: "/dashboard/hired/research", icon: Search },
];

export default function HiredShell({ children }: HiredShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { resumeData } = useResume();

  const hasResume = Boolean(resumeData?.personal_info?.name);

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const resumeRequiredPages = [
    "/dashboard/hired/prep",
    "/dashboard/hired/cover-letter",
  ];
  const showResumeBanner =
    !hasResume &&
    resumeRequiredPages.some((p) => location.pathname.startsWith(p));

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden">
      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-1">
            {/* Brand */}
            <button
              onClick={() => navigate("/dashboard/hired")}
              className="flex items-center gap-2 mr-6 shrink-0"
            >
              <div className="w-7 h-7 bg-indigo-500/15 border border-indigo-500/25 rounded-lg flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase hidden sm:block">
                Get Hired
              </span>
            </button>

            {/* Nav items */}
            <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                      active
                        ? "bg-white/[0.07] text-white"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:block">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Resume status pill */}
            <div className="shrink-0 ml-2">
              {hasResume ? (
                <div className="flex items-center gap-1.5 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-full px-3 py-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-400 hidden sm:block truncate max-w-[120px]">
                    {resumeData.personal_info.name}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/dashboard/hired/resume")}
                  className="flex items-center gap-1.5 bg-amber-500/[0.08] border border-amber-500/20 rounded-full px-3 py-1 hover:bg-amber-500/15 transition-colors"
                >
                  <UploadCloud className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 hidden sm:block">
                    Load Resume
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── RESUME REQUIRED BANNER ───────────────────────────────────────────── */}
      {showResumeBanner && (
        <div className="shrink-0 border-b border-amber-500/15 bg-amber-500/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 h-10">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300/80 font-medium flex-1">
                This feature requires a resume. Upload or build one to continue.
              </p>
              <button
                onClick={() => navigate("/dashboard/hired/resume")}
                className="text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
              >
                Go to Resume →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE CONTENT ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="shrink-0 border-t border-white/[0.04] bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            <span className="text-[10px] text-zinc-700 font-medium">
              Get Hired · Powered by Beseekr AI
            </span>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-zinc-700">
                {hasResume
                  ? `Resume: ${resumeData.personal_info.name}`
                  : "No resume loaded"}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
