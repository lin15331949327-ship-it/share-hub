import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">登录 ShareHub</h1>
        <p className="text-sm text-zinc-500">管理员密码：完全管理权限 | 编辑者密码：仅可添加资源</p>
      </div>
      <LoginForm />
    </div>
  );
}
