interface Props {
  inputKey: string;
  inputValue: string;
  setInputKey: (v: string) => void;
  setInputValue: (v: string) => void;
  onPut: () => void;
  onGet: () => void;
}

export default function InputPanel({
  inputKey,
  inputValue,
  setInputKey,
  setInputValue,
  onPut,
  onGet,
}: Props) {
  return (
    <div style={{ marginBottom: 20 }}>
      <input
        placeholder="Key"
        value={inputKey}
        onChange={(e) =>
          setInputKey(e.target.value)
        }
      />

      <input
        placeholder="Value"
        value={inputValue}
        onChange={(e) =>
          setInputValue(e.target.value)
        }
      />

      <button onClick={onPut}>PUT</button>

      <button onClick={onGet}>GET</button>
    </div>
  );
}