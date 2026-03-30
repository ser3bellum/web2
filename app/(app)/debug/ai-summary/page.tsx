"use client";

import { useState } from "react";

export default function AISummaryDebugPage() {
  const [text, setText] = useState(
    "Ser3bellum aggregates operational signals from different tools and produces concise summaries for business users."
  );
  const [maxBullets, setMaxBullets] = useState("3");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSummarize() {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          maxBullets: maxBullets ? Number(maxBullets) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Request failed.");
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 800 }}>
      <h1>AI Summary Debug</h1>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="text">Text</label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          style={{ display: "block", width: "100%", marginTop: 8 }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="maxBullets">Max bullets</label>
        <input
          id="maxBullets"
          type="number"
          min="1"
          value={maxBullets}
          onChange={(e) => setMaxBullets(e.target.value)}
          style={{ display: "block", marginTop: 8 }}
        />
      </div>

      <button
        onClick={handleSummarize}
        disabled={loading}
        style={{ marginTop: 20 }}
      >
        {loading ? "Summarizing..." : "Summarize"}
      </button>

      {error ? (
        <pre style={{ marginTop: 20, color: "crimson", whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      ) : null}

      {result ? (
        <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>{result}</pre>
      ) : null}
    </main>
  );
}