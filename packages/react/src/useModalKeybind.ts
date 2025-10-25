import { useEffect } from "react";
import { binder } from "@hyperbind/core";

export interface UseModalKeybindOptions {
  keyCombo: string;
  onOpen: () => void;
  onClose?: () => void;
  isOpen?: boolean;
  preventDefault?: boolean;
}

export const useModalKeybind = ({
  keyCombo,
  onOpen,
  onClose,
  isOpen = false,
  preventDefault = true,
}: UseModalKeybindOptions) => {
  useEffect(() => {
    const id = `modal-${keyCombo}-${Date.now()}`;
    
    binder.registerWithId(
      id,
      keyCombo,
      () => {
        if (isOpen && onClose) {
          onClose();
        } else {
          onOpen();
        }
      },
      { preventDefault }
    );

    return () => {
      binder.unregisterById(id);
    };
  }, [keyCombo, onOpen, onClose, isOpen, preventDefault]);
};

