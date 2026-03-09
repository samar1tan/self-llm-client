import { useState } from 'react';
import { X, Cpu, HardDrive, Thermometer, Zap, Fan, Activity, WifiOff } from 'lucide-react';
import { useMonitorStore } from '../stores/monitorStore';
import { ChartPopup } from './ChartPopup';
import { MetricType } from '../types';

function ProgressBar({ value, max, color = 'blue' }: { value: number; max: number; color?: string }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };
  
  return (
    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClasses[color] || colorClasses.blue} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  subValue,
  progress,
  progressMax,
  progressColor,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  progress?: number;
  progressMax?: number;
  progressColor?: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className={`p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg ${onClick ? 'cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-zinc-500 dark:text-zinc-400" />
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-zinc-900 dark:text-white">{value}</span>
        {unit && <span className="text-sm text-zinc-500 dark:text-zinc-400">{unit}</span>}
      </div>
      {subValue && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{subValue}</div>
      )}
      {progress !== undefined && progressMax !== undefined && (
        <div className="mt-2">
          <ProgressBar value={progress} max={progressMax} color={progressColor} />
        </div>
      )}
    </div>
  );
}

function formatBytes(mib: number): string {
  if (mib >= 1024) {
    return `${(mib / 1024).toFixed(1)} GB`;
  }
  return `${Math.round(mib)} MB`;
}

function getTemperatureColor(temp: number): string {
  if (temp >= 85) return 'red';
  if (temp >= 70) return 'yellow';
  return 'green';
}

function getUtilizationColor(util: number): string {
  if (util >= 90) return 'red';
  if (util >= 70) return 'yellow';
  return 'blue';
}

export function MonitorPanel() {
  const { gpu, connected, error, panelOpen, setPanelOpen, lastUpdate, history } = useMonitorStore();
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);

  if (!panelOpen) {
    return null;
  }

  const isConnected = connected && gpu !== null;

  return (
    <div className="w-72 border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Activity size={18} />
          GPU Monitor
        </h3>
        <button
          onClick={() => setPanelOpen(false)}
          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={18} className="text-zinc-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isConnected ? (
          <>
            {/* Device Info */}
            <div className="pb-3 border-b border-zinc-200 dark:border-zinc-700">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {gpu.deviceName}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                PCI: {gpu.pci}
              </p>
            </div>

            {/* GPU Utilization */}
            <MetricCard
              icon={Cpu}
              label="GPU Utilization"
              value={gpu.utilization.gfx}
              unit="%"
              progress={gpu.utilization.gfx}
              progressMax={100}
              progressColor={getUtilizationColor(gpu.utilization.gfx)}
              onClick={() => setSelectedMetric('gfx')}
            />

            {/* Memory Controller */}
            {gpu.utilization.memory > 0 && (
              <MetricCard
                icon={Activity}
                label="Memory Controller"
                value={gpu.utilization.memory}
                unit="%"
                progress={gpu.utilization.memory}
                progressMax={100}
                progressColor="purple"
                onClick={() => setSelectedMetric('memory')}
              />
            )}

            {/* VRAM */}
            <MetricCard
              icon={HardDrive}
              label="VRAM Usage"
              value={formatBytes(gpu.vram.used)}
              subValue={`of ${formatBytes(gpu.vram.total)} (${Math.round((gpu.vram.used / gpu.vram.total) * 100)}%)`}
              progress={gpu.vram.used}
              progressMax={gpu.vram.total}
              progressColor={gpu.vram.used / gpu.vram.total > 0.9 ? 'red' : 'blue'}
              onClick={() => setSelectedMetric('vram')}
            />

            {/* Temperature */}
            <MetricCard
              icon={Thermometer}
              label="Temperature"
              value={Math.round(gpu.sensors.temperature)}
              unit="°C"
              progress={gpu.sensors.temperature}
              progressMax={100}
              progressColor={getTemperatureColor(gpu.sensors.temperature)}
              onClick={() => setSelectedMetric('temp')}
            />

            {/* Power */}
            <MetricCard
              icon={Zap}
              label="Power Draw"
              value={Math.round(gpu.sensors.power)}
              unit="W"
              onClick={() => setSelectedMetric('power')}
            />

            {/* Fan Speed (if available) */}
            {gpu.sensors.fanSpeed !== undefined && (
              <MetricCard
                icon={Fan}
                label="Fan Speed"
                value={gpu.sensors.fanSpeed}
                unit="RPM"
                onClick={() => setSelectedMetric('fan')}
              />
            )}

            {/* Last Update */}
            {lastUpdate && (
              <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center pt-2">
                Last updated: {new Date(lastUpdate).toLocaleTimeString()}
              </div>
            )}
          </>
        ) : (
          /* Not Connected State */
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <WifiOff size={48} className="text-zinc-300 dark:text-zinc-600 mb-4" />
            <h4 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Not Connected
            </h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 px-4">
              {error || 'Unable to connect to GPU monitor server'}
            </p>
            <div className="text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 mx-4">
              <p className="font-medium mb-2">To enable monitoring:</p>
              <code className="block text-left">
                python3 tools/gpu-monitor-server.py
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Chart Popup */}
      {selectedMetric && (
        <ChartPopup
          metric={selectedMetric}
          history={history}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </div>
  );
}
