import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResume, EMPTY_RESUME, RESUME_TEMPLATES } from "../../contexts/ResumeContext";
import { resumeApi, type ATSAnalysis, type InterviewPrepKit, type ResearchSummary, type JobApplication } from "../../api/resume";
import { useToast } from "../../hooks/use-toast";
import {
  FileText,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Target,
  Trophy,
  Upload,
  Globe,
  DollarSign,
  Copy,
  Download,
  Check,
  Briefcase,
  ShieldAlert,
  Loader2,
  FileCheck,
  PlusCircle,
  ChevronRight,
  Flame,
  CheckSquare,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import HiredShell from "./HiredShell";

export default function GetHiredPortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeData, setResumeData, saveActiveDraft, setWorkspaceMode } = useResume();
  const hasResume = Boolean(resumeData?.personal_info?.name);

  // Simple onboarding modes
  const [onboardingMode, setOnboardingMode] = useState<"upload" | "template" | "continue">("continue");

  // Sync mode with active profile status
  useEffect(() => {
    if (hasResume) {
      setOnboardingMode("continue");
    } else {
      setOnboardingMode("upload");
    }
  }, [hasResume]);

  // Target Job Form States
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  // Automation Options
  const [autoTrack, setAutoTrack] = useState(true);
  const [autoResearch, setAutoResearch] = useState(true);

  // Live action statuses
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ats" | "cover" | "prep" | "research">("ats");
  const [analysisStep, setAnalysisStep] = useState(0);

  // Analysis result storage
  const [atsResult, setAtsResult] = useState<ATSAnalysis | null>(null);
  const [coverLetterResult, setCoverLetterResult] = useState<string | null>(null);
  const [interviewPrepResult, setInterviewPrepResult] = useState<InterviewPrepKit | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchSummary | null>(null);
  const [trackedApp, setTrackedApp] = useState<JobApplication | null>(null);

  const [copiedLetter, setCopiedLetter] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Onboarding actions
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const parsed = await resumeApi.uploadAndParseResume(file);
      if (parsed?.personal_info?.name) {
        setResumeData(parsed);
        setWorkspaceMode("upload", true);
        await saveActiveDraft(parsed, undefined, "upload");
        setOnboardingMode("continue");
        toast({
          title: "Resume uploaded",
          description: `Successfully loaded resume for ${parsed.personal_info.name}.`,
        });
      } else {
        throw new Error("Could not read details from file.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message || "Please upload a valid PDF or DOCX file.",
      });
    } finally {
      setIsParsing(false);
      e.target.value = ""; // Reset the input value so the same file can be re-selected
    }
  };

  const handleSelectTemplate = async (template: any) => {
    try {
      setResumeData(template.data);
      setWorkspaceMode("template", true);
      await saveActiveDraft(template.data, undefined, "template");
      setOnboardingMode("continue");
      toast({
        title: "Sample profile loaded",
        description: `Loaded ${template.data.personal_info.name}'s profile.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Preset failed",
        description: "Could not load sample profile.",
      });
    }
  };

  const handleWipeResume = async () => {
    setResumeData(EMPTY_RESUME);
    await saveActiveDraft(EMPTY_RESUME, "");
    setAtsResult(null);
    setCoverLetterResult(null);
    setInterviewPrepResult(null);
    setResearchResult(null);
    setTrackedApp(null);
    setOnboardingMode("upload");
    toast({
      title: "Workspace cleared",
      description: "Active resume details have been reset.",
    });
  };

  // CoPilot execution action
  const handleLaunchCopilot = async () => {
    if (!hasResume) {
      toast({
        variant: "destructive",
        title: "Profile required",
        description: "Please choose a resume option first.",
      });
      return;
    }
    if (!companyName.trim() || !jobTitle.trim() || !jobDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Fields required",
        description: "Please fill out Company, Job Title, and Job Description.",
      });
      return;
    }

    setIsAnalyzing(true);
    setAtsResult(null);
    setCoverLetterResult(null);
    setInterviewPrepResult(null);
    setResearchResult(null);
    setTrackedApp(null);
    setAnalysisStep(1);

    const timer1 = setTimeout(() => setAnalysisStep(2), 1000);
    const timer2 = setTimeout(() => setAnalysisStep(3), 2000);
    const timer3 = setTimeout(() => setAnalysisStep(4), 3000);

    try {
      const [atsRes, coverRes, prepRes] = await Promise.allSettled([
        resumeApi.scoreResume(resumeData, jobDescription),
        resumeApi.generateCoverLetter({
          resume: resumeData,
          job_description: jobDescription,
          company_name: companyName,
          job_title: jobTitle,
          tone: "professional",
        }),
        resumeApi.generateInterviewPrep({
          resume: resumeData,
          job_description: jobDescription,
          company_name: companyName,
          job_title: jobTitle,
        }),
      ]);

      if (atsRes.status === "fulfilled") setAtsResult(atsRes.value);
      if (coverRes.status === "fulfilled") setCoverLetterResult(coverRes.value);
      
      let tempAppId = `temp-${Date.now()}`;
      if (prepRes.status === "fulfilled" && prepRes.value) {
        setInterviewPrepResult(prepRes.value);
        try {
          sessionStorage.setItem(`prepKit:${tempAppId}`, JSON.stringify(prepRes.value));
        } catch (_) {}
      }

      // Connection 1: Sync to Job Tracker
      if (autoTrack) {
        try {
          const appObj = await resumeApi.createApplication({
            company_name: companyName,
            job_title: jobTitle,
            status: "Bookmarked",
            jd_text: jobDescription,
            job_url: jobUrl || undefined,
          });
          setTrackedApp(appObj);
          
          if (prepRes.status === "fulfilled" && prepRes.value) {
            try {
              sessionStorage.setItem(`prepKit:${appObj.id}`, JSON.stringify(prepRes.value));
            } catch (_) {}
          }
        } catch (trackerErr) {
          console.error("Auto tracker sync failed:", trackerErr);
        }
      }

      // Connection 2: reddit Crawl
      if (autoResearch) {
        try {
          const crawlRes = await resumeApi.performCareerResearch(companyName);
          if (crawlRes?.data) {
            const summarized = await resumeApi.summarizeResearch({
              reddit: crawlRes.data.reddit,
              web: crawlRes.data.web,
            });
            setResearchResult(summarized);
          }
        } catch (researchErr) {
          console.error("Salary crawl failed:", researchErr);
        }
      }

      toast({
        title: "Analysis complete",
        description: "ATS score, cover letter, and interview timeline ready.",
      });

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleCopyLetter = () => {
    if (!coverLetterResult) return;
    navigator.clipboard.writeText(coverLetterResult);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
    toast({ title: "Copied", description: "Cover letter copied to clipboard." });
  };

  const handleDownloadLetter = () => {
    if (!coverLetterResult) return;
    const blob = new Blob([coverLetterResult], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${companyName || "tailored"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPitch = () => {
    if (!interviewPrepResult?.elevator_pitch) return;
    navigator.clipboard.writeText(interviewPrepResult.elevator_pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
    toast({ title: "Copied", description: "Pitch copied to clipboard." });
  };

  return (
    <HiredShell>
      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4 text-left font-sans select-none antialiased text-zinc-900 dark:text-zinc-100">
        
        {/* HEADER */}
        <div className="space-y-1 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-2xl font-bold tracking-tight">Job Application Assistant</h1>
          <p className="text-xs text-zinc-500 font-medium">
            Enter a role to score your resume, write a tailored cover letter, and predict interview rounds instantly.
          </p>
        </div>

        {/* STEP 1: CHOOSE RESUME */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">1. Choose Resume Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Action: Upload File */}
            <div
              onClick={() => setOnboardingMode("upload")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-32 ${
                onboardingMode === "upload"
                  ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-500"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="space-y-1">
                <h3 className="font-bold text-sm">Upload Resume File</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Upload your own PDF or Word resume.
                </p>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select file</span>
            </div>

            {/* Action: Preset Template */}
            <div
              onClick={() => setOnboardingMode("template")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-32 ${
                onboardingMode === "template"
                  ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-500"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="space-y-1">
                <h3 className="font-bold text-sm">Use Sample Profile</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Test-drive instantly with sample candidates.
                </p>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select sample</span>
            </div>

            {/* Action: Continue Session */}
            <div
              onClick={() => {
                if (hasResume) {
                  setOnboardingMode("continue");
                } else {
                  toast({
                    title: "No resume loaded",
                    description: "Please upload a resume or choose a sample profile first.",
                  });
                }
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-32 ${
                !hasResume ? "opacity-40 cursor-not-allowed" : ""
              } ${
                onboardingMode === "continue" && hasResume
                  ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-500"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="space-y-1">
                <h3 className="font-bold text-sm">Continue Current Session</h3>
                <p className="text-xs text-zinc-500 leading-relaxed truncate">
                  {hasResume ? `Resume loaded: ${resumeData.personal_info.name}` : "No active resume loaded."}
                </p>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                {hasResume ? "Resume ready" : "Inactive"}
              </span>
            </div>
          </div>

          {/* ONBOARDING METHOD ACTIVE PANEL */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 transition-all">
            {onboardingMode === "upload" && (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">Select PDF or Word File</h4>
                  <p className="text-xs text-zinc-500">
                    Your details will be parsed to tailor job material.
                  </p>
                </div>
                <label className="cursor-pointer bg-zinc-900 text-white dark:bg-white dark:text-black font-bold px-5 py-2 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-2">
                  {isParsing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" /> Select File
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    disabled={isParsing}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {onboardingMode === "template" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 text-center font-medium">
                  Click a profile to load sandbox details:
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {RESUME_TEMPLATES.filter(t => t.id !== "blank_master").map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="text-xs font-bold px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-650 rounded-lg text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                    >
                      {template.name.replace("Modern ", "").replace("Classic ", "")} ({template.data.personal_info.name})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {onboardingMode === "continue" && hasResume && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Resume Loaded Successfully ✅</span>
                    </div>
                    <h4 className="font-bold text-sm">{resumeData.personal_info.name}</h4>
                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed font-mono">
                      {resumeData.personal_info.email} {resumeData.personal_info.phone && `· ${resumeData.personal_info.phone}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate("resume/workspace")}
                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 rounded-lg px-4 py-2 cursor-pointer transition-all border-none flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
                  >
                    Open Resume Workspace 🚀
                  </button>
                  <button
                    onClick={() => navigate("resume")}
                    className="text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 cursor-pointer transition-all bg-transparent"
                  >
                    Manage Workspace Drafts 📁
                  </button>
                  <button
                    onClick={handleWipeResume}
                    className="text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-950/40 rounded-lg px-4 py-2 cursor-pointer transition-all bg-transparent"
                  >
                    Clear Active Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: WORKSPACE (SPLIT-SCREEN) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">2. Job Details & Analysis</h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT SIDE: Inputs Form (40%) */}
            <div className={`lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 transition-all ${
              !hasResume ? "opacity-40 pointer-events-none" : "opacity-100"
            }`}>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Stripe"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full h-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 rounded-lg px-3 text-xs outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Engineer II"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full h-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 rounded-lg px-3 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Job Post URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://..."
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="w-full h-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 rounded-lg px-3 text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Job Description</label>
                  <textarea
                    placeholder="Paste the job description details here to tailor your score and materials..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={5}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 rounded-lg p-3 text-xs outline-none resize-none leading-relaxed transition-all"
                  />
                </div>

                {/* AUTOMATIONS OPTIONS */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoTrack"
                      checked={autoTrack}
                      onChange={(e) => setAutoTrack(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-zinc-900 border-zinc-300 bg-white cursor-pointer"
                    />
                    <label htmlFor="autoTrack" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                      Save to Kanban Job Tracker
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoResearch"
                      checked={autoResearch}
                      onChange={(e) => setAutoResearch(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-zinc-900 border-zinc-300 bg-white cursor-pointer"
                    />
                    <label htmlFor="autoResearch" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                      Search Reddit wage details & salary ranges
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleLaunchCopilot}
                  disabled={isAnalyzing || !hasResume || !companyName.trim() || !jobTitle.trim() || !jobDescription.trim()}
                  className="w-full h-10 bg-zinc-900 text-white dark:bg-white dark:text-black hover:opacity-90 font-bold px-6 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-55 disabled:cursor-not-allowed border-none cursor-pointer"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
                    </span>
                  ) : (
                    <span>Analyze Job</span>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: Real-Time Analytics Console (60%) */}
            <div className="lg:col-span-7 space-y-4">
              {isAnalyzing ? (
                /* LOADING PANEL */
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 min-h-[400px] flex flex-col justify-between text-left">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2.5">
                      <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                      <h4 className="font-bold text-xs uppercase text-zinc-500 tracking-wider">Running Analysis...</h4>
                    </div>
                    
                    <div className="space-y-3.5">
                      {[
                        { step: 1, label: "Scanning profile details...", active: analysisStep >= 1 },
                        { step: 2, label: "Calculating match compatibility score...", active: analysisStep >= 2 },
                        { step: 3, label: "Tailoring cover letter draft...", active: analysisStep >= 3 },
                        { step: 4, label: "Searching wage benchmarks on Reddit...", active: autoResearch ? analysisStep >= 4 : false },
                      ].map((s) => (
                        <div key={s.step} className={`flex items-start gap-2.5 transition-opacity ${
                          s.active ? "opacity-100" : "opacity-30"
                        }`}>
                          <CheckSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${s.active ? "text-emerald-600" : "text-zinc-400"}`} />
                          <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-900 dark:bg-white h-full rounded-full transition-all duration-350"
                        style={{ width: `${(analysisStep / 4) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-zinc-500 uppercase font-bold tracking-wider mt-1">
                      <span>Analyzing</span>
                      <span>{Math.round((analysisStep / 4) * 100)}%</span>
                    </div>
                  </div>
                </div>
              ) : atsResult || coverLetterResult || interviewPrepResult || researchResult ? (
                /* RESULTS CONSOLE */
                <div className="space-y-4 text-left">
                  {/* Results Meta Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <h4 className="font-bold text-xs uppercase text-zinc-500 tracking-wider">Analysis Results</h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Generated custom materials for {jobTitle} @ {companyName}.
                      </p>
                    </div>
                    {trackedApp && (
                      <Badge className="bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 self-start sm:self-auto rounded">
                        Saved in Tracker
                      </Badge>
                    )}
                  </div>

                  {/* Navigation Tab Bar */}
                  <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl flex overflow-x-auto gap-1">
                    {[
                      { id: "ats", label: "ATS Score", icon: FileCheck },
                      { id: "cover", label: "Cover Letter", icon: FileText },
                      { id: "prep", label: "Interview Rounds", icon: Target },
                      { id: "research", label: "Salary Details", icon: Globe },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border-none outline-none ${
                            activeTab === tab.id
                              ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm font-bold"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB: ATS SCORE */}
                  {activeTab === "ats" && atsResult && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                        <div className="text-center space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Match Compatibility</span>
                          <div className="text-3xl font-extrabold tracking-tight">{atsResult.score}%</div>
                        </div>
                        <div className="sm:col-span-2 text-left space-y-1">
                          <h5 className="text-xs font-bold uppercase text-zinc-500">Summary Verdict</h5>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {atsResult.general_feedback}
                          </p>
                        </div>
                      </div>

                      {/* Alignment metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { name: "Keywords Alignment", data: atsResult.aspects.skills_match },
                          { name: "Formatting & Layout", data: atsResult.aspects.formatting },
                          { name: "Highlight Impact", data: atsResult.aspects.impact },
                          { name: "Professional Tone", data: atsResult.aspects.language_tone },
                        ].map((cat) => (
                          <div key={cat.name} className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5 text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{cat.name}</span>
                              <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                {cat.data.rating}/10
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">{cat.data.why}</p>
                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500 leading-relaxed font-semibold">
                              <span className="font-bold block uppercase text-[8px] text-zinc-400 mb-0.5">Improvement tip:</span>
                              {cat.data.how_to_improve}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Missing Keywords list */}
                      {atsResult.missing_keywords?.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl p-4 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Missing keywords to add:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {atsResult.missing_keywords.map((kw) => (
                              <Badge key={kw} className="bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-700 dark:text-zinc-300 text-[10px] font-bold px-2 py-0.5 uppercase rounded">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bullet highlights optimizer */}
                      {atsResult.bullet_point_suggestions?.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Highlight Point Suggestions</h5>
                          <div className="space-y-3">
                            {atsResult.bullet_point_suggestions.map((sug, i) => (
                              <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg space-y-1.5 text-left text-xs leading-relaxed font-semibold">
                                <div className="text-red-500 line-through">{sug.original}</div>
                                <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-start gap-1">
                                  <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span>{sug.improved}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: COVER LETTER */}
                  {activeTab === "cover" && coverLetterResult && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-150">
                      <div className="p-5 max-h-[350px] overflow-y-auto custom-scrollbar border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-7 whitespace-pre-wrap font-mono">
                          {coverLetterResult}
                        </p>
                      </div>
                      <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between flex-wrap gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cover Letter Blueprint</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyLetter}
                            className="h-8 px-3 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 cursor-pointer bg-transparent"
                          >
                            {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLetter ? "Copied" : "Copy"}</span>
                          </button>
                          <button
                            onClick={handleDownloadLetter}
                            className="h-8 px-3 text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-black rounded-lg flex items-center gap-1.5 cursor-pointer border-none"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download .txt</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: INTERVIEW TIMELINE */}
                  {activeTab === "prep" && interviewPrepResult && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      
                      {/* Elevator pitch */}
                      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">30-Second Elevator Pitch</span>
                          <button
                            onClick={handleCopyPitch}
                            className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 flex items-center gap-1 bg-transparent border-none outline-none cursor-pointer"
                          >
                            {copiedPitch ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic font-semibold">
                          "{interviewPrepResult.elevator_pitch}"
                        </p>
                      </div>

                      {/* Timeline list */}
                      <div className="space-y-2.5">
                        {interviewPrepResult.rounds.map((round, idx) => {
                          let diffStyle = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40";
                          if (round.difficulty === "Medium") diffStyle = "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40";
                          if (round.difficulty === "Hard") diffStyle = "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40";

                          return (
                            <div key={idx} className="flex items-start gap-3 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-left text-xs leading-relaxed font-semibold">
                              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 flex items-center justify-center shrink-0">
                                {idx + 1}
                              </div>
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <h5 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">{round.name}</h5>
                                  <Badge className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${diffStyle}`}>{round.difficulty}</Badge>
                                </div>
                                <p className="text-zinc-500 font-semibold">{round.focus}</p>
                                <div className="flex flex-wrap gap-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                                  {round.likely_topics.map((t, i) => (
                                    <Badge key={i} className="bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-500 text-[8px] font-bold px-1.5 rounded-md">
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* practice guide transition link */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            const appObj = trackedApp || {
                              id: `temp-${Date.now()}`,
                              company_name: companyName,
                              job_title: jobTitle,
                              status: "Applied",
                              jd_text: jobDescription,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            };
                            navigate("/dashboard/hired/prep", { state: { app: appObj } });
                          }}
                          className="h-9 px-4 bg-zinc-900 text-white dark:bg-white dark:text-black font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 border-none shadow-sm cursor-pointer"
                        >
                          <span>Launch Practice Room</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB: WAGES & CULTURE */}
                  {activeTab === "research" && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      {researchResult ? (
                        <>
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-left">
                            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-2 mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Consensus Culture Vibe</span>
                              {researchResult.difficulty_rating && (
                                <Badge className="bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                  Interview bar: {researchResult.difficulty_rating}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">
                              {researchResult.key_insight}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Salary benchmarks */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">reddit Wage benchmarks</h5>
                              {researchResult.salary_range ? (
                                <div className="flex items-start gap-2 bg-emerald-500/[0.03] border border-emerald-500/10 p-3 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-450 leading-relaxed">
                                  <Flame className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-pulse" />
                                  <span>{researchResult.salary_range}</span>
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-500 font-medium py-3 text-center">
                                  No estimates crawled for this company yet.
                                </p>
                              )}
                            </div>

                            {/* Culture warnings */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">reddit Culture Signals</h5>
                              {researchResult.culture_signals?.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                  {researchResult.culture_signals.map((flag: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0 mt-2" />
                                      <span>{flag}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-500 font-medium py-3 text-center">
                                  Good signs: No significant alerts detected in forums.
                                </p>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center py-14 flex flex-col items-center justify-center gap-3">
                          <Globe className="w-8 h-8 text-zinc-400 animate-spin" />
                          <div>
                            <h4 className="font-bold text-sm">Crawling wage details</h4>
                            <p className="text-xs text-zinc-500 mt-0.5 max-w-xs mx-auto leading-relaxed">
                               reddit.com is currently being indexed for compensation statistics.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* DESK IDLE PLAYGROUND */
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h4 className="font-bold text-xs uppercase text-zinc-500 tracking-wider">Analysis Desk Idle</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                      Fill out target job details on the left, then click "Analyze Job" to run calculations. Results will render side-by-side.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* STEP 3: MORE TOOLS */}
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">3. More Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            <div
              onClick={() => navigate("resume")}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 mb-3 transition-transform group-hover:scale-105">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs flex items-center gap-1 uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Full Resume Builder
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Refine score ratings, optimize summaries, and download PDF.
              </p>
            </div>

            <div
              onClick={() => navigate("tracker")}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 mb-3 transition-transform group-hover:scale-105">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs flex items-center gap-1 uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Kanban tracker board
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Log target applications, track phases, and save role details.
              </p>
            </div>

            <div
              onClick={() => navigate("prep")}
              className="group bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] hover:border-zinc-450 dark:hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 mb-3 transition-transform group-hover:scale-105">
                <Target className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs flex items-center gap-1 uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Interview practice room
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Review round details, practice behavioral checks, and log notes.
              </p>
            </div>

            <div
              onClick={() => navigate("cover-letter")}
              className="group bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] hover:border-zinc-450 dark:hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 mb-3 transition-transform group-hover:scale-105">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs flex items-center gap-1 uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Cover letter generator
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Write targeted cover letters with adjustable styles.
              </p>
            </div>

          </div>
        </div>

      </div>
    </HiredShell>
  );
}
