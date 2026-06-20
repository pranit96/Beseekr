import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, NavLink, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  Plus,
  Upload,
  RefreshCw,
  Calendar,
  FileText,
  X,
  Sparkles,
  LayoutDashboard,
  BookOpen,
  Target,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { budgetApi, Transaction, SavingGoal, BudgetInsights, YearlyOverview, BudgetDashboard } from "@/api/budget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────
const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];

export const PREDEFINED_CATEGORIES = [
  "Housing", "Utilities", "Food/Groceries", "Transportation",
  "Entertainment", "Healthcare", "Salary", "Investment", "Refund", "Other",
];

export const getCurrencySymbol = (code?: string) => {
  if (!code) return "$";
  switch (code.toUpperCase()) {
    case "INR": return "₹";
    case "EUR": return "€";
    case "GBP": return "£";
    case "CAD": return "CA$";
    case "USD": default: return "$";
  }
};

// ─── Shared Context ──────────────────────────────────────────────
interface BudgetContextType {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
  dashboard: BudgetDashboard | null;
  insights: BudgetInsights | null;
  yearlyOverview: YearlyOverview | null;
  transactions: Transaction[];
  goals: SavingGoal[];
  setDashboard: (d: BudgetDashboard | null) => void;
  setInsights: (i: BudgetInsights | null) => void;
  setYearlyOverview: (y: YearlyOverview | null) => void;
  setTransactions: (t: Transaction[]) => void;
  setGoals: (g: SavingGoal[]) => void;
  loadingDashboard: boolean;
  preferredCurrency: string;
  preferredCurrencySymbol: string;
  handleRefresh: () => void;
  fetchGoals: () => void;
  fetchTransactions: () => void;
}

const BudgetContext = createContext<BudgetContextType | null>(null);
export const useBudget = () => {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetLayout");
  return ctx;
};

// ─── Sub-Navigation Items ────────────────────────────────────────
const SUB_NAV = [
  { label: "Overview", href: "/dashboard/budget/overview", icon: LayoutDashboard },
  { label: "Ledger", href: "/dashboard/budget/ledger", icon: BookOpen },
  { label: "Goals", href: "/dashboard/budget/goals", icon: Target },
  { label: "Insights", href: "/dashboard/budget/insights", icon: Lightbulb },
];

// ─── Component ───────────────────────────────────────────────────
export default function BudgetLayout() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const preferredCurrency = (user as any)?.preferred_currency || "USD";
  const preferredCurrencySymbol = getCurrencySymbol(preferredCurrency);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data states
  const [dashboard, setDashboard] = useState<BudgetDashboard | null>(null);
  const [insights, setInsights] = useState<BudgetInsights | null>(null);
  const [yearlyOverview, setYearlyOverview] = useState<YearlyOverview | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Dialogs
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Add Transaction Form
  const [txType, setTxType] = useState<"income" | "expense" | "transfer" | "refund">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("Food/Groceries");
  const [txMerchant, setTxMerchant] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Import Form
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingStatement, setIsUploadingStatement] = useState(false);

  // ─── Data Fetching ─────────────────────────────────────────────
  const fetchDashboard = async (m: number, y: number) => {
    setLoadingDashboard(true);
    try {
      const response = await budgetApi.getDashboard({ month: m, year: y });
      if (response.success && response.data) {
        setDashboard(response.data);
        if (response.data.recentTransactions) setTransactions(response.data.recentTransactions);
        if (response.data.savingGoals) setGoals(response.data.savingGoals);
      }
    } catch (e: any) {
      toast({ title: "Error loading dashboard", description: e.message || "Failed to retrieve budget stats.", variant: "destructive" });
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await budgetApi.getTransactions({ limit: 200 });
      if (response.success && response.data) setTransactions(response.data.transactions);
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchInsights = async (m: number, y: number) => {
    try {
      const response = await budgetApi.getInsights({ month: m, year: y });
      if (response.success && response.data) setInsights(response.data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchYearlyOverview = async (y: number) => {
    try {
      const response = await budgetApi.getYearlyOverview(y);
      if (response.success && response.data) setYearlyOverview(response.data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await budgetApi.getGoals();
      if (response.success && response.data) setGoals(response.data);
    } catch (e: any) {
      console.error(e);
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

  // ─── Form Handlers ─────────────────────────────────────────────
  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive number.", variant: "destructive" });
      return;
    }
    setIsSubmittingTx(true);
    try {
      const response = await budgetApi.addTransaction({
        type: txType, amount: parseFloat(txAmount), category: txCategory,
        merchant: txMerchant || undefined, description: txDescription || undefined, date: txDate || undefined,
      });
      if (response.success) {
        toast({ title: "Transaction Recorded", description: `Added ${txType} of ${preferredCurrencySymbol}${parseFloat(txAmount).toFixed(2)}.` });
        setIsAddTxOpen(false);
        setTxAmount(""); setTxMerchant(""); setTxDescription(""); setTxDate(new Date().toISOString().split("T")[0]);
        handleRefresh();
      }
    } catch (e: any) {
      toast({ title: "Failed to Add Transaction", description: e.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast({ title: "No Files Selected", description: "Please select one or more bank statement files.", variant: "destructive" });
      return;
    }
    setIsUploadingStatement(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      const response = await budgetApi.importStatement(formData);
      if (response.success && response.data) {
        toast({ title: "Statements Processed", description: response.data.message || "Import success" });
        setIsImportOpen(false); setSelectedFiles([]); handleRefresh();
      }
    } catch (e: any) {
      toast({ title: "Import Failed", description: e.message || "Could not parse statement files.", variant: "destructive" });
    } finally {
      setIsUploadingStatement(false);
    }
  };

  // ─── Auth Guards ───────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading your wallet…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const contextValue: BudgetContextType = {
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    dashboard, insights, yearlyOverview, transactions, goals,
    setDashboard, setInsights, setYearlyOverview, setTransactions, setGoals,
    loadingDashboard, preferredCurrency, preferredCurrencySymbol,
    handleRefresh, fetchGoals, fetchTransactions,
  };

  return (
    <BudgetContext.Provider value={contextValue}>
      <div className="space-y-6 pb-10">
        {/* ── Page Header ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 select-none flex gap-1.5 items-center text-xs font-medium">
                  <Wallet className="w-3 h-3" /> Wallet
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Your Finance Hub
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track spending, set goals, and get AI-powered financial insights.
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh" className="h-9 w-9 rounded-xl">
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                <SelectTrigger className="w-[80px] h-9 rounded-xl bg-background text-sm">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                <SelectTrigger className="w-[80px] h-9 rounded-xl bg-background text-sm">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Desktop action buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Button onClick={() => setIsImportOpen(true)} variant="outline" size="sm" className="gap-1.5 rounded-xl h-9 bg-background hover:bg-muted text-sm">
                  <Upload className="w-3.5 h-3.5" /> Import
                </Button>
                <Button onClick={() => setIsAddTxOpen(true)} size="sm" className="gap-1.5 rounded-xl h-9 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add Transaction
                </Button>
              </div>

              {/* Mobile action dropdown */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-xl h-9 bg-background">
                      <Plus className="w-3.5 h-3.5" /> Actions <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setIsAddTxOpen(true)} className="gap-2 rounded-lg cursor-pointer">
                      <Plus className="w-4 h-4" /> Add Transaction
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsImportOpen(true)} className="gap-2 rounded-lg cursor-pointer">
                      <Upload className="w-4 h-4" /> Import Statement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* ── Sub Navigation ────────────────────────────── */}
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/30 w-fit overflow-x-auto">
            {SUB_NAV.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
              return (
                <NavLink key={item.href} to={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="budgetActiveTab"
                        className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/50"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                      {item.label}
                    </span>
                  </motion.div>
                </NavLink>
              );
            })}
          </nav>
        </motion.div>

        {/* ── Page Content ────────────────────────────────── */}
        <Outlet />

        {/* ═══════════ Add Transaction Dialog ═══════════ */}
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
                    <SelectTrigger className="bg-background rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Amount ({preferredCurrency})</label>
                  <Input type="number" step="0.01" placeholder="0.00" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="bg-background font-mono rounded-xl" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Category</label>
                  <Select value={txCategory} onValueChange={setTxCategory}>
                    <SelectTrigger className="bg-background rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Date</label>
                  <Input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="bg-background rounded-xl" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Merchant / Source</label>
                <Input placeholder="Amazon, Starbucks, Employer etc." value={txMerchant} onChange={(e) => setTxMerchant(e.target.value)} className="bg-background rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Memo / Description</label>
                <textarea
                  className="flex min-h-[70px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Optional notes about this transaction…"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddTxOpen(false)} className="bg-background hover:bg-muted rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isSubmittingTx} className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium rounded-xl">
                  {isSubmittingTx ? "Saving…" : "Record Transaction"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══════════ Import Statement Dialog ═══════════ */}
        <Dialog open={isImportOpen} onOpenChange={(open) => { setIsImportOpen(open); if (!open) setSelectedFiles([]); }}>
          <DialogContent className="max-w-md bg-background border border-border/50 shadow-2xl rounded-2xl z-[99999]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" /> Import Bank Statements
              </DialogTitle>
              <DialogDescription>
                Drop one or more bank statement PDFs, XLS, XLSX or CSV files. The backend parses them automatically.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
              <div className="border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded-xl p-8 text-center bg-muted/10 relative cursor-pointer">
                <input
                  type="file" accept=".pdf,.xls,.xlsx,.csv" multiple
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => { if (e.target.files && e.target.files.length > 0) setSelectedFiles(Array.from(e.target.files)); }}
                />
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
                {selectedFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{selectedFiles.length} file(s) selected:</p>
                    <ul className="text-xs text-muted-foreground max-h-[100px] overflow-y-auto space-y-0.5 text-left max-w-[280px] mx-auto list-disc list-inside">
                      {selectedFiles.map((file, idx) => (<li key={idx} className="truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>))}
                    </ul>
                    <p className="text-xs text-primary mt-1">Click to change files</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-foreground">Select or Drag bank statement files</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports PDF, XLS, XLSX, and CSV formats</p>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)} className="bg-background hover:bg-muted rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isUploadingStatement} className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium rounded-xl">
                  {isUploadingStatement ? "Processing…" : "Parse & Upload"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </BudgetContext.Provider>
  );
}
