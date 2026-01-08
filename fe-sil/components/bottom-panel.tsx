'use client'

import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { SensorData } from '@/lib/sensorData'

interface BottomPanelProps {
  currentData?: SensorData
}

// Subcomponents defined outside render to avoid recreation
const SensorItem = ({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit: string
}) => (
  <tr className="border-b border-gray-300">
    <td className="py-2 text-xs text-gray-600">
      {label}
    </td>
    <td className="py-2 text-xs font-mono text-right text-gray-900">
      {typeof value === 'number' ? value.toFixed(2) : 'N/A'} {unit}
    </td>
    <td className="py-2 pl-3">
      <CheckCircle2 size={14} className="text-green-600" />
    </td>
  </tr>
)

const HealthIndicator = ({
  label,
  value,
  isGood,
}: {
  label: string
  value: string | number
  isGood: boolean
}) => (
  <div className="flex items-center justify-between p-2 rounded bg-gray-100">
    <span className="text-xs text-gray-600">
      {label}
    </span>
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-gray-900">
        {value}
      </span>
      {isGood ? (
        <CheckCircle2 size={14} className="text-green-600" />
      ) : (
        <AlertTriangle size={14} className="text-amber-600" />
      )}
    </div>
  </div>
)

const EventItem = ({
  time,
  level,
  message,
}: {
  time: string
  level: 'info' | 'warning' | 'error'
  message: string
}) => {
  const colors = {
    info: '#6b7280',
    warning: '#d97706',
    error: '#dc2626',
  }

  return (
    <div className="py-2 border-b border-gray-300">
      <p className="text-xs" style={{ color: colors[level] }}>
        <span className="font-mono">[{time}]</span> {message}
      </p>
    </div>
  )
}

export default function BottomPanel({ currentData }: BottomPanelProps) {
  // Use real telemetry data or defaults
  const sensors = currentData ? {
    accelR: currentData.ACCEL_R,
    accelP: currentData.ACCEL_P,
    accelY: currentData.ACCEL_Y,
    gyroR: currentData.GYRO_R,
    gyroP: currentData.GYRO_P,
    gyroY: currentData.GYRO_Y,
    pressure: currentData.PRESSURE,
    humidity: 65, // Not in official spec
  } : {
    accelR: 0,
    accelP: 0,
    accelY: 0,
    gyroR: 0,
    gyroP: 0,
    gyroY: 0,
    pressure: 0,
    humidity: 0,
  }

  const health = currentData ? {
    battery: Math.round((currentData.VOLTAGE / 8.4) * 100), // Assuming 8.4V max
    gpsLock: currentData.GPS_SATS >= 4,
    tempSafe: currentData.TEMPERATURE > -20 && currentData.TEMPERATURE < 60,
    signal: 95, // Not in official spec
    cpuLoad: 45, // Not in official spec
  } : {
    battery: 0,
    gpsLock: false,
    tempSafe: true,
    signal: 0,
    cpuLoad: 0,
  }

  return (
    <div className="p-6 bg-gray-50">
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="rounded-lg border-2 p-4 bg-white border-gray-300 shadow-sm">
          <h3 className="text-xs font-bold mb-3 text-gray-700">
            SENSOR DATA
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                <SensorItem label="Accel Roll" value={sensors.accelR} unit="deg/s²" />
                <SensorItem label="Accel Pitch" value={sensors.accelP} unit="deg/s²" />
                <SensorItem label="Accel Yaw" value={sensors.accelY} unit="deg/s²" />
                <SensorItem label="Gyro Roll" value={sensors.gyroR} unit="°/s" />
                <SensorItem label="Gyro Pitch" value={sensors.gyroP} unit="°/s" />
                <SensorItem label="Gyro Yaw" value={sensors.gyroY} unit="°/s" />
                <SensorItem label="Pressure" value={sensors.pressure} unit="kPa" />
                <SensorItem label="Humidity" value={sensors.humidity} unit="%" />
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-lg border-2 p-4 bg-white border-gray-300 shadow-sm">
          <h3 className="text-xs font-bold mb-3 text-gray-700">
            SYSTEM HEALTH
          </h3>
          <div className="space-y-2">
            <HealthIndicator label="Battery" value={`${health.battery}%`} isGood={health.battery > 50} />
            <HealthIndicator label="GPS Lock" value={health.gpsLock ? 'YES' : 'NO'} isGood={health.gpsLock} />
            <HealthIndicator
              label="Temp Safe"
              value={health.tempSafe ? 'YES' : 'NO'}
              isGood={health.tempSafe}
            />
            <HealthIndicator label="Signal" value={`${health.signal}%`} isGood={health.signal > 50} />
          </div>
        </div>

        <div className="rounded-lg border-2 p-4 bg-white border-gray-300 shadow-sm">
          <h3 className="text-xs font-bold mb-3 text-gray-700">
            EVENT LOG
          </h3>
          <div className="max-h-48 overflow-y-auto">
            <EventItem time="12:09:12" level="info" message="Mission progress nominal" />
            <EventItem time="12:09:05" level="info" message="All systems operational" />
            <EventItem time="12:08:58" level="warning" message="Temperature rising: 24.5°C" />
            <EventItem time="12:08:42" level="info" message="GPS synchronization locked" />
            <EventItem time="12:08:35" level="info" message="CanSat initialized" />
            <EventItem time="12:08:21" level="info" message="Launch sequence armed" />
          </div>
        </div>
      </div>
    </div>
  )
}
