import { getAllModuleIds, getModuleMeta, getModuleIndex } from "@/lib/content";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ExerciseNav } from "@/components/ExerciseNav";
import Link from "next/link";

export async function generateStaticParams() {
  return getAllModuleIds().map((id) => ({ moduleId: id }));
}

interface PageProps {
  params: Promise<{ moduleId: string }>;
}

export default async function ModulePage({ params }: PageProps) {
  const { moduleId } = await params;
  const meta = getModuleMeta(moduleId);
  const content = getModuleIndex(moduleId);

  return (
    <main>
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6 inline-block">
        ← All modules
      </Link>

      <ExerciseNav moduleId={moduleId} currentSlug="index" />

      <article className="prose prose-gray max-w-none dark:prose-invert">
        <MDXRemote source={content} />
      </article>

      <div className="mt-10">
        <Link
          href={`/modules/${moduleId}/concept`}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 transition-colors"
        >
          Start module →
        </Link>
      </div>
    </main>
  );
}
