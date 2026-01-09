'use client'

import { useState, useEffect, useRef } from 'react'
import CCVLogPanel from '@/components/ccv-log-panel'
import TopBar from '@/components/top-bar'
import MetricsRow from '@/components/metrics-row'
import GraphsMapSection from '@/components/graphs-map-section'
import BottomPanel from '@/components/bottom-panel'
import CommandPanel from '@/components/command-panel'
import { SensorData } from '@/lib/sensorData'


export default function CanSatDashboard() {

  const [allData, setAllData] = useState<SensorData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [packetsReceived, setPacketsReceived] = useState(0)
  const [packetsLost, setPacketsLost] = useState(0)
  const [lastCmdEcho, setLastCmdEcho] = useState<string | null>(null)

  const fileCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentData = allData.length > 0 ? allData[allData.length - 1] : null
  const currentIndex = allData.length - 1
  const missionTime = currentData?.MISSION_TIME || '00:00:00'
  const batteryPercent = currentData ? Math.min(100, Math.max(0, (currentData.VOLTAGE - 6.0) / (8.4 - 6.0) * 100)) : 0
  const signalStrength = 80 // Mock signal strength

  useEffect(() => {
    if (lastCmdEcho) {
      const t = setTimeout(() => setLastCmdEcho(null), 3000)
      return () => clearTimeout(t)
    }
  }, [lastCmdEcho])
  // Load and parse CSV data from Arduino
  const loadCSVData = async () => {
    try {
      const response = await fetch(
        `/cansat_telemetry.csv?ts=${Date.now()}`,
        { cache: 'no-store' }
      )
      if (!response.ok) {
        console.error('Failed to fetch CSV:', response.status)
        return
      }

      const text = await response.text()
      const lines = text.trim().split('\n')

      if (lines.length < 2) {
        console.log('No data in CSV yet')
        return // No data yet
      }

      const dataLines = lines.slice(1)

      const eventLines = dataLines.filter(line => line.startsWith('EVENT'))

      for (const line of eventLines) {
        const parts = line.split(',')

        const payload = parts[2] || ''

        // Command acknowledgement
        if (payload.startsWith('CMD_ECHO:')) {
          setLastCmdEcho(payload.replace('CMD_ECHO:', ''))
        } else {
          // Flight events (APOGEE, LANDED, etc.)
          console.log('[FLIGHT EVENT]', payload)
        }
      }


      const telemetryLines = dataLines.filter(
        line => !line.startsWith('EVENT') && line.includes(',')
      )

      const parsedData: SensorData[] = telemetryLines.map((line) => {
        const values = line.split(',')
        const missionTimeStr = values[0]?.trim() || '00:00:00'

        // Parse Arduino CSV:
        // MISSION_TIME,PACKET,STATE,ALTITUDE_M,RAW_ALTITUDE_M,PRESSURE_KPA,TEMP_C,...

        const packetCount = parseInt(values[1]) || 0
        const state = values[2]?.trim() || 'LAUNCH_PAD'
        const altitude = parseFloat(values[3]) || 0
        // const rawAltitude = parseFloat(values[4]) || 0
        const pressure = parseFloat(values[5]) || 0
        const temperature = parseFloat(values[6]) || 0
        const accelR = parseFloat(values[7]) || 0
        const accelP = parseFloat(values[8]) || 0
        const accelY = parseFloat(values[9]) || 0
        const gyroR = parseFloat(values[10]) || 0
        const gyroP = parseFloat(values[11]) || 0
        const gyroY = parseFloat(values[12]) || 0
        const gpsLAT = parseFloat(values[13]) || 0
        const gpsLON = parseFloat(values[14]) || 0
        const gpsALT = parseFloat(values[15]) || 0
        const gpsTime = values[16]?.trim() || ''
        const gpsSats = parseInt(values[17]) || 0
        const gpsFix = values[18] === '1' ? 'FIX' : 'NO_FIX'



        // Mock voltage (battery simulation: starts at 8.4V, slowly decreases)
        const voltage = Math.max(6.0, 8.4 - (packetCount * 0.001))
        const current = 0.5 + Math.random() * 0.1 // Mock current 0.5-0.6A

        return {
          TEAM_ID: 'TEAM_AERIUS_01',
          MISSION_TIME: missionTimeStr,
          PACKET_COUNT: packetCount,
          MODE: 'F', // Flight mode
          STATE: state,
          ALTITUDE: altitude,
          TEMPERATURE: temperature,
          PRESSURE: pressure,
          VOLTAGE: parseFloat(voltage.toFixed(1)),
          CURRENT: parseFloat(current.toFixed(2)),
          GYRO_R: gyroR,
          GYRO_P: gyroP,
          GYRO_Y: gyroY,
          ACCEL_R: accelR,
          ACCEL_P: accelP,
          ACCEL_Y: accelY,
          GPS_TIME: gpsTime,
          GPS_ALTITUDE: gpsALT,
          GPS_LATITUDE: gpsLAT,
          GPS_LONGITUDE: gpsLON,
          GPS_SATS: gpsSats,
          GPS_FIX: gpsFix,
          CMD_ECHO: lastCmdEcho || ''
        }
      })

      setAllData(parsedData)
      setPacketsReceived(parsedData.length)

      // Calculate packet loss (if packet numbers have gaps)
      if (parsedData.length > 1) {
        const first = parsedData[0].PACKET_COUNT
        const last = parsedData[parsedData.length - 1].PACKET_COUNT
        const expectedPackets = Math.max(0, last - first + 1)
        const actualPackets = parsedData.length
        setPacketsLost(Math.max(0, expectedPackets - actualPackets))
      }

      console.log(`Loaded ${parsedData.length} data points from CSV`)

    } catch (error) {
      console.error('Error loading CSV:', error)
    }
  }

  const startDataStream = async () => {
    setConnecting(true)

    await sendCommand('C')

    setIsConnected(true)
    setConnecting(false)

    loadCSVData()
    fileCheckIntervalRef.current = setInterval(loadCSVData, 1000)
  }


  const stopDataStream = async () => {
    setConnecting(true)

    await sendCommand('D')

    setIsConnected(false)
    setConnecting(false)

    if (fileCheckIntervalRef.current) {
      clearInterval(fileCheckIntervalRef.current)
    }
  }


  const sendCommand = async (cmd: 'C' | 'D') => {
    await fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd })
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fileCheckIntervalRef.current) {
        clearInterval(fileCheckIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <CCVLogPanel allData={allData} currentIndex={currentIndex} />

      {/* Right Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar
          isConnected={isConnected}
          utcTime={missionTime}
          batteryPercent={batteryPercent}
          signalStrength={signalStrength}
          allData={allData}
          onConnect={startDataStream}
          onDisconnect={stopDataStream}
          connecting={connecting}
        />

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Metrics Row */}
          <MetricsRow currentData={currentData} packetsReceived={packetsReceived} packetsLost={packetsLost} />

          {/* Camera Feeds */}
          {/* <CameraFeeds /> */}

          {/* Graphs + Map Section */}
          <GraphsMapSection allData={allData} currentIndex={currentIndex} />

          {/* Bottom Panel */}
          <BottomPanel currentData={currentData ?? undefined} />

          {/* Command Panel */}
          <CommandPanel
            teamId={currentData?.TEAM_ID || 'TEAM_AERIUS_01'}
            onSendCommand={(command: string) => {
              if (command === 'C' || command === 'D') {
                void sendCommand(command)
              } else {
                console.warn('Invalid command:', command)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
