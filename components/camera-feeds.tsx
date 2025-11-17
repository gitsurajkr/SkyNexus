'use client'

import React, { useState } from 'react'
import { Camera, Download, Maximize2 } from 'lucide-react'

export default function CameraFeeds() {
  const [fps] = useState({ cam_a: 30, cam_b: 24 })
  const [latency] = useState({ cam_a: 210, cam_b: 245 })
  const [timestamp] = useState(new Date().toLocaleTimeString())

  const CameraCard = ({
    label,
    fps: fpsValue,
    latency: latencyValue,
    cameraId,
  }: {
    label: string
    fps: number
    latency: number
    cameraId: string
  }) => (
    <div
      className="rounded-xl overflow-hidden border-2 relative group"
      style={{
        backgroundColor: '#1a1d23',
        borderColor: '#3a3f47',
        boxShadow: 'none',
      }}
    >
      {/* Camera Feed */}
      <div className="relative w-full pt-[75%] bg-gradient-to-b from-gray-900 to-black overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(45deg, #1a1f2e 25%, transparent 25%, transparent 75%, #1a1f2e 75%, #1a1f2e),
                            linear-gradient(45deg, #1a1f2e 25%, transparent 25%, transparent 75%, #1a1f2e 75%, #1a1f2e)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px',
            backgroundColor: '#0C0F16',
          }}
        >
          <Camera size={48} style={{ color: '#6b7280', opacity: 0.5 }} />
        </div>

        {/* Overlay Info */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
          {/* Top Left: Label + Status */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2 py-1 rounded"
              style={{ backgroundColor: '#3a3f47', color: '#f9fafb' }}
            >
              {label}
            </span>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>

          {/* Bottom: Info Bar */}
          <div
            className="text-xs font-mono space-y-1"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '8px', borderRadius: '4px' }}
          >
            <p style={{ color: '#9ca3af' }}>FPS: {fpsValue}</p>
            <p style={{ color: '#9ca3af' }}>RTL: {latencyValue}ms</p>
            <p style={{ color: '#d1d5db' }}>{timestamp}</p>
          </div>
        </div>

        {/* Action Buttons (on hover) */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-2 rounded"
            style={{ backgroundColor: 'rgba(58, 63, 71, 0.5)', color: '#d1d5db' }}
          >
            <Download size={16} />
          </button>
          <button
            className="p-2 rounded"
            style={{ backgroundColor: 'rgba(58, 63, 71, 0.5)', color: '#d1d5db' }}
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-2 gap-6 p-6" style={{ backgroundColor: '#0f1117' }}>
      <CameraCard
        label="Primary Camera"
        fps={fps.cam_a}
        latency={latency.cam_a}
        cameraId="cam_a"
      />
      <CameraCard
        label="Secondary/Payload Camera"
        fps={fps.cam_b}
        latency={latency.cam_b}
        cameraId="cam_b"
      />
    </div>
  )
}
