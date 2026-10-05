import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

// Configure pdf.js worker URL using local Vite asset with fallback to /pdf.worker.min.mjs
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || '/pdf.worker.min.mjs';
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
}

export type CardCategory = 'auto' | 'ayushman' | 'aadhaar' | 'ration' | 'voter' | 'abha';

export interface CardSettings {
  widthMm: number; // default 86
  heightMm: number; // default 54
  dpi: number; // default 300
  ayushmanRotation: 'cw' | 'ccw' | 'none' | 'auto';
  outputFormat: 'jpg' | 'png';
  jpgQuality: number; // 0.1 - 1.0 (default 0.98)
  roundedCorners: boolean;
  borderGuide: boolean;
  marginBleedMm: number;
}

export const DEFAULT_SETTINGS: CardSettings = {
  widthMm: 86,
  heightMm: 54,
  dpi: 300,
  ayushmanRotation: 'none',
  outputFormat: 'jpg',
  jpgQuality: 1.0,
  roundedCorners: true,
  borderGuide: false,
  marginBleedMm: 1,
};

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessedCard {
  id: string;
  sourceFileName: string;
  category: 'ayushman' | 'aadhaar' | 'ration' | 'voter' | 'abha';
  categoryLabel: string;
  frontDataUrl: string;
  backDataUrl: string;
  sourcePages: string[]; // original page previews for visual adjustment
  frontCropBox?: CropBox;
  backCropBox?: CropBox;
  cardIndex: number;
  numPages: number;
  rotationFront: number;
  rotationBack: number;
  dimensions: {
    widthPx: number;
    heightPx: number;
    dpi: number;
    mm: string;
  };
}

export interface ProcessingLog {
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

/**
 * Detects card category from extracted PDF text content and filename
 */
export function detectCardCategory(text: string, fileName = ''): 'ayushman' | 'aadhaar' | 'ration' | 'voter' | 'abha' {
  const lowerText = (text + ' ' + fileName).toLowerCase();

  // 1. Ayushman Card & State Health Schemes (PM-JAY / BIS / Setu / MahaSarathi / Maharashtra Schemes)
  if (
    lowerText.includes('ayushman') ||
    lowerText.includes('pmjay') ||
    lowerText.includes('pm-jay') ||
    lowerText.includes('jan arogya') ||
    lowerText.includes('national health authority') ||
    lowerText.includes('bis.pmjay') ||
    lowerText.includes('setu') ||
    lowerText.includes('mahasarathi') ||
    lowerText.includes('mahasarthi') ||
    lowerText.includes('sarathi') ||
    lowerText.includes('maha id') ||
    lowerText.includes('maharashtra') ||
    lowerText.includes('डिजिटल') ||
    lowerText.includes('प्रवेशद्वार')
  ) {
    return 'ayushman';
  }

  // 2. Aadhaar Card (UIDAI)
  if (
    lowerText.includes('aadhaar') ||
    lowerText.includes('uidai') ||
    lowerText.includes('unique identification') ||
    lowerText.includes('mera aadhaar') ||
    lowerText.includes('enrolment no') ||
    lowerText.includes('eaadhaar') ||
    lowerText.includes('e-aadhaar') ||
    lowerText.includes('मेरी पहचान') ||
    lowerText.includes('help@uidai.gov.in') ||
    lowerText.includes('www.uidai.gov.in') ||
    lowerText.includes('vid :')
  ) {
    return 'aadhaar';
  }

  // 3. Voter ID (e-EPIC)
  if (
    lowerText.includes('election commission') ||
    lowerText.includes('epic') ||
    lowerText.includes('matdata') ||
    lowerText.includes('elector photo') ||
    lowerText.includes('elector') ||
    lowerText.includes('voter') ||
    lowerText.includes('eci.gov')
  ) {
    return 'voter';
  }

  // 4. ABHA Card
  if (
    lowerText.includes('abha') ||
    lowerText.includes('abdm') ||
    lowerText.includes('ayushman bharat digital') ||
    lowerText.includes('health id') ||
    lowerText.includes('14-digit')
  ) {
    return 'abha';
  }

  // 5. Ration Card
  if (
    lowerText.includes('ration') ||
    lowerText.includes('khadya') ||
    lowerText.includes('food & supplies') ||
    lowerText.includes('food and civil') ||
    lowerText.includes('nfsa') ||
    lowerText.includes('sphh') ||
    lowerText.includes('phh') ||
    lowerText.includes('aay') ||
    lowerText.includes('fair price') ||
    lowerText.includes('rc no') ||
    lowerText.includes('wbpds')
  ) {
    return 'ration';
  }

  // Default to Ayushman / MahaSarathi (which covers upper-stacked two-card layouts)
  return 'ayushman';
}

/**
 * Converts a mm measurement to pixels at a given DPI
 */
export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Automatically extracts potential passwords from filename:
 * - Direct filename without extension (e.g. "AAVE2012.pdf" -> "AAVE2012")
 * - Uppercase & lowercase variants
 * - Standard 8-character Aadhaar password token (4 letters + 4 digits: e.g. AAVE2012)
 * - Space/underscore delimited tokens
 */
export function getPasswordCandidatesFromFilename(fileName = '', explicitPassword?: string): string[] {
  const candidates: string[] = [];

  if (explicitPassword && explicitPassword.trim()) {
    candidates.push(explicitPassword.trim());
    candidates.push(explicitPassword.trim().toUpperCase());
    candidates.push(explicitPassword.trim().toLowerCase());
  }

  if (fileName) {
    // Strip extension
    const rawBase = fileName.replace(/\.[^/.]+$/, '').trim();
    if (rawBase) {
      candidates.push(rawBase);
      candidates.push(rawBase.toUpperCase());
      candidates.push(rawBase.toLowerCase());

      // Alphanumeric cleaned
      const alphaNum = rawBase.replace(/[^a-zA-Z0-9]/g, '');
      if (alphaNum && alphaNum !== rawBase) {
        candidates.push(alphaNum);
        candidates.push(alphaNum.toUpperCase());
      }

      // Check for standard 8-character Aadhaar password pattern (4 letters + 4 digits: e.g. AAVE2012)
      const matches8 = rawBase.match(/[a-zA-Z]{4}\d{4}/g);
      if (matches8) {
        for (const m of matches8) {
          candidates.push(m.toUpperCase());
          candidates.push(m.toLowerCase());
        }
      }

      // Delimited tokens (e.g. "Aadhaar_AAVE2012" -> ["Aadhaar", "AAVE2012"])
      const tokens = rawBase.split(/[\s_\-(),.]+/);
      for (const t of tokens) {
        if (t && t.length >= 4) {
          candidates.push(t);
          candidates.push(t.toUpperCase());
        }
      }
    }
  }

  return Array.from(new Set(candidates));
}

/**
 * Multi-page PDF renderer: renders all pages (or up to 2 pages) to high-res canvases.
 * Automatically tries to unlock password-protected PDFs using filename-derived passwords
 * (e.g. if the file is named AAVE2012.pdf or contains the password in the filename).
 */
export async function renderPdfToCanvases(
  pdfData: ArrayBuffer,
  fileName = '',
  explicitPassword?: string,
  scale = 2.8
): Promise<{ canvases: HTMLCanvasElement[]; numPages: number; text: string; unlockedWithPassword?: string }> {
  let pdf: any = null;
  let usedPassword: string | undefined = undefined;

  // 1. Try opening without password or explicit password first
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData.slice(0),
      password: explicitPassword || undefined,
    });
    pdf = await loadingTask.promise;
    if (explicitPassword) usedPassword = explicitPassword;
  } catch (err: any) {
    const isPwErr =
      err?.name === 'PasswordException' ||
      String(err?.message || '').toLowerCase().includes('password') ||
      err?.code === 1;

    if (!isPwErr) {
      throw err;
    }

    // 2. File is password protected! Try candidates derived from filename
    const candidates = getPasswordCandidatesFromFilename(fileName, explicitPassword);
    let unlocked = false;

    for (const candidate of candidates) {
      try {
        const testTask = pdfjsLib.getDocument({
          data: pdfData.slice(0),
          password: candidate,
        });
        pdf = await testTask.promise;
        usedPassword = candidate;
        unlocked = true;
        break;
      } catch {
        // Continue trying next candidate
      }
    }

    if (!unlocked || !pdf) {
      const pwException = new Error('PDF is password-protected and could not be unlocked with filename.');
      pwException.name = 'PasswordException';
      throw pwException;
    }
  }

  const numPages = pdf.numPages;
  const canvases: HTMLCanvasElement[] = [];
  let combinedText = '';

  const pagesToLoad = Math.min(numPages, 2);

  for (let pageNum = 1; pageNum <= pagesToLoad; pageNum++) {
    const page = await pdf.getPage(pageNum);

    try {
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
      combinedText += ' ' + pageText;
    } catch (e) {
      console.warn('Text extraction warning:', e);
    }

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    if (!context) throw new Error('Could not create 2D canvas context');

    // Fill with solid white background to prevent transparent canvas issues
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    canvases.push(canvas);
  }

  return { canvases, numPages, text: combinedText, unlockedWithPassword: usedPassword };
}

/**
 * Loads image into canvas
 */
export function renderImageToCanvas(imageFile: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Scans a canvas sub-region to locate content boundaries (non-white pixels)
 */
export function findContentBoundingBox(
  canvas: HTMLCanvasElement,
  region: { startX: number; startY: number; width: number; height: number }
): { minX: number; maxX: number; minY: number; maxY: number; found: boolean } {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { minX: region.startX, maxX: region.startX + region.width, minY: region.startY, maxY: region.startY + region.height, found: false };

  const sx = Math.max(0, Math.floor(region.startX));
  const sy = Math.max(0, Math.floor(region.startY));
  const sw = Math.min(canvas.width - sx, Math.floor(region.width));
  const sh = Math.min(canvas.height - sy, Math.floor(region.height));

  if (sw <= 10 || sh <= 10) {
    return { minX: sx, maxX: sx + sw, minY: sy, maxY: sy + sh, found: false };
  }

  try {
    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const data = imgData.data;

    let minX = sw;
    let maxX = 0;
    let minY = sh;
    let maxY = 0;
    let hitCount = 0;

    // Sample every 4 pixels for high-speed scanning
    for (let y = 0; y < sh; y += 4) {
      const rowOffset = y * sw * 4;
      for (let x = 0; x < sw; x += 4) {
        const idx = rowOffset + x * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Content threshold: not pure white/light grey and visible
        if (a > 40 && (r < 240 || g < 240 || b < 240)) {
          hitCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (hitCount > 50 && maxX > minX && maxY > minY) {
      return {
        minX: sx + minX,
        maxX: sx + maxX,
        minY: sy + minY,
        maxY: sy + maxY,
        found: true,
      };
    }
  } catch (e) {
    console.warn('Content bounding scan warning:', e);
  }

  return { minX: sx, maxX: sx + sw, minY: sy, maxY: sy + sh, found: false };
}

export interface BlueBannerBounds {
  found: boolean;
  leftX: number;
  rightX: number;
  topY: number;
  bottomY: number;
  width: number;
  height: number;
}

/**
 * Scans a vertical slice of canvas to locate the exact dark blue banner bounds
 * ("सर्व सेवा व योजनांचे डिजिटल प्रवेशद्वार.")
 * Signature: Blue is dominant over Red and Green:
 * r <= 85, g between 40 and 150, b >= 95, and b > r + 30
 */
export function findMahaSarathiBlueBannerBounds(
  canvas: HTMLCanvasElement,
  minYRatio = 0.15,
  maxYRatio = 0.35
): BlueBannerBounds {
  const W = canvas.width;
  const H = canvas.height;
  const defaultFallback: BlueBannerBounds = {
    found: false,
    leftX: Math.round(W * 0.198),
    rightX: Math.round(W * 0.802),
    topY: Math.round(H * (maxYRatio - 0.035)),
    bottomY: Math.round(H * maxYRatio),
    width: Math.round(W * 0.604),
    height: Math.round(H * 0.035),
  };

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return defaultFallback;

  const startY = Math.max(0, Math.floor(H * minYRatio));
  const endY = Math.min(H, Math.ceil(H * maxYRatio));
  const scanH = endY - startY;

  if (scanH <= 10 || W <= 20) return defaultFallback;

  try {
    const imgData = ctx.getImageData(0, startY, W, scanH);
    const data = imgData.data;

    let minX = W;
    let maxX = 0;
    let topBlueRow = -1;
    let bottomBlueRow = -1;

    // Scan rows in this slice
    for (let y = 0; y < scanH; y += 2) {
      let rowBlueCount = 0;
      let rowMinX = W;
      let rowMaxX = 0;
      const rowOffset = y * W * 4;

      for (let x = 0; x < W; x += 3) {
        const idx = rowOffset + x * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Dark blue banner pixel detection
        if (a > 120 && b >= 95 && b > r + 30 && b >= g * 0.85 && r <= 85) {
          rowBlueCount++;
          if (x < rowMinX) rowMinX = x;
          if (x > rowMaxX) rowMaxX = x;
        }
      }

      // If at least 10% of the sampled row width is blue banner
      if (rowBlueCount > (W / 3) * 0.10) {
        if (topBlueRow === -1) topBlueRow = y;
        bottomBlueRow = y;
        if (rowMinX < minX) minX = rowMinX;
        if (rowMaxX > maxX) maxX = rowMaxX;
      }
    }

    if (topBlueRow !== -1 && bottomBlueRow !== -1 && maxX > minX && (maxX - minX) > W * 0.35) {
      const bannerLeftX = minX;
      const bannerRightX = maxX;
      const bannerTopY = startY + topBlueRow;
      // Add 2 pixels to land exactly flush on the outer rounded bottom border of the dark blue banner
      const bannerBottomY = Math.min(H, startY + bottomBlueRow + 2);

      return {
        found: true,
        leftX: bannerLeftX,
        rightX: bannerRightX,
        topY: bannerTopY,
        bottomY: bannerBottomY,
        width: bannerRightX - bannerLeftX + 1,
        height: bannerBottomY - bannerTopY,
      };
    }
  } catch (e) {
    console.warn('Blue banner detection warning:', e);
  }

  return defaultFallback;
}

/**
 * Backwards compatible helper returning bottom Y
 */
export function findMahaSarathiBlueBannerBottom(
  canvas: HTMLCanvasElement,
  minYRatio: number,
  maxYRatio: number
): { bottomY: number; found: boolean } {
  const bounds = findMahaSarathiBlueBannerBounds(canvas, minYRatio, maxYRatio);
  return { bottomY: bounds.bottomY, found: bounds.found };
}

export interface AadhaarBoundsResult {
  found: boolean;
  frontBox: CropBox;
  backBox: CropBox;
}

/**
 * Accurately detects the side-by-side UIDAI e-Aadhaar cards in the lower quadrant of an A4 page.
 * Scans for:
 * 1. The top horizontal scissor cut line (around Y = 70.5% - 72.0%) to start cleanly INSIDE it.
 * 2. The vertical center dashed line (around X = 49.0% - 51.0%) to exclude dashed borders on both cards.
 * 3. The bottom helpline bar (around Y = 91.5% - 93.5%) to include the full red helpline bar.
 * Maintains standard CR80 aspect ratio (86mm x 54mm) and orientation.
 */
export function findAadhaarCardBounds(canvas: HTMLCanvasElement): AadhaarBoundsResult {
  const W = canvas.width;
  const H = canvas.height;

  // Calibrated inside-border inset defaults (4-6px strictly inside printed border lines):
  // Excludes left black border line (~0.076 -> 0.081)
  // Excludes bottom black border line (~0.928 -> 0.923)
  // Excludes center dashed divider line (~0.491 and ~0.509)
  // Excludes right black border line (~0.924 -> 0.919)
  const defaultTopY = Math.round(H * 0.722);
  const defaultFrontX = Math.round(W * 0.081);
  const defaultBackX = Math.round(W * 0.509);
  const defaultCw = Math.round(W * 0.410);
  const defaultCh = Math.round(H * 0.201);

  const fallback: AadhaarBoundsResult = {
    found: true,
    frontBox: {
      x: defaultFrontX,
      y: defaultTopY,
      width: defaultCw,
      height: defaultCh,
    },
    backBox: {
      x: defaultBackX,
      y: defaultTopY,
      width: defaultCw,
      height: defaultCh,
    },
  };

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return fallback;

  try {
    // 1. Locate the vertical center dashed divider line near X = 48.5% - 51.5%, Y = 73% - 88%
    const midScanX = Math.round(W * 0.485);
    const midScanW = Math.round(W * 0.030);
    const midScanY = Math.round(H * 0.730);
    const midScanH = Math.round(H * 0.150);

    let centerDividerX = Math.round(W * 0.500);
    if (midScanW > 4 && midScanH > 10) {
      const midImg = ctx.getImageData(midScanX, midScanY, midScanW, midScanH);
      const mData = midImg.data;
      const colDarkness: number[] = new Array(midScanW).fill(0);

      for (let y = 0; y < midScanH; y += 2) {
        const rowOff = y * midScanW * 4;
        for (let x = 0; x < midScanW; x++) {
          const idx = rowOff + x * 4;
          const r = mData[idx];
          const g = mData[idx + 1];
          const b = mData[idx + 2];
          // Dashed line has dark or grey pixels
          if (r < 180 && g < 180 && b < 180) {
            colDarkness[x]++;
          }
        }
      }

      let maxColDark = 0;
      let maxColIdx = -1;
      for (let x = 0; x < midScanW; x++) {
        if (colDarkness[x] > maxColDark) {
          maxColDark = colDarkness[x];
          maxColIdx = x;
        }
      }

      if (maxColIdx !== -1 && maxColDark > midScanH * 0.08) {
        centerDividerX = midScanX + maxColIdx;
      }
    }

    // 2. Locate the left vertical black border line of Front card near X = 6.8% - 8.8%, Y = 74% - 88%
    const leftScanX = Math.round(W * 0.068);
    const leftScanW = Math.round(W * 0.020);
    const leftScanY = Math.round(H * 0.740);
    const leftScanH = Math.round(H * 0.140);

    let detectedLeftLineX = -1;
    if (leftScanW > 4 && leftScanH > 10) {
      const leftImg = ctx.getImageData(leftScanX, leftScanY, leftScanW, leftScanH);
      const lData = leftImg.data;
      const colDarkness: number[] = new Array(leftScanW).fill(0);

      for (let y = 0; y < leftScanH; y += 2) {
        const rowOff = y * leftScanW * 4;
        for (let x = 0; x < leftScanW; x++) {
          const idx = rowOff + x * 4;
          const r = lData[idx];
          const g = lData[idx + 1];
          const b = lData[idx + 2];
          // Outer black border line is dark
          if (r < 130 && g < 130 && b < 130) {
            colDarkness[x]++;
          }
        }
      }

      let maxColDark = 0;
      let maxColIdx = -1;
      for (let x = 0; x < leftScanW; x++) {
        if (colDarkness[x] > maxColDark) {
          maxColDark = colDarkness[x];
          maxColIdx = x;
        }
      }

      // Strong vertical line presence
      if (maxColIdx !== -1 && maxColDark > (leftScanH / 2) * 0.35) {
        detectedLeftLineX = leftScanX + maxColIdx;
      }
    }

    // 3. Locate the right vertical black border line of Back card near X = 91.0% - 93.5%, Y = 74% - 88%
    const rightScanX = Math.round(W * 0.910);
    const rightScanW = Math.round(W * 0.025);
    const rightScanY = Math.round(H * 0.740);
    const rightScanH = Math.round(H * 0.140);

    let detectedRightLineX = -1;
    if (rightScanW > 4 && rightScanH > 10) {
      const rightImg = ctx.getImageData(rightScanX, rightScanY, rightScanW, rightScanH);
      const rData = rightImg.data;
      const colDarkness: number[] = new Array(rightScanW).fill(0);

      for (let y = 0; y < rightScanH; y += 2) {
        const rowOff = y * rightScanW * 4;
        for (let x = 0; x < rightScanW; x++) {
          const idx = rowOff + x * 4;
          const r = rData[idx];
          const g = rData[idx + 1];
          const b = rData[idx + 2];
          if (r < 130 && g < 130 && b < 130) {
            colDarkness[x]++;
          }
        }
      }

      let maxColDark = 0;
      let maxColIdx = -1;
      for (let x = 0; x < rightScanW; x++) {
        if (colDarkness[x] > maxColDark) {
          maxColDark = colDarkness[x];
          maxColIdx = x;
        }
      }

      if (maxColIdx !== -1 && maxColDark > (rightScanH / 2) * 0.35) {
        detectedRightLineX = rightScanX + maxColIdx;
      }
    }

    // 4. Locate the top horizontal scissor cut line near Y = 70.0% - 72.5%
    const topScanY = Math.round(H * 0.700);
    const topScanH = Math.round(H * 0.028);
    const topScanX = Math.round(W * 0.10);
    const topScanW = Math.round(W * 0.80);

    let topCutLineY = Math.round(H * 0.714);
    if (topScanW > 10 && topScanH > 4) {
      const topImg = ctx.getImageData(topScanX, topScanY, topScanW, topScanH);
      const tData = topImg.data;
      const rowDarkness: number[] = new Array(topScanH).fill(0);

      for (let y = 0; y < topScanH; y++) {
        const rowOff = y * topScanW * 4;
        for (let x = 0; x < topScanW; x += 3) {
          const idx = rowOff + x * 4;
          const r = tData[idx];
          const g = tData[idx + 1];
          const b = tData[idx + 2];
          if (r < 160 && g < 160 && b < 160) {
            rowDarkness[y]++;
          }
        }
      }

      let maxRowDark = 0;
      let maxRowIdx = -1;
      for (let y = 0; y < topScanH; y++) {
        if (rowDarkness[y] > maxRowDark) {
          maxRowDark = rowDarkness[y];
          maxRowIdx = y;
        }
      }

      if (maxRowIdx !== -1 && maxRowDark > (topScanW / 3) * 0.10) {
        topCutLineY = topScanY + maxRowIdx;
      }
    }

    // Crop start: 8 pixels below top cut line to strictly exclude dashes and any top outer stroke
    const startY = Math.max(Math.round(H * 0.722), topCutLineY + 8);

    // 5. Locate the bottom horizontal black border line and red baseline / helpline near Y = 91.0% - 94.0%
    const botScanY = Math.round(H * 0.910);
    const botScanH = Math.round(H * 0.030);
    const botScanX = Math.round(W * 0.15);
    const botScanW = Math.round(W * 0.70);

    let detectedBottomBlackLineY = -1;
    let lowestRedRowY = -1;

    if (botScanW > 10 && botScanH > 4) {
      const botImg = ctx.getImageData(botScanX, botScanY, botScanW, botScanH);
      const bData = botImg.data;
      const rowBlackness: number[] = new Array(botScanH).fill(0);

      for (let y = 0; y < botScanH; y++) {
        const rowOff = y * botScanW * 4;
        for (let x = 0; x < botScanW; x += 3) {
          const idx = rowOff + x * 4;
          const r = bData[idx];
          const g = bData[idx + 1];
          const b = bData[idx + 2];

          // Check for horizontal dark border line
          if (r < 120 && g < 120 && b < 120) {
            rowBlackness[y]++;
          }

          // Check for red baseline ("मेरा आधार, मेरी पहचान" / Helpline bar)
          if (r > 150 && g < 80 && b < 80) {
            if (y > lowestRedRowY) {
              lowestRedRowY = y;
            }
          }
        }
      }

      // Find lowest distinct black border line
      for (let y = botScanH - 1; y >= 0; y--) {
        if (rowBlackness[y] > (botScanW / 3) * 0.20) {
          detectedBottomBlackLineY = botScanY + y;
          break;
        }
      }
    }

    // Determine target bottom Y:
    // Inset strictly 5-6px above the detected black border line so NO black line is captured,
    // while keeping the red baseline flush at bottom.
    let targetBottomY = defaultTopY + defaultCh;
    if (detectedBottomBlackLineY !== -1) {
      targetBottomY = detectedBottomBlackLineY - 5;
    } else if (lowestRedRowY !== -1) {
      targetBottomY = botScanY + lowestRedRowY;
    }

    let finalCh = targetBottomY - startY;
    if (finalCh < H * 0.175 || finalCh > H * 0.220) {
      finalCh = defaultCh;
    }

    // Calculate horizontal boundaries:
    // Front card (Left side):
    // Left edge: inset strictly 6px inside detected left black border line (or calibrated default)
    // Right edge: stop 6px before center dashed line
    const frontLeft = detectedLeftLineX !== -1 ? detectedLeftLineX + 6 : defaultFrontX;
    const frontRight = Math.min(Math.round(W * 0.491), centerDividerX - 6);
    const finalFrontCw = Math.max(10, frontRight - frontLeft);

    // Back card (Right side):
    // Left edge: start 6px after center dashed line
    // Right edge: inset strictly 6px inside detected right black border line (or calibrated default)
    const backLeft = Math.max(Math.round(W * 0.509), centerDividerX + 6);
    const backRight = detectedRightLineX !== -1 ? detectedRightLineX - 6 : Math.round(W * 0.919);
    const finalBackCw = Math.max(10, backRight - backLeft);

    return {
      found: true,
      frontBox: {
        x: frontLeft,
        y: startY,
        width: finalFrontCw,
        height: finalCh,
      },
      backBox: {
        x: backLeft,
        y: startY,
        width: finalBackCw,
        height: finalCh,
      },
    };
  } catch (e) {
    console.warn('Aadhaar bounds scan warning:', e);
  }

  return fallback;
}

/**
 * Crops a bounding region from source canvas into standard CR80 PVC dimensions (86mm x 54mm).
 * Properly rotates in an intermediate canvas to NEVER clip or draw outside bounds.
 */
export function extractAndFormatCard(
  sourceCanvas: HTMLCanvasElement,
  cropBox: CropBox,
  settings: CardSettings,
  rotationDegrees = 0
): string {
  const targetWidthPx = mmToPx(settings.widthMm, settings.dpi);
  const targetHeightPx = mmToPx(settings.heightMm, settings.dpi);

  // Validate cropBox coordinates within source canvas
  const sx = Math.max(0, Math.min(sourceCanvas.width - 20, Math.round(cropBox.x)));
  const sy = Math.max(0, Math.min(sourceCanvas.height - 20, Math.round(cropBox.y)));
  const sw = Math.max(20, Math.min(sourceCanvas.width - sx, Math.round(cropBox.width)));
  const sh = Math.max(20, Math.min(sourceCanvas.height - sy, Math.round(cropBox.height)));

  // 1. Extract the raw crop region into an isolated intermediate canvas
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = sw;
  cropCanvas.height = sh;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return '';

  cropCtx.fillStyle = '#ffffff';
  cropCtx.fillRect(0, 0, sw, sh);
  cropCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

  // 2. Handle rotation in isolated intermediate canvas so geometry is never clipped
  const normRot = ((rotationDegrees % 360) + 360) % 360;
  let activeCanvas = cropCanvas;

  if (normRot === 90 || normRot === 270) {
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = sh;
    rotCanvas.height = sw;
    const rotCtx = rotCanvas.getContext('2d');
    if (rotCtx) {
      rotCtx.fillStyle = '#ffffff';
      rotCtx.fillRect(0, 0, sh, sw);
      rotCtx.translate(sh / 2, sw / 2);
      rotCtx.rotate((normRot * Math.PI) / 180);
      rotCtx.drawImage(cropCanvas, -sw / 2, -sh / 2);
      activeCanvas = rotCanvas;
    }
  } else if (normRot === 180) {
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = sw;
    rotCanvas.height = sh;
    const rotCtx = rotCanvas.getContext('2d');
    if (rotCtx) {
      rotCtx.fillStyle = '#ffffff';
      rotCtx.fillRect(0, 0, sw, sh);
      rotCtx.translate(sw / 2, sh / 2);
      rotCtx.rotate((180 * Math.PI) / 180);
      rotCtx.drawImage(cropCanvas, -sw / 2, -sh / 2);
      activeCanvas = rotCanvas;
    }
  }

  // 3. Render onto target CR80 PVC output canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetWidthPx;
  outCanvas.height = targetHeightPx;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return '';

  if (settings.outputFormat === 'png') {
    outCtx.clearRect(0, 0, targetWidthPx, targetHeightPx);
  } else {
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, targetWidthPx, targetHeightPx);
  }

  // Smooth high-fidelity image scaling
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  if (settings.roundedCorners) {
    const radius = mmToPx(3.18, settings.dpi);
    outCtx.save();
    outCtx.beginPath();
    roundRect(outCtx, 0, 0, targetWidthPx, targetHeightPx, radius);
    outCtx.clip();
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, targetWidthPx, targetHeightPx);
    outCtx.drawImage(activeCanvas, 0, 0, activeCanvas.width, activeCanvas.height, 0, 0, targetWidthPx, targetHeightPx);
    outCtx.restore();
  } else {
    outCtx.drawImage(activeCanvas, 0, 0, activeCanvas.width, activeCanvas.height, 0, 0, targetWidthPx, targetHeightPx);
  }

  // 4. Subtle CR80 standard guide border
  if (settings.borderGuide) {
    outCtx.save();
    outCtx.strokeStyle = '#cbd5e1';
    outCtx.lineWidth = 1;
    if (settings.roundedCorners) {
      const radius = mmToPx(3.18, settings.dpi);
      roundRect(outCtx, 0.5, 0.5, targetWidthPx - 1, targetHeightPx - 1, radius);
      outCtx.stroke();
    } else {
      outCtx.strokeRect(0.5, 0.5, targetWidthPx - 1, targetHeightPx - 1);
    }
    outCtx.restore();
  }

  const mime = settings.outputFormat === 'png' ? 'image/png' : 'image/jpeg';
  return outCanvas.toDataURL(mime, settings.jpgQuality);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Smart multi-page and single-page government card auto-cropper.
 * Eliminates blank previews by combining content-aware edge detection with calibrated geometry.
 */
export function cropGovernmentCardAdvanced(
  canvases: HTMLCanvasElement[],
  category: 'ayushman' | 'aadhaar' | 'ration' | 'voter' | 'abha',
  settings: CardSettings
): {
  frontUrl: string;
  backUrl: string;
  frontBox: CropBox;
  backBox: CropBox;
  rotFront: number;
  rotBack: number;
} {
  const isMultiPage = canvases.length >= 2;
  const page1 = canvases[0];
  const page2 = isMultiPage ? canvases[1] : canvases[0];

  const W1 = page1.width;
  const H1 = page1.height;
  const W2 = page2.width;
  const H2 = page2.height;

  let frontBox: CropBox;
  let backBox: CropBox;
  let rotFront = 0;
  let rotBack = 0;

  // =========================================================================
  // CASE 1: MULTI-PAGE DOCUMENT (Page 1 = Front side, Page 2 = Back side)
  // Very common for e-EPIC Voter ID, Ayushman BIS 2.0 / Setu, Digital Ration
  // =========================================================================
  if (isMultiPage) {
    if (category === 'voter') {
      // e-EPIC 2-Page: In official Election Commission downloads,
      // the card is located in the LOWER half (from 48% to 92%), framed by ECI borders!
      const cw1 = W1 * 0.88;
      const ch1 = cw1 * (54 / 86);
      const scan1 = findContentBoundingBox(page1, {
        startX: W1 * 0.05,
        startY: H1 * 0.45,
        width: W1 * 0.90,
        height: H1 * 0.50,
      });

      const y1 = scan1.found ? Math.max(H1 * 0.45, scan1.minY - 10) : H1 * 0.52;
      frontBox = {
        x: (W1 - cw1) / 2,
        y: Math.min(H1 - ch1 - 10, y1),
        width: cw1,
        height: ch1,
      };

      const cw2 = W2 * 0.88;
      const ch2 = cw2 * (54 / 86);
      const scan2 = findContentBoundingBox(page2, {
        startX: W2 * 0.05,
        startY: H2 * 0.45,
        width: W2 * 0.90,
        height: H2 * 0.50,
      });

      const y2 = scan2.found ? Math.max(H2 * 0.45, scan2.minY - 10) : H2 * 0.52;
      backBox = {
        x: (W2 - cw2) / 2,
        y: Math.min(H2 - ch2 - 10, y2),
        width: cw2,
        height: ch2,
      };
    } else if (category === 'ayushman') {
      // Ayushman 2-Page: Card is in the center/upper half
      const cw1 = W1 * 0.88;
      const ch1 = cw1 * (54 / 86);
      const scan1 = findContentBoundingBox(page1, {
        startX: W1 * 0.05,
        startY: H1 * 0.08,
        width: W1 * 0.90,
        height: H1 * 0.55,
      });

      const y1 = scan1.found ? Math.max(H1 * 0.08, scan1.minY - 5) : H1 * 0.12;
      frontBox = {
        x: (W1 - cw1) / 2,
        y: Math.min(H1 - ch1 - 10, y1),
        width: cw1,
        height: ch1,
      };

      const cw2 = W2 * 0.88;
      const ch2 = cw2 * (54 / 86);
      const scan2 = findContentBoundingBox(page2, {
        startX: W2 * 0.05,
        startY: H2 * 0.08,
        width: W2 * 0.90,
        height: H2 * 0.55,
      });

      const y2 = scan2.found ? Math.max(H2 * 0.08, scan2.minY - 5) : H2 * 0.12;
      backBox = {
        x: (W2 - cw2) / 2,
        y: Math.min(H2 - ch2 - 10, y2),
        width: cw2,
        height: ch2,
      };

      if (settings.ayushmanRotation !== 'none') {
        rotFront = settings.ayushmanRotation === 'ccw' ? -90 : 90;
        rotBack = settings.ayushmanRotation === 'ccw' ? -90 : 90;
      }
    } else {
      // General 2-Page (Ration / ABHA / other):
      // Scan middle region for content
      const cw1 = W1 * 0.88;
      const ch1 = cw1 * (54 / 86);
      const scan1 = findContentBoundingBox(page1, {
        startX: W1 * 0.05,
        startY: H1 * 0.08,
        width: W1 * 0.90,
        height: H1 * 0.80,
      });

      const y1 = scan1.found ? Math.max(H1 * 0.05, scan1.minY - 5) : H1 * 0.12;
      frontBox = {
        x: (W1 - cw1) / 2,
        y: Math.min(H1 - ch1 - 10, y1),
        width: cw1,
        height: ch1,
      };

      const cw2 = W2 * 0.88;
      const ch2 = cw2 * (54 / 86);
      const scan2 = findContentBoundingBox(page2, {
        startX: W2 * 0.05,
        startY: H2 * 0.08,
        width: W2 * 0.90,
        height: H2 * 0.80,
      });

      const y2 = scan2.found ? Math.max(H2 * 0.08, scan2.minY - 5) : H2 * 0.12;
      backBox = {
        x: (W2 - cw2) / 2,
        y: Math.min(H2 - ch2 - 10, y2),
        width: cw2,
        height: ch2,
      };
    }
  } else {
    // =========================================================================
    // CASE 2: SINGLE PAGE DOCUMENT (Both Front & Back are on Page 1, or single card)
    // =========================================================================

    // Subcase 2A: The uploaded file is ALREADY a single card (aspect ratio ~ 1.45 to 1.75)
    const ratio = W1 / H1;
    if (ratio >= 1.40 && ratio <= 1.75) {
      frontBox = { x: 0, y: 0, width: W1, height: H1 };
      backBox = { x: 0, y: 0, width: W1, height: H1 };
    } else {
      // Intelligent layout analysis for Portrait A4:
      // 1. Scan Top Card Zone (Y: 1% - 30%)
      const scanTop = findContentBoundingBox(page1, {
        startX: W1 * 0.03,
        startY: H1 * 0.01,
        width: W1 * 0.94,
        height: H1 * 0.30,
      });

      // 2. Scan Middle Card Zone (Y: 28% - 60%)
      const scanMid = findContentBoundingBox(page1, {
        startX: W1 * 0.03,
        startY: H1 * 0.28,
        width: W1 * 0.94,
        height: H1 * 0.32,
      });

      // 3. Scan Bottom Section (Y: 62% - 98%)
      const scanBot = findContentBoundingBox(page1, {
        startX: W1 * 0.03,
        startY: H1 * 0.62,
        width: W1 * 0.94,
        height: H1 * 0.36,
      });

      // Scan for MahaSarathi dark blue banners ("सर्व सेवा व योजनांचे डिजिटल प्रवेशद्वार.")
      const banner1 = findMahaSarathiBlueBannerBounds(page1, 0.15, 0.33);
      const banner2 = findMahaSarathiBlueBannerBounds(page1, 0.45, 0.65);
      const hasBlueBanners = banner1.found || banner2.found;

      // Check if document has bottom cards (Aadhaar side-by-side in lower quadrant)
      const isAadhaarLayout = category === 'aadhaar' || (scanBot.found && !hasBlueBanners);

      // Check if document is genuinely an upper-stacked card (Ayushman / MahaSarathi)
      const isUpperStacked = !isAadhaarLayout && (hasBlueBanners || ((scanTop.found || scanMid.found) && !scanBot.found));

      if (hasBlueBanners || isUpperStacked) {
        if (W1 > H1) {
          // Landscape layout: side by side
          const cw = W1 * 0.46;
          const ch = cw * (54 / 86);
          frontBox = { x: W1 * 0.025, y: (H1 - ch) / 2, width: cw, height: ch };
          backBox = { x: W1 * 0.515, y: (H1 - ch) / 2, width: cw, height: ch };
          rotFront = 0;
          rotBack = 0;
        } else {
          // Portrait A4: Top Card (Front) & Middle Card (Back)
          // 1. Front Card (Top): Flush crop along the rounded blue bottom edge
          if (banner1.found) {
            const cw1 = banner1.width;
            const ch1 = Math.round(cw1 * (54 / 86));
            const y1 = Math.max(0, banner1.bottomY - ch1);
            frontBox = {
              x: banner1.leftX,
              y: y1,
              width: cw1,
              height: ch1,
            };
          } else {
            // Calibrated geometry for Top Card: height ~ 26.8% of H, ending at ~28.8%
            const ch1 = Math.round(H1 * 0.268);
            const cw1 = Math.round(ch1 * (86 / 54));
            const x1 = Math.round((W1 - cw1) / 2);
            const topY = scanTop.found ? Math.max(H1 * 0.015, scanTop.minY - 2) : Math.round(H1 * 0.020);
            frontBox = {
              x: x1,
              y: topY,
              width: cw1,
              height: ch1,
            };
          }

          // 2. Back Card (Second Card): Flush crop along the rounded blue bottom edge
          if (banner2.found) {
            const cw2 = banner2.width;
            const ch2 = Math.round(cw2 * (54 / 86));
            const y2 = Math.max(0, banner2.bottomY - ch2);
            backBox = {
              x: banner2.leftX,
              y: y2,
              width: cw2,
              height: ch2,
            };
          } else if (banner1.found) {
            const cw2 = banner1.width;
            const ch2 = Math.round(cw2 * (54 / 86));
            const midY = scanMid.found ? Math.max(H1 * 0.30, scanMid.minY - 2) : Math.round(H1 * 0.320);
            backBox = {
              x: banner1.leftX,
              y: midY,
              width: cw2,
              height: ch2,
            };
          } else {
            // Calibrated geometry for Second Card: height ~ 26.8% of H, ending at ~58.8%
            const ch2 = Math.round(H1 * 0.268);
            const cw2 = Math.round(ch2 * (86 / 54));
            const x2 = Math.round((W1 - cw2) / 2);
            const midY = scanMid.found ? Math.max(H1 * 0.29, scanMid.minY - 2) : Math.round(H1 * 0.320);
            backBox = {
              x: x2,
              y: midY,
              width: cw2,
              height: ch2,
            };
          }

          // Always upright landscape, zero rotation as confirmed by user
          rotFront = 0;
          rotBack = 0;
        }
      } else {
        const resolvedCategory = isAadhaarLayout ? 'aadhaar' : category;
        switch (resolvedCategory) {
          case 'aadhaar': {
            // UIDAI e-Aadhaar side-by-side layout:
            // Crops inside dashed cut lines, retains red helpline footer on Back, CR80 ratio
            const aadhaar = findAadhaarCardBounds(page1);
            frontBox = aadhaar.frontBox;
            backBox = aadhaar.backBox;
            rotFront = 0;
            rotBack = 0;
            break;
          }

        case 'voter': {
          if (W1 > H1) {
            // Landscape layout: side by side
            const cw = W1 * 0.46;
            const ch = cw * (54 / 86);
            frontBox = { x: W1 * 0.03, y: (H1 - ch) / 2, width: cw, height: ch };
            backBox = { x: W1 * 0.51, y: (H1 - ch) / 2, width: cw, height: ch };
          } else {
            // Portrait layout: lower half card or top/bottom
            const cw = W1 * 0.88;
            const ch = cw * (54 / 86);
            frontBox = { x: (W1 - cw) / 2, y: H1 * 0.52, width: cw, height: ch };
            backBox = { x: (W1 - cw) / 2, y: H1 * 0.52, width: cw, height: ch };
          }
          break;
        }

        case 'abha': {
          const cw = W1 * 0.88;
          const ch = cw * (54 / 86);
          frontBox = { x: (W1 - cw) / 2, y: H1 * 0.08, width: cw, height: ch };
          backBox = { x: (W1 - cw) / 2, y: H1 * 0.52, width: cw, height: ch };
          break;
        }

        case 'ration':
        default: {
          if (W1 > H1) {
            // Landscape document: side by side
            const cw = W1 * 0.46;
            const ch = cw * (54 / 86);
            frontBox = { x: W1 * 0.03, y: (H1 - ch) / 2, width: cw, height: ch };
            backBox = { x: W1 * 0.51, y: (H1 - ch) / 2, width: cw, height: ch };
          } else {
            // Portrait document: top half and bottom half
            const cw = W1 * 0.88;
            const ch = cw * (54 / 86);
            frontBox = { x: (W1 - cw) / 2, y: H1 * 0.08, width: cw, height: ch };
            backBox = { x: (W1 - cw) / 2, y: H1 * 0.52, width: cw, height: ch };
          }
          break;
        }
      }
    }
  }
}

  // Extract both sides with non-clipped rotation
  const frontUrl = extractAndFormatCard(page1, frontBox, settings, rotFront);
  const backUrl = extractAndFormatCard(page2, backBox, settings, rotBack);

  return { frontUrl, backUrl, frontBox, backBox, rotFront, rotBack };
}

/**
 * Creates structured ZIP with folders:
 * - Ration Card/ (01_front.jpg, 01_back.jpg, ...)
 * - Ayushman Card/ (01_front.jpg, 01_back.jpg, ...)
 * - Voter ID/ (01_front.jpg, 01_back.jpg, ...)
 * - ABHA Card/ (01_front.jpg, 01_back.jpg, ...)
 * - Aadhaar Card/ (01_front.jpg, 01_back.jpg, ...)
 */
export async function createBatchCardZip(cards: ProcessedCard[]): Promise<Blob> {
  const zip = new JSZip();

  const folderNames: Record<string, string> = {
    ayushman: 'Ayushman Card',
    aadhaar: 'Aadhaar Card',
    ration: 'Ration Card',
    voter: 'Voter ID',
    abha: 'ABHA Card',
  };

  const countByCat: Record<string, number> = {};

  for (const card of cards) {
    const cat = card.category;
    const folderName = folderNames[cat] || 'Other Cards';
    countByCat[cat] = (countByCat[cat] || 0) + 1;
    const idx = String(countByCat[cat]).padStart(2, '0');

    const folder = zip.folder(folderName);
    if (!folder) continue;

    const frontBase64 = card.frontDataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
    const backBase64 = card.backDataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');

    const ext = card.frontDataUrl.startsWith('data:image/png') ? 'png' : 'jpg';

    folder.file(`${idx}_front.${ext}`, frontBase64, { base64: true });
    folder.file(`${idx}_back.${ext}`, backBase64, { base64: true });
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Generates an A4 Print-Ready Layout Sheet containing up to 5 cards (10 sides: 5 Front left + 5 Back right)
 * Standard A4 at 300 DPI: 2480 x 3508 px
 */
export function generateA4PrintSheet(cards: ProcessedCard[], settings: CardSettings): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 2480;
    canvas.height = 3508;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('PVC CARD PRINT SHEET (A4 / 300 DPI) - FRONT & BACK ALIGNED', 100, 100);

    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Dimensions: ${settings.widthMm}mm x ${settings.heightMm}mm | Ready for Lamination / Dragon Sheet / Thermal Transfer`, 100, 140);

    const cardWPx = mmToPx(settings.widthMm, 300);
    const cardHPx = mmToPx(settings.heightMm, 300);

    const marginX = 140;
    const gapX = 80;
    const startY = 220;
    const gapY = 40;

    const cardsToDraw = cards.slice(0, 5);
    const totalImages = cardsToDraw.length * 2;

    if (totalImages === 0) {
      return resolve(canvas.toDataURL('image/jpeg', 0.98));
    }

    let loadedCount = 0;

    cardsToDraw.forEach((card, i) => {
      const y = startY + i * (cardHPx + gapY);

      const imgFront = new Image();
      imgFront.onload = () => {
        const xFront = marginX;
        ctx.drawImage(imgFront, xFront, y, cardWPx, cardHPx);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.strokeRect(xFront, y, cardWPx, cardHPx);

        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(`Card #${i + 1} FRONT (${card.categoryLabel})`, xFront + 8, y - 8);

        loadedCount++;
        if (loadedCount === totalImages) {
          resolve(canvas.toDataURL('image/jpeg', 0.98));
        }
      };
      imgFront.src = card.frontDataUrl;

      const imgBack = new Image();
      imgBack.onload = () => {
        const xBack = marginX + cardWPx + gapX;
        ctx.drawImage(imgBack, xBack, y, cardWPx, cardHPx);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.strokeRect(xBack, y, cardWPx, cardHPx);

        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(`Card #${i + 1} BACK (${card.categoryLabel})`, xBack + 8, y - 8);

        loadedCount++;
        if (loadedCount === totalImages) {
          resolve(canvas.toDataURL('image/jpeg', 0.98));
        }
      };
      imgBack.src = card.backDataUrl;
    });
  });
}

/**
 * Generates an Epson L805 / T50 / R280 compatible 2-Card PVC Tray Print Canvas
 * Tray dimension: 140mm x 210mm (or 1650 x 2480 px at 300 DPI)
 */
export function generatePvcTraySheet(card: ProcessedCard, settings: CardSettings): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1650;
    canvas.height = 2480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('EPSON L805 / PVC TRAY PRINT TEMPLATE (300 DPI)', 80, 80);

    const cardWPx = mmToPx(settings.widthMm, 300);
    const cardHPx = mmToPx(settings.heightMm, 300);

    const xPos = Math.round((canvas.width - cardWPx) / 2);
    const yFront = 250;
    const yBack = 1350;

    let loaded = 0;

    const imgFront = new Image();
    imgFront.onload = () => {
      ctx.drawImage(imgFront, xPos, yFront, cardWPx, cardHPx);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(xPos, yFront, cardWPx, cardHPx);

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(`TRAY SLOT 1: FRONT (${card.categoryLabel})`, xPos, yFront - 12);

      loaded++;
      if (loaded === 2) resolve(canvas.toDataURL('image/jpeg', 0.98));
    };
    imgFront.src = card.frontDataUrl;

    const imgBack = new Image();
    imgBack.onload = () => {
      ctx.drawImage(imgBack, xPos, yBack, cardWPx, cardHPx);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(xPos, yBack, cardWPx, cardHPx);

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(`TRAY SLOT 2: BACK (${card.categoryLabel})`, xPos, yBack - 12);

      loaded++;
      if (loaded === 2) resolve(canvas.toDataURL('image/jpeg', 0.98));
    };
    imgBack.src = card.backDataUrl;
  });
}
