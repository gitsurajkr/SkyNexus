'use client'

import React from 'react'
import { Activity, Thermometer, Navigation, Gauge, Zap, Compass, MapPin } from 'lucide-react'
import { SensorData } from '@/lib/sensorData'

interface MetricsRowProps {
  currentData: SensorData | null
  packetsReceived?: number
  packetsLost?: number
}

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
        {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
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

export default function MetricsRow({ currentData, packetsReceived = 0, packetsLost = 0 }: MetricsRowProps) {
  if (!currentData) return null

  const altitude = currentData.ALTITUDE
  const temperature = currentData.TEMPERATURE
  const pressure = currentData.PRESSURE
  const voltage = currentData.VOLTAGE
  const current = currentData.CURRENT
  const state = currentData.STATE
  const gpsLat = currentData.GPS_LATITUDE
  const gpsLon = currentData.GPS_LONGITUDE
  const gpsAlt = currentData.GPS_ALTITUDE
  const gpsSats = currentData.GPS_SATS
  const gpsTime = currentData.GPS_TIME
  const cmdEcho = currentData.CMD_ECHO
  const mode = currentData.MODE

  return (
    <div className="p-6 bg-gray-50">
      {/* Row 1: Primary Sensor Data */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <MetricCard
          title="ALTITUDE"
          value={typeof altitude === 'number' ? altitude.toFixed(1) : 'N/A'}
          unit="m"
          subtext="Resolution: ±0.1m"
          icon={<Activity size={20} />}
        />
        <MetricCard
          title="TEMPERATURE"
          value={typeof temperature === 'number' ? temperature.toFixed(1) : 'N/A'}
          unit="°C"
          subtext="Resolution: ±0.1°C"
          icon={<Thermometer size={20} />}
        />
        <MetricCard
          title="PRESSURE"
          value={typeof pressure === 'number' ? pressure.toFixed(1) : 'N/A'}
          unit="kPa"
          subtext="Resolution: ±0.1 kPa"
          icon={<Gauge size={20} />}
        />
        <MetricCard
          title="STATE"
          value={state || 'UNKNOWN'}
          unit=""
          subtext="Flight State"
          icon={<Navigation size={20} />}
        />
        <MetricCard
          title="MODE"
          value={mode || 'UNKNOWN'}
          unit=""
          subtext="Operating Mode"
          icon={<Compass size={20} />}
        />
      </div>
      
      {/* Row 2: Power & GPS Data */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <MetricCard
          title="GPS TIME"
          value={gpsTime || 'N/A'}
          unit=""
          subtext="UTC Time"
          icon={<Activity size={20} />}
        />
        <MetricCard
          title="GPS SATS"
          value={gpsSats || 0}
          unit=""
          subtext="Satellites Tracked"
          icon={<Compass size={20} />}
        />
        
        <MetricCard
          title="GPS LATITUDE"
          value={typeof gpsLat === 'number' ? gpsLat.toFixed(4) : 'N/A'}
          unit="°N"
          subtext="Resolution: ±0.0001°"
          icon={<MapPin size={20} />}
        />
        <MetricCard
          title="GPS LONGITUDE"
          value={typeof gpsLon === 'number' ? gpsLon.toFixed(4) : 'N/A'}
          unit="°W"
          subtext="Resolution: ±0.0001°"
          icon={<MapPin size={20} />}
        />
        <MetricCard
          title="GPS ALTITUDE"
          value={typeof gpsAlt === 'number' ? gpsAlt.toFixed(1) : 'N/A'}
          unit="m MSL"
          subtext="Mean Sea Level"
          icon={<Activity size={20} />}
        />
      </div>

      {/* Row 3: GPS Info & Communication */}
      <div className="grid grid-cols-4 gap-4">

        <MetricCard
          title="VOLTAGE"
          value={typeof voltage === 'number' ? voltage.toFixed(1) : 'N/A'}
          unit="V"
          subtext="Battery Voltage"
          icon={<Zap size={20} />}
        />
        <MetricCard
          title="CURRENT"
          value={typeof current === 'number' ? current.toFixed(2) : 'N/A'}
          unit="A"
          subtext="Current Draw"
          icon={<Zap size={20} />}
        />
        
        <MetricCard
          title="CMD ECHO"
          value={cmdEcho || 'NONE'}
          unit=""
          subtext="Last Command"
          icon={<Navigation size={20} />}
        />
        <div className="p-4 rounded-lg border bg-white border-gray-300 transition-all duration-300 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-600">
              PACKETS
            </span>
            <div className="text-gray-500"><Activity size={20} /></div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-green-600">
                  {packetsReceived}
                </span>
              </div>
              <p className="text-xs text-gray-500">Received</p>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-red-600">
                  {packetsLost}
                </span>
              </div>
              <p className="text-xs text-gray-500">Lost</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

