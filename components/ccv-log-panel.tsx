'use client'

import React, { useRef, useEffect } from 'react'
import { SensorData } from '@/lib/loadCSVData'

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
          CCV LOG - Team {allData[0]?.teamId || 'XYZ'}
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
          const healthColor = entry.systemHealth === 'NOMINAL' ? '#10b981' : 
                             entry.systemHealth === 'WARNING' ? '#f59e0b' : '#ef4444'
          
          return (
            <div key={idx} className="leading-relaxed">
              <span style={{ color: healthColor }}>
                {entry.systemHealth}:
              </span>
              {' '}
              <span>Team {entry.teamId}, Temp: {entry.temperature.toFixed(1)}°C</span>
              {entry.eventLog && (
                <>
                  {' - '}
                  <span>{entry.eventLog}</span>
                </>
              )}
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
