import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { signup } from "@/features/auth-actions";
import { getCurrentUser } from "@/lib/session";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  return <AuthForm mode="signup" action={signup} />;
}
