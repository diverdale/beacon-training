import { getAllModules } from "@/lib/content";
import { ModuleCard } from "@/components/ModuleCard";

export default function Home() {
  const modules = getAllModules();

  return (
    <main>
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-2">AI Training</h1>
        <p className="text-gray-500 text-sm">
          Claude Code & Windsurf — hands-on exercises with real codebases
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {modules.map((meta) => (
          <ModuleCard
            key={meta.id}
            meta={meta}
            completedCount={0}
            totalExercises={4}
          />
        ))}
      </div>

      <p className="text-xs text-gray-300 mt-12 text-center">
        Progress is saved locally in your browser.
      </p>
    </main>
  );
}
