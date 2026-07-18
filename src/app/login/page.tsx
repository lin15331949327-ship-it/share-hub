import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 animate-gradient-slow" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-200/30 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-rose-200/20 rounded-full blur-3xl animate-float-slower" />
      <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-sky-200/30 rounded-full blur-2xl animate-float" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-violet-100/50 border border-white/80 p-8">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="inline-block text-5xl animate-bounce-gentle">📦</div>
          </div>

          <h1 className="text-xl font-bold text-zinc-900 text-center mb-2">
            ShareHub
          </h1>
          <p className="text-sm text-zinc-400 text-center mb-6">
            没有密码？微信上戳一下我就行~
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
