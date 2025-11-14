# PAN Card Generator

A Next.js application to generate PAN cards from JSON data and download them as PNG images.

## Features

- Generate PAN cards from JSON data
- Exact format matching official PAN card design
- Download as PNG with PAN number as filename
- Sample data included for testing
- Responsive design

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Usage

1. Paste your JSON data in the input field or click "Load Sample Data"
2. Click "Generate PAN Card" to display the card
3. Click "Download as PNG" to save the card as a PNG file
4. The downloaded file will be named with the PAN number (e.g., `LMNCD8010T.png`)

## JSON Format

The application expects JSON data in the following format:

```json
{
  "status": "VALID",
  "message": "PAN verified successfully",
  "pan": "LMNCD8010T",
  "name_pan_card": "JOHN SNOW",
  "registered_name": "JOHN SNOW",
  "name_provided": "JOHN SNOW",
  "gender": "Male",
  "date_of_birth": "27-10-2004"
}
```

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- html2canvas
- qrcode

## Project Structure

```
pancard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── PanCard.tsx
├── package.json
├── next.config.js
└── tsconfig.json
```

# pancard
