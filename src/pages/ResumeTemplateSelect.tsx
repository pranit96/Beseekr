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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#030712] text-slate-100 pb-12 px-4 sm:px-6 lg:px-8 pt-6"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* TOP CONTROL BAR */}
        <div className="flex items-center gap-4 border-b border-slate-800/40 pb-6">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 h-10 w-10"
            onClick={() => navigate("/dashboard/resume")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
                Select Workspace Layout
              </h2>
              <Badge className="bg-indigo-500/10 hover:bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full font-semibold text-[10px]">
                ATS Optimal
              </Badge>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Select an industry-standard structural layout to initialize your
              draft container.
            </p>
          </div>
        </div>

        {/* 3-COLUMN TEMPLATE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESUME_TEMPLATES.map((tmpl) => {
            const IconComponent = tmpl.icon;
            const schemeColors = {
              emerald: "bg-emerald-500",
              indigo: "bg-blue-500",
              slate: "bg-zinc-500",
            };

            const badgeColors = {
              emerald:
                "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
              indigo: "bg-blue-500/10 border-blue-500/20 text-blue-400",
              slate: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
            };

            return (
              <Card
                key={tmpl.id}
                onClick={() => handleSelect(tmpl)}
                className="group relative overflow-hidden border border-slate-800 bg-slate-900/10 backdrop-blur-xl rounded-3xl flex flex-col cursor-pointer hover:border-slate-700 hover:bg-slate-900/30 transition-all duration-300 shadow-2xl select-none flex-1"
              >
                {/* Accent Color Top Line */}
                <div
                  className={`absolute top-0 inset-x-0 h-1 transition-all duration-300 ${schemeColors[tmpl.colorScheme as keyof typeof schemeColors] || "bg-slate-500"}`}
                />

                <div className="p-6 flex flex-col h-full space-y-6">
                  {/* Icon Block */}
                  <div
                    className={`h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 ${badgeColors[tmpl.colorScheme as keyof typeof badgeColors]}`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>

                  {/* Details */}
                  <div className="space-y-2 flex-grow">
                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-white flex items-center gap-2">
                      {tmpl.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  {/* Visual Mockup Representation */}
                  <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-4 space-y-3 group-hover:border-slate-800 transition-all relative">
                    {/* Header Mock */}
                    <div className="h-2.5 bg-slate-800 rounded-full w-1/3" />
                    <div className="h-px bg-slate-900 w-full" />

                    {/* Experience Section Mock */}
                    <div className="space-y-2">
                      <div
                        className={`h-2 rounded-full w-1/4 opacity-60 ${schemeColors[tmpl.colorScheme as keyof typeof schemeColors]}`}
                      />
                      <div className="h-1.5 bg-slate-800 rounded-full w-full" />
                      <div className="h-1.5 bg-slate-800/60 rounded-full w-5/6" />
                    </div>

                    {/* Skills Section Mock */}
                    <div className="space-y-2 mt-1">
                      <div
                        className={`h-2 rounded-full w-1/4 opacity-60 ${schemeColors[tmpl.colorScheme as keyof typeof schemeColors]}`}
                      />
                      <div className="flex gap-1.5">
                        <div className="h-1.5 bg-slate-800 rounded-full w-1/4" />
                        <div className="h-1.5 bg-slate-800 rounded-full w-1/3" />
                        <div className="h-1.5 bg-slate-800 rounded-full w-1/5" />
                      </div>
                    </div>
                  </div>

                  {/* Spec Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold bg-slate-900/40 border-slate-800 text-slate-400"
                    >
                      {tmpl.styles.fontFamily} Typeface
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold bg-slate-900/40 border-slate-800 flex items-center gap-1.5 text-slate-400"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${tmpl.colorScheme === "slate" ? "bg-slate-400" : "bg-indigo-400"}`}
                      />
                      Industry Theme
                    </Badge>
                  </div>

                  {/* Select CTA */}
                  <Button className="w-full rounded-xl h-10 font-bold bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-300 hover:text-white border border-slate-700/50 group-hover:border-transparent transition-all duration-300 shadow-sm text-xs">
                    Initialize Template
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
