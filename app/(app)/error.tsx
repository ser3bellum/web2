"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("APP_ERROR_BOUNDARY:", error);
  }, [error]);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>Something crashed on the server.</h2>
      <p style={{ marginTop: 8 }}>Message: {error.message}</p>
      <p style={{ marginTop: 8 }}>Digest: {error.digest ?? "n/a"}</p>

      <button
        onClick={() => reset()}
        style={{
          marginTop: 16,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      >
        Retry
      </button>
    </div>
  );
}