import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div
      className="min-h-[80vh] flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--color-paper)" }}
    >
      {/* Single large soft glow — refined, not candy */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] animate-breathe pointer-events-none"
        style={{
          background: "oklch(58% 0.16 65 / 14%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Subtle secondary shape — deeper, smaller */}
      <div
        className="absolute w-[280px] h-[280px] rounded-full blur-[80px] pointer-events-none"
        style={{
          background: "oklch(72% 0.10 65 / 10%)",
          bottom: "15%",
          right: "10%",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 animate-card-in"
        style={{ animationFillMode: "both" }}
      >
        <div
          className="rounded-[var(--radius-xl)] p-8"
          style={{
            background: "var(--color-surface)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "var(--shadow-card)",
            border: "1px solid oklch(100% 0 0 / 50%)",
          }}
        >
          {/* Icon */}
          <div className="text-center mb-7">
            <div
              className="inline-block text-[44px] leading-none select-none animate-icon-float"
              aria-hidden
            >
              📦
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-center mb-1.5 tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-display)",
              color: "var(--color-text)",
              fontWeight: 400,
            }}
          >
            ShareHub
          </h1>

          {/* Subtitle */}
          <p
            className="text-center mb-7 leading-relaxed"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-soft)",
            }}
          >
            没有密码？
            <br />
            微信上戳一下我就行~
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
