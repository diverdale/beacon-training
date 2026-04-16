"use client";

import { markComplete, isComplete } from "@/lib/progress";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface MarkCompleteButtonProps {
  moduleId: string;
  exerciseSlug: string;
  nextHref?: string;
}

export function MarkCompleteButton({ moduleId, exerciseSlug, nextHref }: MarkCompleteButtonProps) {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(isComplete(moduleId, exerciseSlug));
  }, [moduleId, exerciseSlug]);

  function handleClick() {
    markComplete(moduleId, exerciseSlug);
    setDone(true);
    if (nextHref) router.push(nextHref);
  }

  if (done) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-8">
        ✓ Marked complete{nextHref ? " — " : ""}
        {nextHref && (
          <a href={nextHref} className="underline text-gray-600 dark:text-gray-300">
            Continue
          </a>
        )}
      </p>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="mt-8 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 transition-colors"
    >
      Mark complete
    </button>
  );
}
