import { useState } from "react";


import InputPanel from "./components/InputPanel";
import StatusCard from "./components/StatusCard";
import KVStore from "./components/KVStore";
import PolicyViewer from "./components/PolicyViewer";

import { CachePolicy } from "./types/cache";
import { useCacheSocket } from "./hooks/useCacheSocket";
import ControlPanel from "./components/controlPanel";

export default function CacheVisualizer() {
  const {
    cacheData,
    put,
    get,
    switchPolicy,
  } = useCacheSocket();

  const [inputKey, setInputKey] = useState("");
  const [inputValue, setInputValue] =
    useState("");

  const [policy, setPolicy] =
    useState<CachePolicy>("LRU");

  const handlePolicy = (
    newPolicy: CachePolicy
  ) => {
    setPolicy(newPolicy);
    switchPolicy(newPolicy);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        // padding: "24px",
        fontFamily: "sans-serif",
        // color: "#fff",
        boxSizing: "border-box",
        margin: 0,
        background: `
        radial-gradient(circle at 15% 15%, rgba(229, 9, 20, 0.55) 0%, rgba(229, 9, 20, 0) 45%),
        radial-gradient(circle at 85% 20%, rgba(180, 0, 0, 0.25) 0%, rgba(180, 0, 0, 0) 40%),
        linear-gradient(160deg, #1a0000 0%, #0d0000 45%, #050505 75%, #000000 100%)
      `,

        // Add these here
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}  >
      <h1
        style={{
          marginBottom: "24px",
          fontSize: "2.5rem",
          fontWeight: "bold",
          letterSpacing: "1px",
        }}
      >
        Cache Engine Visualizer
      </h1>

      <ControlPanel
        currentPolicy={policy}
        onChange={handlePolicy}
      />

      <InputPanel
        inputKey={inputKey}
        inputValue={inputValue}
        setInputKey={setInputKey}
        setInputValue={setInputValue}
        onPut={() => {
          put(inputKey, inputValue);
          setInputKey("");
          setInputValue("");
        }}
        onGet={() => {
          get(inputKey);
          setInputKey("");
        }}
      />

      <StatusCard data={cacheData} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: "24px",
        }}
      >
        <KVStore kvStore={cacheData?.kvStore ?? {}} />

        <PolicyViewer
          policy={policy}
          state={cacheData?.policyState}
        />
      </div>
    </div>
  );
}
