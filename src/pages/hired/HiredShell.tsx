import { useNavigate, useLocation } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import { AlertTriangle } from "lucide-react";

interface HiredShellProps {
  children: React.ReactNode;
}

export default function HiredShell({ children }: HiredShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { resumeData } = useResume();

  const hasResume = Boolean(resumeData?.personal_info?.name);

  const resumeRequiredPages = [
    "/dashboard/hired/prep",
    "/dashboard/hired/cover-letter",
  ];
  const showResumeBanner =
    !hasResume &&
    resumeRequiredPages.some((p) => location.pathname.startsWith(p));

  return (
    <div className="w-full flex flex-col text-foreground">
      {/* ── RESUME REQUIRED BANNER ───────────────────────────────────────────── */}
      {showResumeBanner && (
        <div className="border-b border-amber-200 dark:border-amber-500/15 bg-amber-50 dark:bg-amber-500/[0.06] -mx-2 sm:-mx-4">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300/80 font-medium flex-1 text-left">
              This feature requires a resume. Upload or build one to continue.
            </p>
            <button
              onClick={() => navigate("/dashboard/hired")}
              className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors whitespace-nowrap cursor-pointer"
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
