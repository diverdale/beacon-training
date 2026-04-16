import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Content directory is at the repo root, symlinked into web/
const CONTENT_DIR = path.join(process.cwd(), "content", "modules");

export interface ModuleMeta {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  exerciseTypes: string[];
  order: number;
  locked: boolean;
}

export interface Exercise {
  slug: string;
  label: string;
  content: string; // raw MDX string
}

export const EXERCISE_SLUGS = [
  "concept",
  "guided",
  "independent",
  "debrief",
] as const;

export type ExerciseSlug = (typeof EXERCISE_SLUGS)[number];

export const EXERCISE_LABELS: Record<ExerciseSlug, string> = {
  concept: "Concept",
  guided: "Guided Exercise",
  independent: "Independent Exercise",
  debrief: "Debrief",
};

export function getAllModules(): ModuleMeta[] {
  const dirs = fs
    .readdirSync(CONTENT_DIR)
    .filter((d) => fs.statSync(path.join(CONTENT_DIR, d)).isDirectory())
    .sort();

  return dirs.map((dir) => {
    const metaPath = path.join(CONTENT_DIR, dir, "meta.json");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as ModuleMeta;
    return meta;
  });
}

export function getModuleMeta(moduleId: string): ModuleMeta {
  const metaPath = path.join(CONTENT_DIR, moduleId, "meta.json");
  return JSON.parse(fs.readFileSync(metaPath, "utf-8")) as ModuleMeta;
}

export function getModuleIndex(moduleId: string): string {
  const filePath = path.join(CONTENT_DIR, moduleId, "index.mdx");
  const { content } = matter(fs.readFileSync(filePath, "utf-8"));
  return content;
}

export function getExercise(moduleId: string, exerciseSlug: ExerciseSlug): string {
  const filePath = path.join(CONTENT_DIR, moduleId, `${exerciseSlug}.mdx`);
  const { content } = matter(fs.readFileSync(filePath, "utf-8"));
  return content;
}

export function getAllModuleIds(): string[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((d) => fs.statSync(path.join(CONTENT_DIR, d)).isDirectory())
    .sort();
}
