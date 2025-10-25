import React, { useEffect } from "react";
import { binder } from "@hyperbind/core";

export const FormNavigator = ({
  inputRefs,
}: {
  inputRefs: React.RefObject<HTMLInputElement>[];
}) => {
  useEffect(() => {
    const moveNext = () => {
      const active = document.activeElement;
      const index = inputRefs.findIndex((ref) => ref.current === active);
      if (index >= 0) {
        const nextIndex = (index + 1) % inputRefs.length;
        inputRefs[nextIndex].current?.focus();
      }
    };

    const movePrev = () => {
      const active = document.activeElement;
      const index = inputRefs.findIndex((ref) => ref.current === active);
      if (index >= 0) {
        const prevIndex = (index - 1 + inputRefs.length) % inputRefs.length;
        inputRefs[prevIndex].current?.focus();
      }
    };

    binder.register("enter", moveNext);
    binder.register("shift+enter", movePrev);
    binder.register("tab", moveNext);
    binder.register("shift+tab", movePrev);

    return () => {
      binder.unregister("enter");
      binder.unregister("shift+enter");
      binder.unregister("tab");
      binder.unregister("shift+tab");
    };
  }, [inputRefs]);

  return null;
};
