'use client'

import React, { useState, useEffect, useRef } from 'react'
import CCVLogPanel from '@/components/ccv-log-panel'
import TopBar from '@/components/top-bar'
import MetricsRow from '@/components/metrics-row'
import GraphsMapSection from '@/components/graphs-map-section'
import BottomPanel from '@/components/bottom-panel'
import CommandPanel from '@/components/command-panel'
import { SensorData } from '@/lib/sensorData'

const WS_URL = 'ws://localhost:8081';

export default function CanSatDashboard() {
  const [isConnected, setIsConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [missionTime, setMissionTime] = useState<string>('00:00:00')
  const [batteryPercent, setBatteryPercent] = useState(100)
  const [signalStrength, setSignalStrength] = useState(0)
  const [packetsReceived, setPacketsReceived] = useState(0)
  const [packetsLost, setPacketsLost] = useState(0)
  
  // Real-time telemetry data
  const [allData, setAllData] = useState<SensorData[]>([])
  const [currentData, setCurrentData] = useState<SensorData | null>(null)
  const wsRef = useRef<WebSocket | null>(null);
  const lastSeqRef = useRef<number | null>(null);

  // WebSocket connection (manual connect)
  const userRequestedRef = useRef(false);

  const connectWebSocket = () => {
    userRequestedRef.current = true;
    setConnecting(true);
    // Close existing if present
    if (wsRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      try { wsRef.current.close(); } catch (e) { /* ignore */ }
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to telemetry simulator');
      setIsConnected(true);
      setConnecting(false);
      setSignalStrength(100);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'telemetry') {
        const telemetry: SensorData = message.data;

        // Update current data
        setCurrentData(telemetry);

        // Update mission time from telemetry
        if (telemetry.MISSION_TIME) {
          setMissionTime(telemetry.MISSION_TIME);
        }

        // Add to history (keep last 500 entries)
        setAllData(prev => {
          const next = [...prev, telemetry];
          if (next.length > 500) next.shift();
          return next;
        });

        // Packet counters (PACKET_COUNT-based)
        if (typeof telemetry.PACKET_COUNT === 'number') {
          setPacketsReceived(prev => prev + 1);
          const last = lastSeqRef.current;
          if (last === null) {
            // first packet
            lastSeqRef.current = telemetry.PACKET_COUNT;
          } else {
            const expected = last + 1;
            if (telemetry.PACKET_COUNT > expected) {
              const lost = telemetry.PACKET_COUNT - expected;
              setPacketsLost(prev => prev + lost);
            }
            lastSeqRef.current = telemetry.PACKET_COUNT;
          }
        } else {
          // if no PACKET_COUNT present, count as received
          setPacketsReceived(prev => prev + 1);
        }

        // Update battery percent
        const batteryPct = Math.max(0, Math.min(100,
          ((telemetry.VOLTAGE - 11.1) / (12.6 - 11.1)) * 100
        ));
        setBatteryPercent(Math.round(batteryPct));
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnecting(false);
      setSignalStrength(0);
    };

    ws.onclose = () => {
      console.log('❌ Disconnected from simulator');
      setIsConnected(false);
      setConnecting(false);
      setSignalStrength(0);

      // Auto-reconnect only if user requested connection
      if (userRequestedRef.current) {
        setTimeout(() => connectWebSocket(), 3000);
      }
    };
  };

  const disconnectWebSocket = () => {
    userRequestedRef.current = false;
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* ignore */ }
      wsRef.current = null;
    }
    setIsConnected(false);
    setSignalStrength(0);
  };

  const sendCommand = (command: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending command:', command);
      wsRef.current.send(command);
    } else {
      console.error('WebSocket is not connected. Cannot send command.');
      alert('Not connected to CanSat. Please connect first.');
    }
  };

  // Mission time is now updated from telemetry packets

  // Auto-connect to simulator on mount for convenience
  useEffect(() => {
    // mark that user requested connection so auto-reconnect works
    userRequestedRef.current = true;
    connectWebSocket();
    return () => {
      userRequestedRef.current = false;
      disconnectWebSocket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Always render dashboard UI; connection status is shown in TopBar

  const currentIndex = allData.length - 1;

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
          onConnect={connectWebSocket}
          onDisconnect={disconnectWebSocket}
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
            teamId={currentData?.TEAM_ID || '1000'} 
            onSendCommand={sendCommand}
          />
        </div>
      </div>
    </div>
  )
}
