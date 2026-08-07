export type KeyValueStore = Record<string, string>;

export type PolicyState =
  | string[]
  | Record<string, string[]>;

export interface CacheStatePayload {
  lastOperation: "PUT" | "GET" | "POLICY_CHANGE";
  status: string;
  kvStore: KeyValueStore;
  policyState: PolicyState;
}

export type CachePolicy = "LRU" | "LFU" | "FIFO";