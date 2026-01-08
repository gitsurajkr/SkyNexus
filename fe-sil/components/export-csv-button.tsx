'use client'
import { convertToCSV, SensorData } from '@/lib/sensorData'
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
    // Filename format per spec: Flight_<TEAM_ID>.csv
    link.download = `Flight_${allData[0]?.TEAM_ID || '1000'}.csv`
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
