import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import {
  ResumeSchema,
  ATSAnalysis,
  resumeApi,
  ResumeRevision,
} from "@/api/resume";
import { useToast } from "@/hooks/use-toast";
import { Laptop, Briefcase, GraduationCap, File } from "lucide-react";

// Define Resume Templates and empty states here so all routed pages can leverage them.
export const EMPTY_RESUME: ResumeSchema = {
  personal_info: {
    name: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [{ category: "Technical Skills", items: [] }],
  projects: [],
  certifications: [],
};

export const PRESET_TEMPLATE: ResumeSchema = {
  personal_info: {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    website: "linkedin.com/in/alexj",
    summary:
      "Result-driven software professional with 4 years of expertise constructing high-scalability web infrastructures and robust microservices. Adept at accelerating cross-functional delivery timelines using modern agile engineering principles.",
  },
  experience: [
    {
      company: "Stripe",
      position: "Software Engineer II",
      location: "San Francisco, CA",
      period: "Jan 2023 - Present",
      highlights: [
        "Architected redundant internal processing middleware, yielding a 12% reduction in latency overhead.",
        "Spearheaded refactoring initiative for merchant dashboard interface utilizing React, raising Lighthouse performance metrics from 72 to 95.",
      ],
    },
  ],
  education: [
    {
      institution: "Stanford University",
      degree: "Bachelor of Science in Computer Science",
      period: "Sept 2017 - June 2021",
    },
  ],
  skills: [
    {
      category: "Languages",
      items: ["JavaScript", "TypeScript", "Go", "Python", "SQL"],
    },
    {
      category: "Frameworks",
      items: ["React", "Node.js", "Next.js", "Express", "Tailwind CSS"],
    },
  ],
  projects: [
    {
      name: "Distributed Event Pipeline",
      description:
        "Engineered custom Pub/Sub streaming pipeline resolving payload delivery bottlenecks.",
      highlights: [
        "Safely process 50k payloads hourly with 99.98% fault-tolerance validation.",
      ],
    },
  ],
  certifications: ["AWS Solutions Architect Associate"],
};

export const RESUME_TEMPLATES = [
  {
    id: "blank_master",
    name: "Blank Slate (From Scratch)",
    description:
      "Start from zero with an entirely clean workspace. Perfect for experienced builders or copying existing structures precisely.",
    icon: File,
    styles: {
      primaryColor: "#1e293b",
      accentColor: "#64748b",
      fontFamily: "Sans",
    },
    colorScheme: "slate",
    data: {
      ...EMPTY_RESUME,
      styles: {
        primaryColor: "#1e293b",
        accentColor: "#64748b",
        fontFamily: "Sans",
      },
    },
  },
  {
    id: "tech_vanguard",
    name: "Modern Tech Vanguard",
    description:
      "Clean, modern sans-serif geometry with Emerald green accents. Highly recommended for Software Engineers, Data Scientists, and Product Managers.",
    icon: Laptop,
    styles: {
      primaryColor: "#065F46",
      accentColor: "#059669",
      fontFamily: "Sans",
    },
    colorScheme: "emerald",
    data: {
      ...PRESET_TEMPLATE,
      styles: {
        primaryColor: "#065F46",
        accentColor: "#059669",
        fontFamily: "Sans",
      },
    },
  },
  {
    id: "classic_executive",
    name: "Classic Executive",
    description:
      "A timeless Serif layout in Obsidian black. Maximum corporate legibility. Optimal for Finance, Legal, Sales, and C-Suite executive applications.",
    icon: Briefcase,
    styles: {
      primaryColor: "#111827",
      accentColor: "#4B5563",
      fontFamily: "Serif",
    },
    colorScheme: "slate",
    data: {
      ...PRESET_TEMPLATE,
      personal_info: {
        ...PRESET_TEMPLATE.personal_info,
        name: "Robert Sterling",
        summary:
          "Accomplished management professional with over 6 years overseeing enterprise accounts and optimizing high-level business strategies. Proven capability in leading multi-million dollar budget portfolios.",
      },
      styles: {
        primaryColor: "#111827",
        accentColor: "#4B5563",
        fontFamily: "Serif",
      },
    },
  },
  {
    id: "indigo_scholar",
    name: "Indigo Scholar",
    description:
      "A hybrid academic structure with deep Indigo branding. Perfect for Academic Research, Project Coordinators, and Graduate applications.",
    icon: GraduationCap,
    styles: {
      primaryColor: "#1E3A8A",
      accentColor: "#3B82F6",
      fontFamily: "Sans",
    },
    colorScheme: "indigo",
    data: {
      ...PRESET_TEMPLATE,
      personal_info: {
        ...PRESET_TEMPLATE.personal_info,
        name: "Jordan Casey",
      },
      styles: {
        primaryColor: "#1E3A8A",
        accentColor: "#3B82F6",
        fontFamily: "Sans",
      },
    },
  },
];

export interface ResumeContextType {
  resumeData: ResumeSchema;
  jobDescription: string;
  atsReport: ATSAnalysis | null;
  revisionHistory: ResumeRevision[];
  uploadedResumes: Array<{
    id: string;
    name: string;
    uploaded_at: string;
    resume: ResumeSchema;
  }>;
  isLoading: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isScoring: boolean;
  isOptimizing: boolean;
  workspaceMode: "template" | "upload";
  showOnboarding: boolean;
  uploadSource: "fresh_upload" | "template" | "restored" | null;

  setResumeData: React.Dispatch<React.SetStateAction<ResumeSchema>>;
  setJobDescription: React.Dispatch<React.SetStateAction<string>>;
  setAtsReport: React.Dispatch<React.SetStateAction<ATSAnalysis | null>>;
  setIsScoring: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOptimizing: React.Dispatch<React.SetStateAction<boolean>>;
  setWorkspaceMode: (mode: "template" | "upload", skipFetch?: boolean) => void;
  setShowOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
  setUploadSource: React.Dispatch<
    React.SetStateAction<"fresh_upload" | "template" | "restored" | null>
  >;

  fetchDraft: (forcedMode?: "template" | "upload") => Promise<void>;
  fetchBothDrafts: () => Promise<{
    upload: {
      resume_data: ResumeSchema;
      job_description: string;
      history: ResumeRevision[];
    } | null;
    template: {
      resume_data: ResumeSchema;
      job_description: string;
      history: ResumeRevision[];
    } | null;
  }>;
  saveActiveDraft: (
    forcedData?: ResumeSchema,
    forcedJD?: string,
    forcedMode?: "template" | "upload",
  ) => Promise<void>;
  saveSnapshot: (name?: string) => Promise<void>;
  restoreSnapshot: (revisionId: string) => Promise<void>;
  deleteSnapshot: (revisionId: string) => Promise<void>;
  purgeWorkspace: () => Promise<void>;
  resetWorkspace: () => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();

  // Multi-Workspace Isolation Layer State
  const [workspaceMode, setWorkspaceModeState] = useState<
    "template" | "upload"
  >(() => {
    const saved = localStorage.getItem("resume-active-mode");
    return saved === "upload" || saved === "template" ? saved : "template";
  });

  const [resumeData, setResumeData] = useState<ResumeSchema>(EMPTY_RESUME);
  const [jobDescription, setJobDescription] = useState("");
  const [atsReport, setAtsReport] = useState<ATSAnalysis | null>(null);
  const [revisionHistory, setRevisionHistory] = useState<ResumeRevision[]>([]);
  const [uploadedResumes, setUploadedResumes] = useState<
    Array<{
      id: string;
      name: string;
      uploaded_at: string;
      resume: ResumeSchema;
    }>
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isScoring, setIsScoring] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [uploadSource, setUploadSource] = useState<
    "fresh_upload" | "template" | "restored" | null
  >(null);

  const skipNextFetchRef = useRef(false);
  const lastSyncedDataRef = useRef<ResumeSchema>(EMPTY_RESUME);
  const lastSyncedJDRef = useRef<string>("");

  const setWorkspaceMode = useCallback(
    (mode: "template" | "upload", skipFetch: boolean = false) => {
      if (skipFetch) {
        skipNextFetchRef.current = true;
      }
      setWorkspaceModeState(mode);
      localStorage.setItem("resume-active-mode", mode);
    },
    [],
  );

  const fetchDraft = useCallback(
    async (forcedMode?: "template" | "upload") => {
      const targetMode = forcedMode || workspaceMode;
      try {
        setIsLoading(true);
        const draft = await resumeApi.getResumeDraft(targetMode);
        if (draft) {
          if (
            draft.resume_data &&
            Object.keys(draft.resume_data.personal_info || {}).length > 0
          ) {
            setResumeData(draft.resume_data);
            lastSyncedDataRef.current = draft.resume_data;
            setSaveStatus("saved");
          } else {
            // Handle cases where slot is completely new
            setResumeData(EMPTY_RESUME);
            lastSyncedDataRef.current = EMPTY_RESUME;
            setSaveStatus("idle");
          }
          setJobDescription(draft.job_description || "");
          lastSyncedJDRef.current = draft.job_description || "";
          setRevisionHistory(draft.history || []);
          setUploadedResumes(draft.uploaded_resumes || []);
        } else {
          // New account / no draft
          setResumeData(EMPTY_RESUME);
          lastSyncedDataRef.current = EMPTY_RESUME;
          setJobDescription("");
          lastSyncedJDRef.current = "";
          setRevisionHistory([]);
          setUploadedResumes([]);
          setSaveStatus("idle");
        }
      } catch (error) {
        console.error("[ResumeContext] Failed to fetch cloud draft:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceMode],
  );
  // Multi-Workspace Persistence Linkage
  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      setIsLoading(false);
      return;
    }
    fetchDraft();
  }, [workspaceMode, fetchDraft]);

  const fetchBothDrafts = useCallback(async () => {
    try {
      const [uploadDraft, templateDraft] = await Promise.allSettled([
        resumeApi.getResumeDraft("upload"),
        resumeApi.getResumeDraft("template"),
      ]);
      return {
        upload: uploadDraft.status === "fulfilled" ? uploadDraft.value : null,
        template:
          templateDraft.status === "fulfilled" ? templateDraft.value : null,
      };
    } catch (error) {
      console.error("[ResumeContext] Failed to fetch both drafts:", error);
      return { upload: null, template: null };
    }
  }, []);

  const saveActiveDraft = async (
    forcedData?: ResumeSchema,
    forcedJD?: string,
    forcedMode?: "template" | "upload",
  ) => {
    try {
      setSaveStatus("saving");
      const dataToSave = forcedData || resumeData;
      const jdToSave = forcedJD !== undefined ? forcedJD : jobDescription;
      const modeToSave = forcedMode || workspaceMode;

      // Prevent wiping new slots
      if (
        !dataToSave.personal_info?.name &&
        dataToSave.experience.length === 0
      ) {
        setSaveStatus("idle");
        return;
      }

      const success = await resumeApi.saveResumeDraft(
        dataToSave,
        jdToSave,
        modeToSave,
      );
      if (success) {
        setSaveStatus("saved");
        // Keep synced references updated
        lastSyncedDataRef.current = dataToSave;
        lastSyncedJDRef.current = jdToSave;
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("[ResumeContext] Auto-save failed:", error);
      setSaveStatus("error");
    }
  };

  const saveSnapshot = async (name?: string) => {
    try {
      setSaveStatus("saving");
      const snapshotName =
        name ||
        `Saved - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const snapshot = await resumeApi.saveResumeSnapshot(
        resumeData,
        jobDescription,
        snapshotName,
        workspaceMode,
      );

      // Append new snapshot locally
      setRevisionHistory((prev) => [snapshot, ...prev].slice(0, 15));
      setSaveStatus("saved");

      toast({
        title: "Archived in Vault",
        description:
          "Your current revision was backed up to the 45-day history cloud vault.",
      });
    } catch (error) {
      console.error("[ResumeContext] Failed to archive snapshot:", error);
      setSaveStatus("error");
      toast({
        title: "Vault Archiving Failed",
        description: "Unable to backup this version right now.",
        variant: "destructive",
      });
    }
  };

  const restoreSnapshot = async (revisionId: string) => {
    try {
      setIsLoading(true);
      const restored = await resumeApi.restoreResumeSnapshot(
        revisionId,
        workspaceMode,
      );
      setResumeData(restored.resume_data);
      lastSyncedDataRef.current = restored.resume_data;
      setJobDescription(restored.job_description);
      lastSyncedJDRef.current = restored.job_description;
      setSaveStatus("saved");
      toast({
        title: "Revision Restored",
        description: "Target snapshot promoted to your active draft workspace.",
      });
    } catch (error) {
      console.error("[ResumeContext] Failed to restore snapshot:", error);
      toast({
        title: "Restoration Failed",
        description: "Could not retrieve target snapshot.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSnapshot = async (revisionId: string) => {
    try {
      const success = await resumeApi.deleteResumeSnapshot(
        revisionId,
        workspaceMode,
      );
      if (success) {
        setRevisionHistory((prev) => prev.filter((r) => r.id !== revisionId));
        toast({
          title: "Evicted from Vault",
          description: "Revision snapshot was permanently purged.",
        });
      }
    } catch (error) {
      console.error("[ResumeContext] Failed to purge snapshot:", error);
      toast({
        title: "Failed to Delete",
        description: "Could not purge this archive snapshot.",
        variant: "destructive",
      });
    }
  };

  const purgeWorkspace = async () => {
    try {
      setIsLoading(true);
      const success = await resumeApi.purgeResumeDraft(workspaceMode);
      if (success) {
        // Synced Cloud Wipe completed - apply Local Cold Wipe
        setResumeData(EMPTY_RESUME);
        lastSyncedDataRef.current = EMPTY_RESUME;
        setJobDescription("");
        lastSyncedJDRef.current = "";
        setAtsReport(null);
        setRevisionHistory([]);
        setSaveStatus("idle");

        toast({
          title: "Workspace Terminated",
          description: `Your complete ${
            workspaceMode === "upload" ? "Upload & Score" : "AI Builder"
          } cloud workspace container and all historic revisions have been fully deleted.`,
        });
      }
    } catch (error: any) {
      console.error("[ResumeContext] Complete workspace purge failed:", error);
      toast({
        title: "Purge Operation Failed",
        description: "Unable to safely evict cloud dataset right now.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetWorkspace = () => {
    setResumeData(EMPTY_RESUME);
    lastSyncedDataRef.current = EMPTY_RESUME;
    setJobDescription("");
    lastSyncedJDRef.current = "";
    setAtsReport(null);
    setUploadedResumes([]);
    setSaveStatus("idle");
  };

  // Debounced auto-save triggered on data/JD change
  useEffect(() => {
    if (isLoading) return; // Skip if still loading initial draft

    // Skip if empty initial template to prevent wiping
    if (!resumeData.personal_info?.name && resumeData.experience.length === 0)
      return;

    // Skip if the current state matches the last synced state
    const isDataEqual =
      JSON.stringify(resumeData) === JSON.stringify(lastSyncedDataRef.current);
    const isJDEqual = jobDescription === lastSyncedJDRef.current;
    if (isDataEqual && isJDEqual) {
      return;
    }

    const timer = setTimeout(() => {
      saveActiveDraft();
    }, 2000); // 2-second debounce for cloud sync

    return () => clearTimeout(timer);
  }, [resumeData, jobDescription, isLoading, workspaceMode]);

  return (
    <ResumeContext.Provider
      value={{
        resumeData,
        jobDescription,
        atsReport,
        revisionHistory,
        uploadedResumes,
        isLoading,
        saveStatus,
        isScoring,
        isOptimizing,
        workspaceMode,
        showOnboarding,
        uploadSource,
        setResumeData,
        setJobDescription,
        setAtsReport,
        setIsScoring,
        setIsOptimizing,
        setWorkspaceMode,
        setShowOnboarding,
        setUploadSource,
        fetchDraft,
        fetchBothDrafts,
        saveActiveDraft,
        saveSnapshot,
        restoreSnapshot,
        deleteSnapshot,
        purgeWorkspace,
        resetWorkspace,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error("useResume must be used within ResumeProvider");
  }
  return context;
};
