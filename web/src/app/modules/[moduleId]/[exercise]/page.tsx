import {
  getAllModuleIds,
  getExercise,
  EXERCISE_SLUGS,
  EXERCISE_LABELS,
  type ExerciseSlug,
} from "@/lib/content";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ExerciseNav } from "@/components/ExerciseNav";
import { MarkCompleteButton } from "@/components/MarkCompleteButton";
import { DebriefGate } from "@/components/DebriefGate";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const moduleIds = getAllModuleIds();
  return moduleIds.flatMap((moduleId) =>
    EXERCISE_SLUGS.map((exercise) => ({ moduleId, exercise }))
  );
}

interface PageProps {
  params: Promise<{ moduleId: string; exercise: string }>;
}

function getNextExercise(current: ExerciseSlug, moduleId: string): string | undefined {
  const idx = EXERCISE_SLUGS.indexOf(current);
  if (idx === -1 || idx === EXERCISE_SLUGS.length - 1) return undefined;
  return `/modules/${moduleId}/${EXERCISE_SLUGS[idx + 1]}`;
}

export default async function ExercisePage({ params }: PageProps) {
  const { moduleId, exercise } = await params;

  if (!EXERCISE_SLUGS.includes(exercise as ExerciseSlug)) {
    notFound();
  }

  const slug = exercise as ExerciseSlug;
  const content = getExercise(moduleId, slug);
  const nextHref = getNextExercise(slug, moduleId);

  const body = (
    <article className="prose prose-gray max-w-none">
      <MDXRemote source={content} />
    </article>
  );

  return (
    <main>
      <Link href={`/modules/${moduleId}`} className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">
        ← {EXERCISE_LABELS[slug] ? moduleId.split("-").slice(1).join(" ") : "Module"}
      </Link>

      <ExerciseNav moduleId={moduleId} currentSlug={slug} />

      {slug === "debrief" ? (
        <DebriefGate moduleId={moduleId}>{body}</DebriefGate>
      ) : (
        body
      )}

      {slug !== "debrief" ? (
        <MarkCompleteButton
          moduleId={moduleId}
          exerciseSlug={slug}
          nextHref={nextHref}
        />
      ) : null}
    </main>
  );
}
