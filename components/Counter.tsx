"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

/** "500+", "%92", "8" gibi metinlerdeki sayıyı yukarı doğru sayar. */
export function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const match = value.match(/[\d]+/);
  const target = match ? parseInt(match[0], 10) : 0;
  const [prefix, suffix] = match
    ? [value.slice(0, match.index), value.slice(match.index! + match[0].length)]
    : ["", value];
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, target]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
