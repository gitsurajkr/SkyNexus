'use client'

import React from 'react'
import { Activity, Thermometer, Navigation, Gauge } from 'lucide-react'
import { SensorData } from '@/lib/loadCSVData'

interface MetricsRowProps {
  currentData: SensorData | null
}

export default function MetricsRow({ currentData }: MetricsRowProps) {
  if (!currentData) return null

  const altitude = currentData.altitude
  const temperature = currentData.temperature
  const speed = currentData.speed
  const tilt = currentData.tilt

  const MetricCard = ({
    title,
    value,
    unit,
    subtext,
    icon: Icon,
  }: {
    title: string
    value: string | number
    unit?: string
    subtext?: string
    icon: React.ReactNode
  }) => (
    <div
      className="p-4 rounded-lg border-2 transition-all duration-300"
      style={{
        backgroundColor: '#151A23',
        borderColor: '#00E0FF',
        boxShadow: '0 0 20px rgba(0, 224, 255, 0.2)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold" style={{ color: '#00E0FF' }}>
          {title}
        </span>
        <div style={{ color: '#00E0FF' }}>{Icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold" style={{ color: '#EAF1F7' }}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-xs" style={{ color: '#00E0FF' }}>
          {unit}
        </span>
      </div>
      {subtext && (
        <p className="text-xs mt-2" style={{ color: '#00E0FF', opacity: 0.7 }}>
          {subtext}
        </p>
      )}
    </div>
  )

  return (
    <div className="grid grid-cols-4 gap-4 p-6" style={{ backgroundColor: '#0C0F16' }}>
      <MetricCard
        title="ALTITUDE"
        value={altitude}
        unit="m"
        icon={<Activity size={20} />}
      />
      <MetricCard
        title="TEMPERATURE"
        value={temperature}
        unit="°C"
        subtext={`Pressure: ${currentData.pressure.toFixed(1)} hPa`}
        icon={<Thermometer size={20} />}
      />
      <MetricCard
        title="SPEED"
        value={speed}
        unit="m/s"
        subtext={`Vertical velocity`}
        icon={<Navigation size={20} />}
      />
      <MetricCard
        title="TILT ANGLE"
        value={tilt}
        unit="°"
        subtext={`Orientation`}
        icon={<Gauge size={20} />}
      />
    </div>
  )
}

