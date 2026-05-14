import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  ResumeSchema,
  ATSAnalysis,
  resumeApi,
  ResumeRevision,
} from "@/api/resume";
import { useToast } from "@/hooks/use-toast";
import { Laptop, Briefcase, GraduationCap } from "lucide-react";

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
  isLoading: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isScoring: boolean;
  isOptimizing: boolean;

  setResumeData: React.Dispatch<React.SetStateAction<ResumeSchema>>;
  setJobDescription: React.Dispatch<React.SetStateAction<string>>;
  setAtsReport: React.Dispatch<React.SetStateAction<ATSAnalysis | null>>;
  setIsScoring: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOptimizing: React.Dispatch<React.SetStateAction<boolean>>;

  fetchDraft: () => Promise<void>;
  saveActiveDraft: (
    forcedData?: ResumeSchema,
    forcedJD?: string,
  ) => Promise<void>;
  saveSnapshot: (name?: string) => Promise<void>;
  restoreSnapshot: (revisionId: string) => Promise<void>;
  deleteSnapshot: (revisionId: string) => Promise<void>;
  resetWorkspace: () => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();

  const [resumeData, setResumeData] = useState<ResumeSchema>(EMPTY_RESUME);
  const [jobDescription, setJobDescription] = useState("");
  const [atsReport, setAtsReport] = useState<ATSAnalysis | null>(null);
  const [revisionHistory, setRevisionHistory] = useState<ResumeRevision[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isScoring, setIsScoring] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const fetchDraft = useCallback(async () => {
    try {
      setIsLoading(true);
      const draft = await resumeApi.getResumeDraft();
      if (draft) {
        if (
          draft.resume_data &&
          Object.keys(draft.resume_data.personal_info || {}).length > 0
        ) {
          setResumeData(draft.resume_data);
          setSaveStatus("saved");
        }
        setJobDescription(draft.job_description || "");
        setRevisionHistory(draft.history || []);
      }
    } catch (error) {
      console.error("[ResumeContext] Failed to fetch cloud draft:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on initial mount
  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const saveActiveDraft = async (
    forcedData?: ResumeSchema,
    forcedJD?: string,
  ) => {
    try {
      setSaveStatus("saving");
      const dataToSave = forcedData || resumeData;
      const jdToSave = forcedJD !== undefined ? forcedJD : jobDescription;

      // Only save if there's data to prevent wiping
      if (
        !dataToSave.personal_info?.name &&
        dataToSave.experience.length === 0
      ) {
        setSaveStatus("idle");
        return;
      }

      const success = await resumeApi.saveResumeDraft(dataToSave, jdToSave);
      if (success) {
        setSaveStatus("saved");
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
      const restored = await resumeApi.restoreResumeSnapshot(revisionId);
      setResumeData(restored.resume_data);
      setJobDescription(restored.job_description);
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
      const success = await resumeApi.deleteResumeSnapshot(revisionId);
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

  const resetWorkspace = () => {
    setResumeData(EMPTY_RESUME);
    setJobDescription("");
    setAtsReport(null);
    setSaveStatus("idle");
  };

  // Debounced auto-save triggered on data/JD change
  useEffect(() => {
    if (isLoading) return; // Skip if still loading initial draft

    // Skip if empty initial template to prevent wiping
    if (!resumeData.personal_info?.name && resumeData.experience.length === 0)
      return;

    const timer = setTimeout(() => {
      saveActiveDraft();
    }, 2000); // 2-second debounce for cloud sync

    return () => clearTimeout(timer);
  }, [resumeData, jobDescription, isLoading]);

  return (
    <ResumeContext.Provider
      value={{
        resumeData,
        jobDescription,
        atsReport,
        revisionHistory,
        isLoading,
        saveStatus,
        isScoring,
        isOptimizing,
        setResumeData,
        setJobDescription,
        setAtsReport,
        setIsScoring,
        setIsOptimizing,
        fetchDraft,
        saveActiveDraft,
        saveSnapshot,
        restoreSnapshot,
        deleteSnapshot,
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
