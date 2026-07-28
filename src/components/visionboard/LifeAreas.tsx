import { useState } from "react";
import { motion } from "framer-motion";
import type { LifeArea } from "@/api/visionboard";

const AREA_META: Record<string, { label: string; icon: string }> = {
  career: { label: "Career", icon: "💼" },
  learning: { label: "Learning", icon: "🧠" },
  health: { label: "Health", icon: "💪" },
  relationships: { label: "Relationships", icon: "❤️" },
  finance: { label: "Finance", icon: "💰" },
};

interface LifeAreasProps {
  areas: LifeArea[];
  onUpdate: (areas: Array<{ area: string; score: number }>) => Promise<any>;
}

function ScoreBar({
  area,
  score,
  onScoreChange,
}: {
  area: string;
  score: number;
  onScoreChange: (s: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const meta = AREA_META[area] || { label: area, icon: "⭐" };

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    onScoreChange(Math.min(100, Math.max(0, pct)));
  }

  const color = score >= 70 ? "#8FA689" : score >= 40 ? "#C9714A" : "#A89070";

  return (
    <div className="vb-area-row">
      <span className="vb-area-icon">{meta.icon}</span>
      <span className="vb-area-label">{meta.label}</span>
      <div
        className="vb-bar-track"
        onClick={handleClick}
        title="Click to set score"
      >
        <motion.div
          className="vb-bar-fill"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 }}
        />
      </div>
      <span className="vb-area-score">{score}%</span>
    </div>
  );
}

export function LifeAreas({ areas, onUpdate }: LifeAreasProps) {
  const [localAreas, setLocalAreas] = useState<LifeArea[]>(areas);
  const [dirty, setDirty] = useState(false);

  function handleChange(areaKey: string, score: number) {
    setLocalAreas((prev) =>
      prev.map((a) => (a.area === areaKey ? { ...a, score } : a)),
    );
    setDirty(true);
  }

  async function save() {
    await onUpdate(localAreas.map((a) => ({ area: a.area, score: a.score })));
    setDirty(false);
  }

  const ORDER = ["career", "learning", "health", "relationships", "finance"];
  const sorted = [...localAreas].sort(
    (a, b) => ORDER.indexOf(a.area) - ORDER.indexOf(b.area),
  );

  return (
    <div className="vb-section vb-life-areas">
      <div className="vb-section-header">
        <div className="vb-section-label">
          <span>🌡</span>
          <span>Life Areas</span>
        </div>
        {dirty && (
          <motion.button
            className="vb-btn-primary vb-btn-sm"
            onClick={save}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            Save
          </motion.button>
        )}
      </div>

      <div className="vb-areas-list">
        {sorted.map((a) => (
          <ScoreBar
            key={a.area}
            area={a.area}
            score={a.score}
            onScoreChange={(s) => handleChange(a.area, s)}
          />
        ))}
      </div>

      <p className="vb-area-hint">Click on any bar to update your score</p>
    </div>
  );
}
