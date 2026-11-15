import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { NewPostForm } from "@/components/NewPostForm";

export default async function NewPostPage() {
  if (!(await getCurrentUser())) redirect("/login");
  return (
    <>
      <h1>New feature request</h1>
      <NewPostForm />
    </>
  );
}
