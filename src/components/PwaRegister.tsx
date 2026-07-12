"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Falla silenciosa: la app sigue funcionando normal sin PWA.
      });
    }
  }, []);

  return null;
}
