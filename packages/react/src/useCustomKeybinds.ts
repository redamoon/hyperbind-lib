import { useState, useEffect, useCallback } from "react";
import { binder } from "@hyperbind/core";

export interface CustomKeybind {
  id: string;
  label: string;
  keyCombo: string;
  enabled: boolean;
  preventDefault: boolean;
}

export interface UseCustomKeybindsOptions {
  storageKey?: string;
  onTrigger?: (id: string) => void;
}

export const useCustomKeybinds = (options: UseCustomKeybindsOptions = {}) => {
  const { storageKey = "hyperbind_custom_keybinds", onTrigger } = options;
  
  const [keybinds, setKeybinds] = useState<CustomKeybind[]>([]);

  // LocalStorageから読み込み
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setKeybinds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load keybinds from localStorage", e);
      }
    }
  }, [storageKey]);

  // LocalStorageに保存
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(keybinds));
  }, [keybinds, storageKey]);

  // KeybindManagerに登録
  useEffect(() => {
    keybinds.forEach((kb) => {
      binder.registerWithId(
        kb.id,
        kb.keyCombo,
        () => {
          if (onTrigger) {
            onTrigger(kb.id);
          }
        },
        { preventDefault: kb.preventDefault }
      );
      
      if (!kb.enabled) {
        binder.disableById(kb.id);
      }
    });

    return () => {
      keybinds.forEach((kb) => {
        binder.unregisterById(kb.id);
      });
    };
  }, [keybinds, onTrigger]);

  const addKeybind = useCallback((keybind: Omit<CustomKeybind, "id">) => {
    const newKeybind: CustomKeybind = {
      ...keybind,
      id: `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setKeybinds((prev) => [...prev, newKeybind]);
    return newKeybind.id;
  }, []);

  const removeKeybind = useCallback((id: string) => {
    setKeybinds((prev) => prev.filter((kb) => kb.id !== id));
  }, []);

  const updateKeybind = useCallback((id: string, updates: Partial<CustomKeybind>) => {
    setKeybinds((prev) =>
      prev.map((kb) => (kb.id === id ? { ...kb, ...updates } : kb))
    );
  }, []);

  const toggleKeybind = useCallback((id: string) => {
    setKeybinds((prev) =>
      prev.map((kb) => {
        if (kb.id === id) {
          const newEnabled = !kb.enabled;
          if (newEnabled) {
            binder.enableById(id);
          } else {
            binder.disableById(id);
          }
          return { ...kb, enabled: newEnabled };
        }
        return kb;
      })
    );
  }, []);

  const togglePreventDefault = useCallback((id: string) => {
    setKeybinds((prev) =>
      prev.map((kb) => {
        if (kb.id === id) {
          const newPreventDefault = !kb.preventDefault;
          binder.setPreventDefault(id, newPreventDefault);
          return { ...kb, preventDefault: newPreventDefault };
        }
        return kb;
      })
    );
  }, []);

  return {
    keybinds,
    addKeybind,
    removeKeybind,
    updateKeybind,
    toggleKeybind,
    togglePreventDefault,
  };
};

