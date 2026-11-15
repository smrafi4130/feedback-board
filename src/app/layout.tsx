import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, requireUser } from "@/lib/session";
import { logout } from "@/features/auth-actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feedback Board",
  description: "A product feedback board built with Next.js, Postgres and server actions.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  void requireUser;
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body>
        <header className="top">
          <div className="container">
            <Link href="/" className="brand">
              Feedback Board
            </Link>
            <nav className="row">
              {user ? (
                <>
                  <span className="meta">
                    {user.name}
                    {user.role === "admin" ? " · admin" : ""}
                  </span>
                  <form action={logout}>
                    <button type="submit">Sign out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login">Sign in</Link>
                  <Link href="/signup" className="btn primary">
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
