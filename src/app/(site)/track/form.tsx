"use client";

import Link from "next/link";
import { useActionState, useMemo, useSyncExternalStore } from "react";
import { trackOrder, type TrackState } from "@/app/actions/track";
import { recentOrders, recentRaw } from "../checkout/saved";
import { input } from "../checkout/styles";

export function TrackForm({ order }: { order: string }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, undefined);
  // Orders placed on this device: one tap, no typing. The server (and hydration) see none.
  const raw = useSyncExternalStore(
    () => () => {},
    recentRaw,
    () => "",
  );
  const recent = useMemo(() => recentOrders(raw), [raw]);
  return (
    <div className="flex flex-col gap-6">
      {recent.length > 0 && (
        <div className="rounded-[20px] border border-rule bg-white p-6">
          <h2 className="display mb-3 text-[24px]">ON THIS DEVICE</h2>
          <ul className="divide-y divide-rule">
            {recent.map((r) => (
              <li key={r.token}>
                <Link href={`/order/${r.token}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-red">
                  <span className="font-mono font-semibold tracking-[.06em]">{r.no}</span>
                  <span className="text-faint">{new Date(r.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · View →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form action={action} className="flex flex-col gap-4 rounded-[20px] border border-rule bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="t-order" className="mb-1.5 block text-sm font-semibold">
              Order number<span className="ml-0.5 text-red" aria-hidden>*</span>
            </label>
            <input id="t-order" name="order" required defaultValue={state?.order ?? order} placeholder="F1N-1027" autoCapitalize="characters" spellCheck={false} className={input} />
          </div>
          <div>
            <label htmlFor="t-phone" className="mb-1.5 block text-sm font-semibold">
              Phone<span className="ml-0.5 text-red" aria-hidden>*</span>
            </label>
            <input id="t-phone" name="phone" type="tel" required autoComplete="tel" defaultValue={state?.phone} placeholder="98XXXXXXXX" className={input} />
          </div>
        </div>
        <p className="-mt-1 text-xs text-faint">Your order number is in your confirmation email and at the top of your order page.</p>
        {state?.error && (
          <p role="alert" className="rounded-[10px] bg-red/10 p-3 text-sm font-semibold text-red">
            {state.error}
          </p>
        )}
        <button disabled={pending} className="cursor-pointer rounded-full bg-red py-4 text-[15px] font-semibold text-white transition-colors hover:bg-red-hot disabled:cursor-wait disabled:opacity-60">
          {pending ? "Looking…" : "Find my order"}
        </button>
      </form>
    </div>
  );
}
