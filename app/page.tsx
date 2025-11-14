'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const PanCard = dynamic(() => import('../components/PanCard'), { ssr: false })

interface PanData {
  status?: string
  message?: string
  reference_id?: number
  verification_id?: string
  name_provided?: string
  pan?: string
  registered_name?: string
  name_pan_card?: string
  first_name?: string
  last_name?: string
  type?: string
  gender?: string
  date_of_birth?: string
  masked_aadhaar_number?: string
  email?: string
  mobile_number?: string
  aadhaar_linked?: boolean
  address?: {
    full_address?: string
    street?: string
    city?: string
    state?: string
    pincode?: number
    country?: string
  }
}

interface ApiResponse {
  success: boolean
  message: string
  totalRecords: number
  successCount: number
  failedCount: number
  successData: PanData[]
  failedData: Array<{
    pan: string
    error: {
      type: string
      code: string
      message: string
    }
  }>
}

const sampleData: PanData = {
  "status": "VALID",
  "message": "PAN verified successfully",
  "reference_id": 21637861,
  "verification_id": "testverificationId",
  "name_provided": "JOHN SNOW",
  "pan": "LMNCD8010T",
  "registered_name": "JOHN SNOW",
  "name_pan_card": "JOHN SNOW",
  "first_name": "JOHN",
  "last_name": "SNOW",
  "type": "Individual or Person",
  "gender": "Male",
  "date_of_birth": "27-10-2004",
  "masked_aadhaar_number": "XXXXXXXX8848",
  "email": "a*c@gmail.com",
  "mobile_number": "99XXXXXX99",
  "aadhaar_linked": true,
  "address": {
    "full_address": "Quarter - A, Block - B Sample Area, ABC Street 700011 KOLKATA WEST BENGAL INDIA",
    "street": "ABC Street",
    "city": "KOLKATA",
    "state": "WEST BENGAL",
    "pincode": 700011,
    "country": "India"
  }
}

export default function Home() {
  const [jsonInput, setJsonInput] = useState('')
  const [panData, setPanData] = useState<PanData | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isProcessingCsv, setIsProcessingCsv] = useState(false)
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [panToVehicleMap, setPanToVehicleMap] = useState<Map<string, string>>(new Map())
  const batchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load sample data on mount
    setJsonInput(JSON.stringify(sampleData, null, 2))
    setPanData(sampleData)
  }, [])

  const handleGenerate = () => {
    try {
      const data = JSON.parse(jsonInput)
      if (!data.pan) {
        alert('PAN number is required')
        return
      }
      setPanData(data)
    } catch (error) {
      alert('Invalid JSON format: ' + (error as Error).message)
    }
  }

  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(sampleData, null, 2))
    setPanData(sampleData)
  }

  const handleDownload = async () => {
    if (!panData || !panData.pan) {
      alert('Please generate a PAN card first')
      return
    }

    setIsDownloading(true)
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default
      
      const panCardElement = document.getElementById('panCard')
      if (!panCardElement) {
        throw new Error('PAN card element not found')
      }

      // Wait a bit for QR code to render
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(panCardElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false
      })

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob')
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${panData.pan}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setIsDownloading(false)
      }, 'image/png')
    } catch (error) {
      console.error('Error generating PNG:', error)
      alert('Error generating PNG. Please try again.')
      setIsDownloading(false)
    }
  }

  const parseCsvFile = async (file: File): Promise<Map<string, string>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      const panToVehicleMap = new Map<string, string>()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          
          if (lines.length === 0) {
            resolve(panToVehicleMap)
            return
          }
          
          // Helper function to parse CSV line
          const parseCsvLine = (line: string): string[] => {
            const values: string[] = []
            let current = ''
            let inQuotes = false
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j]
              if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''))
                current = ''
              } else {
                current += char
              }
            }
            values.push(current.trim().replace(/^"|"$/g, '')) // Push last value
            return values
          }
          
          // Parse header row
          const headerLine = lines[0].toLowerCase()
          const hasHeader = headerLine.includes('pan') || headerLine.includes('vehicle')
          const headers = hasHeader ? parseCsvLine(lines[0]) : null
          
          // Find column indices
          let panIndex = 0
          let vehicleIndex = 2
          
          if (headers) {
            panIndex = headers.findIndex(h => h.toLowerCase().includes('pan'))
            vehicleIndex = headers.findIndex(h => h.toLowerCase().includes('vehicle'))
            
            // Defaults if not found
            if (panIndex === -1) panIndex = 0
            if (vehicleIndex === -1) vehicleIndex = 2
          }
          
          // Start from data rows (skip header if exists)
          const startIndex = hasHeader ? 1 : 0
          
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue
            
            const values = parseCsvLine(line)
            
            if (values.length > panIndex && values.length > vehicleIndex) {
              const pan = values[panIndex]?.trim().toUpperCase()
              const vehicleNumber = values[vehicleIndex]?.trim().toUpperCase()
              
              if (pan && vehicleNumber) {
                panToVehicleMap.set(pan, vehicleNumber)
              }
            }
          }
          
          resolve(panToVehicleMap)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read CSV file'))
      reader.readAsText(file)
    })
  }

  const handleCsvUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file')
      return
    }

    setIsProcessingCsv(true)
    try {
      // First, parse the CSV to get vehicle number mappings
      const vehicleMap = await parseCsvFile(csvFile)
      setPanToVehicleMap(vehicleMap)
      
      const formData = new FormData()
      formData.append('file', csvFile)

      // Use Next.js API route to proxy the request (avoids CORS issues)
      // Note: Large CSV files may take several minutes to process
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        const errorMessage = errorData.error || errorData.details || `API request failed: ${response.statusText}`
        
        if (response.status === 504 || response.status === 408 || errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('timed out')) {
          throw new Error(errorMessage || 'The request timed out. Large CSV files may take longer to process. Please try with a smaller file (50-100 records) or contact support.')
        }
        
        throw new Error(errorMessage)
      }

      const data: ApiResponse = await response.json()
      setApiResponse(data)

      if (data.success) {
        await generateBatchPngs(data, vehicleMap)
      } else {
        alert('No successful PAN verifications found. Please check the CSV file.')
      }
    } catch (error: any) {
      console.error('Error processing CSV:', error)
      
      // Check if it's a timeout error
      const isTimeout = error.name === 'TimeoutError' || 
                       error.name === 'AbortError' || 
                       error.message?.toLowerCase().includes('timeout') ||
                       error.message?.toLowerCase().includes('timed out')
      
      if (isTimeout) {
        alert('Request timed out. This usually happens with large CSV files.\n\nSuggested solutions:\n1. Split your CSV into smaller files (50-100 records each)\n2. Check your internet connection\n3. Try again - sometimes the server needs a moment\n4. Contact support if the issue persists')
      } else {
        alert('Error processing CSV: ' + (error as Error).message)
      }
    } finally {
      setIsProcessingCsv(false)
    }
  }

  const generateBatchPngs = async (apiResponse: ApiResponse, vehicleMap: Map<string, string>) => {
    if (!batchContainerRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      const panDataList = apiResponse.successData || []

      // Clear container and make it temporarily visible but off-screen for rendering
      batchContainerRef.current.innerHTML = ''
      batchContainerRef.current.style.position = 'fixed'
      batchContainerRef.current.style.left = '0'
      batchContainerRef.current.style.top = '0'
      batchContainerRef.current.style.width = '1179px'
      batchContainerRef.current.style.height = '978px'
      batchContainerRef.current.style.zIndex = '-1'
      batchContainerRef.current.style.visibility = 'visible'

      for (let i = 0; i < panDataList.length; i++) {
        const data = panDataList[i]
        if (!data.pan) continue

        // Create a temporary container for this PAN card
        const tempContainer = document.createElement('div')
        tempContainer.id = `panCard-${i}`
        tempContainer.style.position = 'absolute'
        tempContainer.style.left = '0'
        tempContainer.style.top = '0'
        tempContainer.style.width = '1179px'
        tempContainer.style.height = '978px'
        batchContainerRef.current.appendChild(tempContainer)

        // Render PanCard component data
        const panCardHTML = `
          <div class="pan-card" style="position: relative;">
            <div class="card-header">
              <div class="emblem-section">
                <img src="/images/ashokicon.png" alt="Emblem of India" class="emblem-image" />
              </div>
              <div class="title-section">
                <div class="pan-title">PAN CARD</div>
              </div>
            </div>
            <div class="card-content">
              <div class="detail-row">
                <span class="detail-label">Name</span>
                <span class="detail-colon">:</span>
                <span class="detail-value">${(data.name_pan_card || data.registered_name || data.name_provided || '-').toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Gender</span>
                <span class="detail-colon">:</span>
                <span class="detail-value">${(data.gender || '-').toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">DOB</span>
                <span class="detail-colon">:</span>
                <span class="detail-value">${data.date_of_birth || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pan Number</span>
                <span class="detail-colon">:</span>
                <span class="detail-value">${(data.pan || '-').toUpperCase()}</span>
              </div>
            </div>
            <hr class="hr-line" />
            <div class="card-footer">
              <div class="digilocker-section">
                <img src="/images/digiicon.png" alt="DigiLocker" class="digilocker-logo" />
              </div>
              <div class="qr-section">
                <img src="/images/qr.png" alt="QR Code" class="qr-code" />
                <div class="tap-to-zoom">Tap to Zoom</div>
              </div>
            </div>
          </div>
        `
        tempContainer.innerHTML = panCardHTML

        // Wait for images to load
        const images = tempContainer.querySelectorAll('img')
        const imagePromises = Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = reject
            setTimeout(() => resolve(), 5000) // Timeout after 5 seconds
          })
        })
        await Promise.all(imagePromises)
        await new Promise(resolve => setTimeout(resolve, 300))

        // Generate canvas
        const canvas = await html2canvas(tempContainer.querySelector('.pan-card') as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: false,
          width: 1179,
          height: 978
        })

        // Convert canvas to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else throw new Error('Failed to create blob')
          }, 'image/png')
        })

        // Use vehicle number as filename if available, otherwise use PAN number
        const pan = data.pan.toUpperCase()
        const vehicleNumber = vehicleMap.get(pan) || pan
        const fileName = `${vehicleNumber}.png`
        zip.file(fileName, blob)

        // Clean up
        tempContainer.remove()
      }

      // Hide container again
      batchContainerRef.current.style.visibility = 'hidden'
      batchContainerRef.current.style.position = 'absolute'
      batchContainerRef.current.style.left = '-9999px'

      // Create CSV with status information
      const csvRows: string[] = []
      // CSV Header
      csvRows.push('Vehicle Number,PAN Number,Status,Message,Name,Gender,Date of Birth')

      // Helper function to escape CSV values
      const escapeCsv = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }

      // Add successful records
      if (apiResponse.successData) {
        apiResponse.successData.forEach((data) => {
          const name = (data.name_pan_card || data.registered_name || data.name_provided || '-').toUpperCase()
          const pan = (data.pan || '-').toUpperCase()
          const vehicleNumber = vehicleMap.get(pan) || '-'
          const status = data.status || 'VALID'
          const message = data.message || 'PAN verified successfully'
          const gender = (data.gender || '-').toUpperCase()
          const dob = data.date_of_birth || '-'
          
          csvRows.push(`${escapeCsv(vehicleNumber)},${escapeCsv(pan)},${escapeCsv(status)},${escapeCsv(message)},${escapeCsv(name)},${escapeCsv(gender)},${escapeCsv(dob)}`)
        })
      }

      // Add failed records
      if (apiResponse.failedData) {
        apiResponse.failedData.forEach((failed) => {
          const pan = failed.pan.toUpperCase()
          const vehicleNumber = vehicleMap.get(pan) || '-'
          const status = 'INVALID'
          const message = failed.error?.message || 'Verification failed'
          
          csvRows.push(`${escapeCsv(vehicleNumber)},${escapeCsv(pan)},${escapeCsv(status)},${escapeCsv(message)},-,-,-`)
        })
      }

      // Add CSV to ZIP
      const csvContent = csvRows.join('\n')
      zip.file('pan-status-report.csv', csvContent)

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pan-cards-${new Date().getTime()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      const totalRecords = (apiResponse.successData?.length || 0) + (apiResponse.failedData?.length || 0)
      alert(`Successfully generated ${panDataList.length} PAN card images and status CSV, downloaded as ZIP file! Total records: ${totalRecords}`)
    } catch (error) {
      console.error('Error generating batch PNGs:', error)
      // Ensure container is hidden even on error
      if (batchContainerRef.current) {
        batchContainerRef.current.style.visibility = 'hidden'
        batchContainerRef.current.style.position = 'absolute'
        batchContainerRef.current.style.left = '-9999px'
      }
      alert('Error generating batch PNGs: ' + (error as Error).message)
    }
  }

  return (
    <div className="container">
      <h1>PAN Card Generator</h1>
      
      {/* CSV Upload Section */}
      <div className="csv-section">
        <h2>Bulk PAN Card Generation from CSV</h2>
        <div className="csv-upload-area">
          <input
            type="file"
            id="csvFileInput"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            style={{ marginBottom: '15px' }}
          />
          <button
            className="upload-btn"
            onClick={handleCsvUpload}
            disabled={isProcessingCsv || !csvFile}
          >
            {isProcessingCsv ? 'Processing CSV (this may take a few minutes)...' : 'Upload CSV and Generate ZIP'}
          </button>
          {apiResponse && (
            <div className="api-response">
              <p><strong>Total Records:</strong> {apiResponse.totalRecords}</p>
              <p><strong>Success:</strong> {apiResponse.successCount}</p>
              <p><strong>Failed:</strong> {apiResponse.failedCount}</p>
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="input-section">
          <h2>Enter PAN Card Data</h2>
          <textarea
            className="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON data here..."
          />
          <button className="generate-btn" onClick={handleGenerate}>
            Generate PAN Card
          </button>
          <button className="sample-btn" onClick={handleLoadSample}>
            Load Sample Data
          </button>
        </div>

        <div className="card-section">
          <div className="card-actions">
            <button
              className="download-btn"
              onClick={handleDownload}
              disabled={isDownloading || !panData}
            >
              {isDownloading ? 'Generating...' : 'Download as PNG'}
            </button>
          </div>
          <PanCard data={panData || undefined} />
        </div>
      </div>

      {/* Hidden container for batch processing */}
      <div
        ref={batchContainerRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '0',
          visibility: 'hidden'
        }}
      />
    </div>
  )
}

