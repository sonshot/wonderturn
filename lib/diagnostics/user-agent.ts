import Bowser from "bowser";

export type DeviceInfo = {
  browser: string;
  browserVersion: string | null;
  os: string;
  osVersion: string | null;
  platform: string;
  userAgent: string;
};

export function inferDevice(userAgent: string): DeviceInfo {
  const parsed = Bowser.parse(userAgent);

  return {
    browser: parsed.browser.name ?? "Unknown browser",
    browserVersion: parsed.browser.version ?? null,
    os: parsed.os.name ?? "Unknown OS",
    osVersion: parsed.os.version ?? null,
    platform: parsed.platform.type ?? "unknown device",
    userAgent,
  };
}

export function formatDevice(device: DeviceInfo) {
  const browser = [device.browser, device.browserVersion]
    .filter(Boolean)
    .join(" ");
  const os = [device.os, device.osVersion].filter(Boolean).join(" ");

  return `${browser} on ${os} (${device.platform})`;
}
