"use client";

import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const data = await res.json();
      window.location.href =
        data.role === "admin" ? "/admin/resources" : "/admin/resources/new";
      return;
    } else {
      setError("密码不对，再试试~");
    }
    setLoading(false);
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 16px",
    fontSize: "var(--text-base)",
    fontFamily: "var(--font-body)",
    color: "var(--color-text)",
    background: "var(--color-paper-2)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    outline: "none",
    transition: `border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)`,
  };

  const inputFocusStyle = {
    borderColor: "oklch(58% 0.16 65 / 60%)",
    boxShadow: "var(--shadow-glow)",
    background: "var(--color-paper)",
  };

  const inputErrorStyle = {
    borderColor: "var(--color-error)",
    boxShadow: "0 0 0 3px var(--color-error-bg)",
  };

  const btnBase: React.CSSProperties = {
    width: "100%",
    padding: "10px 0",
    fontSize: "var(--text-base)",
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    color: "#fff",
    background: "var(--color-accent)",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    transition: `transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out)`,
    outline: "none",
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: "100%" }}>
      <div style={{ marginBottom: "var(--space-md)" }}>
        <label
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-text-soft)",
            marginBottom: "var(--space-xs)",
          }}
        >
          输入密码
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          placeholder="输入密码"
          autoFocus
          style={{
            ...inputStyle,
            ...(error ? inputErrorStyle : {}),
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor =
                "oklch(58% 0.16 65 / 60%)";
              e.currentTarget.style.boxShadow = "var(--shadow-glow)";
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
          disabled={loading}
        />
      </div>

      {error && (
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-error)",
            marginBottom: "var(--space-md)",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        style={{
          ...btnBase,
          ...(loading || !password
            ? { opacity: 0.5, cursor: "not-allowed", transform: "none" }
            : {}),
        }}
        onMouseEnter={(e) => {
          if (!loading && password) {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.boxShadow =
              "0 4px 20px oklch(58% 0.16 65 / 35%)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
        onMouseDown={(e) => {
          if (!loading && password) {
            e.currentTarget.style.transform = "scale(0.98)";
          }
        }}
        onMouseUp={(e) => {
          if (!loading && password) {
            e.currentTarget.style.transform = "scale(1.02)";
          }
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow =
            "0 0 0 3px var(--color-ring)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {loading ? "验证中..." : "进入 ShareHub"}
      </button>
    </form>
  );
}
