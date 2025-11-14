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

    // Forward the request to the external API
    const response = await fetch('https://agentapp.chairbord.in/v1/api/cashfree/advance-pan-verification', {
      method: 'POST',
      body: forwardFormData,
      headers: {
        // Don't set Content-Type header, let the browser set it with boundary for FormData
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `API request failed: ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in upload-csv API route:', error)
    return NextResponse.json(
      { error: 'Failed to process CSV: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

