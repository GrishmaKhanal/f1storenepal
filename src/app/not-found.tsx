import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper p-8 text-center">
      <div className="font-mono text-xs tracking-[.12em] text-red">ERROR 404</div>
      <h1 className="display text-7xl italic">BOX, BOX.</h1>
      <p className="text-muted">That page isn&apos;t on the grid.</p>
      <Link href="/" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-red hover:text-white">Back to the store</Link>
    </main>
  );
}
