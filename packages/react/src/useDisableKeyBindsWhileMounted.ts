import { useEffect } from "react";
import { binder } from "@hyperbind/core";

export const useDisableKeyBindsWhileMounted = () => {
  useEffect(() => {
    binder.disable();
    return () => binder.enable();
  }, []);
};
