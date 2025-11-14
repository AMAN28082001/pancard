// Sample JSON data
const sampleData = {
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
};

let currentData = null;

// DOM Elements
const jsonInput = document.getElementById('jsonInput');
const generateBtn = document.getElementById('generateBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const downloadBtn = document.getElementById('downloadBtn');
const panCard = document.getElementById('panCard');
const editForm = document.getElementById('editForm');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Generate dummy QR code (non-functional)
function generateDummyQR() {
    const qrCodeDiv = document.getElementById('qrCode');
    qrCodeDiv.innerHTML = '';
    
    // Generate a dummy QR code with random data (won't be scannable)
    const dummyData = `PAN:${currentData?.pan || 'XXXXX0000X'}|${Date.now()}|DUMMY`;
    
    QRCode.toCanvas(qrCodeDiv, dummyData, {
        width: 100,
        height: 100,
        margin: 1,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, function (error) {
        if (error) {
            console.error('QR Code generation error:', error);
            // Fallback: create a simple black square pattern
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            
            // Create a simple pattern
            ctx.fillStyle = '#000';
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    if ((i + j) % 2 === 0) {
                        ctx.fillRect(i * 10, j * 10, 10, 10);
                    }
                }
            }
            qrCodeDiv.appendChild(canvas);
        }
    });
}

// Update PAN card with data
function updatePanCard(data) {
    currentData = data;
    
    // Update card fields - format exactly as shown in image
    const name = (data.name_pan_card || data.registered_name || data.name_provided || '-').toUpperCase();
    const gender = (data.gender || '-').toUpperCase();
    const dob = data.date_of_birth || '-';
    const pan = (data.pan || '-').toUpperCase();
    
    document.getElementById('cardName').textContent = name;
    document.getElementById('cardGender').textContent = gender;
    document.getElementById('cardDOB').textContent = dob;
    document.getElementById('cardPan').textContent = pan;
    
    // Generate QR code
    generateDummyQR();
}

// Parse and validate JSON
function parseJSON(input) {
    try {
        const data = JSON.parse(input);
        if (!data.pan) {
            throw new Error('PAN number is required');
        }
        return data;
    } catch (error) {
        alert('Invalid JSON format: ' + error.message);
        return null;
    }
}

// Generate PAN card from JSON input
generateBtn.addEventListener('click', () => {
    const input = jsonInput.value.trim();
    if (!input) {
        alert('Please enter JSON data');
        return;
    }
    
    const data = parseJSON(input);
    if (data) {
        updatePanCard(data);
    }
});

// Load sample data
loadSampleBtn.addEventListener('click', () => {
    jsonInput.value = JSON.stringify(sampleData, null, 2);
    updatePanCard(sampleData);
});

// Download as PNG
downloadBtn.addEventListener('click', async () => {
    if (!currentData) {
        alert('Please generate a PAN card first');
        return;
    }
    
    try {
        // Show loading state
        downloadBtn.textContent = 'Generating...';
        downloadBtn.disabled = true;
        
        // Use html2canvas to capture the card
        const canvas = await html2canvas(panCard, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality
            logging: false,
            useCORS: true,
            allowTaint: false
        });
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `PAN_Card_${currentData.pan || 'card'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // Reset button
            downloadBtn.textContent = 'Download as PNG';
            downloadBtn.disabled = false;
        }, 'image/png');
    } catch (error) {
        console.error('Error generating PNG:', error);
        alert('Error generating PNG. Please try again.');
        downloadBtn.textContent = 'Download as PNG';
        downloadBtn.disabled = false;
    }
});

// Edit functionality
panCard.addEventListener('click', () => {
    if (!currentData) return;
    
    // Populate edit form
    document.getElementById('editName').value = currentData.name_pan_card || currentData.registered_name || currentData.name_provided || '';
    document.getElementById('editGender').value = currentData.gender || 'Male';
    document.getElementById('editDOB').value = currentData.date_of_birth || '';
    document.getElementById('editPan').value = currentData.pan || '';
    
    // Show edit form
    editForm.classList.remove('hidden');
    editForm.scrollIntoView({ behavior: 'smooth' });
});

// Save changes
saveBtn.addEventListener('click', () => {
    if (!currentData) return;
    
    // Update current data
    currentData.name_pan_card = document.getElementById('editName').value;
    currentData.registered_name = document.getElementById('editName').value;
    currentData.name_provided = document.getElementById('editName').value;
    currentData.gender = document.getElementById('editGender').value;
    currentData.date_of_birth = document.getElementById('editDOB').value;
    currentData.pan = document.getElementById('editPan').value;
    
    // Update card
    updatePanCard(currentData);
    
    // Update JSON input
    jsonInput.value = JSON.stringify(currentData, null, 2);
    
    // Hide form
    editForm.classList.add('hidden');
});

// Cancel edit
cancelBtn.addEventListener('click', () => {
    editForm.classList.add('hidden');
});

// Initialize with sample data on load
window.addEventListener('DOMContentLoaded', () => {
    jsonInput.value = JSON.stringify(sampleData, null, 2);
    updatePanCard(sampleData);
});

