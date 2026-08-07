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
        padding: 24,
        fontFamily: "sans-serif",
      }}
    >
      <h1>Cache Engine Visualizer</h1>

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
        }}
      >
        <KVStore
          kvStore={cacheData?.kvStore ?? {}}
        />

        <PolicyViewer
          policy={policy}
          state={cacheData?.policyState}
        />
      </div>
    </div>
  );
}