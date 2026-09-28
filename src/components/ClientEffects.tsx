"use client";

import { useEffect } from "react";
import { speechService } from "@/lib/speech";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Unlocks audio on the first tap (required by mobile browsers) and
 * registers a service worker so the HTTPS site can be installed / reused
 * away from the home LAN.
 */
export default function ClientEffects() {
  useEffect(() => {
    speechService.preload();

    const unlock = () => {
      void speechService.unlock();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    // CDN mirrors (jsDelivr / 国内镜像) are shared origins. Do not register a
    // service worker there; audio is loaded directly from the same path.
    const onSharedCdn = BASE_PATH.startsWith("/gh/");
    if (!onSharedCdn && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => {
        /* private mode / unsupported */
      });
    }

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return null;
}
