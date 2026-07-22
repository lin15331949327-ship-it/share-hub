"use client";

import { createContext, useContext } from "react";

type Device = "mobile" | "desktop";
const DeviceContext = createContext<Device>("desktop");

export function useDevice() {
  return useContext(DeviceContext);
}

export function DeviceProvider({ device, children }: { device: Device; children: React.ReactNode }) {
  return <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>;
}
