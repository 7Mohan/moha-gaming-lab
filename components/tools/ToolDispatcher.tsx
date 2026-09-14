"use client";

import * as React from "react";
import type { Tool } from "@/types/tool";

import { RefreshRateEngine } from "./engines/RefreshRateEngine";
import { FpsMonitorEngine } from "./engines/FpsMonitorEngine";
import { NetworkTestEngine } from "./engines/NetworkTestEngine";
import { DeviceInfoEngine } from "./engines/DeviceInfoEngine";
import { BrowserTestEngine } from "./engines/BrowserTestEngine";
import { GpuTestEngine } from "./engines/GpuTestEngine";
import { DisplayTestEngine } from "./engines/DisplayTestEngine";
import { TouchTestEngine } from "./engines/TouchTestEngine";
import { StorageTestEngine } from "./engines/StorageTestEngine";
import { GamepadTestEngine } from "./engines/GamepadTestEngine";
import { FpsCalculatorEngine } from "./engines/FpsCalculatorEngine";
import { PingTesterEngine } from "./engines/PingTesterEngine";
import { DeviceTierCheckerEngine } from "./engines/DeviceTierCheckerEngine";
import { trackToolEvent } from "@/lib/analytics/tracker";

export function ToolDispatcher({ tool }: { tool: Tool }) {
  React.useEffect(() => {
    trackToolEvent("TOOL_VIEW", tool.slug, {
      toolName: tool.name,
      category: tool.category,
    });
  }, [tool.slug, tool.name, tool.category]);

  switch (tool.slug) {
    case "refresh-rate":
      return <RefreshRateEngine />;
    case "fps-monitor":
      return <FpsMonitorEngine />;
    case "network-test":
      return <NetworkTestEngine />;
    case "device-info":
      return <DeviceInfoEngine />;
    case "browser-test":
      return <BrowserTestEngine />;
    case "gpu-test":
      return <GpuTestEngine />;
    case "display-test":
      return <DisplayTestEngine />;
    case "touch-test":
      return <TouchTestEngine />;
    case "storage-test":
      return <StorageTestEngine />;
    case "gamepad-test":
      return <GamepadTestEngine />;
    case "fps-calculator":
      return <FpsCalculatorEngine />;
    case "ping-tester":
      return <PingTesterEngine />;
    case "device-tier-checker":
      return <DeviceTierCheckerEngine />;
    default:
      return (
        <div className="p-8 border border-border-default bg-bg-surface rounded-md text-center text-text-secondary text-sm">
          Interactive engine for <strong className="text-text-primary">{tool.name}</strong> is loading.
        </div>
      );
  }
}
