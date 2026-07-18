import { getAdminPassword, getEditorPassword, setAdminPassword, setEditorPassword } from "./kv";
import { compare, hash } from "./hash";
import type { SessionUser } from "./types";

export interface AuthResult {
  ok: true;
  user: SessionUser;
}

export interface AuthError {
  ok: false;
  error: string;
  status: number;
}

/**
 * Authenticate with a password. Returns the user role on success.
 */
export async function authenticate(password: string): Promise<AuthResult | AuthError> {
  if (!password) {
    return { ok: false, error: "Password required", status: 400 };
  }

  const adminHash = await getAdminPassword();
  if (adminHash && (await compare(password, adminHash))) {
    return { ok: true, user: { role: "admin" } };
  }

  const editorHash = await getEditorPassword();
  if (editorHash && (await compare(password, editorHash))) {
    return { ok: true, user: { role: "editor" } };
  }

  return { ok: false, error: "Wrong password", status: 401 };
}

/**
 * Change a password. Caller must be admin.
 */
export async function changePassword(
  target: string,
  oldPassword: string,
  newPassword: string
): Promise<AuthResult | AuthError> {
  if (!target || !oldPassword || !newPassword) {
    return { ok: false, error: "target, oldPassword, newPassword required", status: 400 };
  }
  if (!["admin", "editor"].includes(target)) {
    return { ok: false, error: "target must be admin or editor", status: 400 };
  }
  if (newPassword.length < 3) {
    return { ok: false, error: "新密码至少3位", status: 400 };
  }

  const stored = target === "admin" ? await getAdminPassword() : await getEditorPassword();
  if (!stored || !(await compare(oldPassword, stored))) {
    return { ok: false, error: "旧密码错误", status: 403 };
  }

  const newHash = await hash(newPassword);
  if (target === "admin") {
    await setAdminPassword(newHash);
  } else {
    await setEditorPassword(newHash);
  }

  return { ok: true, user: { role: "admin" } };
}
