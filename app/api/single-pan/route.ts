import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { pan } = body

        if (!pan) {
            return NextResponse.json(
                { error: 'Pan Number is required' },
                { status: 400 }
            )
        }

        // Forward to external API
        const response = await fetch('https://agentapp.chairbord.in/v1/api/cashfree/advance-single-pan', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ pan })
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
        console.error('Error in API route:', error)
        return NextResponse.json(
            { error: 'Failed: ' + (error as Error).message },
            { status: 500 }
        )
    }
}
