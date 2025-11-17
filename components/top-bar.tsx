'use client'

import React from 'react'
import { Zap, Wifi, WifiOff, Signal } from 'lucide-react'
import ExportCSVButton from './export-csv-button'
import { SensorData } from '@/lib/loadCSVData'

interface TopBarProps {
  isConnected: boolean
  utcTime: string
  batteryPercent: number
  signalStrength: number
  allData?: SensorData[]
}

export default function TopBar({
  isConnected,
  utcTime,
  batteryPercent,
  signalStrength,
  allData,
}: TopBarProps) {
  return (
    <div
      className="h-16 flex items-center justify-between px-6 border-b"
      style={{
        backgroundColor: '#151A23',
        borderBottomColor: '#00E0FF',
        borderBottomWidth: '1px',
      }}
    >
      {/* Left: Title + Status */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#EAF1F7' }}>
            Team Aerius
          </h1>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {/* <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} /> */}
          <span className="text-xs" style={{ color: '#EAF1F7' }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      {/* Right: UTC Time, Battery, Signal */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-xs" style={{ color: '#00E0FF' }}>
            UTC TIME
          </p>
          <p className="text-sm font-mono font-bold" style={{ color: '#EAF1F7' }}>
            {utcTime}
          </p>
        </div>

        <div className="h-8 w-px" style={{ backgroundColor: '#00E0FF', opacity: 0.3 }} />

        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: '#FFB84D' }} />
          <div>
            <p className="text-xs" style={{ color: '#00E0FF' }}>
              BATTERY
            </p>
            <p className="text-sm font-bold" style={{ color: '#EAF1F7' }}>
              {batteryPercent}%
            </p>
          </div>
        </div>

        <div className="h-8 w-px" style={{ backgroundColor: '#00E0FF', opacity: 0.3 }} />

        <div className="flex items-center gap-2">
          <Signal size={16} style={{ color: '#00E0FF' }} />
          <div>
            <p className="text-xs" style={{ color: '#00E0FF' }}>
              SIGNAL
            </p>
            <p className="text-sm font-bold" style={{ color: '#EAF1F7' }}>
              {signalStrength}%
            </p>
          </div>
        </div>

        {allData && allData.length > 0 && (
          <>
            <div className="h-8 w-px" style={{ backgroundColor: '#00E0FF', opacity: 0.3 }} />
            <ExportCSVButton allData={allData} />
          </>
        )}
      </div>
    </div>
  )
}
