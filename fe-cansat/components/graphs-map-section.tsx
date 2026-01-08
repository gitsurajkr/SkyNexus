'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { SensorData } from '@/lib/sensorData'
import dynamic from 'next/dynamic'

// Dynamically import the map component (client-side only for Leaflet)
const OfflineMap = dynamic(() => import('./offline-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white border border-gray-200 rounded-lg">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
})

interface GraphsMapSectionProps {
  allData: SensorData[]
  currentIndex: number
}

const SimpleChart = ({
  title,
  data,
  dataKey,
  color,
  yAxisLabel,
}: {
  title: string
  data: {
    time: number
    altitude: number
    temperature: number
    pressure: number
    voltage: number
    current: number
    descentRate: number
    batteryPercent: number
    gForceMagnitude: number
    accelR: number
    accelP: number
    accelY: number
    gyroR: number
    gyroP: number
    gyroY: number
    gpsAlt: number
    gpsSats: number
  }[]
  dataKey: string
  color: string
  yAxisLabel: string
}) => (
  <div className="p-4 rounded-lg border bg-white border-gray-300 shadow-sm">
    <h3 className="text-xs font-bold mb-3 text-gray-700">
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" opacity={0.5} />
        <XAxis
          dataKey="time"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          label={{ value: 'Time', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 11 }}
          domain={['dataMin', 'dataMax']}
        />
        <YAxis 
          tick={{ fill: '#6b7280', fontSize: 11 }}
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            color: '#1f2937',
          }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          dot={false}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)

export default function GraphsMapSection({ allData, currentIndex }: GraphsMapSectionProps) {
  // Don't render if no data yet
  if (!allData || allData.length === 0) {
    return (
      <div className="p-6 bg-gray-50">
        <div className="text-center text-gray-600">
          Loading graph data...
        </div>
      </div>
    )
  }

  // Show sliding window of data for smooth continuous visualization
  const windowSize = 100
  const startIndex = Math.max(0, currentIndex - windowSize + 1)
  const endIndex = currentIndex + 1
  const recentData = allData.slice(startIndex, endIndex).map((d, i, arr) => {
    // Calculate descent rate (negative = descending)
    const descentRate = i > 0 ? (d.ALTITUDE - arr[i - 1].ALTITUDE) / 1 : 0; // per second
    
    // Calculate battery percentage (8.4V = 100%, 6.0V = 0%)
    const batteryPercent = Math.max(0, Math.min(100, ((d.VOLTAGE - 6.0) / (8.4 - 6.0)) * 100));
    
    // Calculate total acceleration magnitude in g (data is in m/s²)
    const gForceMagnitude = Math.sqrt(d.ACCEL_R ** 2 + d.ACCEL_P ** 2 + d.ACCEL_Y ** 2) / 9.81;
    
    return {
      time: startIndex + i,
      altitude: d.ALTITUDE,
      temperature: d.TEMPERATURE,
      pressure: d.PRESSURE,
      voltage: d.VOLTAGE,
      current: d.CURRENT,
      descentRate: descentRate,
      batteryPercent: batteryPercent,
      gForceMagnitude: gForceMagnitude,
      accelR: d.ACCEL_R,
      accelP: d.ACCEL_P,
      accelY: d.ACCEL_Y,
      gyroR: d.GYRO_R,
      gyroP: d.GYRO_P,
      gyroY: d.GYRO_Y,
      gpsAlt: d.GPS_ALTITUDE,
      gpsSats: d.GPS_SATS,
    };
  });

  return (
    <div className="p-6 bg-gray-50">
      {/* Map Section */}
      <div className="mb-6">
        <h2 className="text-sm font-bold mb-3 text-gray-700">FLIGHT PATH MAP</h2>
        <div className="h-[400px] w-full">
          <OfflineMap data={allData} currentIndex={currentIndex} />
        </div>
      </div>

      {/* Graphs Grid */}
      <h2 className="text-sm font-bold mb-3 text-gray-700">SENSOR TELEMETRY</h2>
      <div className="grid grid-cols-3 gap-4">
        {/* Row 1: Altitude, Temperature, Pressure */}
        <SimpleChart
          title="ALTITUDE"
          data={recentData}
          dataKey="altitude"
          color="#00E0FF"
          yAxisLabel="Meters"
        />
        <SimpleChart
          title="TEMPERATURE"
          data={recentData}
          dataKey="temperature"
          color="#FFB84D"
          yAxisLabel="°C"
        />
        <SimpleChart
          title="PRESSURE"
          data={recentData}
          dataKey="pressure"
          color="#FF4D4D"
          yAxisLabel="kPa"
        />

        {/* Row 2: Descent Rate, Battery, G-Force */}
        <SimpleChart
          title="GPS ALTITUDE"
          data={recentData}
          dataKey="gpsAlt"
          color="#00FF88"
          yAxisLabel="m"
        />
        <SimpleChart
          title="DESCENT RATE"
          data={recentData}
          dataKey="descentRate"
          color="#f59e0b"
          yAxisLabel="m/s"
        />
        <SimpleChart
          title="BATTERY %"
          data={recentData}
          dataKey="batteryPercent"
          color="#10b981"
          yAxisLabel="%"
        />
        <SimpleChart
          title="G-FORCE MAG"
          data={recentData}
          dataKey="gForceMagnitude"
          color="#ef4444"
          yAxisLabel="g"
        />
        {/* <SimpleChart
          title="GPS SATELLITES"
          data={recentData}
          dataKey="gpsSats"
          color="#8b5cf6"
          yAxisLabel="count"
        /> */}
      
        <SimpleChart
          title="VOLTAGE"
          data={recentData}
          dataKey="voltage"
          color="#10b981"
          yAxisLabel="V"
        />
        <SimpleChart
          title="CURRENT"
          data={recentData}
          dataKey="current"
          color="#3b82f6"
          yAxisLabel="A"
        />
        <SimpleChart
          title="ACCEL ROLL"
          data={recentData}
          dataKey="accelR"
          color="#00E0FF"
          yAxisLabel="m/s²"
        />
        <SimpleChart
          title="ACCEL PITCH"
          data={recentData}
          dataKey="accelP"
          color="#00FF88"
          yAxisLabel="m/s²"
        />

        {/* Row 3: Accelerometer Yaw, Gyroscope R, P, Y */}
        <SimpleChart
          title="ACCEL YAW"
          data={recentData}
          dataKey="accelY"
          color="#FFB84D"
          yAxisLabel="m/s²"
        />
        <SimpleChart
          title="GYRO ROLL"
          data={recentData}
          dataKey="gyroR"
          color="#00E0FF"
          yAxisLabel="deg/s"
        />
        <SimpleChart
          title="GYRO PITCH"
          data={recentData}
          dataKey="gyroP"
          color="#00FF88"
          yAxisLabel="deg/s"
        />

        {/* Row 4: Gyroscope Yaw */}
        <SimpleChart
          title="GYRO YAW"
          data={recentData}
          dataKey="gyroY"
          color="#FFB84D"
          yAxisLabel="deg/s"
        />
       
      </div>
    </div>
  )
}
