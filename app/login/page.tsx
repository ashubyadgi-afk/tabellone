import { redirect } from "next/navigation";
import { getRoleHomePath, getSession } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(getRoleHomePath(session.role));
  }

  return <LoginForm />;
}
