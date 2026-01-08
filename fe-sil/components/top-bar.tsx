"use client"

import React from 'react'
import { Zap, Signal, Loader } from 'lucide-react'
import ExportCSVButton from './export-csv-button'
import { SensorData } from '@/lib/sensorData'
import Image from 'next/image'

interface TopBarProps {
  isConnected: boolean
  utcTime: string
  batteryPercent: number
  signalStrength: number
  allData?: SensorData[]
  onConnect?: () => void
  onDisconnect?: () => void
  connecting?: boolean
}

export default function TopBar({
  isConnected,
  utcTime,
  batteryPercent,
  signalStrength,
  allData,
  onConnect,
  onDisconnect,
  connecting = false,
}: TopBarProps) {
  return (
    <div className="h-16 flex items-center justify-between px-6 border-b bg-white border-gray-300">
      {/* Title + Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          
          <Image src="/Aerius.jpg" width={70} height={70} alt="Team Aerius Logo" className="rounded-full" />
   
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Team Aerius
            </h1>
            <p className="text-xs text-gray-500">
              Team ID: {allData && allData.length > 0 ? allData[0].TEAM_ID : '1000'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-gray-600">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      {/* Right: UTC Time, Battery, Signal */}
      <div className="flex items-center gap-6">

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Upload Code - hidden during demo
            <button className="flex items-center gap-2 px-6 py-2 rounded-md border-2 bg-blue-600 border-blue-700 text-white hover:bg-blue-700 transition-colors font-medium">
              <span className="text-sm font-semibold">Upload Code</span>
            </button>
            */}
            <button className="flex items-center gap-2 px-6 py-2 rounded-md border-2 bg-blue-600 border-blue-700 text-white hover:bg-blue-700 transition-colors font-medium">
              <span className="text-sm font-semibold">Test Module</span>
            </button>
            {allData && allData.length > 0 && (
              <ExportCSVButton allData={allData} />
            )}
          </div>

          <div className="ml-3">
            <p className="text-xs text-gray-600">MISSION TIME</p>
            <p className="text-sm font-mono font-bold text-gray-900">{utcTime}</p>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-300 opacity-50" />

        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber-600" />
          <div>
            <p className="text-xs text-gray-600">
              BATTERY
            </p>
            <p className="text-sm font-bold text-gray-900">
              {batteryPercent}%
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-300 opacity-50" />

        <div className="flex items-center gap-2">
          <Signal size={16} className="text-gray-600" />
          <div>
            <p className="text-xs text-gray-600">
              SIGNAL
            </p>
            <p className="text-sm font-bold text-gray-900">
              {signalStrength}%
            </p>
          </div>

          <div className="h-8 w-px bg-gray-300 opacity-50" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isConnected) onDisconnect?.(); else onConnect?.();
              }}
              disabled={connecting}
              className={`flex items-center gap-2 px-6 py-2 rounded-md border-2 transition-colors font-medium ${isConnected ? 'bg-red-600 border-red-700 hover:bg-red-700 text-white' : 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700'}`}>
              {connecting ? <Loader className="animate-spin" size={14} /> : null}
              <span className="text-sm font-semibold">{isConnected ? 'Disconnect' : (connecting ? 'Connecting...' : 'Connect')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
