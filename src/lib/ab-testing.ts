type Variant = {
  name: string;
  weight: number;
};

type Experiment = {
  id: string;
  variants: Variant[];
};

class ABTesting {
  private experiments = new Map<string, Experiment>();
  private assignments = new Map<string, string>();

  constructor() {
    if (typeof window !== "undefined") {
      this.loadAssignments();
    }
  }

  defineExperiment(id: string, variants: Variant[]) {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.001) {
      throw new Error("Variant weights must sum to 1");
    }
    this.experiments.set(id, { id, variants });
  }

  getVariant(experimentId: string, userId?: string): string {
    const key = `${experimentId}:${userId || "anonymous"}`;

    if (this.assignments.has(key)) {
      return this.assignments.get(key)!;
    }

    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const variant = this.selectVariant(experiment.variants);
    this.assignments.set(key, variant);
    this.saveAssignments();

    return variant;
  }

  private selectVariant(variants: Variant[]): string {
    const random = Math.random();
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant.name;
      }
    }

    return variants[variants.length - 1].name;
  }

  private loadAssignments() {
    try {
      const stored = localStorage.getItem("ab_assignments");
      if (stored) {
        const data = JSON.parse(stored);
        this.assignments = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error("Failed to load AB test assignments:", error);
    }
  }

  private saveAssignments() {
    try {
      const data = Object.fromEntries(this.assignments);
      localStorage.setItem("ab_assignments", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save AB test assignments:", error);
    }
  }
}

export const abTesting = new ABTesting();
