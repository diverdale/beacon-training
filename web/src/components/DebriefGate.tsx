"use client";

import { isComplete } from "@/lib/progress";
import { useEffect, useState } from "react";

interface DebriefGateProps {
  moduleId: string;
  children: React.ReactNode;
}

export function DebriefGate({ moduleId, children }: DebriefGateProps) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    // Debrief is available once the independent exercise is marked complete
    setUnlocked(isComplete(moduleId, "independent"));
  }, [moduleId]);

  if (!unlocked) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500 text-sm">
          Complete the independent exercise to unlock the debrief.
        </p>
        <a
          href={`/modules/${moduleId}/independent`}
          className="mt-3 inline-block text-sm underline text-gray-700"
        >
          Go to independent exercise →
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
