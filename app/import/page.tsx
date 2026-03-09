"use client";

import dynamic from "next/dynamic";

// Load Import UI only on the client to avoid dev bundler/runtime errors on this route
const ImportPageClient = dynamic(
  () => import("@/components/ImportPageClient").then((m) => m.ImportPageClient),
  { ssr: false }
);

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <ImportPageClient />
    </div>
  );
}

