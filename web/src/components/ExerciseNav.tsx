import Link from "next/link";
import { EXERCISE_SLUGS, EXERCISE_LABELS, type ExerciseSlug } from "@/lib/content";

interface ExerciseNavProps {
  moduleId: string;
  currentSlug: ExerciseSlug | "index";
}

export function ExerciseNav({ moduleId, currentSlug }: ExerciseNavProps) {
  const steps: Array<{ slug: string; label: string; href: string }> = [
    { slug: "index", label: "Overview", href: `/modules/${moduleId}` },
    ...EXERCISE_SLUGS.map((slug) => ({
      slug,
      label: EXERCISE_LABELS[slug],
      href: `/modules/${moduleId}/${slug}`,
    })),
  ];

  return (
    <nav className="flex gap-1 flex-wrap mb-8 text-sm">
      {steps.map((step) => (
        <Link
          key={step.slug}
          href={step.href}
          className={`px-3 py-1 rounded border transition-colors ${
            step.slug === currentSlug
              ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
              : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500"
          }`}
        >
          {step.label}
        </Link>
      ))}
    </nav>
  );
}
