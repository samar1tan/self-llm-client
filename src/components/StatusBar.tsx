import { useEffect, useRef } from 'react';
import { Cpu, HardDrive, Thermometer, Zap, WifiOff, ChevronUp, ChevronDown } from 'lucide-react';
import { useMonitorStore } from '../stores/monitorStore';
import { GpuMonitorService } from '../services/monitor';

function formatVram(usedMiB: number, totalMiB: number): string {
  const usedGB = usedMiB / 1024;
  const totalGB = totalMiB / 1024;
  return `${usedGB.toFixed(1)}/${totalGB.toFixed(0)}GB`;
}

function formatTemp(celsius: number): string {
  return `${Math.round(celsius)}°C`;
}

function formatPower(watts: number): string {
  return `${Math.round(watts)}W`;
}

export function StatusBar() {
  const {
    settings,
    gpu,
    connected,
    error,
    panelOpen,
    togglePanel,
    setGpuMetrics,
    setError,
  } = useMonitorStore();

  const serviceRef = useRef<GpuMonitorService | null>(null);

  // Initialize and manage polling service
  useEffect(() => {
    if (!settings.enabled) {
      if (serviceRef.current) {
        serviceRef.current.destroy();
        serviceRef.current = null;
      }
      return;
    }

    // Create service if not exists
    if (!serviceRef.current) {
      serviceRef.current = new GpuMonitorService(
        settings.endpoint,
        settings.pollingInterval,
        (response) => {
          if (response.gpu) {
            setGpuMetrics(response.gpu);
          }
        },
        (err) => {
          setError(err);
        }
      );
      serviceRef.current.start();
    } else {
      // Update config if changed
      serviceRef.current.updateConfig(settings.endpoint, settings.pollingInterval);
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.destroy();
        serviceRef.current = null;
      }
    };
  }, [settings.enabled, settings.endpoint, settings.pollingInterval, setGpuMetrics, setError]);

  // Don't render if monitoring is disabled
  if (!settings.enabled) {
    return null;
  }

  const isConnected = connected && gpu !== null;

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
      <button
        onClick={togglePanel}
        className="w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {isConnected ? (
            <>
              {/* Device name - truncated */}
              <span className="text-zinc-500 dark:text-zinc-400 max-w-[120px] truncate hidden sm:inline">
                {gpu.deviceName.replace('AMD ', '').replace('Radeon ', '')}
              </span>
              
              {/* GPU Utilization */}
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Cpu size={14} className="text-zinc-500" />
                <span className="font-mono">{gpu.utilization.gfx}%</span>
              </div>
              
              {/* VRAM */}
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <HardDrive size={14} className="text-zinc-500" />
                <span className="font-mono">{formatVram(gpu.vram.used, gpu.vram.total)}</span>
              </div>
              
              {/* Temperature */}
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Thermometer size={14} className={gpu.sensors.temperature > 80 ? 'text-red-500' : 'text-zinc-500'} />
                <span className="font-mono">{formatTemp(gpu.sensors.temperature)}</span>
              </div>
              
              {/* Power */}
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 hidden md:flex">
                <Zap size={14} className="text-zinc-500" />
                <span className="font-mono">{formatPower(gpu.sensors.power)}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <WifiOff size={14} />
              <span>{error || 'GPU monitor not connected'}</span>
            </div>
          )}
        </div>
        
        {/* Expand/collapse indicator */}
        <div className="text-zinc-400 dark:text-zinc-500">
          {panelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>
    </div>
  );
}
