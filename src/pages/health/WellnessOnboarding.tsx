import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthProfile, useHealthPlan } from "@/hooks/use-health";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WellnessOnboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data: profile,
    isLoading: profileLoading,
    saveProfile,
  } = useHealthProfile();
  const plan = useHealthPlan();

  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  const [form, setForm] = useState({
    gender: "",
    dateOfBirth: "",
    heightCm: "",
    currentWeightKg: "",
    targetWeightKg: "",
    activityLevel: "",
    primaryGoal: "",
    trainingExperience: "",
    weeklyTrainingDays: "3",
    dietaryPreference: "",
    medicalConditions: "",
    injuries: "",
  });

  useEffect(() => {
    if (profile && !profileLoading) {
      setForm({
        gender: profile.gender ?? "",
        dateOfBirth: profile.date_of_birth ?? "",
        heightCm: profile.height_cm?.toString() ?? "",
        currentWeightKg: profile.current_weight_kg?.toString() ?? "",
        targetWeightKg: profile.target_weight_kg?.toString() ?? "",
        activityLevel: profile.activity_level ?? "",
        primaryGoal: profile.primary_goal ?? "",
        trainingExperience: profile.training_experience ?? "",
        weeklyTrainingDays: profile.weekly_training_days?.toString() ?? "3",
        dietaryPreference: profile.dietary_preference ?? "",
        medicalConditions: (profile.medical_conditions ?? []).join(", "),
        injuries: profile.injuries ?? "",
      });
    }
  }, [profile, profileLoading]);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      await saveProfile.mutateAsync({
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        currentWeightKg: form.currentWeightKg
          ? Number(form.currentWeightKg)
          : undefined,
        targetWeightKg: form.targetWeightKg
          ? Number(form.targetWeightKg)
          : undefined,
        activityLevel: form.activityLevel || undefined,
        primaryGoal: form.primaryGoal || undefined,
        trainingExperience: form.trainingExperience || undefined,
        weeklyTrainingDays: form.weeklyTrainingDays
          ? Number(form.weeklyTrainingDays)
          : undefined,
        dietaryPreference: form.dietaryPreference || undefined,
        medicalConditions: form.medicalConditions
          ? form.medicalConditions.split(",").map((m) => m.trim())
          : undefined,
        injuries: form.injuries || undefined,
      });

      toast({
        title: "Profile saved",
        description: "Generating a personalised health plan for you.",
      });

      await plan.mutateAsync({});

      toast({
        title: "Plan ready",
        description: "You can tweak it anytime from the Wellness dashboard.",
      });

      navigate("/wellness");
    } catch (err: any) {
      toast({
        title: "Could not save profile",
        description: err.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const isSaving = saveProfile.isPending || plan.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/60 active:scale-95 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs font-medium text-primary uppercase">
              Health Onboarding
            </p>
            <h1 className="text-base sm:text-lg font-semibold">
              Tell us about your body & routine
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full ${
                step >= s ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <section className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Basics</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[11px] text-muted-foreground">
                  Gender
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-muted-foreground">
                  Date of birth
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField("dateOfBirth", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-muted-foreground">
                  Height (cm)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  value={form.heightCm}
                  onChange={(e) => updateField("heightCm", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-muted-foreground">
                  Current weight (kg)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  value={form.currentWeightKg}
                  onChange={(e) =>
                    updateField("currentWeightKg", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="block text-[11px] text-muted-foreground">
                  Target weight (kg)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  value={form.targetWeightKg}
                  onChange={(e) =>
                    updateField("targetWeightKg", e.target.value)
                  }
                />
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Lifestyle & goal</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 col-span-2">
                <label className="block text-[11px] text-muted-foreground">
                  Primary goal
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  value={form.primaryGoal}
                  onChange={(e) => updateField("primaryGoal", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="fat_loss">Fat loss</option>
                  <option value="muscle_gain">Muscle gain</option>
                  <option value="recomposition">Recomposition</option>
                  <option value="performance">Performance</option>
                  <option value="longevity">Longevity</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="block text-[11px] text-muted-foreground">
                  Activity level
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  value={form.activityLevel}
                  onChange={(e) => updateField("activityLevel", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="sedentary">Mostly sitting</option>
                  <option value="lightly_active">
                    Lightly active (walks 2–3x/week)
                  </option>
                  <option value="moderately_active">
                    Moderately active (3–5 workouts/week)
                  </option>
                  <option value="very_active">Very active</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-muted-foreground">
                  Training experience
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  value={form.trainingExperience}
                  onChange={(e) =>
                    updateField("trainingExperience", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-muted-foreground">
                  Weekly training days
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  value={form.weeklyTrainingDays}
                  onChange={(e) =>
                    updateField("weeklyTrainingDays", e.target.value)
                  }
                />
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Food & constraints</h2>
            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[11px] text-muted-foreground">
                  Dietary preference
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  value={form.dietaryPreference}
                  onChange={(e) =>
                    updateField("dietaryPreference", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="non_vegetarian">Non‑vegetarian</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="eggetarian">Eggetarian</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-muted-foreground">
                  Medical conditions (comma‑separated)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  placeholder="e.g. diabetes, thyroid"
                  value={form.medicalConditions}
                  onChange={(e) =>
                    updateField("medicalConditions", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-muted-foreground">
                  Injuries / movement constraints
                </label>
                <textarea
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 min-h-[70px]"
                  placeholder="e.g. knee pain, avoid deep squats"
                  value={form.injuries}
                  onChange={(e) => updateField("injuries", e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="text-xs text-muted-foreground disabled:opacity-40"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-medium active:scale-[0.97] transition"
            >
              Next
            </button>
          ) : (
            <button
              disabled={isSaving}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-medium active:scale-[0.97] disabled:opacity-60 transition"
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save & generate plan
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
