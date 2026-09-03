// src/pages/dhet/components/AsciiWireframeViewer.tsx
import React, { useState } from "react";
import { Copy, Check, Terminal, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AsciiWireframeViewerProps {
  wireframe: string;
}

export const AsciiWireframeViewer: React.FC<AsciiWireframeViewerProps> = ({
  wireframe,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(wireframe);
    setCopied(true);
    toast.success("ASCII Wireframe copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B0F19] shadow-2xl overflow-hidden flex flex-col">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0F172A] border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 ml-2">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            ascii_layout_wireframe.txt
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg px-2"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5 mr-1" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 mr-1" />
            )}
            {isExpanded ? "Collapse" : "Expand"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-2.5 flex items-center gap-1.5 border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Wireframe</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Monospace ASCII viewport */}
      <div
        className={cn(
          "p-4 md:p-6 overflow-x-auto transition-all duration-300 font-mono text-xs md:text-sm text-sky-300/90 leading-tight select-text whitespace-pre",
          isExpanded ? "max-h-none" : "max-h-[500px]"
        )}
      >
        {wireframe || "No wireframe generated."}
      </div>
    </div>
  );
};
