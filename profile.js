/* ─────────────────────────────────────────
   NutriLog — Profile & Goal Calculator
   Mifflin-St Jeor equation for BMR/TDEE
   ───────────────────────────────────────── */

const STORAGE_KEY = "nutrilog_profile";

/* ── Activity multipliers ── */
const ACTIVITY = {
  sedentary:  1.2,    // little or no exercise
  light:      1.375,  // light exercise 1-3 days/week
  moderate:   1.55,   // moderate exercise 3-5 days/week
  active:     1.725,  // hard exercise 6-7 days/week
  very_active: 1.9    // very hard exercise, physical job
};

/* ── Goal calorie adjustments ── */
const GOAL_ADJUST = {
  lose:     -500,   // 500 kcal deficit
  maintain:    0,
  gain:     +300    // 300 kcal surplus
};

/* ── Protein targets (g per kg bodyweight) ── */
const PROTEIN_RATIO = {
  lose:     2.0,   // higher protein to preserve muscle
  maintain: 1.6,
  gain:     2.2    // higher protein to build muscle
};

/* ── Calculate BMR using Mifflin-St Jeor ── */
function calcBMR(gender, weight, height, age) {
  const base = (10 * weight) + (6.25 * height) - (5 * age);
  return gender === "male" ? base + 5 : base - 161;
}

/* ── Main calculation ── */
export function calcGoals(profile) {
  const { gender, age, weight, height, activity, goal } = profile;

  const bmr  = calcBMR(gender, weight, height, age);
  const tdee = Math.round(bmr * ACTIVITY[activity]);
  const calories = Math.round(tdee + GOAL_ADJUST[goal]);

  const protein_g = Math.round(weight * PROTEIN_RATIO[goal]);
  const fat_g     = Math.round((calories * 0.25) / 9);   // 25% of calories from fat
  const carbs_g   = Math.round((calories - (protein_g * 4) - (fat_g * 9)) / 4);

  return { calories, protein_g, carbs_g, fat_g, bmr, tdee };
}

/* ── Save profile to localStorage ── */
export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/* ── Load profile from localStorage ── */
export function loadProfile() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

/* ── Check if profile exists ── */
export function hasProfile() {
  return !!localStorage.getItem(STORAGE_KEY);
}

/* ── Get saved goals (for app.js to consume) ── */
export function getSavedGoals() {
  const profile = loadProfile();
  if (!profile) return null;
  return calcGoals(profile);
}