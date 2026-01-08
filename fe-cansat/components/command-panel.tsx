'use client'

import React, { useState } from 'react'
import { Send, Terminal } from 'lucide-react'

interface CommandPanelProps {
  teamId: string
  onSendCommand?: (command: string) => void
}

export default function CommandPanel({ teamId, onSendCommand }: CommandPanelProps) {
  const [customCommand, setCustomCommand] = useState('')
  const [simPressure, setSimPressure] = useState('101325')
  const [customTime, setCustomTime] = useState('')
  const [mecDevice, setMecDevice] = useState('')

  const sendCommand = (cmd: string) => {
    console.log('Sending command:', cmd)
    onSendCommand?.(cmd)
  }

  return (
    <div className="p-6 bg-gray-50 border-t border-gray-300">
      <div className="flex items-center gap-2 mb-4">
        <Terminal size={20} className="text-gray-700" />
        <h2 className="text-lg font-bold text-gray-900">COMMAND INTERFACE</h2>
        <span className="text-xs text-gray-500 ml-2">Team ID: {teamId}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* CX - Telemetry On/Off */}
        <div className="p-4 rounded-lg border bg-white border-gray-300 shadow-sm">
          <h3 className="text-xs font-bold text-gray-700 mb-3">CX - TELEMETRY CONTROL</h3>
          <div className="flex gap-2">
            <button
              onClick={() => sendCommand(`CMD,${teamId},CX,ON`)}
              className="flex-1 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-semibold"
            >
              ON
            </button>
            <button
              onClick={() => sendCommand(`CMD,${teamId},CX,OFF`)}
              className="flex-1 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold"
            >
              OFF
            </button>
          </div>
        </div>

        {/* ST - Set Time */}
        <div className="p-4 rounded-lg border bg-white border-gray-300 shadow-sm">
          <h3 className="text-xs font-bold text-gray-700 mb-3">ST - SET TIME</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="hh:mm:ss"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-900"
            />
            <button
              onClick={() => sendCommand(`CMD,${teamId},ST,${customTime}`)}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              SET
            </button>
          </div>
          <button
            onClick={() => sendCommand(`CMD,${teamId},ST,GPS`)}
            className="w-full px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm font-semibold"
          >
            SET FROM GPS
          </button>
        </div>

        {/* CAL - Calibrate */}
        <div className="p-4 rounded-lg border bg-white border-gray-300 shadow-sm">
          <h3 className="text-xs font-bold text-gray-700 mb-3">CAL - CALIBRATE ALTITUDE</h3>
          <button
            onClick={() => sendCommand(`CMD,${teamId},CAL`)}
            className="w-full px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors text-sm font-semibold"
          >
            CALIBRATE TO 0m
          </button>
          <p className="text-xs text-gray-500 mt-2">Use when installed on launch pad</p>
        </div>

        {/* SIM - Simulation Mode */}
        <div className="p-4 rounded-lg border bg-white border-gray-300 shadow-sm">
          <h3 className="text-xs font-bold text-gray-700 mb-3">SIM - SIMULATION MODE</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => sendCommand(`CMD,${teamId},SIM,ENABLE`)}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              ENABLE
            </button>
            <button
              onClick={() => sendCommand(`CMD,${teamId},SIM,ACTIVATE`)}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-semibold"
            >
              ACTIVATE
            </button>
            <button
              onClick={() => sendCommand(`CMD,${teamId},SIM,DISABLE`)}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold"
            >
              DISABLE
            </button>
          </div>
        </div>

        {/* SIMP - Simulated Pressure */}
        <div className="p-4 rounded-lg border bg-white border-gray-300 shadow-sm">
          <h3 className="text-xs font-bold text-gray-700 mb-3">SIMP - SIMULATED PRESSURE</h3>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Pascals"
              value={simPressure}
              onChange={(e) => setSimPressure(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-900"
            />
            <button
              onClick={() => sendCommand(`CMD,${teamId},SIMP,${simPressure}`)}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              SEND
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Simulation mode only (Pa)</p>
        </div>

        {/* MEC - Mechanism Control */}
        <div className="p-4 rounded-lg border bg-white border-gray-300 shadow-sm">
          <h3 className="text-xs font-bold text-gray-700 mb-3">MEC - MECHANISM CONTROL</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Device ID"
              value={mecDevice}
              onChange={(e) => setMecDevice(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-900"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => sendCommand(`CMD,${teamId},MEC,${mecDevice},ON`)}
              className="flex-1 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-semibold"
            >
              ON
            </button>
            <button
              onClick={() => sendCommand(`CMD,${teamId},MEC,${mecDevice},OFF`)}
              className="flex-1 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold"
            >
              OFF
            </button>
          </div>
        </div>
      </div>

      {/* Custom Command */}
      <div className="mt-4 p-4 rounded-lg border bg-white border-gray-300 shadow-sm">
        <h3 className="text-xs font-bold text-gray-700 mb-3">CUSTOM COMMAND</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter custom command (e.g., CMD,1000,CX,ON)"
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm font-mono text-gray-900"
          />
          <button
            onClick={() => {
              sendCommand(customCommand)
              setCustomCommand('')
            }}
            className="px-6 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900 transition-colors text-sm font-semibold flex items-center gap-2"
          >
            <Send size={16} />
            SEND
          </button>
        </div>
      </div>
    </div>
  )
}
