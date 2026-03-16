const { PDFDocument, rgb, degrees } = PDFLib;

let selectedFiles = [];
let watermarkImageBytes = null;
let watermarkImageElement = null;

// Elements
const pdfFileInput = document.getElementById('pdfFile');
const uploadLabel = document.querySelector('.upload-label');
const uploadText = document.getElementById('uploadText');
const fileListContainer = document.getElementById('fileList');
const addWatermarkBtn = document.getElementById('addWatermark');
const statusDiv = document.getElementById('status');

// Preview
const livePreview = document.getElementById('livePreview');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

// Watermark type
const watermarkTypeRadios = document.querySelectorAll('input[name="watermarkType"]');
const textSection = document.getElementById('textSection');
const imageSection = document.getElementById('imageSection');

// Text elements
const watermarkTextInput = document.getElementById('watermarkText');
const opacityInput = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const fontSizeInput = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const colorInput = document.getElementById('color');
const textPositionSelect = document.getElementById('textPosition');
const textRotationInput = document.getElementById('textRotation');
const textRotationValue = document.getElementById('textRotationValue');

// Image elements
const imageFileInput = document.getElementById('imageFile');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');
const imageOpacityInput = document.getElementById('imageOpacity');
const imageOpacityValue = document.getElementById('imageOpacityValue');
const imageSizeInput = document.getElementById('imageSize');
const imageSizeValue = document.getElementById('imageSizeValue');
const imageControls = document.getElementById('imageControls');
const imagePositionSelect = document.getElementById('imagePosition');
const imageRotationInput = document.getElementById('imageRotation');
const imageRotationValue = document.getElementById('imageRotationValue');

// Event Listeners
pdfFileInput.addEventListener('change', handleFileSelect);
addWatermarkBtn.addEventListener('click', addWatermarkToBatch);

// Watermark type change
watermarkTypeRadios.forEach(radio => {
    radio.addEventListener('change', handleWatermarkTypeChange);
});

// Text controls
opacityInput.addEventListener('input', (e) => {
    opacityValue.textContent = e.target.value;
    updatePreview();
});
fontSizeInput.addEventListener('input', (e) => {
    fontSizeValue.textContent = e.target.value;
    updatePreview();
});
colorInput.addEventListener('input', updatePreview);
textPositionSelect.addEventListener('change', updatePreview);
textRotationInput.addEventListener('input', (e) => {
    textRotationValue.textContent = e.target.value;
    updatePreview();
});
watermarkTextInput.addEventListener('input', updatePreview);

// Image controls
imageFileInput.addEventListener('change', handleImageSelect);
removeImageBtn.addEventListener('click', removeWatermarkImage);
imageOpacityInput.addEventListener('input', (e) => {
    imageOpacityValue.textContent = e.target.value;
    updatePreview();
});
imageSizeInput.addEventListener('input', (e) => {
    imageSizeValue.textContent = e.target.value;
    updatePreview();
});
imagePositionSelect.addEventListener('change', updatePreview);
imageRotationInput.addEventListener('input', (e) => {
    imageRotationValue.textContent = e.target.value;
    updatePreview();
});

function setTextRotation(angle) {
    textRotationInput.value = angle;
    textRotationValue.textContent = angle;
}

function setImageRotation(angle) {
    imageRotationInput.value = angle;
    imageRotationValue.textContent = angle;
}

function handleWatermarkTypeChange(e) {
    const selectedType = e.target.value;
    
    // Hide all sections first
    textSection.style.display = 'none';
    imageSection.style.display = 'none';
    
    // Show relevant sections
    if (selectedType === 'text') {
        textSection.style.display = 'block';
    } else if (selectedType === 'image') {
        imageSection.style.display = 'block';
    } else if (selectedType === 'both') {
        textSection.style.display = 'block';
        imageSection.style.display = 'block';
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    
    console.log('Files selected:', files.length);
    
    if (files.length > 0) {
        selectedFiles = [...selectedFiles, ...files];
        console.log('Total files in queue:', selectedFiles.length);
        updateUI();
        statusDiv.textContent = '';
        statusDiv.className = '';
    }
}

function updateUI() {
    const fileCount = selectedFiles.length;
    
    // Update upload box
    if (fileCount > 0) {
        uploadLabel.classList.add('has-files');
        uploadText.textContent = `${fileCount} file(s) selected`;
        addWatermarkBtn.disabled = false;
    } else {
        uploadLabel.classList.remove('has-files');
        uploadText.textContent = 'Drag & Drop multiple PDFs here';
        addWatermarkBtn.disabled = true;
    }
    
    // Update file list
    if (fileCount > 0) {
        fileListContainer.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <svg class="file-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span class="file-name">${file.name}</span>
                </div>
                <button class="remove-btn" onclick="removeFile(${index})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            fileListContainer.appendChild(fileItem);
        });
    } else {
        fileListContainer.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No PDFs uploaded yet. Add files on the left to start a batch.</p>
            </div>
        `;
    }
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateUI();
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
        console.log('Image selected:', file.name);
        
        const reader = new FileReader();
        reader.onload = function(event) {
            watermarkImageBytes = event.target.result;
            previewImg.src = event.target.result;
            imagePreview.style.display = 'block';
            imageControls.style.display = 'block';
            
            // Load image for preview
            watermarkImageElement = new Image();
            watermarkImageElement.onload = function() {
                console.log('Image loaded for preview');
                updatePreview();
            };
            watermarkImageElement.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function removeWatermarkImage() {
    watermarkImageBytes = null;
    watermarkImageElement = null;
    imageFileInput.value = '';
    previewImg.src = '';
    imagePreview.style.display = 'none';
    imageControls.style.display = 'none';
    console.log('Image removed');
    updatePreview();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 0, b: 0 };
}

function calculatePosition(pageWidth, pageHeight, contentWidth, contentHeight, position) {
    const margin = 50;
    
    switch(position) {
        case 'center':
            return {
                x: pageWidth / 2 - contentWidth / 2,
                y: pageHeight / 2 - contentHeight / 2
            };
        case 'top-left':
            return { x: margin, y: pageHeight - margin - contentHeight };
        case 'top-right':
            return { x: pageWidth - margin - contentWidth, y: pageHeight - margin - contentHeight };
        case 'bottom-left':
            return { x: margin, y: margin };
        case 'bottom-right':
            return { x: pageWidth - margin - contentWidth, y: margin };
        case 'top-center':
            return { x: pageWidth / 2 - contentWidth / 2, y: pageHeight - margin - contentHeight };
        case 'bottom-center':
            return { x: pageWidth / 2 - contentWidth / 2, y: margin };
        default:
            return { x: pageWidth / 2 - contentWidth / 2, y: pageHeight / 2 - contentHeight / 2 };
    }
}

function updatePreview() {
    const selectedType = document.querySelector('input[name="watermarkType"]:checked').value;
    const watermarkText = watermarkTextInput.value.trim();
    
    // Show preview only if there's something to show
    if ((selectedType === 'text' && watermarkText) || 
        (selectedType === 'image' && watermarkImageElement) ||
        (selectedType === 'both' && (watermarkText || watermarkImageElement))) {
        livePreview.style.display = 'block';
    } else {
        livePreview.style.display = 'none';
        return;
    }
    
    const canvas = previewCanvas;
    const ctx = previewCtx;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    // Draw sample document lines
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    for (let i = 40; i < height - 40; i += 20) {
        ctx.beginPath();
        ctx.moveTo(40, i);
        ctx.lineTo(width - 40, i);
        ctx.stroke();
    }
    
    ctx.save();
    
    // Draw text watermark
    if ((selectedType === 'text' || selectedType === 'both') && watermarkText) {
        const fontSize = parseInt(fontSizeInput.value) * 0.5; // Scale for preview
        const opacity = parseFloat(opacityInput.value);
        const color = colorInput.value;
        const position = textPositionSelect.value;
        const rotation = parseInt(textRotationInput.value);
        
        ctx.font = `${fontSize}px Arial`;
        const textWidth = ctx.measureText(watermarkText).width;
        const textHeight = fontSize;
        
        const pos = calculatePosition(width, height, textWidth, textHeight, position);
        
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.translate(pos.x + textWidth / 2, pos.y + textHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.fillText(watermarkText, -textWidth / 2, textHeight / 4);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    // Draw image watermark
    if ((selectedType === 'image' || selectedType === 'both') && watermarkImageElement) {
        const imageSize = parseInt(imageSizeInput.value) * 0.5; // Scale for preview
        const imageOpacity = parseFloat(imageOpacityInput.value);
        const position = imagePositionSelect.value;
        const rotation = parseInt(imageRotationInput.value);
        
        const scale = imageSize / watermarkImageElement.width;
        const imgWidth = watermarkImageElement.width * scale;
        const imgHeight = watermarkImageElement.height * scale;
        
        const pos = calculatePosition(width, height, imgWidth, imgHeight, position);
        
        ctx.globalAlpha = imageOpacity;
        ctx.translate(pos.x + imgWidth / 2, pos.y + imgHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(watermarkImageElement, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    ctx.restore();
}

async function addWatermarkToBatch() {
    if (selectedFiles.length === 0) {
        console.log('No files to process');
        return;
    }

    const selectedType = document.querySelector('input[name="watermarkType"]:checked').value;
    const watermarkText = watermarkTextInput.value.trim();
    
    // Validation
    if (selectedType === 'text' && !watermarkText) {
        statusDiv.textContent = 'Please enter watermark text';
        statusDiv.className = 'error';
        return;
    }
    
    if ((selectedType === 'image' || selectedType === 'both') && !watermarkImageBytes) {
        statusDiv.textContent = 'Please upload an image';
        statusDiv.className = 'error';
        return;
    }

    const filesToProcess = [...selectedFiles];
    const totalFiles = filesToProcess.length;
    
    console.log('Starting batch processing for', totalFiles, 'files');
    console.log('Watermark type:', selectedType);
    
    selectedFiles = [];
    pdfFileInput.value = '';
    updateUI();
    
    addWatermarkBtn.disabled = true;
    statusDiv.textContent = `Processing ${totalFiles} file(s)... Please wait`;
    statusDiv.className = 'processing';

    const opacity = parseFloat(opacityInput.value);
    const fontSize = parseInt(fontSizeInput.value);
    const color = hexToRgb(colorInput.value);
    const textPosition = textPositionSelect.value;
    const textRotation = parseInt(textRotationInput.value);
    
    const imageOpacity = parseFloat(imageOpacityInput.value);
    const imageSize = parseInt(imageSizeInput.value);
    const imagePosition = imagePositionSelect.value;
    const imageRotation = parseInt(imageRotationInput.value);

    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < totalFiles; i++) {
        const file = filesToProcess[i];
        console.log(`Processing file ${i + 1}/${totalFiles}: ${file.name}`);
        
        try {
            statusDiv.textContent = `Processing ${i + 1}/${totalFiles}: ${file.name}`;
            
            const arrayBuffer = await file.arrayBuffer();
            console.log(`Loaded ${file.name}, size: ${arrayBuffer.byteLength} bytes`);
            
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();
            console.log(`PDF has ${pages.length} pages`);
            
            // Embed image if needed
            let embeddedImage = null;
            if ((selectedType === 'image' || selectedType === 'both') && watermarkImageBytes) {
                try {
                    if (watermarkImageBytes.startsWith('data:image/png')) {
                        const pngImageBytes = await fetch(watermarkImageBytes).then(res => res.arrayBuffer());
                        embeddedImage = await pdfDoc.embedPng(pngImageBytes);
                    } else if (watermarkImageBytes.startsWith('data:image/jpeg') || watermarkImageBytes.startsWith('data:image/jpg')) {
                        const jpgImageBytes = await fetch(watermarkImageBytes).then(res => res.arrayBuffer());
                        embeddedImage = await pdfDoc.embedJpg(jpgImageBytes);
                    }
                    console.log('Image embedded successfully');
                } catch (imgError) {
                    console.error('Error embedding image:', imgError);
                }
            }
            
            pages.forEach(page => {
                const { width, height } = page.getSize();
                
                // Add text watermark if needed
                if ((selectedType === 'text' || selectedType === 'both') && watermarkText) {
                    const textWidth = watermarkText.length * fontSize * 0.6;
                    const textHeight = fontSize;
                    const textPos = calculatePosition(width, height, textWidth, textHeight, textPosition);
                    
                    page.drawText(watermarkText, {
                        x: textPos.x,
                        y: textPos.y,
                        size: fontSize,
                        color: rgb(color.r, color.g, color.b),
                        opacity: opacity,
                        rotate: degrees(textRotation)
                    });
                }
                
                // Add image watermark if needed
                if ((selectedType === 'image' || selectedType === 'both') && embeddedImage) {
                    const imgDims = embeddedImage.scale(imageSize / embeddedImage.width);
                    const imgPos = calculatePosition(width, height, imgDims.width, imgDims.height, imagePosition);
                    
                    page.drawImage(embeddedImage, {
                        x: imgPos.x,
                        y: imgPos.y,
                        width: imgDims.width,
                        height: imgDims.height,
                        opacity: imageOpacity,
                        rotate: degrees(imageRotation)
                    });
                }
            });

            const pdfBytes = await pdfDoc.save();
            console.log(`Saved ${file.name}, size: ${pdfBytes.length} bytes`);
            
            downloadPDF(pdfBytes, file.name);
            processedCount++;
            console.log(`Successfully processed ${file.name}`);
            
            if (i < totalFiles - 1) {
                console.log('Waiting 800ms before next file...');
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        } catch (error) {
            errorCount++;
            console.error(`Error processing ${file.name}:`, error);
            statusDiv.textContent = `Error on file ${i + 1}: ${file.name}. Continuing...`;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log(`Batch complete: ${processedCount} succeeded, ${errorCount} failed`);
    statusDiv.textContent = `Successfully processed ${processedCount} of ${totalFiles} file(s)!`;
    statusDiv.className = 'success';
    addWatermarkBtn.disabled = selectedFiles.length === 0;
}

function downloadPDF(pdfBytes, originalName) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const newName = originalName.replace('.pdf', '_watermarked.pdf');
    a.download = newName;
    console.log(`Triggering download: ${newName}`);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Cleaned up download: ${newName}`);
    }, 100);
}
