'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

export default function BottomPanel() {
  const [sensors, setSensors] = useState({
    accelX: 0.02,
    accelY: 0.015,
    accelZ: 9.81,
    gyroX: 0.5,
    gyroY: 0.3,
    gyroZ: 0.1,
    pressure: 1013.25,
    humidity: 65,
  })

  const [health, setHealth] = useState({
    battery: 87,
    gpsLock: true,
    tempSafe: true,
    signal: 95,
    cpuLoad: 45,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) => ({
        accelX: prev.accelX + (Math.random() - 0.5) * 0.02,
        accelY: prev.accelY + (Math.random() - 0.5) * 0.02,
        accelZ: 9.81 + (Math.random() - 0.5) * 0.05,
        gyroX: (Math.random() - 0.5) * 2,
        gyroY: (Math.random() - 0.5) * 2,
        gyroZ: (Math.random() - 0.5) * 2,
        pressure: 1013.25 + (Math.random() - 0.5) * 2,
        humidity: 65 + (Math.random() - 0.5) * 5,
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

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
        {value.toFixed(2)} {unit}
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
                <SensorItem label="Accel X" value={sensors.accelX} unit="g" />
                <SensorItem label="Accel Y" value={sensors.accelY} unit="g" />
                <SensorItem label="Accel Z" value={sensors.accelZ} unit="g" />
                <SensorItem label="Gyro X" value={sensors.gyroX} unit="°/s" />
                <SensorItem label="Gyro Y" value={sensors.gyroY} unit="°/s" />
                <SensorItem label="Gyro Z" value={sensors.gyroZ} unit="°/s" />
                <SensorItem label="Pressure" value={sensors.pressure} unit="hPa" />
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
