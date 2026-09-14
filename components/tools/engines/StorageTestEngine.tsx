"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { LimitationNotice, TechnicalNote, PrivacyBadge } from "@/components/tools/LimitationNotice";

interface StorageReport {
  quotaBytes: number;
  usageBytes: number;
  persisted: boolean;
  indexedDbSupported: boolean;
  localStorageSupported: boolean;
  sessionStorageSupported: boolean;
  cachesSupported: boolean;
}

export function StorageTestEngine() {
  const [report, setReport] = React.useState<StorageReport | null>(null);
  const [isInspecting, setIsInspecting] = React.useState(true);

  const inspectStorage = React.useCallback(async () => {
    setIsInspecting(true);

    let quota = 0;
    let usage = 0;
    let isPersisted = false;

    // Check StorageManager estimate
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        quota = est.quota || 0;
        usage = est.usage || 0;
      } catch {}
    }

    // Check persistence
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.persisted) {
      try {
        isPersisted = await navigator.storage.persisted();
      } catch {}
    }

    // Check LocalStorage
    let lsOk = false;
    try {
      const testKey = "__moha_test__";
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
      lsOk = true;
    } catch {}

    // Check SessionStorage
    let ssOk = false;
    try {
      const testKey = "__moha_test__";
      sessionStorage.setItem(testKey, "1");
      sessionStorage.removeItem(testKey);
      ssOk = true;
    } catch {}

    // Check IndexedDB
    const idbOk = typeof indexedDB !== "undefined";

    // Check Cache API
    const cacheOk = typeof caches !== "undefined";

    setReport({
      quotaBytes: quota,
      usageBytes: usage,
      persisted: isPersisted,
      indexedDbSupported: idbOk,
      localStorageSupported: lsOk,
      sessionStorageSupported: ssOk,
      cachesSupported: cacheOk,
    });

    setIsInspecting(false);
  }, []);

  React.useEffect(() => {
    inspectStorage();
  }, [inspectStorage]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 MB";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (!report) {
    return (
      <div className="p-8 text-center text-text-muted font-mono text-sm border border-border-default rounded-md bg-bg-surface">
        Inspecting browser storage quota...
      </div>
    );
  }

  const quotaFormatted = formatBytes(report.quotaBytes);
  const usageFormatted = formatBytes(report.usageBytes);
  const percentUsed =
    report.quotaBytes > 0
      ? ((report.usageBytes / report.quotaBytes) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PrivacyBadge text="Safe read-only audit. Zero destructive writes." />
      </div>

      {/* Top Metrics */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Available Quota"
          value={quotaFormatted}
          subtext="Allocated browser storage pool"
          status={report.quotaBytes > 1024 * 1024 * 1024 ? "good" : "neutral"}
        />
        <MetricCard
          label="Current Usage"
          value={usageFormatted}
          subtext={`${percentUsed}% of total quota`}
          status="neutral"
        />
        <MetricCard
          label="Persistence State"
          value={report.persisted ? "Persisted" : "Standard"}
          subtext={report.persisted ? "Exempt from automatic eviction" : "Subject to OS disk clearing"}
          status={report.persisted ? "good" : "neutral"}
        />
        <MetricCard
          label="IndexedDB State"
          value={report.indexedDbSupported ? "Online" : "Blocked"}
          subtext="High-capacity transactional storage"
          status={report.indexedDbSupported ? "good" : "error"}
        />
      </MetricGrid>

      {/* Storage Subsystems Report */}
      <div className="border border-border-default bg-bg-surface rounded-md overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-subtle bg-bg-elevated flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
            Browser Storage Subsystems
          </span>
          <Button variant="tertiary" size="sm" onClick={inspectStorage} disabled={isInspecting}>
            <RefreshCw size={12} className="mr-1" /> Re-audit
          </Button>
        </div>

        <dl className="divide-y divide-border-subtle text-xs">
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">StorageManager Quota API</dt>
            <dd className="col-span-2 text-text-primary font-mono">
              {report.quotaBytes > 0 ? "Supported & Reporting" : "Unsupported in this browser"}
            </dd>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">IndexedDB</dt>
            <dd className="col-span-2 font-mono text-status-success">
              {report.indexedDbSupported ? "Available (Ready for offline game caches)" : "Unavailable"}
            </dd>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Cache Storage API</dt>
            <dd className="col-span-2 font-mono text-text-primary">
              {report.cachesSupported ? "Supported (Service Worker cache pool)" : "Unavailable"}
            </dd>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">LocalStorage</dt>
            <dd className="col-span-2 font-mono text-text-primary">
              {report.localStorageSupported ? "Operational (5–10MB sync key-value store)" : "Blocked"}
            </dd>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">SessionStorage</dt>
            <dd className="col-span-2 font-mono text-text-primary">
              {report.sessionStorageSupported ? "Operational (Session-scoped memory)" : "Blocked"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="Browser Storage Allocation">
          <p>
            Browsers do not have unlimited access to device storage. The operating system assigns a shared pool (usually 10%–60% of free internal flash memory). If device storage drops below 10%, browsers may aggressively purge un-persisted caches.
          </p>
        </TechnicalNote>

        <LimitationNotice
          title="Safe Non-Destructive Benchmark"
          limitations={[
            "This tool queries browser metadata and does NOT write massive dummy files to benchmark flash wear.",
            "Reported quota is for browser origin storage, not overall device storage capacity (e.g. 128GB/256GB).",
          ]}
        />
      </div>
    </div>
  );
}
