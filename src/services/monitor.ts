import { GpuMetrics, VllmStats } from '../types';

export interface MonitorResponse {
  gpu?: GpuMetrics;
  vllm?: VllmStats;
  error?: string;
}

/**
 * Fetch GPU metrics from the monitor server
 * Server wraps amdgpu_top --json output
 */
export async function fetchGpuMetrics(endpoint: string): Promise<MonitorResponse> {
  try {
    const response = await fetch(`${endpoint}/gpu-stats`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse amdgpu_top JSON format
    if (data.devices && data.devices.length > 0) {
      const device = data.devices[0];
      const gpu: GpuMetrics = {
        deviceName: device.Info?.DeviceName || 'Unknown GPU',
        pci: device.Info?.PCI || device.Info?.DevicePath?.pci || 'N/A',
        utilization: {
          gfx: device.gpu_activity?.GFX?.value ?? 0,
          memory: device.gpu_activity?.Memory?.value ?? 0,
          media: device.gpu_activity?.MediaEngine?.value ?? 0,
        },
        vram: {
          // For APUs: GTT (system RAM as GPU memory) is larger and more relevant than dedicated VRAM
          // For discrete GPUs: VRAM is the main memory
          // Use GTT if Total VRAM < 16GB (indicates APU), otherwise use VRAM
          used: (device.VRAM?.['Total VRAM']?.value ?? 0) < 16384
            ? (device.VRAM?.['Total GTT Usage']?.value ?? device.VRAM?.['Total VRAM Usage']?.value ?? 0)
            : (device.VRAM?.['Total VRAM Usage']?.value ?? 0),
          total: (device.VRAM?.['Total VRAM']?.value ?? 0) < 16384
            ? (device.VRAM?.['Total GTT']?.value ?? device.VRAM?.['Total VRAM']?.value ?? 0)
            : (device.VRAM?.['Total VRAM']?.value ?? 0),
        },
        sensors: {
          // amdgpu_top uses "Edge Temperature", "Average Power", etc.
          temperature: device.Sensors?.['Edge Temperature']?.value ?? 
                       device.Sensors?.['Junction Temperature']?.value ??
                       device.Sensors?.['GPU Temperature']?.value ?? 0,
          power: device.Sensors?.['Average Power']?.value ?? 
                 device.Sensors?.['GFX Power']?.value ??
                 device.Sensors?.['Input Power']?.value ?? 0,
          fanSpeed: device.Sensors?.Fan?.value ?? undefined,
        },
        timestamp: Date.now(),
      };
      
      return { gpu };
    }
    
    // Direct format (if server pre-transforms)
    if (data.deviceName || data.utilization) {
      return { gpu: data as GpuMetrics };
    }

    return { error: 'Invalid response format' };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return { error: 'Connection timeout' };
      }
      return { error: error.message };
    }
    return { error: 'Unknown error' };
  }
}

/**
 * Check if the monitor server is available
 */
export async function checkMonitorHealth(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`${endpoint}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Polling manager class for GPU metrics
 */
export class GpuMonitorService {
  private intervalId: number | null = null;
  private endpoint: string;
  private pollingInterval: number;
  private onUpdate: (response: MonitorResponse) => void;
  private onError: (error: string) => void;
  private paused: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(
    endpoint: string,
    pollingInterval: number,
    onUpdate: (response: MonitorResponse) => void,
    onError: (error: string) => void
  ) {
    this.endpoint = endpoint;
    this.pollingInterval = pollingInterval;
    this.onUpdate = onUpdate;
    this.onError = onError;

    // Pause polling when tab is hidden
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  };

  start() {
    if (this.intervalId !== null) return;
    
    // Immediate first fetch
    this.poll();
    
    // Start polling interval
    this.intervalId = window.setInterval(() => {
      if (!this.paused) {
        this.poll();
      }
    }, this.pollingInterval);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.retryCount = 0;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    // Immediate poll on resume
    this.poll();
  }

  updateConfig(endpoint: string, pollingInterval: number) {
    const needsRestart = this.intervalId !== null;
    this.stop();
    this.endpoint = endpoint;
    this.pollingInterval = pollingInterval;
    if (needsRestart) {
      this.start();
    }
  }

  private async poll() {
    const response = await fetchGpuMetrics(this.endpoint);
    
    if (response.error) {
      this.retryCount++;
      if (this.retryCount >= this.maxRetries) {
        this.onError(response.error);
        // Reset retry count but keep trying (with errors shown)
        this.retryCount = 0;
      }
    } else {
      this.retryCount = 0;
      this.onUpdate(response);
    }
  }

  destroy() {
    this.stop();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}
