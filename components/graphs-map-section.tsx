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
  Legend,
} from 'recharts'
import { SensorData } from '@/lib/loadCSVData'

interface GraphsMapSectionProps {
  allData: SensorData[]
  currentIndex: number
}

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

  // Show sliding window of data for smooth continuous display
  const windowSize = 100 // Increased window for smoother visualization
  const startIndex = Math.max(0, currentIndex - windowSize + 1)
  const endIndex = currentIndex + 1
  const recentData = allData.slice(startIndex, endIndex).map((d, i) => ({
    time: startIndex + i,
    altitude: d.altitude,
    temperature: d.temperature,
    pressure: d.pressure,
    speed: d.speed,
    tilt: d.tilt,
    voltage: d.voltage,
    current: d.current,
    accelX: d.accelX,
    accelY: d.accelY,
    accelZ: d.accelZ,
    gyroX: d.gyroX,
    gyroY: d.gyroY,
    gyroZ: d.gyroZ,
    magX: d.magX,
    magY: d.magY,
    magZ: d.magZ,
  }))

  const SimpleChart = ({
    title,
    data,
    dataKey,
    color,
    yAxisLabel,
  }: {
    title: string
    data: any[]
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

  return (
    <div className="p-6 bg-gray-50">
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
          yAxisLabel="hPa"
        />

        {/* Row 2: Speed and Accelerometer */}
        <SimpleChart
          title="SPEED"
          data={recentData}
          dataKey="speed"
          color="#00FF88"
          yAxisLabel="m/s"
        />
         <SimpleChart
          title="TILT"
          data={recentData}
          dataKey="tilt"
          color="#FF4D4D"
          yAxisLabel="degrees"
        />
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
          title="ACCEL X"
          data={recentData}
          dataKey="accelX"
          color="#00E0FF"
          yAxisLabel="g"
        />
        <SimpleChart
          title="ACCEL Y"
          data={recentData}
          dataKey="accelY"
          color="#00FF88"
          yAxisLabel="g"
        />

        {/* Row 3: Accelerometer Z, Gyroscope X, Y */}
        <SimpleChart
          title="ACCEL Z"
          data={recentData}
          dataKey="accelZ"
          color="#FFB84D"
          yAxisLabel="g"
        />
        <SimpleChart
          title="GYRO X"
          data={recentData}
          dataKey="gyroX"
          color="#00E0FF"
          yAxisLabel="deg/s"
        />
        <SimpleChart
          title="GYRO Y"
          data={recentData}
          dataKey="gyroY"
          color="#00FF88"
          yAxisLabel="deg/s"
        />

        {/* Row 4: Gyroscope Z, Magnetometer X, Y */}
        <SimpleChart
          title="GYRO Z"
          data={recentData}
          dataKey="gyroZ"
          color="#FFB84D"
          yAxisLabel="deg/s"
        />
        <SimpleChart
          title="MAG X"
          data={recentData}
          dataKey="magX"
          color="#00E0FF"
          yAxisLabel="µT"
        />
        <SimpleChart
          title="MAG Y"
          data={recentData}
          dataKey="magY"
          color="#00FF88"
          yAxisLabel="µT"
        />

        {/* Row 5: Magnetometer Z, Tilt, and Voltage */}
        <SimpleChart
          title="MAG Z"
          data={recentData}
          dataKey="magZ"
          color="#FFB84D"
          yAxisLabel="µT"
        />
       
      </div>
    </div>
  )
}
