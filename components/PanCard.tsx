'use client'

import Image from 'next/image'

interface PanCardData {
  name_pan_card?: string
  registered_name?: string
  name_provided?: string
  gender?: string
  date_of_birth?: string
  pan?: string
}

interface PanCardProps {
  data?: PanCardData  // Made optional to allow default data
}

export default function PanCard({ data }: PanCardProps) {
  // Default data from OCR extraction (fallback if no prop provided)
  const defaultData: PanCardData = {
    name_provided: 'AMAN KUMAR RAJAK',  // Using name_provided as it fits the priority chain
    gender: 'MALE',
    date_of_birth: '28-08-2001',
    pan: 'EMEPR1840H'
  }

  // Use provided data or fallback to default
  const effectiveData = data || defaultData

  // Extract data from JSON
  const name = (effectiveData.name_pan_card || effectiveData.registered_name || effectiveData.name_provided || '-').toUpperCase()
  const gender = (effectiveData.gender || '-').toUpperCase()
  const dob = effectiveData.date_of_birth || '-'
  const pan = (effectiveData.pan || '-').toUpperCase()

  return (
    <div className="pan-card" id="panCard">
      <div className="card-header">
        <div className="emblem-section">
          <Image
            src="/images/ashokicon.png"
            alt="Emblem of India"
            width={350}
            height={350}
            className="emblem-image"
            priority
          />
        </div>
        <div className="title-section">
          <div className="pan-title">PAN CARD</div>
        </div>
      </div>
      
      <div className="card-content">
        {[
          { label: 'Name', value: name },
          { label: 'Gender', value: gender },
          { label: 'DOB', value: dob },
          { label: 'Pan Number', value: pan }
        ].map((item) => (
          <div className="detail-row" key={item.label}>
            <span className="detail-label">{item.label}</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{item.value}</span>
          </div>
        ))}
      </div>
      
      <hr className="hr-line" />
      
      <div className="card-footer">
        <div className="digilocker-section">
          <Image
            src="/images/digiicon.png"
            alt="DigiLocker"
            width={360}
            height={200}
            className="digilocker-logo"
            priority
          />
        </div>
        <div className="qr-section">
          <Image
            src="/images/qr.png"
            alt="QR Code"
            width={280}
            height={280}
            className="qr-code"
            priority
          />
          <div className="tap-to-zoom">Tap to Zoom</div>
        </div>
      </div>
    </div>
  )
}