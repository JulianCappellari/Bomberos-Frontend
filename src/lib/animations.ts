/**
 * Animation constants and Framer Motion variants
 * for the BomberosApp design system.
 */
import type { Variants, Transition } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Durations (seconds)                                                */
/* ------------------------------------------------------------------ */

export const DURATION_FAST = 0.2;
export const DURATION_NORMAL = 0.35;
export const DURATION_SLOW = 0.5;

/* ------------------------------------------------------------------ */
/*  Shared transitions                                                 */
/* ------------------------------------------------------------------ */

export const transitionFast: Transition = {
  duration: DURATION_FAST,
  ease: "easeOut",
};

export const transitionNormal: Transition = {
  duration: DURATION_NORMAL,
  ease: "easeOut",
};

export const transitionSlow: Transition = {
  duration: DURATION_SLOW,
  ease: "easeInOut",
};

/* ------------------------------------------------------------------ */
/*  Page / section variants                                            */
/* ------------------------------------------------------------------ */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitionNormal },
  exit: { opacity: 0, transition: transitionFast },
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_NORMAL, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: transitionFast,
  },
};

export const fadeSlideDown: Variants = {
  hidden: { opacity: 0, y: -14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_NORMAL, ease: "easeOut" },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION_NORMAL, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitionFast,
  },
};

/* ------------------------------------------------------------------ */
/*  Stagger container                                                  */
/* ------------------------------------------------------------------ */

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Stagger child item                                                 */
/* ------------------------------------------------------------------ */

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_NORMAL, ease: "easeOut" },
  },
};

/* ------------------------------------------------------------------ */
/*  Card hover                                                         */
/* ------------------------------------------------------------------ */

export const cardHover = {
  rest: { y: 0, boxShadow: "0 0 0 0 rgba(230,60,60,0)" },
  hover: {
    y: -3,
    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
    transition: { duration: DURATION_FAST, ease: "easeOut" },
  },
};

/* ------------------------------------------------------------------ */
/*  Modal / overlay                                                    */
/* ------------------------------------------------------------------ */

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.97,
    transition: { duration: 0.2 },
  },
};

/* ------------------------------------------------------------------ */
/*  Slide in from sides (for sidebars, drawers)                        */
/* ------------------------------------------------------------------ */

export const slideInLeft: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: { duration: DURATION_NORMAL, ease: "easeOut" },
  },
  exit: {
    x: "-100%",
    transition: { duration: DURATION_FAST, ease: "easeOut" },
  },
};

export const slideInRight: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { duration: DURATION_NORMAL, ease: "easeOut" },
  },
  exit: {
    x: "100%",
    transition: { duration: DURATION_FAST },
  },
};

/* ------------------------------------------------------------------ */
/*  Bottom sheet (mobile modals)                                       */
/* ------------------------------------------------------------------ */

export const bottomSheet: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: {
    y: "100%",
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

/* ------------------------------------------------------------------ */
/*  Pulse / attention                                                  */
/* ------------------------------------------------------------------ */

export const pulseAttention: Variants = {
  rest: { scale: 1 },
  pulse: {
    scale: [1, 1.04, 1],
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
};
