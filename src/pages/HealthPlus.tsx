// src/pages/HealthPlus.tsx
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Salad,
  Sparkles,
  Flame,
  Dumbbell,
  Clock,
  ChefHat,
  ShoppingCart,
  Bike,
  UtensilsCrossed,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  RefreshCw,
  HeartPulse,
  Info,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  User as UserIcon,
  Check,
  ArrowRight,
} from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  healthPlusApi,
  type RecipeData,
  type GenerateRecipeResponse,
} from "@/api/healthPlus";

const MEAL_SLOTS = [
  { id: "breakfast", label: "Breakfast", icon: "🌅", hours: [5, 11] },
  { id: "lunch", label: "Lunch", icon: "🥗", hours: [11, 15] },
  { id: "dinner", label: "Dinner", icon: "🍲", hours: [19, 23] },
  { id: "snack", label: "Energy Snack", icon: "⚡", hours: [15, 19] },
  { id: "post_workout", label: "Post-Workout", icon: "💪", hours: [] },
];

const PREP_SPEEDS = [
  { id: "15-min", label: "15-Min Rush", desc: "Quick skillet or power bowl" },
  { id: "30-min", label: "30-Min Balanced", desc: "Standard whole-food meal" },
  { id: "chef", label: "Weekend Chef", desc: "Layered gourmet nourishment" },
];

const DIET_TYPES = [
  "Vegetarian",
  "Eggetarian",
  "Non-Vegetarian",
  "Vegan",
  "Jain",
  "Keto / Low-Carb",
  "High-Protein",
];

const QUICK_INSPIRATIONS = [
  {
    title: "High-Protein Paneer / Chicken Skillet",
    desc: "36g protein, bell peppers, spinach, whole cumin & lemon",
    mealSlot: "dinner",
    speed: "15-min",
    badge: "Hypertrophy",
  },
  {
    title: "Mediterranean Warm Grain & Lentil Bowl",
    desc: "Complex carbs, cold-pressed olive oil, roasted seeds",
    mealSlot: "lunch",
    speed: "30-min",
    badge: "Heart & Gut",
  },
  {
    title: "Millet & Sprouted Moong Khichdi",
    desc: "Easy digestion, rich in micronutrients, anti-inflammatory",
    mealSlot: "dinner",
    speed: "30-min",
    badge: "Recovery",
  },
];

export default function HealthPlus() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Smart initial time-of-day detection
  const defaultSlot = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 11) return "breakfast";
    if (currentHour >= 11 && currentHour < 15) return "lunch";
    if (currentHour >= 15 && currentHour < 19) return "snack";
    return "dinner";
  }, []);

  // State
  const [selectedMealSlot, setSelectedMealSlot] = useState(defaultSlot);
  const [selectedPrepSpeed, setSelectedPrepSpeed] = useState("30-min");
  const [selectedDiet, setSelectedDiet] = useState<string>("Vegetarian");
  const [servings, setServings] = useState(2);
  const [includePantry, setIncludePantry] = useState(false);
  const [activeSwiggyTab, setActiveSwiggyTab] = useState("instamart");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  // 1. Fetch Profile & Status
  const { data: statusData } = useQuery({
    queryKey: ["health-plus-status"],
    queryFn: () => healthPlusApi.getStatus(),
  });

  const { data: profileResponse, isLoading: isProfileLoading } = useQuery({
    queryKey: ["health-plus-profile"],
    queryFn: () => healthPlusApi.getProfile(),
  });

  const profile = profileResponse?.data?.profile;
  const metabolic = profileResponse?.data?.metabolic;
  const vitals = profileResponse?.data?.vitals;

  // Sync selected diet when profile loads
  useEffect(() => {
    if (profile?.dietary_preference) {
      setSelectedDiet(profile.dietary_preference);
    }
  }, [profile?.dietary_preference]);

  // 2. Recipe Generation Mutation
  const [recipeResult, setRecipeResult] =
    useState<GenerateRecipeResponse | null>(null);

  const generateMutation = useMutation({
    mutationFn: (overrideSlot?: string | void) =>
      healthPlusApi.generateRecipe({
        mealType: overrideSlot || selectedMealSlot,
        prepSpeed: selectedPrepSpeed,
        dietType: selectedDiet,
        servings,
      }),
    onSuccess: (res) => {
      if (res.data) {
        setRecipeResult(res.data);
        setCheckedSteps({});
        toast({
          title: "Recipe Synthesized!",
          description: `${res.data.recipe.title} is ready with live Swiggy options.`,
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Recipe Generation Failed",
        description:
          err.message || "Failed to generate recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  // 3. Update Profile Mutation
  const [editWeight, setEditWeight] = useState<number>(
    profile?.current_weight_kg || 70,
  );
  const [editTargetWeight, setEditTargetWeight] = useState<number>(
    profile?.target_weight_kg || 68,
  );
  const [editHeight, setEditHeight] = useState<number>(
    profile?.height_cm || 175,
  );
  const [editGoal, setEditGoal] = useState<string>(
    profile?.primary_goal || "lean_muscle",
  );
  const [editActivity, setEditActivity] = useState<string>(
    profile?.activity_level || "moderately_active",
  );

  useEffect(() => {
    if (profile) {
      if (profile.current_weight_kg) setEditWeight(profile.current_weight_kg);
      if (profile.target_weight_kg)
        setEditTargetWeight(profile.target_weight_kg);
      if (profile.height_cm) setEditHeight(profile.height_cm);
      if (profile.primary_goal) setEditGoal(profile.primary_goal);
      if (profile.activity_level) setEditActivity(profile.activity_level);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      healthPlusApi.updateProfile({
        current_weight_kg: Number(editWeight),
        target_weight_kg: Number(editTargetWeight),
        height_cm: Number(editHeight),
        primary_goal: editGoal,
        activity_level: editActivity,
        dietary_preference: selectedDiet,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-plus-profile"] });
      setProfileModalOpen(false);
      toast({
        title: "Metabolic Profile Updated",
        description:
          "Your BMR, TDEE, and daily macro targets have been recalculated.",
      });
    },
  });

  // 4. Instamart Cart Sync Mutation
  const syncCartMutation = useMutation({
    mutationFn: (items: any[]) => healthPlusApi.syncInstamartCart(items),
    onSuccess: (res) => {
      toast({
        title: res.data?.syncedViaMcp
          ? "Synced with Swiggy Instamart!"
          : "Instamart Cart Ready!",
        description:
          res.data?.message || "Items mapped and ready for checkout.",
      });
    },
  });

  const recipe = recipeResult?.recipe;
  const swiggy = recipeResult?.swiggy;

  // Filter ingredients based on pantry toggle
  const displayedIngredients = useMemo(() => {
    if (!recipe?.ingredients) return [];
    if (includePantry) return recipe.ingredients;
    return recipe.ingredients.filter((ing) => !ing.isPantryStaple);
  }, [recipe?.ingredients, includePantry]);

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const userInitials = useMemo(() => {
    if (user?.full_name) {
      return user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20">
      <GlobalHeader />

      {/* Subtle Background Glow — dynamic for light & dark */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-[160px]" />
      </div>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ─── Hero & Profile Snapshot ────────────────────────────────────────── */}
        <section
          id="health-plus-hero"
          className="relative rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5 overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Salad className="w-8 h-8" />
                </span>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                      Health+
                    </h1>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold"
                    >
                      Swiggy MCP Active
                    </Badge>
                    {user?.tier && (
                      <Badge
                        variant="secondary"
                        className="text-xs uppercase font-bold tracking-wider px-2 py-0.5"
                      >
                        {user.tier}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    Precision metabolic recipe planner synced to Swiggy
                    Instamart groceries, Food delivery & clean dining.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Pill & Action */}
            <div className="flex flex-wrap items-center gap-3">
              {user && (
                <Link
                  to="/profile"
                  className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground max-w-[120px] truncate">
                    {user.full_name || user.email}
                  </span>
                </Link>
              )}

              <Dialog
                open={profileModalOpen}
                onOpenChange={setProfileModalOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    id="edit-metabolic-profile-btn"
                    variant="outline"
                    className="border-border/60 hover:border-emerald-500/40 hover:bg-emerald-500/5 flex items-center gap-2 rounded-xl"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Nutrition Goals</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle>
                      Metabolic Profile & Nutrition Goals
                    </DialogTitle>
                    <DialogDescription>
                      Recalibrate your Mifflin-St Jeor BMR, TDEE, and daily
                      macro targets.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="weight">Current Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          value={editWeight}
                          onChange={(e) =>
                            setEditWeight(Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                        <Input
                          id="targetWeight"
                          type="number"
                          value={editTargetWeight}
                          onChange={(e) =>
                            setEditTargetWeight(Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={editHeight}
                          onChange={(e) =>
                            setEditHeight(Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="activity">Activity Level</Label>
                        <Select
                          value={editActivity}
                          onValueChange={setEditActivity}
                        >
                          <SelectTrigger id="activity">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sedentary">
                              Sedentary (Desk Job)
                            </SelectItem>
                            <SelectItem value="lightly_active">
                              Lightly Active (1-2 days)
                            </SelectItem>
                            <SelectItem value="moderately_active">
                              Moderately Active (3-5 days)
                            </SelectItem>
                            <SelectItem value="very_active">
                              Very Active (6-7 days)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="goal">Primary Objective</Label>
                      <Select value={editGoal} onValueChange={setEditGoal}>
                        <SelectTrigger id="goal">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lean_muscle">
                            Hypertrophy / Lean Muscle (+ surplus)
                          </SelectItem>
                          <SelectItem value="fat_loss">
                            Fat Loss & Definition (- deficit)
                          </SelectItem>
                          <SelectItem value="maintenance">
                            Metabolic Health & Maintenance
                          </SelectItem>
                          <SelectItem value="longevity">
                            Longevity & Anti-Inflammatory
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      id="save-profile-btn"
                      onClick={() => updateProfileMutation.mutate()}
                      disabled={updateProfileMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                    >
                      {updateProfileMutation.isPending
                        ? "Recalculating..."
                        : "Save & Update Targets"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Metabolic & Vitals Snapshot Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/40">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Daily Calorie Target</span>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-foreground">
                {metabolic?.targetCalories || 2150}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  kcal
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                BMR: {metabolic?.bmr || 1650} kcal · TDEE:{" "}
                {metabolic?.tdee || 2100}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
                <span>Daily Protein Goal</span>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {metabolic?.targetProteinG || 135}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  g
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                ~{Math.round((metabolic?.targetProteinG || 135) * 0.35)}g per
                main meal
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span>Vitals Reading</span>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-foreground">
                {vitals?.overallScore ? `${vitals.overallScore}%` : "Baseline"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Fuel: {vitals?.fuelScore ?? 75}% · {vitals?.band || "Steady"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Layers className="w-3.5 h-3.5 text-teal-500" />
                <span>Swiggy MCP Engine</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-foreground">
                  3-Way Action
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Instamart · Food · Dineout
              </div>
            </div>
          </div>
        </section>

        {/* ─── Recipe Studio Controls ────────────────────────────────────────── */}
        <section
          id="recipe-studio-controls"
          className="rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-6 sm:p-7 shadow-xl shadow-black/5 space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Personalized Recipe Studio
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select your meal slot, prep time, and dietary preference to
                synthesize an optimal dish.
              </p>
            </div>

            {/* Dietary Style Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Diet:
              </span>
              <Select value={selectedDiet} onValueChange={setSelectedDiet}>
                <SelectTrigger
                  id="diet-type-trigger"
                  className="w-[180px] rounded-xl bg-muted/30"
                >
                  <SelectValue placeholder="Diet Type" />
                </SelectTrigger>
                <SelectContent>
                  {DIET_TYPES.map((dt) => (
                    <SelectItem key={dt} value={dt}>
                      {dt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meal Slot Picker */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              1. Choose Meal Slot
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {MEAL_SLOTS.map((slot) => {
                const isActive = selectedMealSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    id={`meal-slot-${slot.id}`}
                    onClick={() => setSelectedMealSlot(slot.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-sm font-medium transition-all ${
                      isActive
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : "border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <span className="text-lg">{slot.icon}</span>
                    <span>{slot.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prep Speed Picker */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              2. Preparation Speed
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PREP_SPEEDS.map((prep) => {
                const isActive = selectedPrepSpeed === prep.id;
                return (
                  <button
                    key={prep.id}
                    id={`prep-speed-${prep.id}`}
                    onClick={() => setSelectedPrepSpeed(prep.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isActive
                        ? "border-teal-500/60 bg-teal-500/10 text-teal-700 dark:text-teal-400 shadow-sm"
                        : "border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">
                        {prep.label}
                      </span>
                      <Clock className="w-4 h-4 opacity-60" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {prep.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Servings & Generate CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-border/30">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                Servings:
              </span>
              {[1, 2, 4].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={servings === s ? "default" : "outline"}
                  onClick={() => setServings(s)}
                  className={`rounded-xl px-3 py-1 text-xs ${
                    servings === s
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s} {s === 1 ? "Person" : "Persons"}
                </Button>
              ))}
            </div>

            <Button
              id="generate-recipe-btn"
              size="lg"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl px-6 py-6 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Synthesizing Metabolic Dish...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate AI Metabolic Recipe
                </>
              )}
            </Button>
          </div>
        </section>

        {/* ─── Empty State / Quick Inspirations (if no recipe yet) ─────────── */}
        {!recipe && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-emerald-500" />
                Quick Metabolic Inspirations
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {QUICK_INSPIRATIONS.map((insp, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedMealSlot(insp.mealSlot);
                    setSelectedPrepSpeed(insp.speed);
                    generateMutation.mutate(insp.mealSlot);
                  }}
                  className="group p-5 rounded-3xl border border-border/50 bg-card/60 hover:bg-card hover:border-emerald-500/40 backdrop-blur-xl transition-all cursor-pointer space-y-3 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]"
                    >
                      {insp.badge}
                    </Badge>
                    <span className="text-xs text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
                      Quick Craft{" "}
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {insp.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insp.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Recipe Showcase & Swiggy Action Hub ─────────────────────────── */}
        {recipe && (
          <section
            id="recipe-results-section"
            className="space-y-8 animate-in fade-in duration-500"
          >
            {/* Main Recipe Card */}
            <div className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5 space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    >
                      {recipe.cuisine}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-teal-500/40 text-teal-600 dark:text-teal-400 bg-teal-500/10"
                    >
                      {recipe.difficulty}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                    >
                      ⏱️ {recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins
                    </Badge>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {recipe.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                    {recipe.description}
                  </p>
                </div>
              </div>

              {/* Macro Gauges Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-muted/30 border border-border/40">
                <div className="text-center">
                  <span className="text-xs text-muted-foreground font-medium">
                    Energy
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">
                    {recipe.caloriesKcal}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      kcal
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground font-medium">
                    Protein
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {recipe.proteinG}g
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground font-medium">
                    Net Carbs
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                    {recipe.carbsG}g
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground font-medium">
                    Dietary Fiber
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
                    {recipe.fiberG}g
                  </div>
                </div>
                <div className="text-center col-span-2 sm:col-span-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Healthy Fats
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {recipe.fatG}g
                  </div>
                </div>
              </div>

              {/* Metabolic Rationale Callout */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-foreground space-y-1">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Metabolic Rationale:{" "}
                  </span>
                  <span>{recipe.metabolicMatchReason}</span>
                </div>
              </div>

              {/* Step-by-Step Cooking Instructions */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-emerald-500" />
                  Cooking Instructions
                </h3>
                <div className="space-y-2.5">
                  {recipe.instructions.map((step, idx) => {
                    const isDone = Boolean(checkedSteps[idx]);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleStep(idx)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isDone
                            ? "bg-emerald-500/5 border-emerald-500/30 text-muted-foreground line-through"
                            : "bg-muted/10 border-border/30 hover:bg-muted/20 text-foreground"
                        }`}
                      >
                        <button
                          type="button"
                          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                            isDone
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-xs sm:text-sm leading-relaxed">
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chef Tips */}
              {recipe.chefTips && recipe.chefTips.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {recipe.chefTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-muted/20 border border-border/30 text-xs text-muted-foreground flex items-start gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── 3-Way Swiggy Action Hub ─────────────────────────────────── */}
            <div
              id="swiggy-action-hub"
              className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      ⚡
                    </span>
                    Swiggy 3-Way Realistic Action Hub
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Cook fresh via Instamart, order ready-made on Swiggy Food,
                    or reserve a clean-eating table via Dineout.
                  </p>
                </div>
              </div>

              <Tabs
                value={activeSwiggyTab}
                onValueChange={setActiveSwiggyTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 w-full rounded-2xl bg-muted/40 p-1 border border-border/30">
                  <TabsTrigger
                    value="instamart"
                    id="tab-instamart"
                    className="rounded-xl flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-500" />
                    <span>Cook (Instamart)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="food"
                    id="tab-food"
                    className="rounded-xl flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    <Bike className="w-4 h-4 text-orange-500" />
                    <span>Order (Swiggy Food)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="dineout"
                    id="tab-dineout"
                    className="rounded-xl flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    <UtensilsCrossed className="w-4 h-4 text-purple-500" />
                    <span>Dine Out (Dineout)</span>
                  </TabsTrigger>
                </TabsList>

                {/* ── TAB 1: SWIGGY INSTAMART ── */}
                <TabsContent value="instamart" className="space-y-4 mt-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pantry-toggle"
                        checked={includePantry}
                        onChange={(e) => setIncludePantry(e.target.checked)}
                        className="rounded border-border/50 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <Label
                        htmlFor="pantry-toggle"
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        Include common pantry staples (oil, basic spices, salt)
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Estimated Basket:
                      </span>
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        ₹{swiggy?.instamart?.totalEstimatedPrice || 140}
                      </span>
                    </div>
                  </div>

                  {/* Ingredients Table */}
                  <div className="rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/20">
                    {displayedIngredients.map((ing, idx) => {
                      const matchedItem = swiggy?.instamart?.items?.find(
                        (i) =>
                          i.ingredientName.toLowerCase() ===
                          ing.name.toLowerCase(),
                      );
                      const product = matchedItem?.product;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-muted/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                              <ShoppingCart className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                                {ing.name}
                                {ing.isPantryStaple && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 text-muted-foreground border-border/40"
                                  >
                                    Pantry
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Need: {ing.quantity} {ing.unit} · Matched:{" "}
                                <span className="text-foreground font-medium">
                                  {product?.name || ing.instamartQuery}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-foreground">
                              ₹{product?.price || 55}
                            </span>
                            <a
                              href={
                                product?.deepLink ||
                                `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(ing.instamartQuery || ing.name)}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                              title="Search on Swiggy Instamart"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <Button
                      id="sync-instamart-cart-btn"
                      onClick={() =>
                        syncCartMutation.mutate(swiggy?.instamart?.items || [])
                      }
                      disabled={syncCartMutation.isPending}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {syncCartMutation.isPending
                        ? "Syncing via MCP..."
                        : "Add All to Swiggy Instamart Cart"}
                    </Button>

                    <a
                      href="https://www.swiggy.com/instamart"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-border/50 flex items-center gap-2 text-foreground"
                      >
                        <span>Open Swiggy Instamart Web</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                </TabsContent>

                {/* ── TAB 2: SWIGGY FOOD DELIVERY ── */}
                <TabsContent value="food" className="space-y-4 mt-5">
                  <div className="p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20 text-xs text-orange-600 dark:text-orange-400 flex items-center gap-2">
                    <Bike className="w-4 h-4 shrink-0" />
                    <span>
                      Don't have 30 minutes to cook? Here are top-rated dishes
                      nearby with verified nutrition profiles.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(swiggy?.foodDelivery || []).map((dish) => (
                      <div
                        key={dish.id}
                        className="p-4 rounded-2xl border border-border/30 bg-muted/10 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className={
                                dish.isVeg
                                  ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px]"
                                  : "border-rose-500/40 text-rose-600 dark:text-rose-400 text-[10px]"
                              }
                            >
                              {dish.isVeg ? "Veg" : "Non-Veg"}
                            </Badge>
                            <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                              ★ {dish.rating}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-foreground line-clamp-2">
                            {dish.dishName}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {dish.restaurantName}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/20 flex items-center justify-between">
                          <div>
                            <span className="text-base font-bold text-foreground">
                              ₹{dish.price}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {dish.deliveryTimeMin}
                            </span>
                          </div>

                          <a
                            href={dish.orderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs flex items-center gap-1.5"
                            >
                              <span>Order Now</span>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* ── TAB 3: SWIGGY DINEOUT ── */}
                <TabsContent value="dineout" className="space-y-4 mt-5">
                  <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 shrink-0" />
                    <span>
                      Planning a dinner or meeting friends? These healthy,
                      clean-eating spots match your dietary goals.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(swiggy?.dineout || []).map((spot) => (
                      <div
                        key={spot.id}
                        className="p-4 rounded-2xl border border-border/30 bg-muted/10 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                              ★ {spot.rating}
                            </span>
                            <Badge
                              variant="outline"
                              className="border-purple-500/30 text-purple-600 dark:text-purple-400 text-[10px]"
                            >
                              {spot.dealText}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-sm text-foreground line-clamp-1">
                            {spot.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {spot.locality} · {spot.costForTwo}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 line-clamp-1">
                            {spot.cuisine}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/20">
                          <a
                            href={spot.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full border-purple-500/40 hover:bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-xl text-xs flex items-center justify-center gap-1.5"
                            >
                              <span>Reserve Table with Deals</span>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </section>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}
