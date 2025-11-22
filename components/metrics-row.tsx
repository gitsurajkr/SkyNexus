'use client'

import React from 'react'
import { Activity, Thermometer, Navigation, Gauge, Zap } from 'lucide-react'
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
  const voltage = currentData.voltage

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
    <div className="p-4 rounded-lg border bg-white border-gray-300 transition-all duration-300 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-600">
          {title}
        </span>
        <div className="text-gray-500">{Icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-xs text-gray-600">
          {unit}
        </span>
      </div>
      {subtext && (
        <p className="text-xs mt-2 text-gray-500">
          {subtext}
        </p>
      )}
    </div>
  )

  return (
    <div className="grid grid-cols-5 gap-4 p-6 bg-gray-50">
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
        title="VOLTAGE"
        value={voltage}
        unit="V"
        subtext={`Battery level`}
        icon={<Zap size={20} />}
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

