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

export default function JobTracker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  const handleUpdateStatus = async (
    id: string,
    status: JobApplication["status"],
  ) => {
    // OPTIMISTIC UPDATE: Update UI immediately
    const originalApps = [...applications];
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app)),
    );

    try {
      await resumeApi.updateApplication(id, { status });
      toast({
        title: "Status Updated",
        description: `Application moved to ${status}.`,
      });
    } catch (error) {
      // ROLLBACK on failure
      setApplications(originalApps);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not synchronize with server. Reverting changes.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    // OPTIMISTIC UPDATE: Remove from UI immediately
    const originalApps = [...applications];
    setApplications((prev) => prev.filter((app) => app.id !== id));

    try {
      await resumeApi.deleteApplication(id);
      toast({
        title: "Deleted",
        description: "Application removed from tracker.",
      });
    } catch (error) {
      // ROLLBACK on failure
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
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-10 px-6 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
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
              <div className="flex gap-2">
                {["all", "Applied", "Interviewing", "Offer", "Rejected"].map(
                  (s) => (
                    <Button
                      key={s}
                      variant="ghost"
                      onClick={() => setFilterStatus(s)}
                      className={`h-11 px-4 rounded-xl font-bold text-xs capitalize transition-all ${filterStatus === s ? "bg-white text-black hover:bg-zinc-200" : "text-zinc-500 hover:bg-white/5"}`}
                    >
                      {s}
                    </Button>
                  ),
                )}
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
                Start tracking your job search by adding your first application.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              <AnimatePresence mode="popLayout">
                {filteredApps.map((app) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={app.id}
                    className="group relative bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-[28px] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5"
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
                            onClick={() => handleUpdateStatus(app.id, "Offer")}
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
                        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" />
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
  );
}
