import { redirect } from "next/navigation";
import { getRoleHomePath } from "@/lib/auth/session";
import { getLiveSession } from "@/lib/auth/live-session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const live = await getLiveSession();
  if (live.status === "stale") redirect("/api/v1/auth/session-reset");
  if (live.status === "ok") redirect(getRoleHomePath(live.session.role));

  return <LoginForm />;
}
