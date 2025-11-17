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
      <div
        className="w-64 flex flex-col border-r"
        style={{
          backgroundColor: '#0C0F16',
          borderRightColor: '#00E0FF',
          borderRightWidth: '2px',
        }}
      >
        <div className="p-4 text-center" style={{ color: '#00E0FF' }}>
          Loading logs...
        </div>
      </div>
    )
  }

  // Get visible logs (current and past entries)
  const visibleLogs = allData.slice(0, currentIndex + 1).slice(-50) // Show last 50 entries

  return (
    <div
      className="w-64 flex flex-col border-r"
      style={{
        backgroundColor: '#0C0F16',
        borderRightColor: '#00E0FF',
        borderRightWidth: '2px',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderBottomColor: '#00E0FF', borderBottomWidth: '1px' }}>
        <h2 className="text-sm font-bold" style={{ color: '#00E0FF' }}>
          CCV LOG - Team {allData[0]?.teamId || 'XYZ'}
        </h2>
        <p className="text-xs mt-1" style={{ color: '#00FF88' }}>
          MISSION TELEMETRY
        </p>
      </div>

      {/* Log Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1"
        style={{ color: '#00FF88' }}
      >
        {visibleLogs.map((entry, idx) => {
          const healthColor = entry.systemHealth === 'NOMINAL' ? '#00FF88' : 
                             entry.systemHealth === 'WARNING' ? '#FFB84D' : '#FF4D4D'
          
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
