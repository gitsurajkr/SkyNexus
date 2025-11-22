'use client'
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
      className="flex items-center gap-2 px-6 py-2 rounded-md border-2 bg-blue-600 border-blue-700 text-white hover:bg-blue-700 transition-colors font-medium">
      <Download size={14} />
      <span className="text-sm font-semibold">Export</span>
    </button>
  )
}
