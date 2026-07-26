import { useState, useEffect, useCallback } from "react";
import { addOnlineListener, isOnline } from "@/lib/offline";

export function useNetwork() {
  const [online, setOnline] = useState(isOnline());
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = addOnlineListener((onlineStatus) => {
      setOnline(onlineStatus);
      if (onlineStatus && wasOffline) {
        setWasOffline(false);
      }
      if (!onlineStatus) {
        setWasOffline(true);
      }
    });

    // Also listen to native events
    const handleOnline = () => {
      setOnline(true);
    };
    const handleOffline = () => {
      setOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  return { online, wasOffline };
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
