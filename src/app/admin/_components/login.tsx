"use client";

import { startTransition, useActionState } from "react";
import { login } from "../actions";
import { btn } from "./save";

const field = "rounded-[10px] border border-rule bg-white px-3 py-2.5 text-[16px] outline-none focus:border-ink";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <div className="mx-auto mt-[12vh] max-w-sm">
      <div className="mb-6 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo.jpeg" alt="" className="h-12 w-12 rounded-full" />
        <div>
          <div className="display text-2xl">STORE ADMIN</div>
          <div className="text-xs text-ink-5">Sign in to manage the store</div>
        </div>
      </div>
      {/* `action` covers submits before hydration (a real POST, never a GET with the password
          in the URL). onSubmit then skips React's form reset so a typo keeps the username. */}
      <form
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
        className="flex flex-col gap-4 rounded-[14px] border border-rule bg-white p-6"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Username
          <input name="username" autoFocus required autoComplete="username" autoCapitalize="none" spellCheck={false} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <input name="password" type="password" required autoComplete="current-password" className={field} />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span aria-live="polite" className="text-sm text-red">{state?.error}</span>
          <button className={btn} disabled={pending}>{pending ? "Checking…" : "Sign in →"}</button>
        </div>
      </form>
    </div>
  );
}
