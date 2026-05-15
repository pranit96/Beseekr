import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume, RESUME_TEMPLATES } from "@/contexts/ResumeContext";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ResumeTemplateSelect() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setResumeData, saveActiveDraft } = useResume();

  const handleSelect = async (template: (typeof RESUME_TEMPLATES)[0]) => {
    setResumeData(template.data);

    // Write the template choice instantly back to cloud draft container
    await saveActiveDraft(template.data);

    toast({
      title: `${template.name} Loaded!`,
      description:
        "Successfully initialized draft using target industry layout.",
    });

    navigate("/dashboard/resume/workspace");
  };

  return (
    <div className="w-full py-6 px-2 sm:px-4 lg:px-6 selection:bg-white/10">
      {/* HERO HEADER OUTSIDE CARD */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-500 text-left max-w-6xl mx-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/dashboard/resume")}
              className="h-8 w-8 rounded-full bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08] shrink-0 shadow-sm"
              title="Back to Portal"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase flex items-center select-none">
              RESUME INTELLIGENCE{" "}
              <span className="mx-2 opacity-50 text-[8px]">•</span> TEMPLATES
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1 text-white">
            <span>Choose Layout Structure.</span>
            <span className="text-zinc-700">
              Accelerate Initial Extraction.
            </span>
          </h1>
        </div>

        <div className="shrink-0 pb-1">
          <Badge className="bg-zinc-900 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full px-3.5 py-1 font-semibold text-[10px] select-none tracking-widest">
            ATS & RECRUITER OPTIMAL
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* 3-COLUMN TEMPLATE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESUME_TEMPLATES.map((tmpl) => {
            const IconComponent = tmpl.icon;
            const schemeColors = {
              emerald: "bg-zinc-400",
              indigo: "bg-zinc-400",
              slate: "bg-zinc-400",
            };

            const badgeColors = {
              emerald: "bg-zinc-900 border-zinc-800 text-zinc-300",
              indigo: "bg-zinc-900 border-zinc-800 text-zinc-300",
              slate: "bg-zinc-900 border-zinc-800 text-zinc-300",
            };

            return (
              <Card
                key={tmpl.id}
                onClick={() => handleSelect(tmpl)}
                className="group relative overflow-hidden border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl rounded-3xl flex flex-col cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/10 transition-all duration-300 shadow-2xl select-none flex-1"
              >
                {/* Minimal Gray Accent Top Line */}
                <div className="absolute top-0 inset-x-0 h-1 bg-zinc-800 group-hover:bg-zinc-700 transition-colors duration-300" />

                <div className="p-6 flex flex-col h-full space-y-6">
                  {/* Icon Block */}
                  <div
                    className={`h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 ${badgeColors[tmpl.colorScheme as keyof typeof badgeColors]}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>

                  {/* Details */}
                  <div className="space-y-2 flex-grow">
                    <h3 className="text-xl font-bold text-zinc-100 group-hover:text-white flex items-center gap-2 tracking-tight">
                      {tmpl.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  {/* Visual Mockup Representation */}
                  <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-4 space-y-3 group-hover:border-zinc-800 transition-all relative">
                    {/* Header Mock */}
                    <div className="h-2.5 bg-zinc-800 rounded-full w-1/3" />
                    <div className="h-px bg-zinc-900 w-full" />

                    {/* Experience Section Mock */}
                    <div className="space-y-2">
                      <div className="h-2 rounded-full w-1/4 opacity-60 bg-zinc-600" />
                      <div className="h-1.5 bg-zinc-800 rounded-full w-full" />
                      <div className="h-1.5 bg-zinc-800/60 rounded-full w-5/6" />
                    </div>

                    {/* Skills Section Mock */}
                    <div className="space-y-2 mt-1">
                      <div className="h-2 rounded-full w-1/4 opacity-60 bg-zinc-600" />
                      <div className="flex gap-1.5">
                        <div className="h-1.5 bg-zinc-800 rounded-full w-1/4" />
                        <div className="h-1.5 bg-zinc-800 rounded-full w-1/3" />
                        <div className="h-1.5 bg-zinc-800 rounded-full w-1/5" />
                      </div>
                    </div>
                  </div>

                  {/* Spec Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold bg-zinc-900/60 border-zinc-800 text-zinc-400 font-mono"
                    >
                      {tmpl.styles.fontFamily}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold bg-zinc-900/60 border-zinc-800 flex items-center gap-1.5 text-zinc-400 font-mono"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                      Layout Config
                    </Badge>
                  </div>

                  {/* Select CTA */}
                  <Button className="w-full rounded-xl h-10 font-bold bg-zinc-900 group-hover:bg-white group-hover:text-black text-zinc-300 hover:text-white border border-zinc-800 transition-all duration-300 shadow-sm text-xs tracking-tight">
                    Initialize Template
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
