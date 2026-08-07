import { CachePolicy } from "../types/cache";

interface Props {
  currentPolicy: CachePolicy;
  onChange: (policy: CachePolicy) => void;
}

export default function ControlPanel({
  currentPolicy,
  onChange,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 20,
      }}
    >
      {(["LRU", "LFU", "FIFO"] as CachePolicy[]).map(
        (policy) => (
          <button
            key={policy}
            disabled={currentPolicy === policy}
            onClick={() => onChange(policy)}
          >
            {policy}
          </button>
        )
      )}
    </div>
  );
}