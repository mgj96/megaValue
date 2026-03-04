// eslint-disable-next-line no-restricted-imports
import { Input as InputOrig } from "@heroui/react";
import { forwardRef, useEffect, useRef } from "react";

import { mergeRefs } from "~/shared/react";

export const Input = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof InputOrig>
>(({ ...props }, _ref) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    const handleFocus = () => {
      el.select();
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("focus", handleFocus);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <InputOrig
      labelPlacement="outside"
      placeholder=" "
      {...props}
      ref={mergeRefs(ref, _ref)}
    />
  );
});
