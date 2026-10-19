"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { formatMeso } from "~/format";

/** 메소 숫자가 바뀔 때 이전 값에서 새 값으로 스르륵 변한다. */
export const AnimatedMeso = ({
  value,
  signed = false,
}: {
  value: number;
  signed?: boolean;
}) => {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduce) {
      from.current = value;
      setShown(value);
      return;
    }
    const controls = animate(from.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => {
        from.current = v;
        setShown(v);
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  const text = formatMeso(Math.abs(shown));
  if (!signed) return <>{formatMeso(shown)}</>;
  return <>{Math.abs(shown) < 1 ? "0" : `${shown > 0 ? "+" : "-"}${text}`}</>;
};
