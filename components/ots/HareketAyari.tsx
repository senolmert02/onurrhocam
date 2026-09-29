'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Panel hareket ayarı — spec §6.
 *
 * `reducedMotion="user"`: sistem "hareketi azalt" diyorsa layoutId kayması,
 * AnimatePresence ve whileInView anında biter. Yalnızca `/takip` altında;
 * portfolyo kök layout'una konmaz (spec §9 madde 16).
 */
export function HareketAyari({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
