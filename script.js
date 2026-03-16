const { PDFDocument, rgb, degrees } = PDFLib;

let selectedFiles = [];
let watermarkImageBytes = null;
let watermarkImageElement = null;
let currentMode = 'text';

// Elements
const pdfFileInput = document.getElementById('pdfFile');
const uploadBoxInner = document.getElementById('uploadBoxInner');
const uploadMainText = document.getElementById('uploadMainText');
const fileListInline = document.getElementById('fileListInline');
const fileQueue = document.getElementById('fileQueue');
const fileCount = document.getElementById('fileCount');
const addWatermarkBtn = document.getElementById('addWatermark');
const statusDiv = document.getElementById('status');

// Mode tabs
const modeTabs = document.querySelectorAll('.mode-tab');
const textControls = document.getElementById('textControls');
const imageControls = document.getElementById('imageControls');

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
const imageUploadArea = document.getElementById('imageUploadArea');
const imageLoadedArea = document.getElementById('imageLoadedArea');
const previewImg = document.getElementById('previewImg');
const imageName = document.getElementById('imageName');
const removeImageBtn = document.getElementById('removeImage');
const imageOpacityInput = document.getElementById('imageOpacity');
const imageOpacityValue = document.getElementById('imageOpacityValue');
const imageSizeInput = document.getElementById('imageSize');
const imageSizeValue = document.getElementById('imageSizeValue');
const imagePositionSelect = document.getElementById('imagePosition');
const imageRotationInput = document.getElementById('imageRotation');
const imageRotationValue = document.getElementById('imageRotationValue');

// Preview
const previewCanvas = document.getElementById('previewCanvas');
const previewCanvasWrap = document.getElementById('previewCanvasWrap');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const previewCtx = previewCanvas.getContext('2d');

// Event Listeners
pdfFileInput.addEventListener('change', handleFileSelect);
addWatermarkBtn.addEventListener('click', addWatermarkToBatch);

// Mode switching
modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentMode = tab.dataset.mode;
        
        if (currentMode === 'text') {
            textControls.style.display = 'flex';
            imageControls.style.display = 'none';
        } else {
            textControls.style.display = 'none';
            imageControls.style.display = 'flex';
        }
        updatePreview();
    });
});

// Text controls
watermarkTextInput.addEventListener('input', updatePreview);
opacityInput.addEventListener('input', (e) => {
    opacityValue.textContent = parseFloat(e.target.value).toFixed(1);
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

// Image controls
imageFileInput.addEventListener('change', handleImageSelect);
removeImageBtn.addEventListener('click', removeWatermarkImage);
imageOpacityInput.addEventListener('input', (e) => {
    imageOpacityValue.textContent = parseFloat(e.target.value).toFixed(1);
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

window.setTextRotation = function(angle) {
    textRotationInput.value = angle;
    textRotationValue.textContent = angle;
    updatePreview();
};

window.setImageRotation = function(angle) {
    imageRotationInput.value = angle;
    imageRotationValue.textContent = angle;
    updatePreview();
};

function handleFileSelect(e) {
    const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    
    if (files.length > 0) {
        selectedFiles = [...selectedFiles, ...files];
        updateFileUI();
        statusDiv.textContent = '';
        statusDiv.className = '';
    }
}

function updateFileUI() {
    const fileCount = selectedFiles.length;
    
    // Update upload box
    if (fileCount > 0) {
        uploadBoxInner.classList.add('has-files');
        uploadMainText.textContent = `${fileCount} file(s) selected`;
        addWatermarkBtn.disabled = false;
    } else {
        uploadBoxInner.classList.remove('has-files');
        uploadMainText.textContent = 'Drag & drop PDFs here';
        addWatermarkBtn.disabled = true;
    }
    
    // Update inline file list (left panel)
    if (fileCount > 0 && fileCount <= 3) {
        fileListInline.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const chip = document.createElement('div');
            chip.className = 'file-chip';
            chip.innerHTML = `
                <span class="file-chip-name">${file.name}</span>
                <button class="file-chip-remove" onclick="removeFile(${index})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            fileListInline.appendChild(chip);
        });
    } else {
        fileListInline.innerHTML = '';
    }
    
    // Update file queue (right panel)
    if (fileCount > 0) {
        document.getElementById('fileCount').textContent = fileCount;
        document.getElementById('fileCount').style.display = 'inline-block';
        
        fileQueue.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'queue-item';
            item.innerHTML = `
                <svg class="queue-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span class="queue-item-name">${file.name}</span>
                <button class="queue-item-remove" onclick="removeFile(${index})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            fileQueue.appendChild(item);
        });
    } else {
        document.getElementById('fileCount').style.display = 'none';
        fileQueue.innerHTML = `
            <div class="queue-empty">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p>No files selected yet</p>
            </div>
        `;
    }
}

window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    updateFileUI();
};

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            watermarkImageBytes = event.target.result;
            previewImg.src = event.target.result;
            imageName.textContent = file.name;
            imageUploadArea.style.display = 'none';
            imageLoadedArea.style.display = 'block';
            
            watermarkImageElement = new Image();
            watermarkImageElement.onload = function() {
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
    imageUploadArea.style.display = 'block';
    imageLoadedArea.style.display = 'none';
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
    switch (position) {
        case 'center':
            return { x: pageWidth / 2 - contentWidth / 2, y: pageHeight / 2 - contentHeight / 2 };
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
    const watermarkText = watermarkTextInput.value.trim();
    
    const hasContent =
        (currentMode === 'text' && watermarkText) ||
        (currentMode === 'image' && watermarkImageElement);

    if (!hasContent) {
        previewCanvas.style.display = 'none';
        previewPlaceholder.style.display = 'flex';
        return;
    }

    previewCanvas.style.display = 'block';
    previewPlaceholder.style.display = 'none';

    const canvas = previewCanvas;
    const ctx = previewCtx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#F8F7F4';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#E2E0DB';
    ctx.lineWidth = 1;
    for (let i = 60; i < height - 60; i += 24) {
        ctx.beginPath();
        ctx.moveTo(60, i);
        ctx.lineTo(width - 60, i);
        ctx.stroke();
    }

    ctx.save();

    if (currentMode === 'text' && watermarkText) {
        const fontSize = parseInt(fontSizeInput.value) * 0.6;
        const opacity = parseFloat(opacityInput.value);
        const color = colorInput.value;
        const position = textPositionSelect.value;
        const rotation = parseInt(textRotationInput.value);

        ctx.font = `bold ${fontSize}px Arial`;
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

    if (currentMode === 'image' && watermarkImageElement) {
        const imageSize = parseInt(imageSizeInput.value) * 0.6;
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

function dataURLtoUint8Array(dataURL) {
    const base64 = dataURL.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function addWatermarkToBatch() {
    if (selectedFiles.length === 0) return;

    const watermarkText = watermarkTextInput.value.trim();

    if (currentMode === 'text' && !watermarkText) {
        statusDiv.textContent = 'Please enter watermark text.';
        statusDiv.className = 'error';
        return;
    }
    if (currentMode === 'image' && !watermarkImageBytes) {
        statusDiv.textContent = 'Please upload a watermark image.';
        statusDiv.className = 'error';
        return;
    }

    const filesToProcess = [...selectedFiles];
    const totalFiles = filesToProcess.length;

    selectedFiles = [];
    pdfFileInput.value = '';
    updateFileUI();

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

    let imageUint8Array = null;
    let imageType = null;
    if (currentMode === 'image' && watermarkImageBytes) {
        try {
            imageUint8Array = dataURLtoUint8Array(watermarkImageBytes);
            imageType = watermarkImageBytes.startsWith('data:image/png') ? 'png' : 'jpg';
        } catch (e) {
            statusDiv.textContent = 'Failed to load watermark image. Please re-upload it.';
            statusDiv.className = 'error';
            addWatermarkBtn.disabled = false;
            return;
        }
    }

    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < totalFiles; i++) {
        const file = filesToProcess[i];

        try {
            statusDiv.textContent = `Processing ${i + 1}/${totalFiles}: ${file.name}`;

            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();

            let embeddedImage = null;
            if (imageUint8Array) {
                try {
                    embeddedImage = imageType === 'png'
                        ? await pdfDoc.embedPng(imageUint8Array)
                        : await pdfDoc.embedJpg(imageUint8Array);
                } catch (imgError) {
                    console.error('Failed to embed image:', imgError);
                }
            }

            pages.forEach(page => {
                const { width, height } = page.getSize();

                if (currentMode === 'text' && watermarkText) {
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

                if (currentMode === 'image' && embeddedImage) {
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
            downloadPDF(pdfBytes, file.name);
            processedCount++;

            if (i < totalFiles - 1) {
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        } catch (error) {
            errorCount++;
            console.error(`Error processing ${file.name}:`, error);
            statusDiv.textContent = `Error on file ${i + 1}: ${file.name}. Continuing...`;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    if (errorCount === 0) {
        statusDiv.textContent = `✓ Successfully processed ${processedCount} of ${totalFiles} file(s)!`;
        statusDiv.className = 'success';
    } else {
        statusDiv.textContent = `Done: ${processedCount} succeeded, ${errorCount} failed.`;
        statusDiv.className = errorCount === totalFiles ? 'error' : 'processing';
    }

    addWatermarkBtn.disabled = selectedFiles.length === 0;
}

function downloadPDF(pdfBytes, originalName) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalName.replace('.pdf', '_watermarked.pdf');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
