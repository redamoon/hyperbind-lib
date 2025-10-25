import { useState, useRef, useEffect } from "react";
import { useKeybind } from "@hyperbind/react";
import { KeyConfig } from "./KeyConfig";
import { KeyRecorder } from "@hyperbind/react";
import { CalendarModal } from "./CalendarModal";
import { HelpDialog } from "./HelpDialog";
import { FormNavigator } from "@hyperbind/react";

const STORAGE_KEY = "hyperbind_demo_bindings";

export const App = () => {
  const [bindings, setBindings] = useState({ save: "cmd+s" });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const input1 = useRef<HTMLInputElement>(null);
  const input2 = useRef<HTMLInputElement>(null);
  const input3 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBindings(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  }, [bindings]);

  useKeybind(bindings.save, () => alert("💾 保存しました！"));

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🎹 HyperBind 完全デモ</h1>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setShowCalendar(true)}>📅 カレンダー</button>
        <button
          onClick={() => setShowHelp(true)}
          style={{ marginLeft: "1rem" }}
        >
          ❓ ヘルプ
        </button>
      </div>

      <KeyConfig bindings={bindings} onChange={(v) => setBindings(v as typeof bindings)}>
        <label>
          保存キー:
          <KeyRecorder
            value={bindings.save}
            onChange={(v) => setBindings({ ...bindings, save: v })}
          />
        </label>
      </KeyConfig>

      <h2 style={{ marginTop: "2rem" }}>フォーム入力デモ</h2>
      <label>
        名前:
        <input ref={input1} type="text" />
      </label>
      <br />
      <label>
        メール:
        <input ref={input2} type="email" />
      </label>
      <br />
      <label>
        電話:
        <input ref={input3} type="tel" />
      </label>

      <FormNavigator inputRefs={[input1, input2, input3]} />

      {showCalendar && (
        <CalendarModal onClose={() => setShowCalendar(false)} />
      )}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};
