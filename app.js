/* ─────────────────────────────────────────
   NutriLog — App State
   Daily log, totals, add/remove meals.
   ───────────────────────────────────────── */

import { parseMeal, getDailySummary } from "./api.js";

/* ── State ────────────────────────────────────────────── */

// const state = {
//   meals:  [],        // array of parsed meal objects
//   goals: {           // daily targets (user can edit later)
//     calories: 2000,
//     protein_g: 120,
//     carbs_g:   200,
//     fat_g:      65,
//   }
// };

import { getSavedGoals } from "./profile.js";

const savedGoals = getSavedGoals();

const state = {
  meals: [],
  goals: savedGoals || {
    calories:  2000,
    protein_g: 120,
    carbs_g:   200,
    fat_g:      65,
  }
};

/* ── Helpers ──────────────────────────────────────────── */

function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function emptyTotals() {
  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
}

/* ── Core functions ───────────────────────────────────── */

// Add a meal by parsing free text. Returns the saved meal object.
export async function addMeal(text) {
  const parsed = await parseMeal(text);
  const meal   = { ...parsed, id: uuid(), logged_at: new Date().toISOString() };
  state.meals.push(meal);
  return meal;
}

// Remove a meal by id.
export function removeMeal(id) {
  state.meals = state.meals.filter(m => m.id !== id);
}

// Get running totals across all logged meals.
export function getTotals() {
  return state.meals.reduce((acc, meal) => {
    acc.calories  += meal.total.calories;
    acc.protein_g += meal.total.protein_g;
    acc.carbs_g   += meal.total.carbs_g;
    acc.fat_g     += meal.total.fat_g;
    return acc;
  }, emptyTotals());
}

// Get progress toward daily goals (0–100 per macro).
export function getProgress() {
  const totals = getTotals();
  return {
    calories:  Math.min(100, Math.round((totals.calories  / state.goals.calories)  * 100)),
    protein_g: Math.min(100, Math.round((totals.protein_g / state.goals.protein_g) * 100)),
    carbs_g:   Math.min(100, Math.round((totals.carbs_g   / state.goals.carbs_g)   * 100)),
    fat_g:     Math.min(100, Math.round((totals.fat_g     / state.goals.fat_g)     * 100)),
  };
}

// Get all logged meals (read-only copy).
export function getMeals() {
  return [...state.meals];
}

// Get daily goals.
export function getGoals() {
  return { ...state.goals };
}

// Update daily goals.
export function setGoals(newGoals) {
  state.goals = { ...state.goals, ...newGoals };
}

// Get an AI summary of the day's eating.
export async function getSummary() {
  if (state.meals.length === 0) throw new Error("No meals logged yet.");
  return getDailySummary(state.meals);
}

// Clear all meals (e.g. new day).
export function resetDay() {
  state.meals = [];
}