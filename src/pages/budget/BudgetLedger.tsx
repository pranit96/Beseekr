import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  RefreshCw,
  FolderMinus,
  ArrowUpDown,
} from "lucide-react";
import { useBudget, getCurrencySymbol, PREDEFINED_CATEGORIES } from "./BudgetLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default function BudgetLedger() {
  const { transactions, fetchTransactions, handleRefresh, preferredCurrencySymbol } = useBudget();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial load
  const handleLoad = async () => {
    setLoading(true);
    await fetchTransactions();
    setLoading(false);
  };

  // Fetch on first render
  useEffect(() => {
    handleLoad();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (filterType !== "all" && t.type !== filterType) return false;
        if (filterCategory !== "all" && t.category !== filterCategory) return false;
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === "date") {
          comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
        } else {
          comparison = a.amount - b.amount;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [transactions, filterType, filterCategory, sortField, sortOrder]);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      const response = await budgetApi.deleteTransaction(deleteConfirmId);
      if (response.success) {
        toast({ title: "Transaction Deleted", description: "Ledger entry removed." });
        setDeleteConfirmId(null);
        handleRefresh();
      }
    } catch (e: any) {
      toast({ title: "Delete Failed", description: e.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "income": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "expense": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "refund": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      default: return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
      <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-2xl overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-border/20">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[110px] h-9 rounded-xl bg-background text-sm">
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

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[130px] h-9 rounded-xl bg-background text-sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PREDEFINED_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortField} onValueChange={(val) => setSortField(val as any)}>
              <SelectTrigger className="w-[100px] h-9 rounded-xl bg-background text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline" size="sm"
              className="h-9 px-3 rounded-xl bg-background text-sm gap-1.5"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortOrder === "asc" ? "Asc" : "Desc"}
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Fetching transactions…</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center border-b border-border/10">
            <FolderMinus className="w-12 h-12 text-muted-foreground/20 mb-3" />
            <h4 className="text-base font-medium text-foreground mb-1">No Entries Found</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              Adjust filters or record a new transaction to populate the ledger.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                    <TableHead className="w-[90px]">Type</TableHead>
                    <TableHead className="text-right w-[110px]">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredTransactions.map((tx, idx) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        className="hover:bg-muted/20 transition-colors border-b border-border/10"
                      >
                        <TableCell className="font-medium whitespace-nowrap text-sm">
                          {new Date(tx.transaction_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground text-sm">{tx.merchant || "—"}</div>
                          {tx.institution_name && (
                            <div className="text-[10px] text-muted-foreground font-normal flex items-center gap-1 mt-0.5">
                              <span className="capitalize">{tx.institution_name}</span>
                              {tx.account_type && (
                                <>
                                  <span className="opacity-40">•</span>
                                  <span>{tx.account_type === "credit_card" ? "Credit Card" : tx.account_type === "savings_account" ? "Savings" : tx.account_type}</span>
                                </>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted/50 text-muted-foreground hover:bg-muted font-normal text-xs rounded-lg">
                            {tx.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate text-sm">
                          {tx.description || <span className="opacity-40 italic">No notes</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs border rounded-lg", getTypeBadgeStyle(tx.type))}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn("text-right font-bold tabular-nums text-sm", tx.type === "income" || tx.type === "refund" ? "text-emerald-500" : "text-rose-500")}>
                          {tx.type === "income" || tx.type === "refund" ? "+" : "-"}{getCurrencySymbol(tx.currency)}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg" onClick={() => setDeleteConfirmId(tx.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-border/10">
              <AnimatePresence>
                {filteredTransactions.map((tx, idx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="flex items-center justify-between px-4 py-3.5 gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-foreground truncate">{tx.merchant || tx.category}</span>
                        <Badge className={cn("text-[10px] border rounded-md shrink-0", getTypeBadgeStyle(tx.type))}>
                          {tx.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {new Date(tx.transaction_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {tx.institution_name && ` · ${tx.institution_name} (${tx.account_type === "credit_card" ? "Card" : "Savings"})`}
                        {tx.description && ` · ${tx.description}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("font-bold text-sm tabular-nums", tx.type === "income" || tx.type === "refund" ? "text-emerald-500" : "text-rose-500")}>
                        {tx.type === "income" || tx.type === "refund" ? "+" : "-"}{getCurrencySymbol(tx.currency)}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteConfirmId(tx.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Transaction count footer */}
        {filteredTransactions.length > 0 && (
          <div className="px-5 py-3 border-t border-border/20 text-xs text-muted-foreground">
            Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm bg-background border border-border/50 shadow-2xl rounded-2xl z-[99999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" /> Delete Transaction
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The transaction will be permanently removed from your ledger.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded-xl bg-background">Cancel</Button>
            <Button onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground rounded-xl font-medium">
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
