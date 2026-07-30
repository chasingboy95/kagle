import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { useMemo } from "react";

import auraSvg from "@/assets/muscle-sphere/aura.svg";
import coreSvg from "@/assets/muscle-sphere/core.svg";
import fasciaSvg from "@/assets/muscle-sphere/fascia.svg";
import fibersSvg from "@/assets/muscle-sphere/fibers.svg";
import fluidSvg from "@/assets/muscle-sphere/fluid.svg";
import highlightSvg from "@/assets/muscle-sphere/highlight.svg";
import particlesSvg from "@/assets/muscle-sphere/particles.svg";
import rippleSvg from "@/assets/muscle-sphere/ripple.svg";
import shadowSvg from "@/assets/muscle-sphere/shadow.svg";

export type MuscleStage = "idle" | "ready" | "contract" | "hold" | "relax" | "feedback" | "rest";

export interface MuscleSphereProps {
  /** Current training stage. */
  stage: MuscleStage;
  /** Progress within the current stage, 0–1. Used only for the progress ring. */
  stageProgress?: number;
  /** Diameter in px. Defaults to 288. */
  size?: number;
  /**
   * Stable-pose pause. When true the component animates to and holds the
   * contracted or relaxed target pose for the current stage. All continuous
   * animation (tremor, breathing, ripple) stops. Resuming re-attaches the
   * active variants. This is NOT a frame-level timeline freeze.
   */
  paused?: boolean;
  /** Whether to show the outer conic progress ring. Defaults to false. */
  showProgressRing?: boolean;
  /**
   * Duration of the current training stage in milliseconds.
   * When provided, relax and contract transition durations will derive from it
   * rather than using fixed defaults.
   */
  stageDurationMs?: number;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Internal types                                                     */
/* ------------------------------------------------------------------ */

type LayerName =
  | "shadow"
  | "aura"
  | "ripple"
  | "fascia"
  | "fluid"
  | "fibers"
  | "core"
  | "highlight"
  | "particles";

interface LayerDefinition {
  name: LayerName;
  src: string;
  className: string;
  variants: Variants;
}

/* ------------------------------------------------------------------ */
/*  Shared transitions                                                 */
/* ------------------------------------------------------------------ */

/**
 * Soft cubic-bezier used for the primary contract and relax motion.
 * [0.22, 1, 0.36, 1] – ease-out with a very subtle overshoot.
 */
const CUBIC_EASE: Transition = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

/**
 * Spring used exclusively for small local corrections where it improves
 * organic feel (e.g. shadow settling, subtle idle breathing).
 */
const SOFT_SPRING: Transition = {
  type: "spring",
  stiffness: 60,
  damping: 20,
  mass: 1.45,
};

/* ------------------------------------------------------------------ */
/*  Relax transition helper                                            */
/* ------------------------------------------------------------------ */

/**
 * Build a relax transition that scales duration with the stage length.
 * Floor at 0.6 s so very short stages still animate smoothly.
 */
function relaxTransition(stageDurationMs: number | undefined): Transition {
  const raw = stageDurationMs ? stageDurationMs / 1000 : 0;
  const dur = Math.max(0.6, raw * 0.75);
  return { duration: dur, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };
}

/* ------------------------------------------------------------------ */
/*  Container variants                                                 */
/* ------------------------------------------------------------------ */

function buildContainerVariants(stageDurationMs: number | undefined): Variants {
  const relaxT = relaxTransition(stageDurationMs);
  return {
    idle:     { scale: 1, y: 0, transition: SOFT_SPRING },
    ready:    { scale: [1, 1.03, 1], y: [0, -1, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
    contract: { scale: 0.92, y: -12, transition: CUBIC_EASE },
    hold:     { scale: 0.92, y: -12, transition: CUBIC_EASE },
    relax:    { scale: [0.92, 1.015, 1], y: [-12, 1, 0], transition: { scale: relaxT, y: relaxT } },
    feedback: { scale: 1, y: 0, opacity: 0.9, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };
}

/* ------------------------------------------------------------------ */
/*  Layer variants (static factory, no runtime allocations per render)  */
/* ------------------------------------------------------------------ */

const shadowVariants: Variants = {
  idle:     { scale: 1, y: 8, opacity: 0.34, filter: "blur(3px)", transition: SOFT_SPRING },
  ready:    { scale: [1, 1.02, 1], y: [8, 6, 8], opacity: [0.34, 0.28, 0.34], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  contract: { scaleX: 0.85, scaleY: 0.88, y: 18, opacity: 0.48, filter: "blur(5px)", transition: CUBIC_EASE },
  hold:     { scaleX: 0.85, scaleY: 0.88, y: 18, opacity: 0.48, filter: "blur(5px)", transition: CUBIC_EASE },
  relax:    { scaleX: [0.85, 1.03, 1], scaleY: [0.88, 1.01, 1], y: [18, 5, 8], opacity: [0.48, 0.28, 0.34], filter: ["blur(5px)", "blur(2px)", "blur(3px)"], transition: { duration: 1.6, times: [0, 0.65, 1], ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  feedback: { scale: 1, y: 8, opacity: 0.34, filter: "blur(3px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const auraVariants: Variants = {
  idle:     { scale: [0.99, 1.03, 0.99], opacity: [0.18, 0.28, 0.18], transition: { duration: 5, repeat: Infinity, ease: "easeInOut" } },
  ready:    { scale: [1, 1.04, 1], opacity: [0.22, 0.34, 0.22], filter: "saturate(1.04) brightness(1.02)", transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  contract: { scale: 0.94, opacity: 0.34, filter: "saturate(1.08) brightness(1.04)", transition: CUBIC_EASE },
  hold:     { scale: 0.94, opacity: 0.34, filter: "saturate(1.08) brightness(1.04)", transition: CUBIC_EASE },
  relax: { scale: [0.94, 1.04, 1], opacity: [0.34, 0.15, 0.2], filter: ["saturate(1.08) brightness(1.04)", "saturate(0.98) brightness(1.02)", "saturate(1) brightness(1)"], transition: { duration: 1.8, ease: [0.22, 1, 0.36, 1] } },
  feedback: { scale: [1.02, 1], opacity: [0.22, 0.18], transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/* 
  Note: the relax variant for aura above uses a function-based transition
  that reads stageDurationMs. This is the only variant that needs it because
  no other layer has a relax sequence that benefits from stage-length scaling.
  We handle it below via a runtime override to keep the static shape simple.
*/

const rippleVariants: Variants = {
  idle:     { scale: 1, opacity: 0.04 },
  ready:    { scale: [1, 1.02, 1], opacity: [0.04, 0.06, 0.04], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  contract: { scale: 0.88, opacity: 0 },
  hold:     { scale: 0.88, opacity: 0 },
  relax:    { scale: [0.88, 1.18], opacity: [0.18, 0], transition: { duration: 1.8, ease: [0.22, 1, 0.36, 1] } },
  feedback: { scale: 1, opacity: 0.04, transition: { duration: 0.8 } },
};

const fasciaVariants: Variants = {
  idle:     { scale: [1, 1.008, 1], rotate: [0, 0.5, -0.3, 0], opacity: 0.58, transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } },
  ready:    { scale: [1, 1.01, 1], rotate: [0, 0.3, -0.2, 0], opacity: 0.58, transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } },
  contract: { scale: 0.91, rotate: 1.2, opacity: 0.78, transition: CUBIC_EASE },
  hold:     { scale: [0.91, 0.915, 0.91], opacity: [0.76, 0.82, 0.76], transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" }, rotate: 1.2 },
  relax:    { scale: [0.91, 1.02, 1], rotate: [1.2, -0.3, 0], opacity: [0.78, 0.52, 0.58], transition: { duration: 1.8, times: [0, 0.65, 1], ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  feedback: { scale: 1, rotate: 0, opacity: 0.58, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const fluidVariants: Variants = {
  idle:     { scaleX: [1, 1.012, 0.996, 1], scaleY: [1, 0.995, 1.012, 1], x: [0, 0.8, -0.5, 0], y: [0, -1, 0.5, 0], rotate: [0, 0.4, -0.3, 0], opacity: 0.74, transition: { duration: 5.5, repeat: Infinity, ease: "easeInOut" } },
  ready:    { scaleX: [1, 1.008, 1], scaleY: [1, 0.998, 1], x: [0, 0.4, -0.3, 0], y: [0, -0.5, 0.3, 0], rotate: [0, 0.2, -0.2, 0], opacity: 0.74, transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" } },
  contract: { scaleX: 0.88, scaleY: 0.93, x: 0, y: -1, rotate: -0.4, opacity: 0.88, transition: CUBIC_EASE },
  hold:     { scaleX: 0.88, scaleY: 0.93, x: 0, y: -1, rotate: -0.4, opacity: 0.88, transition: CUBIC_EASE },
  relax:    { scaleX: [0.88, 1.035, 1], scaleY: [0.93, 1.025, 1], x: [0, -0.8, 0], y: [-1, 1.2, 0], rotate: [-0.4, 0.3, 0], opacity: [0.88, 0.68, 0.74], transition: { duration: 1.8, times: [0, 0.65, 1], ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  feedback: { scaleX: 1, scaleY: 1, x: 0, y: 0, rotate: 0, opacity: 0.74, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const fibersVariants: Variants = {
  idle:     { scale: 1, opacity: 0.6 },
  ready:    { scale: [1, 1.012, 1], opacity: [0.6, 0.66, 0.6], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  contract: { scale: 0.82, opacity: 0.88, filter: "contrast(1.08)", transition: CUBIC_EASE },
  hold:     { scale: 0.82, x: [0, 0.35, -0.45, 0.2, 0], y: [0, -0.25, 0.3, -0.15, 0], opacity: 0.86, filter: "contrast(1.08)", transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" } },
  relax:    { scale: [0.82, 1.025, 1], opacity: [0.88, 0.54, 0.6], filter: ["contrast(1.08)", "contrast(0.98)", "contrast(1)"], transition: { duration: 1.8, times: [0, 0.65, 1], ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  feedback: { scale: 1, opacity: 0.6, filter: "contrast(1)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/*
 * TODO: Future inline-fiber animation
 * ====================================
 * Replace `fibers.svg` with an inline React SVG component that renders
 * individual fiber paths. Each fiber's center-point formula:
 *
 *   Center C = (256, 256)
 *   direction_i = normalize(C - P_i)
 *   translation_i = amplitude_i * easedProgress * direction_i
 *
 * Recommended amplitude: 4–12 px (outer fibers move farther).
 * Fiber metadata must be deterministic (not random per render).
 * The inline component should accept a `contractionProgress` prop (0–1)
 * and optionally a `tremorProgress` for hold-state micro-motion.
 */

const coreVariants: Variants = {
  idle:     { scale: [0.99, 1.03, 0.99], opacity: [0.78, 0.88, 0.78], filter: ["brightness(1) saturate(1)", "brightness(1.04) saturate(1.06)", "brightness(1) saturate(1)"], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } },
  ready:    { scale: [1, 1.04, 1], opacity: [0.82, 0.92, 0.82], filter: ["brightness(1) saturate(1)", "brightness(1.03) saturate(1.04)", "brightness(1) saturate(1)"], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  contract: { scale: 0.72, opacity: 1, filter: "brightness(1.08) saturate(1.12)", transition: CUBIC_EASE },
  hold:     { scale: [0.72, 0.74, 0.72], opacity: [0.94, 1, 0.94], filter: "brightness(1.08) saturate(1.12)", transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
  relax:    { scale: [0.72, 1.04, 1], opacity: [1, 0.72, 0.8], filter: ["brightness(1.08) saturate(1.12)", "brightness(1.02) saturate(0.96)", "brightness(1) saturate(1)"], transition: { duration: 1.8, times: [0, 0.65, 1], ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  feedback: { scale: [1.02, 1], opacity: [0.82, 0.78], filter: ["brightness(1.02) saturate(1.02)", "brightness(1) saturate(1)"], transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const highlightVariants: Variants = {
  idle:     { scale: [1, 1.015, 1], x: 0, y: 0, opacity: [0.38, 0.48, 0.38], transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } },
  ready:    { scale: [1, 1.02, 1], x: 0, y: 0, opacity: [0.38, 0.50, 0.38], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  contract: { scale: 0.9, x: 3, y: 4, opacity: 0.72, filter: "brightness(1.06)", transition: CUBIC_EASE },
  hold:     { scale: 0.9, x: 3, y: 4, opacity: 0.72, filter: "brightness(1.06)", transition: CUBIC_EASE },
  relax:    { scale: [0.9, 1.02, 1], x: [3, -0.5, 0], y: [4, -0.5, 0], opacity: [0.72, 0.34, 0.4], filter: ["brightness(1.06)", "brightness(0.98)", "brightness(1)"], transition: { duration: 1.8, times: [0, 0.65, 1], ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  feedback: { scale: 1, x: 0, y: 0, opacity: 0.38, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const particlesVariants: Variants = {
  idle:     { scale: [1, 1.018, 1], rotate: [0, 0.8, 0], x: [0, 0.6, -0.4, 0], y: [0, -0.8, 0.5, 0], opacity: [0.32, 0.46, 0.32], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } },
  ready:    { scale: [1, 1.015, 1], rotate: [0, 0.4, 0], x: [0, 0.3, -0.2, 0], y: [0, -0.4, 0.3, 0], opacity: [0.32, 0.42, 0.32], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  contract: { scale: 0.78, rotate: 0.8, x: 0, y: 0, opacity: 0.72, transition: CUBIC_EASE },
  hold:     { scale: 0.78, rotate: 0.8, x: 0, y: 0, opacity: 0.72, transition: CUBIC_EASE },
  relax:    { scale: [0.78, 1.03, 1], rotate: [0.8, -0.6, 0], x: [0, 0.8, 0], y: [0, -1, 0], opacity: [0.72, 0.26, 0.34], transition: { duration: 1.8, times: [0, 0.65, 1], ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  feedback: { scale: 1, rotate: 0, x: 0, y: 0, opacity: [0.42, 0.32], transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/* ------------------------------------------------------------------ */
/*  Layer definitions (static, no per-render allocation)               */
/* ------------------------------------------------------------------ */

const LAYER_DEFINITIONS: LayerDefinition[] = [
  { name: "shadow",    src: shadowSvg,    className: "z-0",  variants: shadowVariants },
  { name: "aura",      src: auraSvg,      className: "z-10", variants: auraVariants },
  { name: "ripple",    src: rippleSvg,    className: "z-20", variants: rippleVariants },
  { name: "fascia",    src: fasciaSvg,    className: "z-30", variants: fasciaVariants },
  { name: "fluid",     src: fluidSvg,     className: "z-40", variants: fluidVariants },
  { name: "fibers",    src: fibersSvg,    className: "z-50", variants: fibersVariants },
  { name: "core",      src: coreSvg,      className: "z-60", variants: coreVariants },
  { name: "highlight", src: highlightSvg, className: "z-70", variants: highlightVariants },
  { name: "particles", src: particlesSvg, className: "z-80", variants: particlesVariants },
];

/* ------------------------------------------------------------------ */
/*  Stable-pause target values                                         */
/* ------------------------------------------------------------------ */

const PAUSED_CONTAINER_TARGET: Record<MuscleStage, Record<string, number>> = {
  idle:     { scale: 1, y: 0 },
  ready:    { scale: 1, y: 0 },
  contract: { scale: 0.92, y: -12 },
  hold:     { scale: 0.92, y: -12 },
  relax:    { scale: 1, y: 0 },
  rest:     { scale: 1, y: 0 },
  feedback: { scale: 1, y: 0 },
};

function pausedLayerTarget(layer: LayerName, stage: MuscleStage): Record<string, number | string> {
  const contracted = stage === "contract" || stage === "hold";

  const map: Record<LayerName, Record<string, number | string>> = {
    shadow:    contracted ? { scaleX: 0.85, scaleY: 0.88, y: 18, opacity: 0.48 }          : { scale: 1, y: 8, opacity: 0.34 },
    aura:      contracted ? { scale: 0.94, opacity: 0.34 }                                : { scale: 1, opacity: 0.2 },
    ripple:    { scale: 1, opacity: 0.04 },
    fascia:    contracted ? { scale: 0.91, rotate: 1.2, opacity: 0.78 }                   : { scale: 1, rotate: 0, opacity: 0.58 },
    fluid:     contracted ? { scaleX: 0.88, scaleY: 0.93, rotate: -0.4, y: -1, opacity: 0.88 } : { scale: 1, rotate: 0, y: 0, opacity: 0.74 },
    fibers:    contracted ? { scale: 0.82, opacity: 0.88 }                                : { scale: 1, opacity: 0.6 },
    core:      contracted ? { scale: 0.72, opacity: 1, filter: "brightness(1.08) saturate(1.12)" } : { scale: 1, opacity: 0.8 },
    highlight: contracted ? { scale: 0.9, x: 3, y: 4, opacity: 0.72 }                     : { scale: 1, x: 0, y: 0, opacity: 0.4 },
    particles: contracted ? { scale: 0.78, rotate: 0.8, opacity: 0.72 }                   : { scale: 1, rotate: 0, opacity: 0.34 },
  };
  return map[layer];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Return the resolved stage for reduced-motion mode. */
function reducedStage(stage: MuscleStage): MuscleStage {
  // Simplify hold → contract (no tremor), keep relax overshoot but cap it
  return stage === "hold" ? "contract" : stage;
}

/** Build a reduced-motion animate target for a layer variant. */
function reducedLayerTarget(variants: Variants, stage: MuscleStage): Record<string, number | string> {
  const v = variants[stage];
  if (!v || typeof v !== "object") return { opacity: 1 };
  const target: Record<string, number | string> = {};
  // Pick only scalar properties (flatten keyframes – take first value)
  for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
    if (key === "transition") continue;
    if (key === "filter" && typeof val === "string") { target[key] = val; continue; }
    if (typeof val === "number") { target[key] = val; continue; }
    if (Array.isArray(val) && val.length > 0) {
      target[key] = val[0] as number | string;
    }
  }
  return target;
}

/** Build a reduced-motion animate target for the container. */
function reducedContainerTarget(stage: MuscleStage): Record<string, number> {
  const v = buildContainerVariants(undefined)[stage];
  if (!v || typeof v !== "object") return { scale: 1, y: 0 };
  const target: Record<string, number> = {};
  for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
    if (key === "transition") continue;
    if (typeof val === "number") { target[key] = val; continue; }
    if (Array.isArray(val) && val.length > 0) {
      target[key] = val[0] as number;
    }
  }
  return target;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MuscleSphere({
  stage,
  stageProgress = 0,
  size = 288,
  paused = false,
  showProgressRing = false,
  stageDurationMs,
  className = "",
}: MuscleSphereProps) {
  const shouldReduceMotion = useReducedMotion();
  const p = clamp01(stageProgress);

  const resolvedStage: MuscleStage = shouldReduceMotion
    ? reducedStage(stage)
    : stage;

  /* Memoize the container variants so the relax duration can respond to stageDurationMs. */
  const containerVariants = useMemo(
    () => buildContainerVariants(stageDurationMs),
    [stageDurationMs],
  );

  /* Progress ring style */
  const ringRadius = size / 2 - 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - p);

  return (
    <div
      className={[
        "relative isolate flex shrink-0 items-center justify-center",
        "select-none touch-none",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Pelvic floor training – ${stage}`}
    >
      {/* ── Progress ring (outside animated container) ─────────── */}
      {showProgressRing && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={ringRadius}
            fill="rgb(27 21 24 / 0.8)"
            stroke="rgba(155,140,130,0.02)"
            strokeWidth={4}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={ringRadius}
            fill="none"
            stroke="rgba(155,140,130,0.08)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
      )}

      {/* ── Muscle animation container ─────────────────────────── */}
      <motion.div
        className="relative h-full w-full"
        variants={containerVariants}
        initial={false}
        animate={
          shouldReduceMotion
            ? reducedContainerTarget(resolvedStage)
            : paused
              ? PAUSED_CONTAINER_TARGET[resolvedStage]
              : resolvedStage
        }
        style={{ transformOrigin: "50% 50%", willChange: "transform" }}
      >
        {LAYER_DEFINITIONS.map((layer) => (
          <motion.img
            key={layer.name}
            src={layer.src}
            alt=""
            draggable={false}
            aria-hidden="true"
            className={[
              "pointer-events-none absolute inset-0 h-full w-full",
              "object-contain",
              layer.className,
            ].join(" ")}
            variants={layer.variants}
            initial={false}
            animate={
              shouldReduceMotion
                ? reducedLayerTarget(layer.variants, resolvedStage)
                : paused
                  ? pausedLayerTarget(layer.name, resolvedStage)
                  : resolvedStage
            }
            /*
             * willChange is set only on layers that run continuous hold
             * animations (fibers, core, fascia). Other layers only transition
             * between stage values so browser paint invalidation is minimal.
             */
            style={
              layer.name === "fibers" || layer.name === "core" || layer.name === "fascia"
                ? { transformOrigin: "50% 50%", willChange: "transform, opacity, filter", backfaceVisibility: "hidden" as const }
                : layer.name === "shadow" || layer.name === "ripple"
                  ? { transformOrigin: "50% 50%", willChange: "transform, opacity", backfaceVisibility: "hidden" as const }
                  : { transformOrigin: "50% 50%", backfaceVisibility: "hidden" as const }
            }
          />
        ))}
      </motion.div>
    </div>
  );
}

export default MuscleSphere;
