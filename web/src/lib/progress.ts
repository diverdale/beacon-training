// Version suffix prevents schema conflicts if the data shape changes in future
const STORAGE_KEY = "ai-training-progress:v1";
const UNLOCKED_KEY = "ai-training-unlocked:v1";

export interface Progress {
  [moduleId: string]: {
    [exerciseSlug: string]: boolean; // true = completed
  };
}

export function getProgress(): Progress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function markComplete(moduleId: string, exerciseSlug: string): void {
  const progress = getProgress();
  if (!progress[moduleId]) progress[moduleId] = {};
  progress[moduleId][exerciseSlug] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function isComplete(moduleId: string, exerciseSlug: string): boolean {
  const progress = getProgress();
  return progress[moduleId]?.[exerciseSlug] === true;
}

export function isModuleComplete(moduleId: string, exerciseSlugs: string[]): boolean {
  const progress = getProgress();
  return exerciseSlugs.every((slug) => progress[moduleId]?.[slug] === true);
}

// Facilitator: unlock a module by ID (stores in localStorage)
export function unlockModule(moduleId: string): void {
  const unlocked = getUnlockedModules();
  if (!unlocked.includes(moduleId)) {
    unlocked.push(moduleId);
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
  }
}

export function getUnlockedModules(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(UNLOCKED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function isModuleUnlocked(moduleId: string, locked: boolean): boolean {
  if (!locked) return true; // not gated
  return getUnlockedModules().includes(moduleId);
}
