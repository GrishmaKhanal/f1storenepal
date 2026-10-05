import type { Img as ImgData } from "@/lib/data";

// Responsive <img> for stored media: WebP srcset from the CDN, real width/height so
// the browser reserves space (no layout shift), lazy unless it's above the fold.
export function Img({
  img,
  sizes,
  className,
  priority,
  alt,
}: {
  img: ImgData;
  sizes: string;
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes={sizes}
      width={img.width}
      height={img.height}
      alt={alt ?? img.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}
