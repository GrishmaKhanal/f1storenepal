import Link from "next/link";
import { wrap } from "@/components/chrome";

export default function NotFound() {
  return (
    <section className={`${wrap} flex flex-col items-start gap-6 py-24`}>
      <div className="font-mono text-xs tracking-[.12em] text-red">ERROR 404 · OFF TRACK</div>
      <h1 className="display text-[clamp(56px,10vw,120px)] italic">BOX, BOX.</h1>
      <p className="max-w-md text-muted">That page isn&apos;t on the grid. It may have sold out or moved.</p>
      <div className="flex gap-3">
        <Link href="/shop" className="rounded-full bg-red px-6 py-3 text-sm font-semibold text-white hover:bg-red-hot hover:text-white">Shop all</Link>
        <Link href="/" className="rounded-full border border-ink px-6 py-3 text-sm font-semibold">Home</Link>
      </div>
    </section>
  );
}
