"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Collapse, Motion } from "@/components/motion";
import { coordsLink, mapLink } from "@/lib/map-link";
import { districtIn } from "@/lib/nepal";
import { input } from "./styles";

type LatLng = { lat: number; lng: number };

// Where the map opens until the customer picks a district or shares their location.
const KATHMANDU: LatLng = { lat: 27.7089, lng: 85.3206 };
const NOT_A_LINK = "That isn't a Google Maps link. In Google Maps, tap Share, then Copy link.";
const PHONE = "(max-width: 639px)";

let configured = false;

const keyOf = (p: LatLng) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;

// A pin we wrote ourselves: https://www.google.com/maps?q=lat,lng
function pinOf(url: string): LatLng | null {
  const m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  return m && coordsLink(Number(m[1]), Number(m[2])) ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

// Google's address, trimmed for a Nepali address box: no plus code, no ", Nepal".
function tidy(address: string) {
  return address
    .replace(/^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3},?\s*/i, "")
    .replace(/,?\s*Nepal$/i, "")
    .trim();
}

function km(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

// Phones get a still preview that opens a full-screen picker: a map you can drag inside
// a scrolling page either traps the scroll or moves the pin by accident.
function usePhone() {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(PHONE);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => matchMedia(PHONE).matches,
    () => false,
  );
}

/**
 * Optional delivery pin. With a Google Maps key: search plus a map that moves under a
 * fixed pin. Without one, or if Google refuses the key: the browser's location or a
 * pasted Google Maps link. Either way the form posts a Google Maps link as `mapUrl`.
 */
export function LocationField({
  err,
  mapsKey,
  district,
  province,
  initial,
  onAddress,
  onDistrict,
}: {
  err?: string;
  mapsKey: string | null;
  district: string;
  province: string;
  initial: { mapUrl: string; mapAddress: string } | null; // from the last order on this device
  onAddress: (address: string) => void;
  onDistrict: (district: string) => void;
}) {
  const phone = usePhone();
  const [mode, setMode] = useState<"map" | "paste">(mapsKey ? "map" : "paste");
  const [start] = useState(() => (initial ? pinOf(initial.mapUrl) : null));
  const [pin, setPin] = useState<LatLng | null>(mapsKey ? start : null);
  const [pasted, setPasted] = useState(!mapsKey && initial ? initial.mapUrl : "");
  const [blurred, setBlurred] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [problem, setProblem] = useState("");
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(false); // the full-screen picker
  // Google's address for the pin, tagged with the pin it describes.
  const [found, setFound] = useState<{ key: string; text: string; district: string | null } | null>(start && initial?.mapAddress ? { key: keyOf(start), text: initial.mapAddress, district: null } : null);
  const mapEl = useRef<HTMLDivElement>(null);
  const searchEl = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  // Until the customer places it, the map's centre is just a view, not a pin.
  const armed = useRef(!!(mapsKey && start));
  // Bumped whenever the customer moves the map, so a late location fix never overrides them.
  const moved = useRef(0);
  const locateRef = useRef<(auto?: boolean) => void>(() => {});
  const described = useRef(start ? keyOf(start) : ""); // pin key we already have an address for (or are fetching)
  const latest = useRef({ district, onDistrict, onAddress });

  const link = mode === "map" ? (pin ? coordsLink(pin.lat, pin.lng) : null) : pasted.trim() ? mapLink(pasted) : null;
  const address = pin && found?.key === keyOf(pin) ? found : null;
  const bad = mode === "paste" && !!pasted.trim() && !link;
  const message = problem || (bad && (blurred || err) ? NOT_A_LINK : "");

  function pinCentre() {
    const c = map.current?.getCenter();
    if (!c) return;
    armed.current = true;
    setNote("");
    setPin({ lat: c.lat(), lng: c.lng() });
  }

  useEffect(() => {
    if (mode !== "map" || !mapsKey) return;
    const el = mapEl.current!;
    let live = true;
    const cleanups: (() => void)[] = [];

    async function init() {
      // Google calls this global when the key is wrong or not allowed on this domain.
      (window as { gm_authFailure?: () => void }).gm_authFailure = () => live && setMode("paste");
      try {
        if (!configured) setOptions({ key: mapsKey!, v: "weekly", region: "NP", language: "en" });
        configured = true;
        const { Map, MapTypeControlStyle } = await importLibrary("maps");
        if (!live) return;
        const small = matchMedia(PHONE).matches;
        const m = new Map(el, {
          // Their last delivery spot on this device, or Kathmandu.
          center: start ?? KATHMANDU,
          zoom: start ? 17 : 13,
          disableDefaultUI: true,
          zoomControl: !small,
          mapTypeControl: !small,
          mapTypeControlOptions: { style: small ? MapTypeControlStyle.DROPDOWN_MENU : MapTypeControlStyle.HORIZONTAL_BAR },
          // Desktop: drag with the mouse, ctrl + scroll to zoom, so the page still scrolls.
          gestureHandling: small ? "none" : "cooperative",
          clickableIcons: false,
        });
        map.current = m;
        const place = () => {
          armed.current = true;
          moved.current++;
          setAccuracy(null);
          setNote("");
        };
        m.addListener("dragstart", () => {
          place();
          setDragging(true);
        });
        m.addListener("dragend", () => setDragging(false));
        m.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          place();
          m.panTo(e.latLng);
        });
        el.addEventListener("keydown", place); // arrow keys pan the map too
        m.addListener("idle", () => {
          const c = m.getCenter();
          if (armed.current && c) setPin({ lat: c.lat(), lng: c.lng() });
        });
        cleanups.push(() => {
          google.maps.event.clearInstanceListeners(m);
          el.removeEventListener("keydown", place);
        });
        // Optional (Geocoding API): jump to the district the customer picks.
        try {
          const { Geocoder } = await importLibrary("geocoding");
          geocoder.current = new Geocoder();
        } catch (e) {
          console.warn("Geocoding unavailable", e);
        }
        if (!live) return;
        setReady(true);

        // Already allowed location for this site? Open on where they are (as a view,
        // not a pin: they may be ordering for somewhere else). Never prompt unasked.
        navigator.permissions
          ?.query({ name: "geolocation" })
          .then((s) => live && s.state === "granted" && !armed.current && locateRef.current(true))
          .catch(() => {});

        // Search is a separate API (Places). Without it the map still works.
        try {
          const { PlaceAutocompleteElement } = await importLibrary("places");
          if (!live || !searchEl.current) return;
          const ac = new PlaceAutocompleteElement({ includedRegionCodes: ["np"] });
          ac.placeholder = "Search a place, landmark or area";
          ac.style.colorScheme = "light";
          ac.addEventListener("gmp-select", async ({ placePrediction }) => {
            setProblem("");
            try {
              const { place: hit } = await placePrediction.toPlace().fetchFields({ fields: ["location", "displayName", "formattedAddress", "addressComponents"] });
              if (!hit.location) return;
              place();
              const key = keyOf({ lat: hit.location.lat(), lng: hit.location.lng() });
              const text = [hit.displayName, hit.formattedAddress].filter((x, i, a): x is string => !!x && !(i && a[0] && x.startsWith(a[0]))).join(", ");
              described.current = key;
              suggest(key, text, districtIn(hit.addressComponents?.map((c) => c.longText) ?? []));
              m.setCenter(hit.location);
              m.setZoom(17);
            } catch (e) {
              console.error("Place lookup failed", e);
              setProblem("Couldn't open that place. Drag the map to your spot instead.");
            }
          });
          searchEl.current.replaceChildren(ac);
          cleanups.push(() => ac.remove());
        } catch (e) {
          console.warn("Place search unavailable", e);
        }
      } catch (e) {
        console.error("Google Maps failed to load", e);
        if (live) setMode("paste");
      }
    }

    // Map loads are billed, so wait until the field is about to scroll into view.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        init();
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => {
      live = false;
      io.disconnect();
      cleanups.forEach((f) => f());
      map.current = null;
    };
  }, [mapsKey, mode, start]);

  useEffect(() => {
    latest.current = { district, onDistrict, onAddress };
  });

  function suggest(key: string, raw: string, d: string | null) {
    const text = tidy(raw);
    setFound({ key, text, district: d });
    if (text) latest.current.onAddress(text);
    // Fill in the district from the pin, unless the customer already chose one.
    if (d && !latest.current.district) latest.current.onDistrict(d);
  }

  // Look up a street address for the pin (Geocoding API), once it settles.
  useEffect(() => {
    const g = geocoder.current;
    if (!pin || !g) return;
    const key = keyOf(pin);
    if (described.current === key) return;
    const t = setTimeout(() => {
      described.current = key;
      g.geocode({ location: pin })
        .then(({ results }) => {
          if (described.current !== key) return;
          const best = results.find((r) => !r.types.includes("plus_code")) ?? results[0];
          const parts = results.flatMap((r) => r.address_components);
          const byLevel = parts.filter((c) => c.types.includes("administrative_area_level_2")).map((c) => c.long_name);
          suggest(key, best?.formatted_address ?? "", districtIn([...byLevel, ...parts.map((c) => c.long_name)]));
        })
        .catch((e) => {
          geocoder.current = null; // usually the Geocoding API isn't enabled: stop asking
          console.warn("Couldn't look up the pin's address", e);
        });
    }, 500);
    return () => clearTimeout(t);
  }, [pin]);

  // Full-screen picker: free one-finger dragging, full controls, page scroll locked.
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    const full = open || !phone;
    m.setOptions({ gestureHandling: open ? "greedy" : phone ? "none" : "cooperative", zoomControl: full, mapTypeControl: full });
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheet.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, phone, ready]);

  // Show the chosen district, until the customer has placed the pin themselves.
  useEffect(() => {
    const m = map.current;
    const g = geocoder.current;
    if (!ready || !m || !g || !district || armed.current) return;
    let live = true;
    g.geocode({ address: `${district} District, ${province} Province, Nepal`, region: "np" })
      .then(({ results }) => {
        const r = results[0];
        const c = m.getCenter();
        if (!live || !r || armed.current) return;
        // Already looking at a spot inside that district (e.g. their own location): stay.
        if (c && r.geometry.viewport?.contains(c) && (m.getZoom() ?? 0) >= 12) return;
        if (r.geometry.viewport) m.fitBounds(r.geometry.viewport);
        else m.setCenter(r.geometry.location);
      })
      .catch((e) => {
        // Usually the Geocoding API isn't enabled for the key: stop asking.
        geocoder.current = null;
        console.warn("Couldn't find the district on the map", e);
      });
    return () => {
      live = false;
    };
  }, [district, province, ready]);

  function locate(auto = false) {
    const geo = navigator.geolocation;
    if (!geo) {
      if (!auto) setProblem("This browser can't share your location. Search or drag the map instead.");
      return;
    }
    setProblem("");
    setLocating(true);
    const since = moved.current;
    let best = Infinity;
    let failed = 0;
    const fix = ({ coords }: GeolocationPosition) => {
      if (moved.current !== since || coords.accuracy >= best) return;
      best = coords.accuracy;
      setLocating(false);
      const p = { lat: coords.latitude, lng: coords.longitude };
      const acc = Math.round(coords.accuracy);
      const m = map.current;
      if (!m) {
        setPasted(coordsLink(p.lat, p.lng) ?? "");
        setAccuracy(acc);
        return;
      }
      if (auto) {
        setNote(`Showing where you are now. ${phone ? "Tap the map" : "Press Deliver here"} if that's your delivery spot.`);
      } else {
        armed.current = true;
        setPin(p);
        setAccuracy(acc);
      }
      m.setCenter(p);
      m.setZoom(acc <= 150 ? 18 : acc <= 1500 ? 16 : 14);
    };
    const fail = (e: GeolocationPositionError) => {
      if (++failed < 2 || best < Infinity) return;
      setLocating(false);
      if (auto) return;
      const other = mode === "map" ? "search or drag the map" : "paste a Google Maps link";
      setProblem(
        e.code === e.PERMISSION_DENIED
          ? `Location is blocked for this site. Allow it in your browser settings, or ${other}.`
          : `Couldn't find your location. Try again, or ${other}.`,
      );
    };
    // A quick rough fix first (Wi-Fi or a recent one), then GPS, which replaces it when it lands.
    geo.getCurrentPosition(fix, fail, { enableHighAccuracy: false, maximumAge: 300_000, timeout: 6000 });
    geo.getCurrentPosition(fix, fail, { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 });
  }
  // The map's init effect calls the latest locate() without re-running when it changes.
  useEffect(() => {
    locateRef.current = locate;
  });

  function clear() {
    armed.current = false;
    described.current = "";
    setFound(null);
    setPin(null);
    setPasted("");
    setAccuracy(null);
  }

  const pinIcon = (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 flex-none ${locating ? "animate-pulse" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
  const chip = "flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-semibold shadow-md transition-colors hover:text-red disabled:cursor-wait disabled:opacity-70";

  return (
    <div>
      <label htmlFor={mode === "paste" ? "f-mapUrl" : undefined} className="mb-1.5 block text-sm font-semibold">
        Pin your location
      </label>
      {mode === "map" ? (
        <>
          <p className="mb-2 text-xs text-faint">
            {phone ? "Tap the map and put the pin on your door. We'll fill in your address." : "Search, or drag the map until the pin sits on your door. We'll fill in your address."}
          </p>
          <div
            ref={sheet}
            tabIndex={open ? -1 : undefined}
            role={open ? "dialog" : undefined}
            aria-modal={open || undefined}
            aria-label={open ? "Choose your delivery spot" : undefined}
            className={open ? "fixed inset-0 z-[70] flex flex-col gap-3 bg-white px-3 pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] outline-none" : "flex flex-col gap-2"}
          >
            {open && (
              <div className="flex items-center justify-between gap-3">
                <p className="display text-[24px]">PIN YOUR DOOR</p>
                <button type="button" onClick={() => setOpen(false)} className="h-10 w-10 flex-none cursor-pointer rounded-full border border-rule text-lg hover:border-ink" aria-label="Close map">
                  ✕
                </button>
              </div>
            )}
            <div ref={searchEl} className="empty:hidden [&>*]:w-full" />
            <div className={`relative overflow-hidden rounded-[10px] border border-rule bg-paper ${open ? "min-h-0 flex-1" : "h-[240px] sm:h-[340px]"}`}>
              <div ref={mapEl} className="absolute inset-0" aria-label="Map: drag to move the pin" />
              {!ready && <div className="absolute inset-0 flex items-center justify-center text-sm text-faint">Loading map…</div>}
              {ready && (
                <>
                  {/* The pin stays put in the middle; the map moves under it. */}
                  <span className="pointer-events-none absolute top-1/2 left-1/2 h-1.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30" />
                  <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                    <svg viewBox="0 0 24 32" className={`h-10 w-[30px] drop-shadow-md transition-transform duration-150 ease-out ${dragging ? "-translate-y-2" : ""} ${pin ? "text-red" : "text-ink"}`} aria-hidden>
                      <path fill="currentColor" d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 32 12 32s12-11.6 12-20.3C24 5.2 18.6 0 12 0z" />
                      <circle cx="12" cy="11.5" r="4.5" fill="#fff" />
                    </svg>
                  </span>
                  {phone && !open && (
                    <button type="button" onClick={() => setOpen(true)} className="absolute inset-0 z-10 flex cursor-pointer items-end justify-center pb-4" aria-label="Open the map to choose your delivery spot">
                      <span className="rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg">{pin ? "Tap to adjust the pin" : "Tap to choose your spot"}</span>
                    </button>
                  )}
                  <div className="absolute top-2.5 right-2.5 z-20 flex flex-col items-end gap-2">
                    <button type="button" onClick={() => locate()} disabled={locating} className={chip}>
                      {pinIcon}
                      {locating ? "Finding you…" : "My location"}
                    </button>
                    {!phone && !open && (
                      <button type="button" onClick={() => setOpen(true)} className={`${chip} w-10 justify-center px-0`} aria-label="Full screen map" title="Full screen">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {!pin && !open && !phone && (
                    <button type="button" onClick={pinCentre} className="absolute bottom-9 left-1/2 z-20 -translate-x-1/2 cursor-pointer rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap text-white shadow-lg hover:bg-red">
                      Deliver here
                    </button>
                  )}
                </>
              )}
            </div>
            {open && (
              <button
                type="button"
                onClick={() => {
                  if (!armed.current) pinCentre();
                  setOpen(false);
                }}
                className="h-12 flex-none cursor-pointer rounded-full bg-red text-[15px] font-semibold text-white hover:bg-red-hot"
              >
                {pin ? "Done" : "Deliver here"}
              </button>
            )}
          </div>
          <input type="hidden" name="mapUrl" value={link ?? ""} />
          <input type="hidden" name="mapAddress" value={address?.text ?? ""} />
        </>
      ) : (
        <>
          <p className="mb-2 text-xs text-faint">Helps delivery find you. Share where you are now, or paste a link from Google Maps (Share → Copy link).</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => locate()}
              disabled={locating}
              className="flex h-12 flex-none cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-red disabled:cursor-wait disabled:opacity-60"
            >
              {pinIcon}
              {locating ? "Finding you…" : "Use my current location"}
            </button>
            <input
              id="f-mapUrl"
              name="mapUrl"
              value={pasted}
              onChange={(e) => {
                setPasted(e.target.value);
                setAccuracy(null);
                setProblem("");
              }}
              onBlur={() => setBlurred(true)}
              inputMode="url"
              autoComplete="off"
              placeholder="or paste a Google Maps link"
              aria-invalid={!!message}
              aria-describedby="f-mapUrl-status"
              className={input}
            />
          </div>
        </>
      )}
      <div id="f-mapUrl-status" aria-live="polite">
        <Motion>
          <Collapse show={!!link}>
            {mode === "map" && (
              <p className="pt-2 text-sm">
                <span className="font-semibold text-online">✓ Location pinned</span>
                {address?.text && <span className="text-ink"> · {address.text}</span>}
                {address?.district && district && address.district !== district && (
                  <span className="mt-0.5 block text-xs text-muted">
                    The pin looks like it&apos;s in {address.district} district, but you picked {district}. Check one of them.
                  </span>
                )}
              </p>
            )}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm">
              {mode === "paste" && <span className="font-semibold text-online">✓ Location pinned</span>}
              {accuracy != null && (
                <span className="text-faint">{accuracy > 300 ? `Rough, within about ${km(accuracy)}. ${mode === "map" ? "Drag the map to your door." : "A pasted Maps link is more precise."}` : `Accurate to about ${km(accuracy)}`}</span>
              )}
              <a href={link ?? undefined} target="_blank" rel="noopener noreferrer" className="underline">
                Check on Google Maps
              </a>
              <button type="button" onClick={clear} className="cursor-pointer text-faint underline hover:text-red">
                Remove
              </button>
            </p>
          </Collapse>
          <Collapse show={!link && !!note}>
            <p className="pt-1.5 text-xs text-muted">{note}</p>
          </Collapse>
          <Collapse show={!!message}>
            <p className="pt-1.5 text-xs text-red">{message}</p>
          </Collapse>
        </Motion>
      </div>
    </div>
  );
}
