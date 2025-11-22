'use client'

import React, { useState, useEffect, useRef } from 'react'
import CCVLogPanel from '@/components/ccv-log-panel'
import TopBar from '@/components/top-bar'
import MetricsRow from '@/components/metrics-row'
// import CameraFeeds from '@/components/camera-feeds'
import GraphsMapSection from '@/components/graphs-map-section'
import BottomPanel from '@/components/bottom-panel'
import { loadCSVData, convertToCSV, SensorData } from '@/lib/loadCSVData'

export default function CanSatDashboard() {
  const [isConnected, setIsConnected] = useState(true)
  const [utcTime, setUtcTime] = useState<string>('')
  const [batteryPercent, setBatteryPercent] = useState(87)
  const [signalStrength, setSignalStrength] = useState(95)
  
  // Generate and store all data
  const [allData, setAllData] = useState<SensorData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load data from CSV file
    loadCSVData().then(data => {
      setAllData(data)
      setIsLoading(false)
      console.log(`Loaded ${data.length} entries from CSV file`)
    }).catch(error => {
      console.error('Error loading CSV:', error)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    // Update UTC time every second
    const interval = setInterval(() => {
      setUtcTime(new Date().toUTCString().split(' ')[4])
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Play through data at very fast rate for smooth real-time animation
    if (!isPlaying || currentIndex >= allData.length - 1) return
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => Math.min(prev + 1, allData.length - 1))
    }, 50) // Update every 50ms (20 updates/sec) for very smooth animation

    return () => clearInterval(interval)
  }, [isPlaying, currentIndex, allData.length])

  const currentData = allData[currentIndex]

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 text-gray-800">
            Loading Telemetry Data...
          </div>
          <div className="text-sm text-gray-600">
            Reading CSV file
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <CCVLogPanel allData={allData} currentIndex={currentIndex} />

      {/* Right Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar
          isConnected={isConnected}
          utcTime={utcTime}
          batteryPercent={batteryPercent}
          signalStrength={signalStrength}
          allData={allData}
        />

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Metrics Row */}
          <MetricsRow currentData={currentData} />

          {/* Camera Feeds */}
          {/* <CameraFeeds /> */}

          {/* Graphs + Map Section */}
          <GraphsMapSection allData={allData} currentIndex={currentIndex} />

          {/* Bottom Panel */}
          <BottomPanel />
        </div>
      </div>
    </div>
  )
}
