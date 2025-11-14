import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Create a new FormData to forward to the external API
    const forwardFormData = new FormData()
    forwardFormData.append('file', file)

    // Forward the request to the external API with better error handling
    let response: Response
    try {
      response = await fetch('https://agentapp.chairbord.in/v1/api/cashfree/advance-pan-verification', {
        method: 'POST',
        body: forwardFormData,
        headers: {
          // Don't set Content-Type header, let the browser set it with boundary for FormData
        },
      })
    } catch (fetchError: any) {
      // Handle fetch errors specifically
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        return NextResponse.json(
          { error: 'The external API request timed out. The CSV file may be too large. Please try splitting it into smaller files.' },
          { status: 504 }
        )
      }
      throw fetchError
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      return NextResponse.json(
        { error: `API request failed: ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in upload-csv API route:', error)
    
    // Provide more specific error messages
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timed out. Please try with a smaller CSV file or contact support.' },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process CSV: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
}

