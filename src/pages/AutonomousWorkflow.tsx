// src/pages/AutonomousWorkflow.tsx
// Two-panel layout:
//   Left  → WorkflowHistorySidebar (collapsible, ~280px)
//   Right → WorkflowHistoryViewer (past run)  OR  AutonomousWorkflowInterface (run new)

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlobalHeader } from "@/components/GlobalHeader";
import { AutonomousWorkflowInterface } from "@/components/AutonomousWorkflowInterface";
import { WorkflowHistorySidebar } from "@/components/WorkflowHistorySidebar";
import { WorkflowHistoryViewer } from "@/components/WorkflowHistoryViewer";
import type { WorkflowExecution } from "@/components/WorkflowHistorySidebar";
import { motion, AnimatePresence } from "framer-motion";

type RightView =
  | { kind: "new" }
  | { kind: "history"; id: string };

const SIDEBAR_WIDTH = 280;

export default function AutonomousWorkflow() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightView, setRightView] = useState<RightView>({ kind: "new" });
  const queryClient = useQueryClient();

  // ── Callbacks ─────────────────────────────────────────────────────────────

  /** Called when a history item is clicked in the sidebar */
  const handleSelectExecution = useCallback((exec: WorkflowExecution) => {
    setRightView({ kind: "history", id: exec.id });
  }, []);

  /** Called when the user wants to start a fresh workflow */
  const handleNewWorkflow = useCallback(() => {
    setRightView({ kind: "new" });
  }, []);

  /**
   * Called by AutonomousWorkflowInterface when a workflow completes.
   * Invalidates the history cache so the sidebar auto-refreshes.
   */
  const handleWorkflowComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["workflow-history"] });
  }, [queryClient]);

  // ── Render ────────────────────────────────────────────────────────────────

  const selectedId =
    rightView.kind === "history" ? rightView.id : null;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Sidebar ── */}
        <AnimatePresence initial={false}>
          <motion.div
            key="sidebar"
            animate={{ width: sidebarCollapsed ? 48 : SIDEBAR_WIDTH }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="shrink-0 overflow-hidden"
            style={{ minWidth: sidebarCollapsed ? 48 : SIDEBAR_WIDTH }}
          >
            <WorkflowHistorySidebar
              selectedId={selectedId}
              onSelect={handleSelectExecution}
              onNewWorkflow={handleNewWorkflow}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            />
          </motion.div>
        </AnimatePresence>

        {/* ── Right: Main Pane ── */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {rightView.kind === "history" ? (
              <motion.div
                key={`history-${rightView.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 overflow-y-auto"
              >
                <WorkflowHistoryViewer
                  executionId={rightView.id}
                  onBack={handleNewWorkflow}
                  onNewWorkflow={handleNewWorkflow}
                />
              </motion.div>
            ) : (
              <motion.div
                key="new-workflow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0"
              >
                <AutonomousWorkflowInterface
                  onWorkflowComplete={handleWorkflowComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
