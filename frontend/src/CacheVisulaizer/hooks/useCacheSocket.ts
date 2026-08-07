import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { CachePolicy, CacheStatePayload } from "../types/cache";


const socket = io("http://localhost:5000");

export function useCacheSocket() {
    const [cacheData, setCacheData] =
        useState<CacheStatePayload | null>(null);

    useEffect(() => {
        socket.on(
            "CACHE_STATE_CHANGED",
            (data: CacheStatePayload) => {
                setCacheData(data);
            }
        );

        return () => {
            socket.off("CACHE_STATE_CHANGED");
        };
    }, []);

    const put = (key: string, value: string) => {
        socket.emit("EXECUTE_PUT", {
            key,
            value,
        });
    };

    const get = (key: string) => {
        socket.emit("EXECUTE_GET", {
            key,
        });
    };

    const switchPolicy = (
        policy: CachePolicy
    ) => {
        socket.emit("SWITCH_POLICY", {
            policyType: policy,
        });
    };

    return {
        cacheData,
        put,
        get,
        switchPolicy,
    };
}