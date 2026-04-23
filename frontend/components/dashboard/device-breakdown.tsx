"use client";

interface DeviceBreakdownProps {
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  platforms: {
    ios: number;
    android: number;
  };
}

function Bar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-xs">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function DeviceBreakdown({ devices, platforms }: DeviceBreakdownProps) {
  const deviceTotal = devices.mobile + devices.desktop + devices.tablet;
  const platformTotal = platforms.ios + platforms.android;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Device types */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">
          Devices
        </h3>
        <div className="space-y-4">
          <Bar
            label="Mobile"
            value={devices.mobile}
            total={deviceTotal}
            color="#00ff88"
          />
          <Bar
            label="Desktop"
            value={devices.desktop}
            total={deviceTotal}
            color="#10b981"
          />
          <Bar
            label="Tablet"
            value={devices.tablet}
            total={deviceTotal}
            color="#059669"
          />
        </div>
      </div>

      {/* Platforms */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">
          Platforms
        </h3>
        <div className="space-y-4">
          <Bar
            label="iOS"
            value={platforms.ios}
            total={platformTotal}
            color="#00ff88"
          />
          <Bar
            label="Android"
            value={platforms.android}
            total={platformTotal}
            color="#10b981"
          />
        </div>
      </div>
    </div>
  );
}
