const { PDFDocument, rgb, degrees } = PDFLib;

let selectedFiles = [];
let watermarkImageBytes = null;   // data URL string
let watermarkImageElement = null; // Image() for canvas preview
let currentMode = 'text';         // 'text' | 'image'

// ── DOM refs ──
const pdfFileInput      = document.getElementById('pdfFile');
const uploadBoxInner    = document.getElementById('uploadBoxInner');
const addWatermarkBtn   = document.getElementById('addWatermark');
const statusDiv         = document.getElementById('status');

const previewCanvas     = document.getElementById('previewCanvas');
const previewPlaceholder= document.getElementById('previewPlaceholder');
const previewCtx        = previewCanvas.getContext('2d');

const tabText           = document.getElementById('tabText');
const tabImage          = document.getElementById('tabImage');
const textControlsEl    = document.getElementById('textControls');
const imageControlsEl   = document.getElementById('imageControls');

// Text fields
const watermarkTextInput  = document.getElementById('watermarkText');
const opacityInput        = document.getElementById('opacity');
const opacityValueEl      = document.getElementById('opacityValue');
const fontSizeInput       = document.getElementById('fontSize');
const fontSizeValueEl     = document.getElementById('fontSizeValue');
const colorInput          = document.getElementById('color');
const textPositionSelect  = document.getElementById('textPosition');
const textRotationInput   = document.getElementById('textRotation');
const textRotationValueEl = document.getElementById('textRotationValue');

// Image fields
const imageFileInput      = document.getElementById('imageFile');
const swapImageBtn        = document.getElementById('swapImageBtn');
const swapImageFile       = document.getElementById('swapImageFile');
const imageUploadArea     = document.getElementById('imageUploadArea');
const imageLoadedArea     = document.getElementById('imageLoadedArea');
const imgThumb            = document.getElementById('imgThumb');
const imgFileNameEl       = document.getElementById('imgFileName');
const imageSizeInput      = document.getElementById('imageSize');
const imageSizeValueEl    = document.getElementById('imageSizeValue');
const imageOpacityInput   = document.getElementById('imageOpacity');
const imageOpacityValueEl = document.getElementById('imageOpacityValue');
const imagePositionSelect = document.getElementById('imagePosition');
const imageRotationInput  = document.getElementById('imageRotation');
const imageRotationValueEl= document.getElementById('imageRotationValue');

// File queue (right panel)
const fileQueueList       = document.getElementById('fileQueueList');
const fileCountBadge      = document.getElementById('fileCount');

// ── Mode tabs ──
tabText.addEventListener('click', () => setMode('text'));
tabImage.addEventListener('click', () => setMode('image'));

function setMode(mode) {
    currentMode = mode;
    tabText.classList.toggle('active', mode === 'text');
    tabImage.classList.toggle('active', mode === 'image');
    textControlsEl.style.display  = mode === 'text'  ? 'flex' : 'none';
    imageControlsEl.style.display = mode === 'image' ? 'flex' : 'none';
    updatePreview();
}

// ── PDF file select ──
pdfFileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (files.length) {
        selectedFiles = [...selectedFiles, ...files];
        renderFileQueue();
        updateUploadBox();
        clearStatus();
    }
});

function updateUploadBox() {
    if (selectedFiles.length > 0) {
        uploadBoxInner.classList.add('has-files');
        uploadBoxInner.querySelector('.upload-main-text').textContent =
            `${selectedFiles.length} PDF${selectedFiles.length > 1 ? 's' : ''} selected`;
        addWatermarkBtn.disabled = false;
    } else {
        uploadBoxInner.classList.remove('has-files');
        uploadBoxInner.querySelector('.upload-main-text').textContent = 'Drop PDFs here or click to browse';
        addWatermarkBtn.disabled = true;
    }
}

function renderFileQueue() {
    if (selectedFiles.length === 0) {
        fileQueueList.innerHTML = `
            <div class="queue-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No PDFs added yet</p>
            </div>`;
        fileCountBadge.style.display = 'none';
        return;
    }

    fileCountBadge.style.display = 'inline-block';
    fileCountBadge.textContent = selectedFiles.length;

    fileQueueList.innerHTML = selectedFiles.map((file, i) => `
        <div class="queue-item">
            <svg class="queue-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="queue-item-name" title="${file.name}">${file.name}</span>
            <button class="queue-item-remove" onclick="window.removeFile(${i})" title="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>`).join('');
}

window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    renderFileQueue();
    updateUploadBox();
};

// ── Image upload ──
function loadImageFile(file) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        watermarkImageBytes = e.target.result;

        // Show thumb + swap button, hide upload area
        imgThumb.src = e.target.result;
        imgFileNameEl.textContent = file.name;
        imageUploadArea.style.display = 'none';
        imageLoadedArea.style.display = 'block';

        // Load for canvas preview
        watermarkImageElement = new Image();
        watermarkImageElement.onload = updatePreview;
        watermarkImageElement.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

imageFileInput.addEventListener('change', (e) => loadImageFile(e.target.files[0]));
swapImageBtn.addEventListener('click', () => swapImageFile.click());
swapImageFile.addEventListener('change', (e) => {
    if (e.target.files[0]) loadImageFile(e.target.files[0]);
    swapImageFile.value = ''; // reset so same file can be re-picked
});

// ── Text controls ──
watermarkTextInput.addEventListener('input', updatePreview);
opacityInput.addEventListener('input', (e) => { opacityValueEl.textContent = parseFloat(e.target.value).toFixed(1); updatePreview(); });
fontSizeInput.addEventListener('input', (e) => { fontSizeValueEl.textContent = e.target.value; updatePreview(); });
colorInput.addEventListener('input', updatePreview);
textPositionSelect.addEventListener('change', updatePreview);
textRotationInput.addEventListener('input', (e) => { textRotationValueEl.textContent = e.target.value; updatePreview(); });

// ── Image controls ──
imageSizeInput.addEventListener('input', (e) => { imageSizeValueEl.textContent = e.target.value; updatePreview(); });
imageOpacityInput.addEventListener('input', (e) => { imageOpacityValueEl.textContent = parseFloat(e.target.value).toFixed(1); updatePreview(); });
imagePositionSelect.addEventListener('change', updatePreview);
imageRotationInput.addEventListener('input', (e) => { imageRotationValueEl.textContent = e.target.value; updatePreview(); });

// ── Rotation presets (called from HTML onclick) ──
window.setTextRotation = function(angle) {
    textRotationInput.value = angle;
    textRotationValueEl.textContent = angle;
    updatePreview();
};
window.setImageRotation = function(angle) {
    imageRotationInput.value = angle;
    imageRotationValueEl.textContent = angle;
    updatePreview();
};

// ── Position helper ──
function calculatePosition(pw, ph, cw, ch, position) {
    const m = 50;
    switch (position) {
        case 'center':        return { x: pw/2 - cw/2,      y: ph/2 - ch/2 };
        case 'top-left':      return { x: m,                 y: ph - m - ch };
        case 'top-right':     return { x: pw - m - cw,       y: ph - m - ch };
        case 'bottom-left':   return { x: m,                 y: m };
        case 'bottom-right':  return { x: pw - m - cw,       y: m };
        case 'top-center':    return { x: pw/2 - cw/2,       y: ph - m - ch };
        case 'bottom-center': return { x: pw/2 - cw/2,       y: m };
        default:              return { x: pw/2 - cw/2,       y: ph/2 - ch/2 };
    }
}

// ── Live preview on canvas ──
function updatePreview() {
    const text  = watermarkTextInput.value.trim();
    const hasText  = currentMode === 'text'  && text;
    const hasImage = currentMode === 'image' && watermarkImageElement;

    if (!hasText && !hasImage) {
        previewCanvas.style.display = 'none';
        previewPlaceholder.style.display = 'flex';
        return;
    }

    previewCanvas.style.display = 'block';
    previewPlaceholder.style.display = 'none';

    // Resize canvas to fill its container so preview is always full-size
    const wrap = previewCanvas.parentElement;
    previewCanvas.width  = wrap.clientWidth  || 480;
    previewCanvas.height = wrap.clientHeight || 340;
    const W = previewCanvas.width;
    const H = previewCanvas.height;
    const ctx = previewCtx;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Fake document lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let y = 36; y < H - 36; y += 18) {
        ctx.beginPath(); ctx.moveTo(36, y); ctx.lineTo(W - 36, y); ctx.stroke();
    }

    ctx.save();

    if (hasText) {
        const fontSize = parseInt(fontSizeInput.value) * 0.55;
        const opacity  = parseFloat(opacityInput.value);
        const color    = colorInput.value;
        const position = textPositionSelect.value;
        const rotation = parseInt(textRotationInput.value);

        ctx.font = `bold ${fontSize}px DM Sans, Arial, sans-serif`;
        const tw = ctx.measureText(text).width;
        const th = fontSize;
        const pos = calculatePosition(W, H, tw, th, position);

        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.translate(pos.x + tw / 2, pos.y + th / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.fillText(text, -tw / 2, th / 4);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    if (hasImage) {
        const imageSize    = parseInt(imageSizeInput.value) * 0.5;
        const imageOpacity = parseFloat(imageOpacityInput.value);
        const position     = imagePositionSelect.value;
        const rotation     = parseInt(imageRotationInput.value);

        const scale    = imageSize / watermarkImageElement.width;
        const iw       = watermarkImageElement.width  * scale;
        const ih       = watermarkImageElement.height * scale;
        const pos      = calculatePosition(W, H, iw, ih, position);

        ctx.globalAlpha = imageOpacity;
        ctx.translate(pos.x + iw / 2, pos.y + ih / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(watermarkImageElement, -iw / 2, -ih / 2, iw, ih);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    ctx.restore();
}

// ── Helpers ──
function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1],16)/255, g: parseInt(r[2],16)/255, b: parseInt(r[3],16)/255 }
             : { r: 1, g: 0, b: 0 };
}

function dataURLtoUint8Array(dataURL) {
    const base64 = dataURL.split(',')[1];
    const bin    = atob(base64);
    const bytes  = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

function clearStatus() {
    statusDiv.textContent = '';
    statusDiv.className   = '';
}

function showStatus(msg, type) {
    statusDiv.textContent = msg;
    statusDiv.className   = type;
}

// ── Main: apply watermark ──
async function addWatermarkToBatch() {
    if (!selectedFiles.length) return;

    const text = watermarkTextInput.value.trim();

    if (currentMode === 'text' && !text) {
        showStatus('Please enter watermark text.', 'error'); return;
    }
    if (currentMode === 'image' && !watermarkImageBytes) {
        showStatus('Please upload a watermark image.', 'error'); return;
    }

    const filesToProcess = [...selectedFiles];
    const total = filesToProcess.length;

    // Clear queue
    selectedFiles = [];
    pdfFileInput.value = '';
    renderFileQueue();
    updateUploadBox();

    addWatermarkBtn.disabled = true;
    showStatus(`Processing ${total} file(s)…`, 'processing');

    // Snapshot settings
    const opacity      = parseFloat(opacityInput.value);
    const fontSize     = parseInt(fontSizeInput.value);
    const color        = hexToRgb(colorInput.value);
    const textPosition = textPositionSelect.value;
    const textRotation = parseInt(textRotationInput.value);
    const imageOpacity = parseFloat(imageOpacityInput.value);
    const imageSize    = parseInt(imageSizeInput.value);
    const imagePosition= imagePositionSelect.value;
    const imageRotation= parseInt(imageRotationInput.value);

    // Pre-convert image bytes once
    let imageUint8 = null;
    let imageType  = null;
    if (currentMode === 'image' && watermarkImageBytes) {
        try {
            imageUint8 = dataURLtoUint8Array(watermarkImageBytes);
            imageType  = watermarkImageBytes.startsWith('data:image/png') ? 'png' : 'jpg';
        } catch {
            showStatus('Failed to read image. Please re-upload it.', 'error');
            addWatermarkBtn.disabled = false;
            return;
        }
    }

    let ok = 0, fail = 0;

    for (let i = 0; i < total; i++) {
        const file = filesToProcess[i];
        showStatus(`Processing ${i+1}/${total}: ${file.name}`, 'processing');

        try {
            const buf    = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
            const pages  = pdfDoc.getPages();

            // Embed image into this PDF document
            let embedded = null;
            if (imageUint8) {
                try {
                    embedded = imageType === 'png'
                        ? await pdfDoc.embedPng(imageUint8)
                        : await pdfDoc.embedJpg(imageUint8);
                } catch (e) {
                    console.error('Image embed failed:', e);
                }
            }

            pages.forEach(page => {
                const { width, height } = page.getSize();

                if (currentMode === 'text' && text) {
                    const tw  = text.length * fontSize * 0.6;
                    const th  = fontSize;
                    const pos = calculatePosition(width, height, tw, th, textPosition);
                    page.drawText(text, {
                        x: pos.x, y: pos.y,
                        size: fontSize,
                        color: rgb(color.r, color.g, color.b),
                        opacity,
                        rotate: degrees(textRotation)
                    });
                }

                if (currentMode === 'image' && embedded) {
                    const dims = embedded.scale(imageSize / embedded.width);
                    const pos  = calculatePosition(width, height, dims.width, dims.height, imagePosition);
                    page.drawImage(embedded, {
                        x: pos.x, y: pos.y,
                        width: dims.width, height: dims.height,
                        opacity: imageOpacity,
                        rotate: degrees(imageRotation)
                    });
                }
            });

            const outBytes = await pdfDoc.save();
            downloadPDF(outBytes, file.name);
            ok++;

            if (i < total - 1) await new Promise(r => setTimeout(r, 700));

        } catch (err) {
            fail++;
            console.error(file.name, err);
            showStatus(`Error on "${file.name}" — skipping…`, 'error');
            await new Promise(r => setTimeout(r, 900));
        }
    }

    showStatus(
        fail === 0
            ? `✓ ${ok} file${ok > 1 ? 's' : ''} processed successfully!`
            : `Done — ${ok} succeeded, ${fail} failed.`,
        fail === 0 ? 'success' : 'processing'
    );
    addWatermarkBtn.disabled = true;
}

function downloadPDF(bytes, originalName) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = originalName.replace(/\.pdf$/i, '_watermarked.pdf');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 150);
}

// Wire up button
addWatermarkBtn.addEventListener('click', addWatermarkToBatch);
