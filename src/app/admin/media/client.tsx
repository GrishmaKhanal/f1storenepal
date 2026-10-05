"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMedia, saveMedia, uploadImage } from "../actions";
import { input } from "../_components/fields";
import { Popconfirm } from "../_components/popconfirm";
import { SaveForm } from "../_components/save";

export function MediaUpload() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <div className="flex flex-col items-end gap-1">
      <label className={`cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-red ${pending ? "opacity-60" : ""}`}>
        {pending ? "Uploading…" : "Upload images"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
          multiple
          hidden
          disabled={pending}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            start(async () => {
              setErr("");
              for (const f of files) {
                const fd = new FormData();
                fd.set("file", f);
                const r = await uploadImage(fd);
                if (r.error) {
                  setErr(`${f.name}: ${r.error}`);
                  break;
                }
              }
              router.refresh();
            });
          }}
        />
      </label>
      {err && <span className="text-xs text-red">{err}</span>}
    </div>
  );
}

export function MediaCard({ m }: { m: { id: number; name: string; alt: string; src: string; size: string } }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[14px] border border-rule bg-white">
      <a href={m.src} target="_blank" className="flex aspect-square items-center justify-center bg-paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.src} alt={m.alt} loading="lazy" className="h-full w-full object-contain mix-blend-multiply" />
      </a>
      <SaveForm action={saveMedia} label="Save" className="space-y-2 p-3" barClassName="border-rule bg-white !py-2 text-xs">
        <input type="hidden" name="id" value={m.id} />
        <input name="name" defaultValue={m.name} aria-label="Name" className={`${input} !py-1 text-xs`} />
        <textarea name="alt" defaultValue={m.alt} aria-label="Alt text" rows={2} placeholder="Describe the image" className={`${input} !py-1 text-xs`} />
        <p className="font-mono text-[10px] text-ink-5">{m.size}</p>
      </SaveForm>
      <form action={deleteMedia} className="px-3 pb-3">
        <input type="hidden" name="id" value={m.id} />
        <Popconfirm label="Delete" title="Delete this image?" description="Removed from storage for good. Images still used on the site can't be deleted." confirmLabel="Delete" align="start" triggerClassName="text-xs text-red underline" />
      </form>
    </div>
  );
}
