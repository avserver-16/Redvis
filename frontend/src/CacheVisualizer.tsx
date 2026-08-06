import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// 1. Define types matching your C++ engine's polymorphic JSON outputs
type KeyValueStore = Record<string, string>;

// For LRU and FIFO: policyState is an array of strings ["A", "B", "C"]
// For LFU: policyState is an object mapping frequencies to strings {"1":["A"],"2":["B"]}
type PolicyState = string[] | Record<string, string[]>;

interface CacheStatePayload {
  lastOperation: 'PUT' | 'GET' | 'POLICY_CHANGE';
  status: string; // e.g., "INSERTED", "UPDATED", "HIT_val", "MISS", "EVICTED_key"
  kvStore: KeyValueStore;
  policyState: PolicyState;
}

// 2. Initialize the type-safe Socket instance
const socket: Socket = io('http://localhost:5000');

export default function CacheVisualizer() {
  // Define state with our payload interface, initialized to null
  const [cacheData, setCacheData] = useState<CacheStatePayload | null>(null);
  const [inputKey, setInputKey] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [currentPolicy, setCurrentPolicy] = useState<'LRU' | 'LFU' | 'FIFO'>('LRU');

  useEffect(() => {
    // Type-safe event listener
    socket.on('CACHE_STATE_CHANGED', (data: CacheStatePayload) => {
      setCacheData(data);
    });

    return () => {
      socket.off('CACHE_STATE_CHANGED');
    };
  }, []);

  // 3. Type-safe handlers for UI interactions
  const triggerPut = (k: string, v: string): void => {
    if (!k.trim() || !v.trim()) return;
    socket.emit('EXECUTE_PUT', { key: k, value: v });
    setInputKey('');
    setInputValue('');
  };

  const triggerGet = (k: string): void => {
    if (!k.trim()) return;
    socket.emit('EXECUTE_GET', { key: k });
    setInputKey('');
  };

  const changeAlgo = (type: 'LRU' | 'LFU' | 'FIFO'): void => {
    setCurrentPolicy(type);
    socket.emit('SWITCH_POLICY', { policyType: type });
  };

  // Helper utility to safely distinguish policyState structure types at runtime
  const isLfuState = (state: PolicyState): state is Record<string, string[]> => {
    return !Array.isArray(state);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <h1>Cache Engine Visualizer</h1>

      {/* Control Panel Block */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => changeAlgo('LRU')} disabled={currentPolicy === 'LRU'}>Set LRU</button>
        <button onClick={() => changeAlgo('LFU')} disabled={currentPolicy === 'LFU'}>Set LFU</button>
        <button onClick={() => changeAlgo('FIFO')} disabled={currentPolicy === 'FIFO'}>Set FIFO</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input 
          placeholder="Key" 
          value={inputKey} 
          onChange={(e) => setInputKey(e.target.value)} 
        />
        <input 
          placeholder="Value" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
        />
        <button onClick={() => triggerPut(inputKey, inputValue)}>PUT</button>
        <button onClick={() => triggerGet(inputKey)}>GET</button>
      </div>

      {/* Logs Dashboard Panel */}
      {cacheData && (
        <div style={{ background: '#f0f0f0', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          <strong>Last Action:</strong> {cacheData.lastOperation} ({cacheData.status})
        </div>
      )}

      {/* Visual Render Tracks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* KV Store Visual Matrix Column */}
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>Actual RAM Memory (KV Store)</h3>
          {cacheData && Object.keys(cacheData.kvStore).length === 0 && <p>Cache is Empty</p>}
          {cacheData && Object.entries(cacheData.kvStore).map(([k, v]) => (
            <div key={k} style={{ padding: '8px', margin: '4px 0', background: '#e0f7fa', borderRadius: '4px' }}>
              <strong>{k}:</strong> {v}
            </div>
          ))}
        </div>

        {/* Dynamic Eviction Metadata Track Column */}
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>Eviction Policy Internal Ordering ({currentPolicy})</h3>
          {!cacheData && <p>No events recorded yet.</p>}
          
          {cacheData && !isLfuState(cacheData.policyState) && (
            <div>
              <p><em>Order (Most Recent → Oldest/Victim):</em></p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(cacheData.policyState as string[]).map((key, index) => (
                  <div key={index} style={{ padding: '10px', background: '#ffe0b2', borderRadius: '4px' }}>
                    {key}
                  </div>
                ))}
              </div>
            </div>
          )}

          {cacheData && isLfuState(cacheData.policyState) && (
            <div>
              <p><em>Frequencies:</em></p>
              {Object.entries(cacheData.policyState).map(([freq, keys]) => (
                <div key={freq} style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
                  <span style={{ width: '80px', fontWeight: 'bold' }}>Freq {freq}:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {keys.map((key, idx) => (
                      <div key={idx} style={{ padding: '6px 12px', background: '#d1c4e9', borderRadius: '4px' }}>
                        {key}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}