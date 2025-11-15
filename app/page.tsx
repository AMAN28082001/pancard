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
  const [singlePanInput, setSinglePanInput] = useState('')
  const [singlePanData, setSinglePanData] = useState<PanData | null>(null)
  const [isDownloadingSingle, setIsDownloadingSingle] = useState(false)
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

  const downloadPanCard = async (data: PanData, containerId: string, setIsDownloading: (value: boolean) => void) => {
    if (!data || !data.pan) {
      alert('PAN number is required')
      return
    }

    setIsDownloading(true)
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default

      const panCardElement = document.getElementById(containerId)
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
        link.download = `${data.pan?.toUpperCase() || 'pan-card'}.png`
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

  const downloadSinglePan = async (panInfo: PanData) => {
    if (!panInfo || !panInfo.pan) {
      alert('Invalid PAN data')
      return
    }

    try {
      const html2canvas = (await import('html2canvas')).default

      // Create offscreen container
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'fixed'
      tempContainer.style.left = '0'
      tempContainer.style.top = '0'
      tempContainer.style.width = '1179px'
      tempContainer.style.height = '978px'
      tempContainer.style.zIndex = '-1'
      tempContainer.style.visibility = 'visible'

      document.body.appendChild(tempContainer)

      // Insert SAME HTML template used in bulk export
      tempContainer.innerHTML = `
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
            <span class="detail-value">${(panInfo.name_pan_card || panInfo.registered_name || panInfo.name_provided || '-').toUpperCase()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Gender</span>
            <span class="detail-colon">:</span>
            <span class="detail-value">${(panInfo.gender || '-').toUpperCase()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">DOB</span>
            <span class="detail-colon">:</span>
            <span class="detail-value">${panInfo.date_of_birth || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Pan Number</span>
            <span class="detail-colon">:</span>
            <span class="detail-value">${(panInfo.pan || '-').toUpperCase()}</span>
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

      // Wait for all images to load
      const imgs = tempContainer.querySelectorAll('img')
      await Promise.all(
        Array.from(imgs).map(img => {
          if (img.complete) return Promise.resolve()
          return new Promise(res => {
            img.onload = res
            img.onerror = res
          })
        })
      )

      await new Promise(res => setTimeout(res, 300))

      const cardElement = tempContainer.querySelector(".pan-card") as HTMLElement

      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        width: 1179,
        height: 978
      })

      canvas.toBlob(blob => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${panInfo && panInfo.pan && panInfo.pan.toUpperCase()}.png`
        link.click()
        URL.revokeObjectURL(url)
      })

      tempContainer.remove()
    } catch (err) {
      console.error("Single PAN Download Error:", err)
      alert("Error generating PNG")
    }
  }


  const handleDownload = async () => {
    await downloadPanCard(panData!, 'panCard', setIsDownloading)
  }

  const handleSinglePanSearch1 = async () => {
    if (!singlePanInput.trim()) {
      alert('Please enter a PAN number or name')
      return
    }

    setIsDownloadingSingle(true)
    try {

      const response = await fetch('/api/single-pan', {
        method: 'POST',
        body: JSON.stringify(singlePanInput)
      })
      const data: ApiResponse = await response.json()
      await downloadPanCard(data, 'panCard', setIsDownloadingSingle)
      // // Search in previously processed CSV data if available
      if (apiResponse?.successData) {
        const found = apiResponse.successData.find(
          (item) =>
            item.pan?.toUpperCase() === singlePanInput.trim().toUpperCase() ||
            item.name_pan_card?.toUpperCase().includes(singlePanInput.trim().toUpperCase()) ||
            item.registered_name?.toUpperCase().includes(singlePanInput.trim().toUpperCase()) ||
            item.name_provided?.toUpperCase().includes(singlePanInput.trim().toUpperCase())
        )

        if (found) {
          setSinglePanData(found)
          // Wait for state to update and DOM to render
          await new Promise(resolve => setTimeout(resolve, 300))
          await downloadPanCard(found, 'singlePanCard', setIsDownloadingSingle)
          return
        }
      }

      // If not found in CSV data, check if it's in the current panData
      if (panData && (panData.pan?.toUpperCase() === singlePanInput.trim().toUpperCase() ||
        panData.name_pan_card?.toUpperCase().includes(singlePanInput.trim().toUpperCase()) ||
        panData.registered_name?.toUpperCase().includes(singlePanInput.trim().toUpperCase()))) {
        await downloadPanCard(panData, 'panCard', setIsDownloadingSingle)
        return
      }

      // alert('PAN number or name not found. Please ensure you have uploaded a CSV file with this PAN, or use the JSON input section to enter PAN data first.')
    } catch (error) {
      console.error('Error searching PAN:', error)
      alert('Error searching for PAN: ' + (error as Error).message)
    } finally {
      setIsDownloadingSingle(false)
    }
  }

  const handleSinglePanSearch = async () => {
    if (!singlePanInput.trim()) {
      alert('Please enter a PAN number')
      return
    }

    setIsDownloadingSingle(true)

    try {
      const response = await fetch('/api/single-pan', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pan: singlePanInput })
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      const panInfo = result.data
      setSinglePanData(panInfo)

      await downloadSinglePan(panInfo)

    } catch (err) {
      alert("Error: " + (err as any).message)
    } finally {
      setIsDownloadingSingle(false)
    }
  }




  const handleCsvUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file')
      return
    }

    setIsProcessingCsv(true)
    try {
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

        if (response.status === 504 || errorMessage.includes('timeout')) {
          throw new Error('The request timed out. The CSV file may be too large or the API is taking too long. Please try with a smaller file or try again later.')
        }

        throw new Error(errorMessage)
      }

      const data: ApiResponse = await response.json()
      setApiResponse(data)

      if (data.success) {
        await generateBatchPngs(data)
      } else {
        alert('No successful PAN verifications found. Please check the CSV file.')
      }
    } catch (error: any) {
      console.error('Error processing CSV:', error)
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        alert('Request timed out. The CSV file may be too large or the API is taking too long. Please try with a smaller file or try again later.')
      } else {
        alert('Error processing CSV: ' + (error as Error).message)
      }
    } finally {
      setIsProcessingCsv(false)
    }
  }

  const generateBatchPngs = async (apiResponse: ApiResponse) => {
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

        zip.file(`${data.pan.toUpperCase()}.png`, blob)

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
      csvRows.push('PAN Number,Status,Message,Name,Gender,Date of Birth')

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
          const status = data.status || 'VALID'
          const message = data.message || 'PAN verified successfully'
          const gender = (data.gender || '-').toUpperCase()
          const dob = data.date_of_birth || '-'

          csvRows.push(`${escapeCsv(pan)},${escapeCsv(status)},${escapeCsv(message)},${escapeCsv(name)},${escapeCsv(gender)},${escapeCsv(dob)}`)
        })
      }

      // Add failed records
      if (apiResponse.failedData) {
        apiResponse.failedData.forEach((failed) => {
          const pan = failed.pan.toUpperCase()
          const status = 'INVALID'
          const message = failed.error?.message || 'Verification failed'

          csvRows.push(`${escapeCsv(pan)},${escapeCsv(status)},${escapeCsv(message)},-,-,-`)
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

      {/* Single PAN Download Section */}
      <div className="csv-section">
        <h2>Download Single PAN Card</h2>
        <div className="csv-upload-area">
          <input
            type="text"
            placeholder="Enter PAN number or name to search"
            value={singlePanInput}
            onChange={(e) => setSinglePanInput(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
              border: '2px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSinglePanSearch()
              }
            }}
          />
          <button
            className="upload-btn"
            onClick={handleSinglePanSearch}
            disabled={isDownloadingSingle || !singlePanInput.trim()}
          >
            {isDownloadingSingle ? 'Generating...' : 'Search and Download'}
          </button>
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Note: Search for a PAN from uploaded CSV data or use the JSON input section below to enter PAN data first.
          </p>
          {singlePanData && (
            <div style={{ marginTop: '15px', padding: '10px', background: '#f0f9ff', borderRadius: '5px' }}>
              <p><strong>Found:</strong> {singlePanData.pan}</p>
              <p><strong>Name:</strong> {singlePanData.name_pan_card || singlePanData.registered_name || singlePanData.name_provided}</p>
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

      {/* Single PAN Card Preview (Hidden, used for download) */}
      {singlePanData && (
        <div style={{ position: 'absolute', left: '-9999px', top: '0', visibility: 'hidden', width: '1179px', height: '978px' }}>
          <PanCard data={singlePanData} cardId="singlePanCard" />
        </div>
      )}

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

