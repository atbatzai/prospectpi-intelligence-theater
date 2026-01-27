/**
 * Story 2.2.1: Advanced Animations & Micro-interactions
 * Framer Motion animation variants for premium UX feel
 */

import { Variants } from 'framer-motion';

// Story 2.2.1: Page transition animations
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } }
};

// Story 2.2.1: Card hover and tap interactions
export const cardInteraction: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2, ease: 'easeInOut' } },
  tap: { scale: 0.98 }
};

// Story 2.2.1: Stagger children animation
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 }
};

// Story 2.2.1: Loading pulse animation
export const loadingPulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Story 2.2.1: Badge notification animation
export const badgeNotification: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25
    }
  }
};

// Story 2.2.1: Slide in from side
export const slideInFromRight: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { x: 100, opacity: 0, transition: { duration: 0.3 } }
};

// Story 2.2.1: Progressive reveal animation
export const progressiveReveal: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: 'easeOut' },
      opacity: { duration: 0.4, delay: 0.1 }
    }
  }
};

// Story 2.2.1: Button press feedback
export const buttonPress: Variants = {
  rest: { scale: 1 },
  pressed: { scale: 0.95, transition: { duration: 0.1 } }
};

// Story 2.2.1: Success checkmark animation
export const successCheckmark: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: 'easeInOut' },
      opacity: { duration: 0.2 }
    }
  }
};
