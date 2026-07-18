import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-3">🔐 登录 ShareHub</h1>
        <p className="text-sm text-zinc-400">
          没有密码？微信上戳一下群主呗～
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-xs text-zinc-300 mt-6">
        🐣 密码找 linxiaoxiao 要，别不好意思！
      </p>
    </div>
  );
}
