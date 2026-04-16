import Link from "next/link";
import type { ModuleMeta } from "@/lib/content";

interface ModuleCardProps {
  meta: ModuleMeta;
  completedCount: number; // passed from parent (server component reads progress via cookie or client)
  totalExercises: number;
}

export function ModuleCard({ meta, completedCount, totalExercises }: ModuleCardProps) {
  const pct = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  return (
    <Link
      href={`/modules/${meta.id}`}
      className="block border border-gray-200 rounded-lg p-5 hover:border-gray-400 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Module {meta.order}</p>
          <h2 className="font-semibold text-lg">{meta.title}</h2>
          <p className="text-sm text-gray-600 mt-1">{meta.description}</p>
          <p className="text-xs text-gray-400 mt-2">{meta.estimatedMinutes} min</p>
        </div>
        {completedCount > 0 && (
          <span className="text-xs text-gray-500 whitespace-nowrap mt-1">
            {pct}%
          </span>
        )}
      </div>
    </Link>
  );
}
