import { useEffect } from "react";
import { binder } from "@hyperbind/core";

export const useKeybind = (keyCombo: string, callback: () => void) => {
  useEffect(() => {
    binder.register(keyCombo, callback);
    return () => binder.unregister(keyCombo);
  }, [keyCombo, callback]);
};
