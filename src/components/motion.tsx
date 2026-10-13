"use client";

import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m, stagger, type Transition, type Variants } from "motion/react";

// Motion ships only with the client components that import this file, not every page.
// Springs are short with no bounce: quick, but eased in and out rather than snapping.
// reducedMotion="user" keeps the fades and drops the movement for people who ask their
// OS for less motion.
const spring: Transition = { type: "spring", visualDuration: 0.3, bounce: 0 };

export function Motion({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={spring}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

/** Plays its <Rise>, <CheckBadge> and <Lights> descendants in on mount, one after another. */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Motion>
      <m.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { delayChildren: stagger(0.06) } } }} className={className}>
        {children}
      </m.div>
    </Motion>
  );
}

const rise: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

export function Rise({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div variants={rise} className={className}>
      {children}
    </m.div>
  );
}

/** Red disc that pops in, then draws its tick. */
export function CheckBadge() {
  return (
    <m.span
      variants={{ hidden: { opacity: 0, scale: 0.4 }, show: { opacity: 1, scale: 1, transition: { type: "spring", visualDuration: 0.35, bounce: 0.3 } } }}
      className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-red text-white"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <m.path d="M5 12.5l4.5 4.5L19 7.5" variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.12 } } }} />
      </svg>
    </m.span>
  );
}

/** Order progress as a row of start lights (on a dark strip): each reached step lights up in turn. */
export function Lights({ steps, at }: { steps: readonly string[]; at: number }) {
  return (
    <m.ol variants={{ hidden: {}, show: { transition: { delayChildren: stagger(0.11, { startDelay: 0.1 }) } } }} className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {steps.map((label, i) => (
        <li key={label} className="flex flex-col items-center gap-2 text-center" aria-current={i === at ? "step" : undefined}>
          <span className="relative h-5 w-5 rounded-full bg-white/15">
            {i <= at && (
              <m.span
                variants={{ hidden: { opacity: 0, scale: 0.3 }, show: { opacity: 1, scale: 1 } }}
                className="absolute inset-0 rounded-full bg-red shadow-[0_0_14px_rgba(225,6,0,.55)]"
              />
            )}
          </span>
          <span className={`text-xs font-semibold ${i <= at ? "text-white" : "text-white/45"}`}>
            {label}
            {i <= at && <span className="sr-only"> (done)</span>}
          </span>
        </li>
      ))}
    </m.ol>
  );
}

/** Opens and closes its content by animating height. Needs a <Motion> above it. */
export function Collapse({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <m.div key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
