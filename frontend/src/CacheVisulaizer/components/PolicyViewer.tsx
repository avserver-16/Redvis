import {
  CachePolicy,
  PolicyState,
} from "../types/cache";

interface Props {
  policy: CachePolicy;
  state: PolicyState | undefined;
}

export default function PolicyViewer({
  policy,
  state,
}: Props) {
  if (!state)
    return (
      <div
        style={{
          border: "1px solid #ccc",
          padding: 15,
        }}
      >
        No Events
      </div>
    );

  const isLFU = !Array.isArray(state);

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 15,
      }}
    >
      <h3>{policy} Ordering</h3>

      {!isLFU && (
        <div style={{ display: "flex", gap: 8 }}>
          {state.map((key) => (
            <div
              key={key}
              style={{
                padding: 10,
                background: "#ffe0b2",
              }}
            >
              {key}
            </div>
          ))}
        </div>
      )}

      {isLFU &&
        Object.entries(state).map(
          ([freq, keys]) => (
            <div key={freq}>
              <strong>Freq {freq}</strong>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                }}
              >
                {keys.map((k) => (
                  <div
                    key={k}
                    style={{
                      padding: 8,
                      background: "#d1c4e9",
                    }}
                  >
                    {k}
                  </div>
                ))}
              </div>
            </div>
          )
        )}
    </div>
  );
}