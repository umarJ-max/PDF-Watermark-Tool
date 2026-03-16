const { PDFDocument, rgb, degrees } = PDFLib;

let selectedFiles = [];
let watermarkImage = null;
let watermarkImageBytes = null;

// Elements
const pdfFileInput = document.getElementById('pdfFile');
const uploadLabel = document.querySelector('.upload-label');
const uploadText = document.getElementById('uploadText');
const uploadIcon = document.getElementById('uploadIcon');
const fileListContainer = document.getElementById('fileList');
const watermarkTextInput = document.getElementById('watermarkText');
const opacityInput = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const fontSizeInput = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const colorInput = document.getElementById('color');
const addWatermarkBtn = document.getElementById('addWatermark');
const statusDiv = document.getElementById('status');

// Image watermark elements
const imageFileInput = document.getElementById('imageFile');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');
const imageOpacityInput = document.getElementById('imageOpacity');
const imageOpacityValue = document.getElementById('imageOpacityValue');
const imageSizeInput = document.getElementById('imageSize');
const imageSizeValue = document.getElementById('imageSizeValue');
const imageOpacityGroup = document.getElementById('imageOpacityGroup');
const imageSizeGroup = document.getElementById('imageSizeGroup');

// Event Listeners
pdfFileInput.addEventListener('change', handleFileSelect);
opacityInput.addEventListener('input', (e) => {
    opacityValue.textContent = e.target.value;
});
fontSizeInput.addEventListener('input', (e) => {
    fontSizeValue.textContent = e.target.value;
});
addWatermarkBtn.addEventListener('click', addWatermarkToBatch);

// Image watermark listeners
imageFileInput.addEventListener('change', handleImageSelect);
removeImageBtn.addEventListener('click', removeWatermarkImage);
imageOpacityInput.addEventListener('input', (e) => {
    imageOpacityValue.textContent = e.target.value;
});
imageSizeInput.addEventListener('input', (e) => {
    imageSizeValue.textContent = e.target.value;
});

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
        reader.onload = async function(event) {
            watermarkImageBytes = event.target.result;
            previewImg.src = event.target.result;
            imagePreview.style.display = 'block';
            imageOpacityGroup.style.display = 'block';
            imageSizeGroup.style.display = 'block';
            console.log('Image loaded successfully');
        };
        reader.readAsDataURL(file);
    }
}

function removeWatermarkImage() {
    watermarkImage = null;
    watermarkImageBytes = null;
    imageFileInput.value = '';
    previewImg.src = '';
    imagePreview.style.display = 'none';
    imageOpacityGroup.style.display = 'none';
    imageSizeGroup.style.display = 'none';
    console.log('Image removed');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 0, b: 0 };
}

async function addWatermarkToBatch() {
    if (selectedFiles.length === 0) {
        console.log('No files to process');
        return;
    }

    const filesToProcess = [...selectedFiles];
    const totalFiles = filesToProcess.length;
    
    console.log('Starting batch processing for', totalFiles, 'files');
    console.log('Files to process:', filesToProcess.map(f => f.name));
    
    selectedFiles = [];
    pdfFileInput.value = '';
    updateUI();
    
    addWatermarkBtn.disabled = true;
    statusDiv.textContent = `Processing ${totalFiles} file(s)... Please wait`;
    statusDiv.className = 'processing';

    const watermarkText = watermarkTextInput.value.trim() || 'CONFIDENTIAL';
    const opacity = parseFloat(opacityInput.value);
    const fontSize = parseInt(fontSizeInput.value);
    const color = hexToRgb(colorInput.value);
    
    const imageOpacity = parseFloat(imageOpacityInput.value);
    const imageSize = parseInt(imageSizeInput.value);

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
            
            // Embed image if provided
            let embeddedImage = null;
            if (watermarkImageBytes) {
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
                
                // Add text watermark if provided
                if (watermarkText) {
                    page.drawText(watermarkText, {
                        x: width / 2 - (watermarkText.length * fontSize / 4),
                        y: height / 2,
                        size: fontSize,
                        color: rgb(color.r, color.g, color.b),
                        opacity: opacity,
                        rotate: degrees(45)
                    });
                }
                
                // Add image watermark if provided
                if (embeddedImage) {
                    const imgDims = embeddedImage.scale(imageSize / embeddedImage.width);
                    page.drawImage(embeddedImage, {
                        x: width / 2 - imgDims.width / 2,
                        y: height / 2 - imgDims.height / 2,
                        width: imgDims.width,
                        height: imgDims.height,
                        opacity: imageOpacity,
                        rotate: degrees(45)
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
