import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { MetricChart } from './MetricChart';
import { MetricType, MetricHistoryPoint } from '../types';

interface ChartPopupProps {
  metric: MetricType;
  history: MetricHistoryPoint[];
  onClose: () => void;
}

// Metric configuration
const METRIC_CONFIG: Record<MetricType, {
  label: string;
  unit: string;
  color: string;
  getValue: (point: MetricHistoryPoint) => number;
  minValue?: number;
  maxValue?: number;
}> = {
  gfx: {
    label: 'GPU Utilization',
    unit: '%',
    color: '#3b82f6', // blue-500
    getValue: (p) => p.gfx,
    minValue: 0,
    maxValue: 100,
  },
  memory: {
    label: 'Memory Controller',
    unit: '%',
    color: '#a855f7', // purple-500
    getValue: (p) => p.memory,
    minValue: 0,
    maxValue: 100,
  },
  vram: {
    label: 'VRAM Usage',
    unit: 'GB',
    color: '#3b82f6', // blue-500
    getValue: (p) => p.vram / 1024, // Convert MiB to GB
  },
  temp: {
    label: 'Temperature',
    unit: '°C',
    color: '#22c55e', // green-500
    getValue: (p) => p.temp,
    minValue: 0,
  },
  power: {
    label: 'Power Draw',
    unit: 'W',
    color: '#eab308', // yellow-500
    getValue: (p) => p.power,
    minValue: 0,
  },
  fan: {
    label: 'Fan Speed',
    unit: 'RPM',
    color: '#06b6d4', // cyan-500
    getValue: (p) => p.fan ?? 0,
    minValue: 0,
  },
};

export function ChartPopup({ metric, history, onClose }: ChartPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const config = METRIC_CONFIG[metric];

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Add listener after a small delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Escape key to close
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Transform history data for chart
  const chartData = history.map(point => ({
    timestamp: point.timestamp,
    value: config.getValue(point),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Light backdrop */}
      <div className="absolute inset-0 bg-zinc-500/10 dark:bg-zinc-900/30" onClick={onClose} />
      <div
        ref={popupRef}
        className="relative bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-4 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            {config.label} History
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        {/* Chart */}
        <MetricChart
          data={chartData}
          label={config.label}
          unit={config.unit}
          color={config.color}
          minValue={config.minValue}
          maxValue={config.maxValue}
          height={160}
        />

        {/* Stats summary */}
        {chartData.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Min</div>
              <div className="text-sm font-medium text-zinc-900 dark:text-white">
                {Math.min(...chartData.map(d => d.value)).toFixed(1)} {config.unit}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Avg</div>
              <div className="text-sm font-medium text-zinc-900 dark:text-white">
                {(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1)} {config.unit}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Max</div>
              <div className="text-sm font-medium text-zinc-900 dark:text-white">
                {Math.max(...chartData.map(d => d.value)).toFixed(1)} {config.unit}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
