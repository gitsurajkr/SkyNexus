'use client'

import React, { useRef, useEffect } from 'react'
import { SensorData } from '@/lib/sensorData'

interface CCVLogPanelProps {
  allData: SensorData[]
  currentIndex: number
}

export default function CCVLogPanel({ allData, currentIndex }: CCVLogPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [currentIndex])

  // Don't render if no data
  if (!allData || allData.length === 0) {
    return (
      <div className="w-64 flex flex-col border-r-2 bg-white border-r-gray-300">
        <div className="p-4 text-center text-gray-600">
          Loading logs...
        </div>
      </div>
    )
  }

  const visibleLogs = allData.slice(0, currentIndex + 1).slice(-50) // Show last 50 entries

  return (
    <div className="w-64 flex flex-col border-r-2 bg-white border-r-gray-300">
      {/* Header */}
      <div className="p-4 border-b border-b-gray-300">
        <h2 className="text-sm font-bold text-gray-900">
          CCV LOG - {allData[0]?.TEAM_ID || 'Team Aerius'}
        </h2>
        <p className="text-xs mt-1 text-gray-600">
          MISSION TELEMETRY
        </p>
      </div>

      {/* Log Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1 text-gray-800"
      >
        {visibleLogs.map((entry, idx) => {
          // Skip if entry doesn't have required fields
          if (!entry || typeof entry.ALTITUDE === 'undefined' || typeof entry.TEMPERATURE === 'undefined') {
            return null
          }
          
          // Color based on STATE
          const stateColor = 
            entry.STATE === 'LANDED' ? '#10b981' : 
            entry.STATE === 'ASCENT' ? '#3b82f6' : 
            entry.STATE === 'DESCENT' ? '#f59e0b' : 
            entry.STATE === 'APOGEE' ? '#8b5cf6' :
            entry.STATE === 'PROBE_RELEASE' ? '#ec4899' :
            entry.STATE === 'PAYLOAD_RELEASE' ? '#f97316' :
            '#6b7280'
          
          return (
            <div key={idx} className="leading-relaxed">
              <span style={{ color: stateColor }}>
                [{entry.MISSION_TIME || '00:00:00'}]
              </span>
              {' '}
              <span>Team {entry.TEAM_ID}, Temp: {entry.TEMPERATURE.toFixed(1)}°C</span>
            </div>
          )
        })}
      </div>
                    
      {/* Footer */}
      {/* <div className="p-3 border-t" style={{ borderTopColor: '#00E0FF', borderTopWidth: '1px' }}>
        <p className="text-xs" style={{ color: '#00E0FF' }}>
          {currentIndex + 1} / {allData.length} entries
        </p>
      </div> */}
    </div>
  )
}
