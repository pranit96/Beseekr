// src/api/healthPlus.ts
import { api as apiClient } from "@/lib/apiWrapper";

export interface HealthPlusStatus {
  feature: string;
  enabled: boolean;
  mcp: {
    authenticated: boolean;
    authFile: string;
    servers: {
      instamart: { authenticated: boolean; reason?: string };
      food: { authenticated: boolean; reason?: string };
      dineout: { authenticated: boolean; reason?: string };
    };
    hint: string;
  };
}

export interface MetabolicTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  weightKg: number;
  targetWeightKg: number;
  goal: string;
}

export interface VitalsSummary {
  completedToday: boolean;
  readingDate?: string | null;
  overallScore?: number | null;
  band?: string | null;
  fuelScore?: number | null;
  mindScore?: number | null;
  motionScore?: number | null;
  rhythmScore?: number | null;
  strongestDomain?: string | null;
  weakestDomain?: string | null;
}

export interface HealthProfileData {
  gender?: string;
  date_of_birth?: string;
  height_cm?: number;
  current_weight_kg?: number;
  target_weight_kg?: number;
  activity_level?: string;
  primary_goal?: string;
  dietary_preference?: string;
  medical_conditions?: string[];
  notes?: string;
}

export interface IngredientItem {
  name: string;
  quantity: string;
  unit: string;
  instamartQuery?: string;
  isPantryStaple?: boolean;
}

export interface RecipeData {
  id: string;
  title: string;
  description: string;
  cuisine: string;
  mealType: string;
  difficulty: "Easy" | "Medium" | "Chef";
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fiberG: number;
  fatG: number;
  micronutrients: string[];
  metabolicMatchReason: string;
  ingredients: IngredientItem[];
  instructions: string[];
  chefTips: string[];
  foodAlternativeDish?: string;
  dineoutSpotType?: string;
  createdAt: string;
}

export interface InstamartProduct {
  id: string;
  spinId?: string;
  skuId?: string;
  name: string;
  brand: string;
  packSize: string;
  price: number;
  mrp: number;
  inStock: boolean;
  deepLink: string;
  source: string;
}

export interface InstamartCartItem {
  ingredientName: string;
  recipeQuantity: string;
  isPantryStaple: boolean;
  product: InstamartProduct;
}

export interface InstamartCart {
  items: InstamartCartItem[];
  totalItems: number;
  totalEstimatedPrice: number;
  currency: string;
  instamartCheckoutUrl: string;
}

export interface FoodDeliveryDish {
  id: string;
  dishName: string;
  restaurantName: string;
  price: number;
  rating: number;
  isVeg: boolean;
  deliveryTimeMin: string;
  caloriesKcal?: number;
  proteinG?: number;
  orderUrl: string;
  source: string;
}

export interface DineoutSpot {
  id: string;
  name: string;
  locality: string;
  rating: number;
  costForTwo: string;
  dealText: string;
  cuisine: string;
  bookingUrl: string;
  source: string;
}

export interface GenerateRecipePayload {
  mealType?: string;
  prepSpeed?: string;
  servings?: number;
  dietType?: string;
  cuisine?: string;
  allergies?: string[];
  dislikes?: string[];
  spiceLevel?: string;
  addressId?: string | null;
}

export interface GenerateRecipeResponse {
  recipe: RecipeData;
  swiggy: {
    instamart: InstamartCart;
    foodDelivery: FoodDeliveryDish[];
    dineout: DineoutSpot[];
  };
}

export const healthPlusApi = {
  getStatus: () =>
    apiClient.get<{ success: boolean; data: HealthPlusStatus }>("/api/health/plus/status"),

  getProfile: () =>
    apiClient.get<{
      success: boolean;
      data: {
        profile: HealthProfileData;
        metabolic: MetabolicTargets;
        vitals: VitalsSummary | null;
      };
    }>("/api/health/plus/profile"),

  updateProfile: (payload: Partial<HealthProfileData>) =>
    apiClient.put<{
      success: boolean;
      data: { profile: HealthProfileData; metabolic: MetabolicTargets };
    }>("/api/health/plus/profile", payload),

  generateRecipe: (payload: GenerateRecipePayload) =>
    apiClient.post<{
      success: boolean;
      data: GenerateRecipeResponse;
    }>("/api/health/plus/recipes/generate", payload),

  buildInstamartCart: (ingredients: IngredientItem[], addressId?: string | null, includePantry?: boolean) =>
    apiClient.post<{
      success: boolean;
      data: InstamartCart;
    }>("/api/health/plus/swiggy/instamart-cart", { ingredients, addressId, includePantry }),

  syncInstamartCart: (items: any[], addressId?: string | null) =>
    apiClient.post<{
      success: boolean;
      data: {
        success: boolean;
        syncedViaMcp: boolean;
        cartCount: number;
        message: string;
        swiggyWebUrl: string;
      };
    }>("/api/health/plus/swiggy/instamart-sync", { items, addressId }),

  getFoodOptions: (query: string, addressId?: string | null) =>
    apiClient.get<{
      success: boolean;
      data: FoodDeliveryDish[];
    }>("/api/health/plus/swiggy/food-options", { params: { query, addressId } }),

  getDineoutOptions: (query: string, addressId?: string | null) =>
    apiClient.get<{
      success: boolean;
      data: DineoutSpot[];
    }>("/api/health/plus/swiggy/dineout-options", { params: { query, addressId } }),
};

export default healthPlusApi;
