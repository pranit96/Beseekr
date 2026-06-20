import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  PiggyBank,
  DollarSign,
} from "lucide-react";
import { useBudget, getCurrencySymbol } from "./BudgetLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { budgetApi } from "@/api/budget";
import { cn } from "@/lib/utils";

// Circular progress component
function CircularProgress({ percentage, size = 72, strokeWidth = 6 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} stroke="hsl(var(--muted))" fill="none" className="opacity-40" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
          stroke="hsl(var(--primary))" fill="none" strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          strokeDasharray={circumference}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function BudgetGoals() {
  const { goals, fetchGoals, handleRefresh, preferredCurrency, preferredCurrencySymbol, selectedMonth, selectedYear } = useBudget();
  const { toast } = useToast();

  // Add Goal Dialog
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalPriority, setGoalPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [goalNotes, setGoalNotes] = useState("");
  const [goalIcon, setGoalIcon] = useState("🎯");
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

  // Contribute state (inline, per card)
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [isSubmittingContrib, setIsSubmittingContrib] = useState(false);

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalTargetAmount || parseFloat(goalTargetAmount) <= 0) {
      toast({ title: "Invalid Inputs", description: "Specify a name and positive target amount.", variant: "destructive" });
      return;
    }
    setIsSubmittingGoal(true);
    try {
      const response = await budgetApi.createGoal({
        name: goalName, targetAmount: parseFloat(goalTargetAmount),
        deadline: goalDeadline || undefined, priority: goalPriority,
        notes: goalNotes || undefined, icon: goalIcon || undefined,
      });
      if (response.success) {
        toast({ title: "Goal Created", description: `"${goalName}" with target ${preferredCurrencySymbol}${parseFloat(goalTargetAmount).toLocaleString()}.` });
        setIsAddGoalOpen(false);
        setGoalName(""); setGoalTargetAmount(""); setGoalDeadline(""); setGoalNotes(""); setGoalIcon("🎯");
        fetchGoals();
        handleRefresh();
      }
    } catch (e: any) {
      toast({ title: "Failed to Create Goal", description: e.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalId || !contribAmount || parseFloat(contribAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Specify a positive contribution.", variant: "destructive" });
      return;
    }
    setIsSubmittingContrib(true);
    try {
      const response = await budgetApi.contributeToGoal(contributeGoalId, {
        amount: parseFloat(contribAmount), note: contribNote || undefined,
      });
      if (response.success) {
        toast({ title: "Contribution Saved", description: `Contributed ${preferredCurrencySymbol}${parseFloat(contribAmount).toFixed(2)}.` });
        setContributeGoalId(null); setContribAmount(""); setContribNote("");
        fetchGoals(); handleRefresh();
      }
    } catch (e: any) {
      toast({ title: "Failed", description: e.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsSubmittingContrib(false);
    }
  };

  const getPriorityStyle = (p?: string) => {
    switch ((p || "medium").toLowerCase()) {
      case "critical": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "high": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "medium": return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
      default: return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  const getStatusStyle = (s?: string) => {
    switch ((s || "active").toLowerCase()) {
      case "completed": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "failed": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default: return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Saving Goals</h3>
          <p className="text-sm text-muted-foreground">Set targets and track progress toward your financial milestones.</p>
        </div>
        <Button onClick={() => setIsAddGoalOpen(true)} size="sm" className="gap-1.5 rounded-xl h-9 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium">
          <Plus className="w-3.5 h-3.5" /> New Goal
        </Button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card className="p-16 text-center border border-dashed border-border/40 bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
          <PiggyBank className="w-14 h-14 text-muted-foreground/20 mb-3" />
          <h4 className="text-base font-semibold text-foreground mb-1">No Active Goals</h4>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Define priority targets like an emergency fund or holiday getaway and save step by step.
          </p>
          <Button onClick={() => setIsAddGoalOpen(true)} variant="outline" className="gap-1.5 bg-background hover:bg-muted rounded-xl">
            <Plus className="w-4 h-4" /> Define Goal
          </Button>
        </Card>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            const isContributing = contributeGoalId === goal.id;

            return (
              <motion.div key={goal.id} variants={item}>
                <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{goal.icon || "🎯"}</span>
                      <div className="flex gap-1.5">
                        <Badge className={cn("text-[10px] border rounded-md", getPriorityStyle(goal.priority))} variant="outline">{goal.priority}</Badge>
                        <Badge className={cn("text-[10px] border rounded-md", getStatusStyle(goal.status))} variant="outline">{goal.status}</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-base font-semibold tracking-tight text-foreground">{goal.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 min-h-[28px]">
                      {goal.notes || "No description set."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-4">
                    {/* Circular progress + amounts */}
                    <div className="flex items-center gap-4">
                      <CircularProgress percentage={percent} />
                      <div className="flex-1 space-y-1">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Saved</p>
                          <p className="text-lg font-bold text-emerald-500 tabular-nums">{getCurrencySymbol(goal.currency)}{goal.current_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Target</p>
                          <p className="text-sm font-semibold text-foreground tabular-nums">{getCurrencySymbol(goal.currency)}{goal.target_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Inline Contribute */}
                    {isContributing && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleContributeSubmit}
                        className="space-y-2 pt-2 border-t border-border/20"
                      >
                        <Input type="number" step="0.01" placeholder="Amount" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} className="h-8 text-sm bg-background rounded-lg font-mono" required />
                        <Input placeholder="Note (optional)" value={contribNote} onChange={(e) => setContribNote(e.target.value)} className="h-8 text-sm bg-background rounded-lg" />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => { setContributeGoalId(null); setContribAmount(""); setContribNote(""); }} className="flex-1 h-7 text-xs rounded-lg">Cancel</Button>
                          <Button type="submit" size="sm" disabled={isSubmittingContrib} className="flex-1 h-7 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
                            {isSubmittingContrib ? "Saving…" : "Save"}
                          </Button>
                        </div>
                      </motion.form>
                    )}
                  </CardContent>

                  {!isContributing && (
                    <CardFooter className="bg-muted/20 border-t border-border/20 p-3">
                      <Button
                        onClick={() => setContributeGoalId(goal.id)}
                        variant="outline"
                        className="w-full h-8 text-xs font-medium bg-background hover:bg-muted text-foreground border-border/50 rounded-xl gap-1.5"
                      >
                        <DollarSign className="w-3 h-3" /> Contribute Funds
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent className="max-w-md bg-background border border-border/50 shadow-2xl rounded-2xl z-[99999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-primary" /> New Saving Goal
            </DialogTitle>
            <DialogDescription>
              Set up a target fund to track contributions and progress.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddGoalSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Goal Name</label>
              <Input placeholder="e.g. Emergency Fund, New Laptop, Holiday" value={goalName} onChange={(e) => setGoalName(e.target.value)} className="bg-background rounded-xl" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Target ({preferredCurrency})</label>
                <Input type="number" placeholder="1,000.00" value={goalTargetAmount} onChange={(e) => setGoalTargetAmount(e.target.value)} className="bg-background font-mono rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Icon (Emoji)</label>
                <Input placeholder="🎯 💻 🚗 🌴" value={goalIcon} onChange={(e) => setGoalIcon(e.target.value)} className="bg-background text-center text-lg rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Deadline</label>
                <Input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} className="bg-background rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                <Select value={goalPriority} onValueChange={(val) => setGoalPriority(val as any)}>
                  <SelectTrigger className="bg-background rounded-xl"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Notes</label>
              <textarea
                className="flex min-h-[70px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Describe why you want to save or deadline guidelines…"
                value={goalNotes} onChange={(e) => setGoalNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddGoalOpen(false)} className="bg-background hover:bg-muted rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmittingGoal} className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium rounded-xl">
                {isSubmittingGoal ? "Creating…" : "Create Goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
