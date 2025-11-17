'use client'

import React from 'react'
import { convertToCSV, SensorData } from '@/lib/loadCSVData'
import { Download } from 'lucide-react'

interface ExportCSVButtonProps {
  allData: SensorData[]
}

export default function ExportCSVButton({ allData }: ExportCSVButtonProps) {
  const handleExport = () => {
    const csvContent = convertToCSV(allData)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cansat-telemetry-Team${allData[0]?.teamId || 'XYZ'}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-300 hover:opacity-80"
      style={{
        backgroundColor: '#151A23',
        borderColor: '#00E0FF',
        color: '#00E0FF',
        boxShadow: '0 0 20px rgba(0, 224, 255, 0.2)',
      }}
    >
      <Download size={16} />
      <span className="text-xs font-bold">EXPORT CSV</span>
    </button>
  )
}
