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
  { label: "Interview Intel", path: "/dashboard/hired/prep", icon: Target },
  {
    label: "Cover Letter",
    path: "/dashboard/hired/cover-letter",
    icon: Sparkles,
  },
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
    <div className="w-full flex flex-col text-foreground">
      {/* ── STICKY SUB-TABS ROW ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05] py-3 -mx-2 sm:-mx-4 px-2 sm:px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Nav items */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                      : "text-zinc-500 hover:text-muted-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Resume status pill */}
          <div className="shrink-0">
            {hasResume ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-full px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-400 truncate max-w-[120px] select-none">
                  {resumeData.personal_info.name}
                </span>
              </div>
            ) : (
              <button
                onClick={() => navigate("/dashboard/hired/resume")}
                className="flex items-center gap-1.5 bg-amber-500/[0.08] border border-amber-500/20 rounded-full px-3 py-1.5 hover:bg-amber-500/15 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">
                  Load Resume
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── RESUME REQUIRED BANNER ───────────────────────────────────────────── */}
      {showResumeBanner && (
        <div className="border-b border-amber-500/15 bg-amber-500/[0.06] -mx-2 sm:-mx-4">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300/80 font-medium flex-1 text-left">
              This feature requires a resume. Upload or build one to continue.
            </p>
            <button
              onClick={() => navigate("/dashboard/hired/resume")}
              className="text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              Go to Resume →
            </button>
          </div>
        </div>
      )}

      {/* ── PAGE CONTENT ────────────────────────────────────────────────────── */}
      <div className="w-full min-h-[500px]">{children}</div>
    </div>
  );
}
