import { type ForwardedRef } from "react";

export const mergeRefs = <T>(...refs: ForwardedRef<T>[]) => {
  return (instance: T) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref) {
        // eslint-disable-next-line no-param-reassign
        ref.current = instance;
      }
    });
  };
};
