import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

const easeOut = [0.16, 1, 0.3, 1] as const;

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 4 },
};

interface FadeInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
}

export function FadeIn({ children, delay = 0, className, ...props }: FadeInProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      transition={{ duration: 0.28, ease: easeOut, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

export function StaggerList({ children, className, stagger = 0.06 }: StaggerListProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: { staggerChildren: stagger },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ duration: 0.28, ease: easeOut }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
