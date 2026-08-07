import { CacheStatePayload } from "../types/cache";

interface Props {
  data: CacheStatePayload | null;
}

export default function StatusCard({
  data,
}: Props) {
  if (!data) return null;

  return (
    <div
      style={{
        background: "#f0f0f0",
        padding: 12,
        borderRadius: 6,
        marginBottom: 20,
      }}
    >
      <strong>Last Action:</strong>{" "}
      {data.lastOperation} ({data.status})
    </div>
  );
}