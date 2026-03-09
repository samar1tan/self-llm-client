import { useMemo } from 'react';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface MetricChartProps {
  data: DataPoint[];
  label: string;
  unit: string;
  color?: string;
  minValue?: number;
  maxValue?: number;
  height?: number;
}

export function MetricChart({
  data,
  label,
  unit,
  color = '#3b82f6', // blue-500
  minValue,
  maxValue,
  height = 120,
}: MetricChartProps) {
  const width = 280;
  const padding = { top: 20, right: 12, bottom: 24, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { path, areaPath, yMin, yMax, yTicks, currentValue } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', areaPath: '', yMin: 0, yMax: 100, yTicks: [], currentValue: null };
    }

    const values = data.map(d => d.value);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    
    // Use provided bounds or calculate with padding
    let yMin = minValue ?? Math.max(0, dataMin - (dataMax - dataMin) * 0.1);
    let yMax = maxValue ?? dataMax + (dataMax - dataMin) * 0.1;
    
    // Ensure we have a reasonable range
    if (yMax - yMin < 1) {
      yMin = Math.max(0, dataMin - 5);
      yMax = dataMax + 5;
    }

    // Generate Y axis ticks
    const tickCount = 4;
    const yTicks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      yTicks.push(yMin + (yMax - yMin) * (i / tickCount));
    }

    // Scale functions
    const xScale = (index: number) => (index / (data.length - 1)) * chartWidth;
    const yScale = (value: number) => chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

    // Build SVG path
    const points = data.map((d, i) => ({
      x: xScale(i),
      y: yScale(d.value),
    }));

    const linePath = points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    ).join(' ');

    // Area path (for gradient fill)
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${chartHeight} L 0 ${chartHeight} Z`;

    return {
      path: linePath,
      areaPath,
      yMin,
      yMax,
      yTicks,
      currentValue: data[data.length - 1]?.value ?? null,
    };
  }, [data, chartWidth, chartHeight, minValue, maxValue]);

  // Format time label
  const formatTimeAgo = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  // Calculate time range
  const timeRange = data.length >= 2 
    ? data[data.length - 1].timestamp - data[0].timestamp 
    : 0;

  // Sanitize label for SVG ID (remove spaces and special chars)
  const gradientId = `gradient-${label.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <div className="w-full">
      {/* Header with current value */}
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        {currentValue !== null && (
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">
            {typeof currentValue === 'number' ? currentValue.toFixed(1) : currentValue} {unit}
          </span>
        )}
      </div>

      {/* SVG Chart */}
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Chart background */}
          <rect
            x={0}
            y={0}
            width={chartWidth}
            height={chartHeight}
            className="fill-zinc-50 dark:fill-zinc-900/50"
            rx={4}
          />
          
          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = chartHeight - ((tick - yMin) / (yMax - yMin)) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={0}
                  x2={chartWidth}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  className="text-zinc-400 dark:text-zinc-600"
                />
                <text
                  x={-8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-[10px] fill-zinc-500 dark:fill-zinc-400"
                >
                  {tick >= 1000 ? `${(tick / 1024).toFixed(0)}G` : tick.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {data.length > 1 && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
            />
          )}

          {/* Line */}
          {data.length > 1 && (
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current point dot */}
          {data.length > 0 && currentValue !== null && (
            <circle
              cx={chartWidth}
              cy={chartHeight - ((currentValue - yMin) / (yMax - yMin)) * chartHeight}
              r={4}
              fill={color}
            />
          )}

          {/* X axis labels */}
          <text
            x={0}
            y={chartHeight + 16}
            textAnchor="start"
            className="text-[10px] fill-zinc-500 dark:fill-zinc-400"
          >
            -{formatTimeAgo(timeRange)}
          </text>
          <text
            x={chartWidth}
            y={chartHeight + 16}
            textAnchor="end"
            className="text-[10px] fill-zinc-500 dark:fill-zinc-400"
          >
            now
          </text>
        </g>
      </svg>

      {/* No data message */}
      {data.length === 0 && (
        <div className="flex items-center justify-center h-20 text-sm text-zinc-400 dark:text-zinc-500">
          Collecting data...
        </div>
      )}
    </div>
  );
}
