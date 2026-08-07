import { KeyValueStore } from "../types/cache";

interface Props {
  kvStore: KeyValueStore;
}

export default function KVStore({
  kvStore,
}: Props) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 15,
      }}
    >
      <h3>Actual RAM Memory</h3>

      {Object.keys(kvStore).length === 0 && (
        <p>Cache Empty</p>
      )}

      {Object.entries(kvStore).map(([k, v]) => (
        <div
          key={k}
          style={{
            padding: 8,
            margin: "4px 0",
            background: "#e0f7fa",
          }}
        >
          <strong>{k}</strong> : {v}
        </div>
      ))}
    </div>
  );
}