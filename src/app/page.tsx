import { Suspense } from "react";
import HomeContent from "./HomeContent";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div
            className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--color-border)",
              borderTopColor: "var(--color-accent)",
            }}
          />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
