"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function AuthBar() {
  const { data: session, status } = useSession();

  return (
    <div className="auth-bar">
      <div>
        <div className="micro-label">Session</div>
        <strong>{status === "authenticated" ? session.user?.email ?? "Signed in" : "Guest mode"}</strong>
      </div>
      <button
        className="button secondary"
        onClick={() => {
          if (status === "authenticated") {
            void signOut();
          } else {
            void signIn("google");
          }
        }}
        type="button"
      >
        {status === "authenticated" ? "Sign out" : "Sign in with Google"}
      </button>
    </div>
  );
}
