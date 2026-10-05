import { desc } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";
import { mediaUrl } from "@/lib/media-url";
import { usesBucket } from "@/lib/media-store";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";
import { Empty, PageHeader } from "../_components/ui";
import { MediaCard, MediaUpload } from "./client";

export default async function MediaAdmin({ searchParams }: PageProps<"/admin/media">) {
  await guard();
  const sp = await searchParams;
  const rows = await db.select().from(media).orderBy(desc(media.createdAt));
  const total = rows.reduce((s, m) => s + m.bytes, 0);
  return (
    <>
      <DbNotice />
      <PageHeader actions={<MediaUpload />}>Media</PageHeader>
      <p className="mb-4 text-sm text-ink-5">
        {rows.length} images · {(total / 1024 / 1024).toFixed(1)} MB stored {usesBucket ? "in the image bucket (served by its CDN)" : "locally in .media/ (set S3_* env vars for production)"}. Each upload is saved as WebP at up to 3 sizes.
      </p>
      {sp.inuse && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Can&apos;t delete: that image is used by {String(sp.inuse)}. Remove it there first.</p>}
      {sp.failed && <p className="mb-4 rounded-lg bg-red/10 p-3 text-sm text-red">Couldn&apos;t delete the file from storage. Nothing was removed; try again.</p>}
      {rows.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((m) => (
            <MediaCard key={m.id} m={{ id: m.id, name: m.name, alt: m.alt, src: mediaUrl(m, 480), size: `${m.width}×${m.height} · ${Math.round(m.bytes / 1024)} KB` }} />
          ))}
        </div>
      ) : (
        <Empty>No images yet. Upload here or from any product.</Empty>
      )}
    </>
  );
}
