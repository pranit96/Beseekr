import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { resumeApi, type JobApplication } from "../../api/resume";
import {
  Briefcase,
  Plus,
  Search,
  ExternalLink,
  MoreVertical,
  Trash2,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Filter,
  X,
  FileText,
  Link,
  KanbanSquare,
  LayoutGrid,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import { GlobalFooter } from "../../components/GlobalFooter";

// ─── Add Application Modal ──────────────────────────────────────────────────
interface AddApplicationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<JobApplication>) => Promise<void>;
  isSaving: boolean;
}

function AddApplicationModal({
  open,
  onClose,
  onSave,
  isSaving,
}: AddApplicationModalProps) {
  const [form, setForm] = useState({
    company_name: "",
    job_title: "",
    status: "Applied" as JobApplication["status"],
    job_url: "",
    jd_text: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.job_title.trim()) return;
    await onSave({
      company_name: form.company_name.trim(),
      job_title: form.job_title.trim(),
      status: form.status,
      job_url: form.job_url.trim() || undefined,
      jd_text: form.jd_text.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    setForm({
      company_name: "",
      job_title: "",
      status: "Applied",
      job_url: "",
      jd_text: "",
      notes: "",
    });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-[#111113] border border-white/[0.08] rounded-[32px] p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                New Application
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Paste the JD for AI-powered prep kits later.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company + Title */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Company *
                </label>
                <Input
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="e.g. Google"
                  required
                  className="bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-xl h-11 text-zinc-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Role *
                </label>
                <Input
                  name="job_title"
                  value={form.job_title}
                  onChange={handleChange}
                  placeholder="e.g. SWE II"
                  required
                  className="bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-xl h-11 text-zinc-200"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full h-11 bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 text-sm text-zinc-200 font-medium outline-none transition-all"
              >
                {[
                  "Bookmarked",
                  "Applied",
                  "Interviewing",
                  "Offer",
                  "Rejected",
                ].map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Job URL */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <Link className="w-3 h-3" /> Job URL
              </label>
              <Input
                name="job_url"
                value={form.job_url}
                onChange={handleChange}
                placeholder="https://jobs.company.com/..."
                type="url"
                className="bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-xl h-11 text-zinc-200"
              />
            </div>

            {/* JD Text — key for InterviewPrep AI */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Job Description
                <span className="text-indigo-400 font-bold normal-case tracking-normal text-[10px]">
                  → powers AI Prep Kit
                </span>
              </label>
              <textarea
                name="jd_text"
                value={form.jd_text}
                onChange={handleChange}
                placeholder="Paste the full job description here. The AI will use this to generate your personalized interview prep kit."
                rows={5}
                maxLength={12000}
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition-all resize-none font-medium leading-relaxed"
              />
              <p className="text-[10px] text-zinc-600 font-medium text-right">
                {form.jd_text.length}/12,000
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1 h-11 text-zinc-500 hover:text-white rounded-2xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSaving ||
                  !form.company_name.trim() ||
                  !form.job_title.trim()
                }
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Application"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function JobTracker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);

  // Pre-fetch AI prep kit silently on hover (UX-07)
  useEffect(() => {
    if (!hoveredAppId) return;
    const app = applications.find((a) => a.id === hoveredAppId);
    if (!app || !app.jd_text) return;

    const prefetch = async () => {
      try {
        const cached = sessionStorage.getItem(`prepKit:${app.id}`);
        if (cached) return;

        // Ensure we have a resume to prep with
        const draft = await resumeApi.getResumeDraft("template");
        if (
          !draft ||
          !draft.resume_data ||
          Object.keys(draft.resume_data).length === 0
        )
          return;

        const kit = await resumeApi.generateInterviewPrep({
          resume: draft.resume_data,
          job_description: app.jd_text,
          company_name: app.company_name,
          job_title: app.job_title,
        });
        sessionStorage.setItem(`prepKit:${app.id}`, JSON.stringify(kit));
      } catch (err) {
        // Silent fail for prefetch
      }
    };

    const timeout = setTimeout(prefetch, 800); // 800ms hover intent
    return () => clearTimeout(timeout);
  }, [hoveredAppId, applications]);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await resumeApi.getApplications();
      setApplications(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load applications",
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAddApplication = async (data: Partial<JobApplication>) => {
    setIsSaving(true);
    try {
      const newApp = await resumeApi.createApplication(data);
      setApplications((prev) => [newApp, ...prev]);
      setShowAddModal(false);
      toast({
        title: "Application Added",
        description: `${data.company_name} tracked in your pipeline.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add application",
        description: "Could not save. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: JobApplication["status"],
  ) => {
    const originalApps = [...applications];
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app)),
    );
    // Flash animation
    setUpdatedIds((prev) => new Set(prev).add(id));
    setTimeout(
      () =>
        setUpdatedIds((prev) => {
          const s = new Set(prev);
          s.delete(id);
          return s;
        }),
      1500,
    );

    try {
      await resumeApi.updateApplication(id, { status });
      toast({
        title: "Status Updated",
        description: `Application moved to ${status}.`,
      });
    } catch (error) {
      setApplications(originalApps);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not synchronize with server. Reverting changes.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const originalApps = [...applications];
    setApplications((prev) => prev.filter((app) => app.id !== id));

    try {
      await resumeApi.deleteApplication(id);
      toast({
        title: "Deleted",
        description: "Application removed from tracker.",
      });
    } catch (error) {
      setApplications(originalApps);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "The application could not be removed. Please try again.",
      });
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Offer":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Interviewing":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "Rejected":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "Bookmarked":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-sky-400 bg-sky-500/10 border-sky-500/20";
    }
  };

  return (
    <>
      <AddApplicationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddApplication}
        isSaving={isSaving}
      />

      <div className="h-screen flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-10 py-10 px-4 sm:px-6 lg:px-8">
            {/* TOP NAV */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard/hired")}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-10 px-6 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Application
              </Button>
            </div>

            {/* HEADER & SEARCH */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Job Tracker
                </h1>
                <p className="text-zinc-500 font-medium">
                  Keep track of your applications and interview stages.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                  <Input
                    placeholder="Search by company or role..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchQuery(e.target.value)
                    }
                    className="bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 pl-10 h-11 rounded-xl text-zinc-200 transition-all"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    "all",
                    "Applied",
                    "Interviewing",
                    "Offer",
                    "Rejected",
                    "Bookmarked",
                  ].map((s) => (
                    <Button
                      key={s}
                      variant="ghost"
                      onClick={() => setFilterStatus(s)}
                      className={`h-11 px-4 rounded-xl font-bold text-xs capitalize transition-all ${filterStatus === s ? "bg-white text-black hover:bg-zinc-200" : "text-zinc-500 hover:bg-white/5"}`}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
                <div className="flex bg-white/[0.03] p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-white"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "kanban" ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-white"}`}
                  >
                    <KanbanSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* APPLICATIONS GRID */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-zinc-500 font-medium animate-pulse">
                  Synchronizing your pipeline...
                </p>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-white/[0.08] rounded-[32px] bg-white/[0.01]">
                <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-4 opacity-50" />
                <p className="text-zinc-400 font-bold text-lg">
                  No applications found
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  {applications.length === 0
                    ? 'Click "Add Application" to start tracking your job search.'
                    : "Try adjusting your search or filter."}
                </p>
                {applications.length === 0 && (
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-6 h-11"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Your First Application
                  </Button>
                )}
              </div>
            ) : viewMode === "kanban" && filterStatus === "all" ? (
              // KANBAN VIEW
              <div className="flex gap-6 overflow-x-auto pb-12 snap-x">
                {[
                  "Bookmarked",
                  "Applied",
                  "Interviewing",
                  "Offer",
                  "Rejected",
                ].map((status) => {
                  const columnApps = filteredApps.filter(
                    (a) => a.status === status,
                  );
                  return (
                    <div
                      key={status}
                      className="flex-none w-[320px] snap-center"
                    >
                      <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="font-bold text-sm text-zinc-300">
                          {status}
                        </h3>
                        <Badge
                          className={`px-2 py-0.5 text-[10px] ${getStatusColor(status)}`}
                        >
                          {columnApps.length}
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        {columnApps.map((app) => (
                          <div
                            key={app.id}
                            className={`bg-white/[0.02] border border-white/[0.08] p-4 rounded-2xl hover:border-indigo-500/30 transition-all ${updatedIds.has(app.id) ? "border-indigo-500/50" : ""}`}
                            onMouseEnter={() => setHoveredAppId(app.id)}
                            onMouseLeave={() => setHoveredAppId(null)}
                          >
                            <h4 className="font-bold text-white text-sm line-clamp-1">
                              {app.job_title}
                            </h4>
                            <p className="text-xs text-zinc-500 font-medium mb-3">
                              {app.company_name}
                            </p>

                            <div className="flex justify-between items-center mt-2 border-t border-white/[0.04] pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] hover:text-indigo-400"
                                onClick={() =>
                                  navigate("/dashboard/hired/prep", {
                                    state: { app },
                                  })
                                }
                              >
                                Prep Kit
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-white/[0.1]"
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-zinc-900 border-white/[0.1] text-zinc-300"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(app.id, "Applied")
                                    }
                                  >
                                    Set Applied
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(app.id, "Interviewing")
                                    }
                                  >
                                    Set Interviewing
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(app.id, "Offer")
                                    }
                                  >
                                    Set Offer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(app.id, "Rejected")
                                    }
                                    className="text-red-400"
                                  >
                                    Set Rejected
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // GRID VIEW
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                <AnimatePresence mode="popLayout">
                  {filteredApps.map((app) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={app.id}
                      onMouseEnter={() => setHoveredAppId(app.id)}
                      onMouseLeave={() => setHoveredAppId(null)}
                      className={`group relative bg-white/[0.02] border rounded-[28px] p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5 ${
                        updatedIds.has(app.id)
                          ? "border-indigo-500/50 shadow-indigo-500/20"
                          : "border-white/[0.08] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 transition-colors group-hover:border-white/20">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-zinc-900 border-white/[0.1] text-zinc-300 rounded-xl"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(app.id, "Applied")
                              }
                            >
                              Set Applied
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(app.id, "Interviewing")
                              }
                            >
                              Set Interviewing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(app.id, "Offer")
                              }
                            >
                              Set Offer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(app.id, "Rejected")
                              }
                              className="text-red-400"
                            >
                              Set Rejected
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(app.id)}
                              className="text-red-400"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1">
                            {app.job_title}
                          </h3>
                          <p
                            title={app.company_name}
                            className="text-zinc-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 truncate"
                          >
                            <Building2 className="w-3 h-3 shrink-0" />
                            {app.company_name}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <Badge
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wider ${getStatusColor(
                              app.status,
                            )}`}
                          >
                            {app.status}
                          </Badge>
                          {app.jd_text && (
                            <Badge className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                              JD Attached
                            </Badge>
                          )}
                          {app.job_url && (
                            <a
                              href={app.job_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Badge
                                variant="outline"
                                className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border-white/[0.08] text-zinc-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <ExternalLink className="w-2.5 h-2.5" /> Link
                              </Badge>
                            </a>
                          )}
                        </div>

                        <div className="pt-4 mt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 opacity-60" />
                            Applied{" "}
                            {new Date(app.created_at).toLocaleDateString()}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] hover:text-indigo-400 transition-colors"
                            onClick={() =>
                              navigate("/dashboard/hired/prep", {
                                state: { app },
                              })
                            }
                          >
                            Prep Kit
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>

        <div className="flex-shrink-0">
          <GlobalFooter>
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              Live Syncing Active
            </div>
          </GlobalFooter>
        </div>
      </div>
    </>
  );
}
