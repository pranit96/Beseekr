import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Upload,
  Calendar,
  DollarSign,
  PiggyBank,
  AlertCircle,
  Sparkles,
  RefreshCw,
  FileText,
  X,
  Percent,
  ChevronRight,
  TrendingUp as SavingsRateIcon,
  MessageSquare,
  BadgeAlert,
  FolderMinus,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { budgetApi, Transaction, SavingGoal, BudgetInsights, YearlyOverview, BudgetDashboard } from "@/api/budget";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie
} from "recharts";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const PREDEFINED_CATEGORIES = [
  "Housing",
  "Utilities",
  "Food/Groceries",
  "Transportation",
  "Entertainment",
  "Healthcare",
  "Salary",
  "Investment",
  "Refund",
  "Other",
];

const CURRENCIES = ["USD", "INR", "EUR", "GBP", "CAD"];

export default function Budget() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data states
  const [dashboard, setDashboard] = useState<BudgetDashboard | null>(null);
  const [insights, setInsights] = useState<BudgetInsights | null>(null);
  const [yearlyOverview, setYearlyOverview] = useState<YearlyOverview | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingGoal[]>([]);

  // Loading states
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(false);

  // Dialog open states
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);

  // Add Transaction Form
  const [txType, setTxType] = useState<"income" | "expense" | "transfer" | "refund">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("Food/Groceries");
  const [txMerchant, setTxMerchant] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txSavingGoalId, setTxSavingGoalId] = useState<string>("");
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Add Goal Form
  const [goalName, setGoalName] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalPriority, setGoalPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [goalNotes, setGoalNotes] = useState("");
  const [goalIcon, setGoalIcon] = useState("🎯");
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

  // Contribute Goal Form
  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [isSubmittingContrib, setIsSubmittingContrib] = useState(false);

  // Statement Import Form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingStatement, setIsUploadingStatement] = useState(false);

  // Sorting / Filtering for Ledger Tab
  const [ledgerFilterType, setLedgerFilterType] = useState<string>("all");
  const [ledgerFilterCategory, setLedgerFilterCategory] = useState<string>("all");
  const [ledgerSortField, setLedgerSortField] = useState<"date" | "amount">("date");
  const [ledgerSortOrder, setLedgerSortOrder] = useState<"asc" | "desc">("desc");

  // Load main dashboard metrics
  const fetchDashboard = async (m: number, y: number) => {
    setLoadingDashboard(true);
    try {
      const response = await budgetApi.getDashboard({ month: m, year: y });
      if (response.success && response.data) {
        setDashboard(response.data);
        if (response.data.recentTransactions) {
          setTransactions(response.data.recentTransactions);
        }
        if (response.data.savingGoals) {
          setGoals(response.data.savingGoals);
        }
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error loading dashboard",
        description: e.message || "Failed to retrieve monthly budget stats.",
        variant: "destructive",
      });
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Load ledger transactions specifically (tab 2)
  const fetchTransactions = async () => {
    setLoadingLedger(true);
    try {
      const response = await budgetApi.getTransactions({ limit: 200 });
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Load insights (tab 4)
  const fetchInsights = async (m: number, y: number) => {
    setLoadingInsights(true);
    try {
      const response = await budgetApi.getInsights({ month: m, year: y });
      if (response.success && response.data) {
        setInsights(response.data);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Load yearly data
  const fetchYearlyOverview = async (y: number) => {
    try {
      const response = await budgetApi.getYearlyOverview(y);
      if (response.success && response.data) {
        setYearlyOverview(response.data);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Load goals list
  const fetchGoals = async () => {
    setLoadingGoals(true);
    try {
      const response = await budgetApi.getGoals();
      if (response.success && response.data) {
        setGoals(response.data);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingGoals(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard(selectedMonth, selectedYear);
      fetchInsights(selectedMonth, selectedYear);
      fetchYearlyOverview(selectedYear);
      fetchGoals();
    }
  }, [selectedMonth, selectedYear, user]);

  const handleRefresh = () => {
    fetchDashboard(selectedMonth, selectedYear);
    fetchInsights(selectedMonth, selectedYear);
    fetchYearlyOverview(selectedYear);
    fetchGoals();
  };

  // Form submits
  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number for amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingTx(true);
    try {
      const response = await budgetApi.addTransaction({
        type: txType,
        amount: parseFloat(txAmount),
        category: txCategory,
        merchant: txMerchant || undefined,
        description: txDescription || undefined,
        date: txDate || undefined,
      });

      if (response.success) {
        toast({
          title: "Transaction Recorded",
          description: `Successfully added ${txType} of $${parseFloat(txAmount).toFixed(2)}.`,
        });
        setIsAddTxOpen(false);
        // Reset form
        setTxAmount("");
        setTxMerchant("");
        setTxDescription("");
        setTxDate(new Date().toISOString().split("T")[0]);
        // Refresh
        handleRefresh();
      }
    } catch (e: any) {
      toast({
        title: "Failed to Add Transaction",
        description: e.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalTargetAmount || parseFloat(goalTargetAmount) <= 0) {
      toast({
        title: "Invalid Inputs",
        description: "Please specify a name and a positive target amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingGoal(true);
    try {
      const response = await budgetApi.createGoal({
        name: goalName,
        targetAmount: parseFloat(goalTargetAmount),
        deadline: goalDeadline || undefined,
        priority: goalPriority,
        notes: goalNotes || undefined,
        icon: goalIcon || undefined,
      });

      if (response.success) {
        toast({
          title: "Saving Goal Created",
          description: `Successfully created "${goalName}" with a target of $${parseFloat(goalTargetAmount).toLocaleString()}.`,
        });
        setIsAddGoalOpen(false);
        // Reset form
        setGoalName("");
        setGoalTargetAmount("");
        setGoalDeadline("");
        setGoalNotes("");
        setGoalIcon("🎯");
        // Refresh
        fetchGoals();
        fetchDashboard(selectedMonth, selectedYear);
      }
    } catch (e: any) {
      toast({
        title: "Failed to Create Goal",
        description: e.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalId || !contribAmount || parseFloat(contribAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please specify a positive contribution amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingContrib(true);
    try {
      const response = await budgetApi.contributeToGoal(contributeGoalId, {
        amount: parseFloat(contribAmount),
        note: contribNote || undefined,
      });

      if (response.success) {
        toast({
          title: "Contribution Saved",
          description: `Contributed $${parseFloat(contribAmount).toFixed(2)} to saving goal!`,
        });
        setContributeGoalId(null);
        setContribAmount("");
        setContribNote("");
        // Refresh
        fetchGoals();
        fetchDashboard(selectedMonth, selectedYear);
      }
    } catch (e: any) {
      toast({
        title: "Contribution Failed",
        description: e.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingContrib(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please drop or select a bank statement PDF, XLS, XLSX or CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingStatement(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await budgetApi.importStatement(formData);
      if (response.success && response.data) {
        toast({
          title: "Statement Processed",
          description: `${response.data.message || "Import success"}. Added ${response.data.transactionsImported} new transactions.`,
        });
        setIsImportOpen(false);
        setSelectedFile(null);
        handleRefresh();
      }
    } catch (e: any) {
      toast({
        title: "Import Failed",
        description: e.message || "Could not parse statement file. Make sure backend parser is loaded.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingStatement(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const response = await budgetApi.deleteTransaction(id);
      if (response.success) {
        toast({
          title: "Transaction Deleted",
          description: "Ledger transaction was removed.",
        });
        handleRefresh();
      }
    } catch (e: any) {
      toast({
        title: "Delete Failed",
        description: e.message || "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleTriggerAInsights = async () => {
    setGeneratingInsights(true);
    try {
      const response = await budgetApi.generateInsights();
      if (response.success && response.data) {
        setInsights(response.data);
        toast({
          title: "AI Insights Updated",
          description: "Refreshed and generated deep financial insights.",
        });
      }
    } catch (e: any) {
      toast({
        title: "Failed to Generate Insights",
        description: e.message || "AI model returned an error.",
        variant: "destructive",
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Redirect unauthenticated user
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Financial Profile...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Pre-process recharts data structures
  const dailySpendingChartData = dashboard?.dailySpending
    ? Object.entries(dashboard.dailySpending)
        .map(([date, amount]) => ({
          date: date.substring(5), // mm-dd
          amount,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const categoryBreakdownChartData = dashboard?.categoryBreakdown
    ? Object.entries(dashboard.categoryBreakdown).map(([name, val]) => ({
        name,
        value: val.total,
      }))
    : [];

  const yearlyOverviewChartData = yearlyOverview?.monthly
    ? Object.entries(yearlyOverview.monthly).map(([monthStr, data]) => ({
        month: monthStr,
        income: data.income,
        expenses: data.expenses,
        savings: data.savings,
      }))
    : [];

  // Filter & Sort Transactions list for Ledger Tab
  const filteredTransactions = transactions
    .filter((t) => {
      if (ledgerFilterType !== "all" && t.type !== ledgerFilterType) return false;
      if (ledgerFilterCategory !== "all" && t.category !== ledgerFilterCategory) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (ledgerSortField === "date") {
        comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
      } else if (ledgerSortField === "amount") {
        comparison = a.amount - b.amount;
      }
      return ledgerSortOrder === "asc" ? comparison : -comparison;
    });

  const getPriorityBadgeColor = (p: string) => {
    switch (p.toLowerCase()) {
      case "critical":
        return "bg-rose-500/20 text-rose-500 border border-rose-500/30";
      case "high":
        return "bg-amber-500/20 text-amber-500 border border-amber-500/30";
      case "medium":
        return "bg-cyan-500/20 text-cyan-500 border border-cyan-500/30";
      default:
        return "bg-slate-500/20 text-slate-500 border border-slate-500/30";
    }
  };

  const getGoalStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30";
      case "failed":
        return "bg-rose-500/20 text-rose-500 border border-rose-500/30";
      default:
        return "bg-amber-500/20 text-amber-500 border border-amber-500/30";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* ── Top Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 select-none flex gap-1 items-center">
              <Sparkle className="w-3.5 h-3.5 fill-current animate-pulse" /> Finance Sandbox
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" /> Personal Finance & Budget
          </h1>
          <p className="text-sm text-muted-foreground">
            Plan limits, upload bank statements, organize ledgers and unlock AI financial summaries.
          </p>
        </div>

        {/* Refresh, Period & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:self-end">
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Reload budget statistics">
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Month Dropdown */}
          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(parseInt(val))}
          >
            <SelectTrigger className="w-[120px] bg-background">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Dropdown */}
          <Select
            value={selectedYear.toString()}
            onValueChange={(val) => setSelectedYear(parseInt(val))}
          >
            <SelectTrigger className="w-[90px] bg-background">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027, 2028].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsImportOpen(true)} variant="outline" className="gap-1 bg-background hover:bg-muted">
            <Upload className="w-4 h-4" /> Import Statement
          </Button>

          <Button onClick={() => setIsAddTxOpen(true)} className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Cards Grid ── */}
      {loadingDashboard ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/20 border-border/40 h-24" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {/* NET SAVINGS */}
          <Card className="bg-card/5 backdrop-blur-md border-border/30 relative overflow-hidden group hover:border-primary/20 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl -mr-4 -mt-4 pointer-events-none" />
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between text-muted-foreground">
                Net Savings {(dashboard?.summary.netSavings ?? 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className={`text-xl font-bold tracking-tight ${(dashboard?.summary.netSavings ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ${dashboard?.summary.netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </CardContent>
          </Card>

          {/* SAVINGS RATE */}
          <Card className="bg-card/5 backdrop-blur-md border-border/30 relative overflow-hidden group hover:border-primary/20 transition-colors">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between text-muted-foreground">
                Savings Rate <Percent className="w-3.5 h-3.5 text-blue-400" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-xl font-bold tracking-tight text-foreground">
                {(dashboard?.summary.savingsRate ?? 0).toFixed(1)}%
              </span>
            </CardContent>
          </Card>

          {/* TOTAL INCOME */}
          <Card className="bg-card/5 backdrop-blur-md border-border/30 relative overflow-hidden group hover:border-primary/20 transition-colors">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between text-muted-foreground">
                Total Income <Plus className="w-3.5 h-3.5 text-emerald-400" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-xl font-bold tracking-tight text-emerald-400">
                ${dashboard?.summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </CardContent>
          </Card>

          {/* TOTAL EXPENSES */}
          <Card className="bg-card/5 backdrop-blur-md border-border/30 relative overflow-hidden group hover:border-primary/20 transition-colors">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between text-muted-foreground">
                Total Expenses <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-xl font-bold tracking-tight text-rose-400">
                ${dashboard?.summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </CardContent>
          </Card>

          {/* AVG DAILY SPEND */}
          <Card className="bg-card/5 backdrop-blur-md border-border/30 relative overflow-hidden group hover:border-primary/20 transition-colors">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between text-muted-foreground">
                Avg Daily Spend <Calendar className="w-3.5 h-3.5 text-amber-400" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-xl font-bold tracking-tight text-foreground">
                ${dashboard?.summary.avgDailySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </CardContent>
          </Card>

          {/* PROJECTED SPEND */}
          <Card className="bg-card/5 backdrop-blur-md border-border/30 relative overflow-hidden group hover:border-primary/20 transition-colors">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between text-muted-foreground">
                Projected Spend <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-xl font-bold tracking-tight text-foreground">
                ${dashboard?.summary.projectedMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Tabs Layout ── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/50 border border-border/30 p-1 mb-6 rounded-xl flex w-fit gap-1">
          <TabsTrigger value="overview" className="rounded-lg text-sm font-medium px-4 py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-lg text-sm font-medium px-4 py-2" onClick={fetchTransactions}>
            Ledger & Transactions
          </TabsTrigger>
          <TabsTrigger value="goals" className="rounded-lg text-sm font-medium px-4 py-2" onClick={fetchGoals}>
            Saving Goals
          </TabsTrigger>
          <TabsTrigger value="insights" className="rounded-lg text-sm font-medium px-4 py-2">
            AI Financial Insights
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: OVERVIEW ==================== */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart: Daily Spending Trend */}
            <Card className="lg:col-span-2 bg-card/5 border-border/30 rounded-2xl relative overflow-hidden p-6">
              <div className="absolute top-0 right-0 w-36 h-36 bg-primary/5 rounded-full blur-[50px] -mr-8 -mt-8 pointer-events-none" />
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" /> Daily Spending Trend (this period)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Shows daily aggregated expense and manual transaction flows.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[280px]">
                {dailySpendingChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
                    No transactions recorded for this period yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySpendingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-40" />
                      <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          borderColor: "var(--border)",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                        labelFormatter={(label) => `Date: ${label}`}
                        formatter={(val: any) => [`$${val.toFixed(2)}`, "Expenses"]}
                      />
                      <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#spendGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Categories Breakdown */}
            <Card className="bg-card/5 border-border/30 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" /> Spending Categories
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Breakdown of categories and limits utilization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {categoryBreakdownChartData.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
                      No categories data.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categoryBreakdownChartData.map((item) => {
                        // Predefined arbitrary budget values for UI visual aesthetics if backend lacks budget limit
                        const progressMax = 500; 
                        const percentage = Math.min((item.value / progressMax) * 100, 100);
                        return (
                          <div key={item.name} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                                {item.name}
                              </span>
                              <span className="text-foreground font-semibold">
                                ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${progressMax}
                              </span>
                            </div>
                            <Progress value={percentage} className="h-1.5 bg-muted/40" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Merchants List */}
            <Card className="bg-card/5 border-border/30 rounded-2xl p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-400" /> Top Merchants
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Where you spend the most cash.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {(!dashboard?.topMerchants || dashboard.topMerchants.length === 0) ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No merchants tracked.
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {dashboard.topMerchants.map((merchant, idx) => (
                      <div key={idx} className="flex justify-between py-3 items-center text-sm">
                        <span className="font-medium text-foreground flex items-center gap-2">
                          <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs text-muted-foreground font-bold">
                            {idx + 1}
                          </span>
                          {merchant.name || "Unknown Merchant"}
                        </span>
                        <span className="font-semibold text-rose-400">
                          -${merchant.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Income vs Expenses Bar Chart */}
            <Card className="bg-card/5 border-border/30 rounded-2xl p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                  <SavingsRateIcon className="w-4 h-4 text-blue-400" /> Yearly Growth Trend
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Year-to-date monthly income vs expenses.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[240px]">
                {yearlyOverviewChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
                    No yearly summary data loaded.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyOverviewChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-40" />
                      <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          borderColor: "var(--border)",
                          borderRadius: "12px",
                        }}
                        formatter={(val: any) => [`$${val.toFixed(0)}`]}
                      />
                      <Bar dataKey="income" fill="var(--emerald-500)" radius={[4, 4, 0, 0]} opacity={0.8} name="Income" />
                      <Bar dataKey="expenses" fill="var(--rose-500)" radius={[4, 4, 0, 0]} opacity={0.8} name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== TAB 2: LEDGER ==================== */}
        <TabsContent value="ledger" className="space-y-4">
          <Card className="bg-card/5 border-border/30 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                {/* Filter Type */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Type:</span>
                  <Select value={ledgerFilterType} onValueChange={setLedgerFilterType}>
                    <SelectTrigger className="w-[120px] h-9 bg-background">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Category */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Category:</span>
                  <Select value={ledgerFilterCategory} onValueChange={setLedgerFilterCategory}>
                    <SelectTrigger className="w-[140px] h-9 bg-background">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {PREDEFINED_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Sort:</span>
                  <Select
                    value={ledgerSortField}
                    onValueChange={(val) => setLedgerSortField(val as "date" | "amount")}
                  >
                    <SelectTrigger className="w-[110px] h-9 bg-background">
                      <SelectValue placeholder="Sort Field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 bg-background"
                  onClick={() => setLedgerSortOrder(ledgerSortOrder === "asc" ? "desc" : "asc")}
                >
                  {ledgerSortOrder === "asc" ? "Ascending" : "Descending"}
                </Button>
              </div>
            </div>

            {loadingLedger ? (
              <div className="py-12 text-center text-muted-foreground animate-pulse flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm">Fetching detailed transactions ledger...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border/40 rounded-2xl flex flex-col items-center justify-center">
                <FolderMinus className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <h4 className="text-base font-medium text-foreground mb-1">No Ledger Entries Found</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Adjust filters or record a new transaction manually to populate the ledger database.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[110px]">Date</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="text-right w-[110px]">Amount</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(tx.transaction_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {tx.merchant || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted text-muted-foreground hover:bg-muted font-normal">
                            {tx.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {tx.description || <span className="opacity-40 italic">No notes</span>}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              tx.type === "income"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : tx.type === "expense"
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                : tx.type === "refund"
                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                            }
                          >
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-bold ${tx.type === "income" || tx.type === "refund" ? "text-emerald-400" : "text-rose-400"}`}>
                          {tx.type === "income" || tx.type === "refund" ? "+" : "-"}${tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteTransaction(tx.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ==================== TAB 3: SAVING GOALS ==================== */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-foreground">Track Saving Goals</h3>
              <p className="text-sm text-muted-foreground">Keep money aside for big purchases and critical landmarks.</p>
            </div>
            <Button onClick={() => setIsAddGoalOpen(true)} className="gap-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Add Saving Goal
            </Button>
          </div>

          {loadingGoals ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse bg-muted/20 border-border/40 h-48" />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <Card className="p-16 text-center border border-dashed border-border/40 bg-card/5 flex flex-col items-center justify-center">
              <PiggyBank className="w-14 h-14 text-muted-foreground/30 mb-3" />
              <h4 className="text-base font-semibold text-foreground mb-1">No Active Saving Goals</h4>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Define priority targets like an emergency fund or holiday getaway and save step-by-step.
              </p>
              <Button onClick={() => setIsAddGoalOpen(true)} variant="outline" className="gap-1 bg-background hover:bg-muted">
                <Plus className="w-4 h-4" /> Define Goal Now
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => {
                const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                return (
                  <Card key={goal.id} className="bg-card/5 border-border/30 rounded-2xl overflow-hidden hover:border-primary/20 transition-colors flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{goal.icon || "🎯"}</span>
                        <div className="flex gap-1.5">
                          <Badge className={getPriorityBadgeColor(goal.priority)} variant="outline">
                            {goal.priority}
                          </Badge>
                          <Badge className={getGoalStatusColor(goal.status)} variant="outline">
                            {goal.status}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-base font-semibold tracking-tight text-foreground">{goal.name}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                        {goal.notes || "No extra descriptions or priority timelines set."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground">{percent.toFixed(0)}%</span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Saved</p>
                          <p className="font-bold text-emerald-400">${goal.current_amount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="font-bold text-foreground">${goal.target_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/20 border-t border-border/20 p-4 flex gap-2">
                      <Button
                        onClick={() => setContributeGoalId(goal.id)}
                        className="w-full h-8 text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border/50"
                        variant="outline"
                      >
                        Contribute Funds
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ==================== TAB 4: AI INSIGHTS ==================== */}
        <TabsContent value="insights" className="space-y-6">
          <Card className="bg-card/5 border-border/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/10 via-primary/5 to-transparent rounded-full blur-[60px] pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-5 mb-6">
              <div>
                <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" /> AI Financial Diagnostics
                </h3>
                <p className="text-sm text-muted-foreground">
                  Groq LLM generated highlights, anomaly checks, and recommendations based on your spending history.
                </p>
              </div>

              <Button
                onClick={handleTriggerAInsights}
                disabled={generatingInsights}
                className="gap-2 bg-gradient-to-r from-indigo-500 via-primary to-purple-600 text-white font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
              >
                {generatingInsights ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Analyzing Transactions...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate Fresh Insights
                  </>
                )}
              </Button>
            </div>

            {loadingInsights ? (
              <div className="py-12 text-center text-muted-foreground animate-pulse flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm">Fetching financial diagnostics records...</p>
              </div>
            ) : !insights ? (
              <div className="py-16 text-center border border-dashed border-border/40 rounded-2xl flex flex-col items-center justify-center bg-card/5">
                <Sparkle className="w-12 h-12 text-indigo-400/30 mb-3" />
                <h4 className="text-base font-semibold text-foreground mb-1">AI Financial Report Empty</h4>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Click the button above to run diagnostic algorithms over this period's ledger entries.
                </p>
                <Button onClick={handleTriggerAInsights} variant="outline" className="gap-1 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10">
                  <Sparkles className="w-4 h-4" /> Trigger Diagnostic Report
                </Button>
              </div>
            ) : (
              <div className="space-y-6 relative z-10">
                {/* MoM comparisons */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="bg-background/40 border-border/20 p-4">
                    <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider mb-1">Month-over-Month Income</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {insights.month_over_month?.income_change_pct !== undefined
                          ? `${insights.month_over_month.income_change_pct >= 0 ? "+" : ""}${insights.month_over_month.income_change_pct.toFixed(1)}%`
                          : "0.0%"}
                      </span>
                      {insights.month_over_month?.income_change_pct !== undefined && (
                        <Badge
                          variant="outline"
                          className={insights.month_over_month.income_change_pct >= 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}
                        >
                          {insights.month_over_month.income_change_pct >= 0 ? "Upward Flow" : "Downward Flow"}
                        </Badge>
                      )}
                    </div>
                  </Card>
                  <Card className="bg-background/40 border-border/20 p-4">
                    <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider mb-1">Month-over-Month Expenses</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {insights.month_over_month?.expense_change_pct !== undefined
                          ? `${insights.month_over_month.expense_change_pct >= 0 ? "+" : ""}${insights.month_over_month.expense_change_pct.toFixed(1)}%`
                          : "0.0%"}
                      </span>
                      {insights.month_over_month?.expense_change_pct !== undefined && (
                        <Badge
                          variant="outline"
                          className={insights.month_over_month.expense_change_pct <= 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}
                        >
                          {insights.month_over_month.expense_change_pct <= 0 ? "Reduced Outflow" : "Increased Outflow"}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </div>

                {/* AI Summary Text */}
                <div className="bg-background/50 border border-border/20 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" /> AI Summary & Strategy
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {insights.ai_summary || "AI Summary text is currently being parsed."}
                  </p>
                </div>

                {/* Grid: Tips & Anomalies */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Tips list */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" /> Actionable Saving Tips
                    </h4>
                    {(!insights.ai_tips || insights.ai_tips.length === 0) ? (
                      <p className="text-xs text-muted-foreground italic">No tips generated.</p>
                    ) : (
                      <ul className="space-y-2">
                        {insights.ai_tips.map((tip, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-muted-foreground items-start">
                            <span className="text-emerald-400 mt-1 select-none">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Anomalies list */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <BadgeAlert className="w-4 h-4 text-rose-400" /> Anomaly Warnings
                    </h4>
                    {(!insights.anomalies || insights.anomalies.length === 0) ? (
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-1.5">
                        <Sparkle className="w-4 h-4 fill-current" /> No major spending anomalies detected. Keep up the disciplined budget habits!
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {insights.anomalies.map((anom, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-muted-foreground items-start">
                            <span className="text-rose-400 mt-1 select-none">•</span>
                            <span>{anom}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================
          DIALOGS & MODALS
          ======================================================== */}

      {/* ── Add Transaction Dialog ── */}
      <Dialog open={isAddTxOpen} onOpenChange={setIsAddTxOpen}>
        <DialogContent className="max-w-md bg-background border border-border/50 shadow-2xl rounded-2xl z-[99999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Record Transaction
            </DialogTitle>
            <DialogDescription>
              Record a manual income, expense or refund entry into your finance ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTransactionSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Type</label>
                <Select value={txType} onValueChange={(val) => setTxType(val as any)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="bg-background font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <Select value={txCategory} onValueChange={setTxCategory}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="bg-background"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Merchant / Source</label>
              <Input
                placeholder="Amazon, Starbucks, Employer etc."
                value={txMerchant}
                onChange={(e) => setTxMerchant(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Memo / Description</label>
              <textarea
                className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Optional notes or context about this transaction..."
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddTxOpen(false)} className="bg-background hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingTx} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                {isSubmittingTx ? "Saving..." : "Record Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Goal Dialog ── */}
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent className="max-w-md bg-background border border-border/50 shadow-2xl rounded-2xl z-[99999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-primary" /> Define Saving Goal
            </DialogTitle>
            <DialogDescription>
              Set up a target piggy bank fund to budget and track contributions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddGoalSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Goal Name</label>
              <Input
                placeholder="e.g. Emergency Fund, New Laptop, Holiday"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="bg-background"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Target Amount ($)</label>
                <Input
                  type="number"
                  placeholder="1,000.00"
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(e.target.value)}
                  className="bg-background font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Icon (Emoji)</label>
                <Input
                  placeholder="🎯, 💻, 🚗, 🌴"
                  value={goalIcon}
                  onChange={(e) => setGoalIcon(e.target.value)}
                  className="bg-background text-center text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Deadline</label>
                <Input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                <Select value={goalPriority} onValueChange={(val) => setGoalPriority(val as any)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
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
              <label className="text-xs font-semibold text-muted-foreground">Goal Notes</label>
              <textarea
                className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe why you want to save or deadline guidelines..."
                value={goalNotes}
                onChange={(e) => setGoalNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddGoalOpen(false)} className="bg-background hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingGoal} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
                {isSubmittingGoal ? "Creating..." : "Define Goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Contribute Funds Modal ── */}
      <Dialog open={contributeGoalId !== null} onOpenChange={(open) => !open && setContributeGoalId(null)}>
        <DialogContent className="max-w-sm bg-background border border-border/50 shadow-2xl rounded-2xl z-[99999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Contribute to Saving Goal
            </DialogTitle>
            <DialogDescription>
              Increase the current saved amount of this goal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleContributeSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Contribution Amount ($)</label>
              <Input
                type="number"
                placeholder="100.00"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                className="bg-background font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Note / Comment</label>
              <Input
                placeholder="e.g. Month-end surplus funds transfer"
                value={contribNote}
                onChange={(e) => setContribNote(e.target.value)}
                className="bg-background"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setContributeGoalId(null)} className="bg-background hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingContrib} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                {isSubmittingContrib ? "Processing..." : "Save Contribution"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Import Statement Dialog ── */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-md bg-background border border-border/50 shadow-2xl rounded-2xl z-[99999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Import Bank Statement
            </DialogTitle>
            <DialogDescription>
              Drop a bank statement statement PDF, XLS, XLSX or CSV. The backend parses it automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
            <div className="border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded-xl p-8 text-center bg-muted/10 relative cursor-pointer">
              <input
                type="file"
                accept=".pdf,.xls,.xlsx,.csv"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-semibold text-foreground truncate max-w-[280px] mx-auto">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB — Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-foreground">Select or Drag bank statement file</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports PDF, XLS, XLSX, and CSV formats</p>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)} className="bg-background hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" disabled={isUploadingStatement} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
                {isUploadingStatement ? "Processing Parser..." : "Parse and Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
