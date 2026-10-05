import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Upload,
  RotateCcw,
  RotateCw,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Download,
  Check,
  Sparkles,
  Sliders,
  Crop,
  Layers,
  Palette,
  Eye,
  Eraser,
  Paintbrush,
  Pipette,
  Undo2,
} from 'lucide-react';

interface PhotoStudioProps {
  initialFile?: File | null;
  onApplyPhoto?: (blob: Blob, dataUrl: string) => void;
  onClose?: () => void;
  embedded?: boolean;
}

type AspectRatioMode = 'freeform' | 'passport' | 'square' | 'idcard' | 'banner';
type TouchUpTool = 'view' | 'erase' | 'restore' | 'eyedropper';

interface AspectRatioOption {
  id: AspectRatioMode;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const MAX_DIM = 1200;

export const PhotoStudio: React.FC<PhotoStudioProps> = ({
  initialFile = null,
  onApplyPhoto,
  onClose,
  embedded = false,
}) => {
  const [stage, setStage] = useState<'upload' | 'corners' | 'background'>('upload');
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [cw, setCw] = useState<number>(0);
  const [ch, setCh] = useState<number>(0);
  const [corners, setCorners] = useState<[number, number][]>([]);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);

  // Aspect ratio presets (Freeform + Ready-made standard formats)
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('freeform');

  // Background removal & replacement state
  const [selectedBg, setSelectedBg] = useState<'none' | 'transparent' | 'white' | 'blue' | 'red' | 'custom'>('white');
  const [customBgColor, setCustomBgColor] = useState<string>('#3b82f6');
  const [tolerance, setTolerance] = useState<number>(36);
  const [feather, setFeather] = useState<number>(3);
  const [bgStatus, setBgStatus] = useState<string>('');
  const [processedResultUrl, setProcessedResultUrl] = useState<string>('');
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);

  // Touch-up brush tools state
  const [touchUpTool, setTouchUpTool] = useState<TouchUpTool>('view');
  const [brushSize, setBrushSize] = useState<number>(32);
  const [brushCursor, setBrushCursor] = useState<{ x: number; y: number; visible: boolean; screenRadius: number }>({
    x: 0,
    y: 0,
    visible: false,
    screenRadius: 16,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragIndexRef = useRef<number>(-1);
  const warpedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentFinalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPaintingRef = useRef<boolean>(false);

  // Initialize with file if provided
  useEffect(() => {
    if (initialFile) {
      loadFile(initialFile);
    }
  }, [initialFile]);

  // Redraw corners whenever corners, filters, or sourceImg change
  useEffect(() => {
    if (stage === 'corners' && sourceImg && canvasRef.current && corners.length === 4) {
      redrawCornersCanvas();
    }
  }, [stage, sourceImg, corners, brightness, contrast, saturation]);

  const defaultCornersFor = (width: number, height: number): [number, number][] => [
    [width * 0.08, height * 0.08],
    [width * 0.92, height * 0.08],
    [width * 0.92, height * 0.92],
    [width * 0.08, height * 0.92],
  ];

  const snapCornersToRatio = (mode: AspectRatioMode) => {
    setAspectRatio(mode);
    if (!cw || !ch) return;

    if (mode === 'freeform') {
      return;
    }

    let targetRatio = 1.0; // width / height
    if (mode === 'passport') {
      targetRatio = 35 / 45; // ~0.7778 (35x45mm Indian/International Passport)
    } else if (mode === 'square') {
      targetRatio = 1.0; // 1:1 Square
    } else if (mode === 'idcard') {
      targetRatio = 3 / 4; // 0.75 (3:4 Student & Staff ID Card)
    } else if (mode === 'banner') {
      targetRatio = 16 / 9; // 1.7778 (16:9 Landscape Banner)
    }

    const maxW = cw * 0.86;
    const maxH = ch * 0.86;

    let boxW = maxW;
    let boxH = boxW / targetRatio;

    if (boxH > maxH) {
      boxH = maxH;
      boxW = boxH * targetRatio;
    }

    const left = Math.round((cw - boxW) / 2);
    const top = Math.round((ch - boxH) / 2);
    const right = Math.round(left + boxW);
    const bottom = Math.round(top + boxH);

    setCorners([
      [left, top], // top-left
      [right, top], // top-right
      [right, bottom], // bottom-right
      [left, bottom], // bottom-left
    ]);
  };

  const loadFile = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.round(img.naturalWidth * scale);
      const height = Math.round(img.naturalHeight * scale);

      setCw(width);
      setCh(height);
      setSourceImg(img);
      setCorners(defaultCornersFor(width, height));
      setAspectRatio('freeform');
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setStage('corners');
    };
    img.src = URL.createObjectURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const redrawCornersCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImg) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cw;
    canvas.height = ch;

    // Apply color adjustments
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(sourceImg, 0, 0, cw, ch);
    ctx.filter = 'none';

    // Draw quadrilateral boundary
    ctx.strokeStyle = '#1f6fd6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(corners[i][0], corners[i][1]);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw 4 corner handles
    corners.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1f6fd6';
      ctx.stroke();
    });
  };

  // Dragging event handlers for corners
  const getCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return [(e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy];
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [x, y] = getCanvasPos(e);
    let best = -1;
    let bestDist = 40; // pixel tolerance
    corners.forEach(([cx, cy], i) => {
      const d = Math.hypot(cx - x, cy - y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });

    if (best >= 0) {
      dragIndexRef.current = best;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragIndexRef.current < 0) return;
    const [x, y] = getCanvasPos(e);
    setCorners((prev) => {
      const copy = [...prev] as [number, number][];
      copy[dragIndexRef.current] = [Math.max(0, Math.min(cw, x)), Math.max(0, Math.min(ch, y))];
      return copy;
    });
    setAspectRatio('freeform');
  };

  const handlePointerUp = () => {
    dragIndexRef.current = -1;
  };

  // Rotate source image
  const rotateSource = (direction: 1 | -1) => {
    if (!sourceImg) return;
    const newW = ch;
    const newH = cw;
    const rc = document.createElement('canvas');
    rc.width = newW;
    rc.height = newH;
    const rctx = rc.getContext('2d');
    if (!rctx) return;

    rctx.translate(newW / 2, newH / 2);
    rctx.rotate((direction * Math.PI) / 2);
    rctx.drawImage(sourceImg, -cw / 2, -ch / 2, cw, ch);

    const rotatedImg = new Image();
    rotatedImg.onload = () => {
      setCw(newW);
      setCh(newH);
      setSourceImg(rotatedImg);
      setCorners(defaultCornersFor(newW, newH));
      setAspectRatio('freeform');
    };
    rotatedImg.src = rc.toDataURL();
  };

  // Math for perspective projection
  const solveLinear = (A: number[][], b: number[]) => {
    const n = 8;
    for (let i = 0; i < n; i++) A[i].push(b[i]);
    for (let i = 0; i < n; i++) {
      let maxEl = Math.abs(A[i][i]);
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(A[k][i]) > maxEl) {
          maxEl = Math.abs(A[k][i]);
          maxRow = k;
        }
      }
      [A[i], A[maxRow]] = [A[maxRow], A[i]];
      for (let k = i + 1; k < n; k++) {
        const c = -A[k][i] / A[i][i];
        for (let j = i; j < n + 1; j++) {
          if (i === j) A[k][j] = 0;
          else A[k][j] += c * A[i][j];
        }
      }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = A[i][n] / A[i][i];
      for (let k = i - 1; k >= 0; k--) A[k][n] -= A[k][i] * x[i];
    }
    return x;
  };

  const getPerspectiveTransform = (src: [number, number][], dst: [number, number][]) => {
    const A: number[][] = [];
    const b: number[] = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i];
      const [X, Y] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
      b.push(X);
      A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
      b.push(Y);
    }
    const h = solveLinear(A, b);
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  };

  const applyTransform = (m: number[], x: number, y: number): [number, number] => {
    const d = m[6] * x + m[7] * y + m[8];
    return [(m[0] * x + m[1] * y + m[2]) / d, (m[3] * x + m[4] * y + m[5]) / d];
  };

  const sampleBilinear = (data: Uint8ClampedArray, w: number, h: number, x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) return [255, 255, 255, 255];
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const fx = x - x0;
    const fy = y - y0;

    const px = (xx: number, yy: number) => {
      const idx = (yy * w + xx) * 4;
      return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
    };

    const p00 = px(x0, y0);
    const p10 = px(x1, y0);
    const p01 = px(x0, y1);
    const p11 = px(x1, y1);
    const out = [0, 0, 0, 0];
    for (let c = 0; c < 4; c++) {
      const top = p00[c] * (1 - fx) + p10[c] * fx;
      const bot = p01[c] * (1 - fx) + p11[c] * fx;
      out[c] = top * (1 - fy) + bot * fy;
    }
    return out;
  };

  const computeWarpedCanvas = (): HTMLCanvasElement => {
    const wTop = Math.hypot(corners[1][0] - corners[0][0], corners[1][1] - corners[0][1]);
    const wBot = Math.hypot(corners[2][0] - corners[3][0], corners[2][1] - corners[3][1]);
    const hLeft = Math.hypot(corners[3][0] - corners[0][0], corners[3][1] - corners[0][1]);
    const hRight = Math.hypot(corners[2][0] - corners[1][0], corners[2][1] - corners[1][1]);

    const outW = Math.max(100, Math.min(1200, Math.round(Math.max(wTop, wBot))));
    const outH = Math.max(100, Math.min(1200, Math.round(Math.max(hLeft, hRight))));

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = cw;
    srcCanvas.height = ch;
    const sctx = srcCanvas.getContext('2d')!;
    sctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    sctx.drawImage(sourceImg!, 0, 0, cw, ch);
    const srcData = sctx.getImageData(0, 0, cw, ch).data;

    const dstPts: [number, number][] = [
      [0, 0],
      [outW, 0],
      [outW, outH],
      [0, outH],
    ];
    const M = getPerspectiveTransform(dstPts, corners);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    const octx = outCanvas.getContext('2d')!;
    const outImg = octx.createImageData(outW, outH);

    for (let dy = 0; dy < outH; dy++) {
      for (let dx = 0; dx < outW; dx++) {
        const [sx, sy] = applyTransform(M, dx, dy);
        const p = sampleBilinear(srcData, cw, ch, sx, sy);
        const di = (dy * outW + dx) * 4;
        outImg.data[di] = p[0];
        outImg.data[di + 1] = p[1];
        outImg.data[di + 2] = p[2];
        outImg.data[di + 3] = p[3];
      }
    }
    octx.putImageData(outImg, 0, 0);
    return outCanvas;
  };

  // --- AUTOMATIC SEGMENTATION & BACKGROUND REMOVAL ENGINE ---

  // Edge feathering box filter algorithm for soft hair and natural silhouette boundaries
  const featherAlphaMask = (srcMask: Uint8Array, w: number, h: number, radius: number): Uint8Array => {
    if (radius <= 0) return new Uint8Array(srcMask);

    const total = w * h;
    const temp = new Float32Array(total);
    const output = new Uint8Array(total);
    const r = Math.min(12, Math.max(1, Math.round(radius)));

    for (let y = 0; y < h; y++) {
      const rowOffset = y * w;
      let sum = 0;
      const windowSize = 2 * r + 1;

      for (let x = -r; x <= r; x++) {
        const px = Math.min(w - 1, Math.max(0, x));
        sum += srcMask[rowOffset + px];
      }

      for (let x = 0; x < w; x++) {
        temp[rowOffset + x] = sum / windowSize;
        const left = Math.max(0, x - r);
        const right = Math.min(w - 1, x + r + 1);
        sum += srcMask[rowOffset + right] - srcMask[rowOffset + left];
      }
    }

    for (let x = 0; x < w; x++) {
      let sum = 0;
      const windowSize = 2 * r + 1;

      for (let y = -r; y <= r; y++) {
        const py = Math.min(h - 1, Math.max(0, y));
        sum += temp[py * w + x];
      }

      for (let y = 0; y < h; y++) {
        output[y * w + x] = Math.min(255, Math.max(0, Math.round(sum / windowSize)));
        const top = Math.max(0, y - r);
        const bottom = Math.min(h - 1, y + r + 1);
        sum += temp[bottom * w + x] - temp[top * w + x];
      }
    }

    return output;
  };

  // Automatic portrait segmentation using perimeter color distribution and unbounded flood fill
  const computeSubjectSegmentation = (
    warpedCanvas: HTMLCanvasElement,
    tol: number,
    fth: number
  ): HTMLCanvasElement => {
    const w = warpedCanvas.width;
    const h = warpedCanvas.height;
    const total = w * h;

    const ctx = warpedCanvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // 1. Sample perimeter background color distribution (corners + border pixels)
    const samples: [number, number, number][] = [];
    const addSample = (x: number, y: number) => {
      const idx = (y * w + x) * 4;
      samples.push([data[idx], data[idx + 1], data[idx + 2]]);
    };

    const stepX = Math.max(1, Math.floor(w / 35));
    const stepY = Math.max(1, Math.floor(h / 35));

    // Top border strips (y = 0..15% height)
    for (let x = 0; x < w; x += stepX) {
      addSample(x, 0);
      addSample(x, Math.min(h - 1, Math.floor(h * 0.05)));
      addSample(x, Math.min(h - 1, Math.floor(h * 0.1)));
    }

    // Left and right border strips (shoulders down to 60% of height)
    for (let y = 0; y < Math.floor(h * 0.6); y += stepY) {
      addSample(0, y);
      addSample(Math.min(w - 1, Math.floor(w * 0.05)), y);
      addSample(w - 1, y);
      addSample(Math.max(0, Math.floor(w * 0.95)), y);
    }

    // Mean background color
    let sumR = 0, sumG = 0, sumB = 0;
    for (const [r, g, b] of samples) {
      sumR += r;
      sumG += g;
      sumB += b;
    }
    const meanR = sumR / samples.length;
    const meanG = sumG / samples.length;
    const meanB = sumB / samples.length;

    let varDist = 0;
    for (const [r, g, b] of samples) {
      varDist += Math.hypot(r - meanR, g - meanG, b - meanB);
    }
    const avgDist = varDist / samples.length;

    // Adaptive tolerance threshold based on slider
    const colorThreshold = tol * 2.8 + avgDist * 0.5;
    const neighborThreshold = tol * 1.8;

    // Binary mask: 0 = background, 255 = foreground subject
    const mask = new Uint8Array(total);
    mask.fill(255);

    // BFS queue for border-connected flood fill (unbounded)
    const visited = new Uint8Array(total);
    const queueX = new Int32Array(total);
    const queueY = new Int32Array(total);
    let head = 0;
    let tail = 0;

    const pushQueue = (x: number, y: number) => {
      const idx = y * w + x;
      if (visited[idx]) return;
      visited[idx] = 1;
      mask[idx] = 0;
      queueX[tail] = x;
      queueY[tail] = y;
      tail++;
    };

    // Seed from perimeter edges
    for (let x = 0; x < w; x++) {
      pushQueue(x, 0);
    }
    for (let y = 0; y < Math.floor(h * 0.7); y++) {
      pushQueue(0, y);
      pushQueue(w - 1, y);
    }
    for (let x = 0; x < Math.floor(w * 0.15); x++) {
      pushQueue(x, h - 1);
    }
    for (let x = Math.floor(w * 0.85); x < w; x++) {
      pushQueue(x, h - 1);
    }

    while (head < tail) {
      const cx = queueX[head];
      const cy = queueY[head];
      head++;

      const cIdx = (cy * w + cx) * 4;
      const cr = data[cIdx];
      const cg = data[cIdx + 1];
      const cb = data[cIdx + 2];

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nIdx = ny * w + nx;
        if (visited[nIdx]) continue;

        const pIdx = nIdx * 4;
        const nr = data[pIdx];
        const ng = data[pIdx + 1];
        const nb = data[pIdx + 2];

        const distToBg = Math.hypot(nr - meanR, ng - meanG, nb - meanB);
        const distToCur = Math.hypot(nr - cr, ng - cg, nb - cb);

        // Edge gradient stop: stops at sharp contrast boundaries
        if (distToBg <= colorThreshold && distToCur <= neighborThreshold) {
          visited[nIdx] = 1;
          mask[nIdx] = 0; // Marked as background
          queueX[tail] = nx;
          queueY[tail] = ny;
          tail++;
        }
      }
    }

    // 2. Feather the mask edges
    const feathered = featherAlphaMask(mask, w, h, fth);

    // 3. Create mutable maskCanvas (where white = subject, transparent = background)
    const mCanvas = document.createElement('canvas');
    mCanvas.width = w;
    mCanvas.height = h;
    const mCtx = mCanvas.getContext('2d')!;
    const mImgData = mCtx.createImageData(w, h);
    const mData = mImgData.data;

    for (let i = 0; i < total; i++) {
      const di = i * 4;
      const alphaVal = feathered[i];
      mData[di] = 255;
      mData[di + 1] = 255;
      mData[di + 2] = 255;
      mData[di + 3] = alphaVal; // Soft alpha mask
    }
    mCtx.putImageData(mImgData, 0, 0);

    return mCanvas;
  };

  // Fast compositor that draws foreground onto chosen background
  const compositeOutput = useCallback(
    (
      fgCanvas: HTMLCanvasElement,
      bgChoice: 'none' | 'transparent' | 'white' | 'blue' | 'red' | 'custom',
      customHex: string,
      warpedCanvas: HTMLCanvasElement
    ): HTMLCanvasElement => {
      const w = fgCanvas.width;
      const h = fgCanvas.height;
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ctx = out.getContext('2d')!;

      if (bgChoice === 'none') {
        // Original unedited photo
        ctx.drawImage(warpedCanvas, 0, 0);
        return out;
      }

      if (bgChoice === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      } else if (bgChoice === 'blue') {
        ctx.fillStyle = '#2d5fa8';
        ctx.fillRect(0, 0, w, h);
      } else if (bgChoice === 'red') {
        ctx.fillStyle = '#b83a3a';
        ctx.fillRect(0, 0, w, h);
      } else if (bgChoice === 'custom') {
        ctx.fillStyle = customHex || '#3b82f6';
        ctx.fillRect(0, 0, w, h);
      }
      // For 'transparent', start clean

      // Draw isolated subject over background
      ctx.drawImage(fgCanvas, 0, 0);
      return out;
    },
    []
  );

  // Re-composite from the mutable maskCanvasRef
  const recompositeFromMask = useCallback(() => {
    const warped = warpedCanvasRef.current;
    const mCanvas = maskCanvasRef.current;
    if (!warped || !mCanvas) return;
    const w = warped.width;
    const h = warped.height;

    // Create masked foreground
    const fg = document.createElement('canvas');
    fg.width = w;
    fg.height = h;
    const fgCtx = fg.getContext('2d')!;
    fgCtx.drawImage(warped, 0, 0);
    fgCtx.globalCompositeOperation = 'destination-in';
    fgCtx.drawImage(mCanvas, 0, 0);

    fgCanvasRef.current = fg;

    // Composite onto background
    const output = compositeOutput(fg, selectedBg, customBgColor, warped);
    currentFinalCanvasRef.current = output;
    drawToPreview(output);
    updateProcessedOutputs(output);
  }, [compositeOutput, selectedBg, customBgColor]);

  const drawToPreview = (canvas: HTMLCanvasElement) => {
    const pv = bgPreviewCanvasRef.current;
    if (!pv) return;
    pv.width = canvas.width;
    pv.height = canvas.height;
    const ctx = pv.getContext('2d');
    if (!ctx) return;

    // Draw transparent checkerboard background
    const tileSize = Math.max(12, Math.round(canvas.width / 36));
    for (let y = 0; y < pv.height; y += tileSize) {
      for (let x = 0; x < pv.width; x += tileSize) {
        ctx.fillStyle = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0 ? '#e2e8f0' : '#ffffff';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
    ctx.drawImage(canvas, 0, 0);
  };

  const updateProcessedOutputs = (canvas: HTMLCanvasElement) => {
    canvas.toBlob((blob) => {
      if (blob) {
        setProcessedBlob(blob);
        const url = URL.createObjectURL(blob);
        setProcessedResultUrl(url);
      }
    }, 'image/png');
  };

  // Transition from Stage 2 (Corners) to Stage 3 (Background)
  const handleNextToBg = () => {
    const warped = computeWarpedCanvas();
    warpedCanvasRef.current = warped;

    setBgStatus('Detecting subject and removing background...');
    setStage('background');
    setTouchUpTool('view');

    setTimeout(() => {
      // Run automatic segmentation
      const mCanvas = computeSubjectSegmentation(warped, tolerance, feather);
      maskCanvasRef.current = mCanvas;

      // Extract masked foreground
      const fg = document.createElement('canvas');
      fg.width = warped.width;
      fg.height = warped.height;
      const fgCtx = fg.getContext('2d')!;
      fgCtx.drawImage(warped, 0, 0);
      fgCtx.globalCompositeOperation = 'destination-in';
      fgCtx.drawImage(mCanvas, 0, 0);
      fgCanvasRef.current = fg;

      // Composite with default 'white' studio background
      const output = compositeOutput(fg, 'white', customBgColor, warped);
      currentFinalCanvasRef.current = output;
      setSelectedBg('white');
      drawToPreview(output);
      updateProcessedOutputs(output);
      setBgStatus('Subject isolated. Use Erase / Restore brush or Eyedropper if any background remains.');
    }, 40);
  };

  // Handle switching background color presets
  const handleSelectBackground = (choice: 'none' | 'transparent' | 'white' | 'blue' | 'red' | 'custom') => {
    setSelectedBg(choice);
    const warped = warpedCanvasRef.current;
    const fg = fgCanvasRef.current;
    if (!warped || !fg) return;

    const output = compositeOutput(fg, choice, customBgColor, warped);
    currentFinalCanvasRef.current = output;
    drawToPreview(output);
    updateProcessedOutputs(output);

    const labels: Record<string, string> = {
      none: 'Original photo without background removal',
      transparent: 'Transparent PNG cutout ready for download or lamination',
      white: 'Studio White standard (Passport / Official ID)',
      blue: 'Institutional Blue standard (School & College ID)',
      red: 'Passport Red standard (Visa & Official format)',
      custom: `Custom background color (${customBgColor}) applied`,
    };
    setBgStatus(labels[choice] || 'Background updated.');
  };

  // Handle custom color change
  const handleCustomColorChange = (color: string) => {
    setCustomBgColor(color);
    if (selectedBg !== 'custom') {
      setSelectedBg('custom');
    }
    const warped = warpedCanvasRef.current;
    const fg = fgCanvasRef.current;
    if (!warped || !fg) return;

    const output = compositeOutput(fg, 'custom', color, warped);
    currentFinalCanvasRef.current = output;
    drawToPreview(output);
    updateProcessedOutputs(output);
    setBgStatus(`Custom color ${color} applied.`);
  };

  // Re-run automatic segmentation with current tolerance
  const handleRerunCutout = () => {
    const warped = warpedCanvasRef.current;
    if (!warped) return;
    setBgStatus('Re-running automatic subject isolation...');

    const mCanvas = computeSubjectSegmentation(warped, tolerance, feather);
    maskCanvasRef.current = mCanvas;
    recompositeFromMask();
    setBgStatus(`Cutout recomputed with ${tolerance}% sensitivity.`);
  };

  // --- INTERACTIVE ERASE & RESTORE BRUSH ENGINE ---

  const getPreviewCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number; rect: DOMRect } | null => {
    const canvas = bgPreviewCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y, rect };
  };

  // Paint Erase or Restore directly on mutable maskCanvas
  const paintBrushAt = (x: number, y: number, mode: 'erase' | 'restore') => {
    const mCanvas = maskCanvasRef.current;
    if (!mCanvas) return;
    const mCtx = mCanvas.getContext('2d')!;

    const rad = Math.max(4, Math.round(brushSize / 2));
    const grad = mCtx.createRadialGradient(x, y, 0, x, y, rad);

    if (mode === 'erase') {
      // Erase: Wipe out opacity from mask
      mCtx.globalCompositeOperation = 'destination-out';
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.9)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mCtx.fillStyle = grad;
      mCtx.beginPath();
      mCtx.arc(x, y, rad, 0, Math.PI * 2);
      mCtx.fill();
    } else if (mode === 'restore') {
      // Restore: Paint full white opacity back
      mCtx.globalCompositeOperation = 'source-over';
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      mCtx.fillStyle = grad;
      mCtx.beginPath();
      mCtx.arc(x, y, rad, 0, Math.PI * 2);
      mCtx.fill();
    }

    recompositeFromMask();
  };

  // Eyedropper click-to-purge: sample background color at clicked point and purge connected matching pixels
  const purgeBackgroundColorAt = (targetX: number, targetY: number) => {
    const warped = warpedCanvasRef.current;
    const mCanvas = maskCanvasRef.current;
    if (!warped || !mCanvas) return;

    const w = warped.width;
    const h = warped.height;
    const total = w * h;

    const wCtx = warped.getContext('2d')!;
    const wData = wCtx.getImageData(0, 0, w, h).data;

    const startX = Math.max(0, Math.min(w - 1, Math.round(targetX)));
    const startY = Math.max(0, Math.min(h - 1, Math.round(targetY)));
    const startIdx = (startY * w + startX) * 4;

    const targetR = wData[startIdx];
    const targetG = wData[startIdx + 1];
    const targetB = wData[startIdx + 2];

    const mCtx = mCanvas.getContext('2d')!;
    const mImgData = mCtx.getImageData(0, 0, w, h);
    const mData = mImgData.data;

    // Purge connected or similar pixels within tolerance
    const colorDistThreshold = tolerance * 2.2;
    const visited = new Uint8Array(total);
    const queueX = new Int32Array(total);
    const queueY = new Int32Array(total);
    let head = 0;
    let tail = 0;

    const push = (x: number, y: number) => {
      const idx = y * w + x;
      if (visited[idx]) return;
      visited[idx] = 1;
      queueX[tail] = x;
      queueY[tail] = y;
      tail++;
    };

    push(startX, startY);

    while (head < tail) {
      const cx = queueX[head];
      const cy = queueY[head];
      head++;

      const cIdx = cy * w + cx;
      const pIdx = cIdx * 4;

      // Erase from mask
      mData[pIdx + 3] = 0;

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nIdx = ny * w + nx;
        if (visited[nIdx]) continue;

        const npIdx = nIdx * 4;
        const nr = wData[npIdx];
        const ng = wData[npIdx + 1];
        const nb = wData[npIdx + 2];

        const dist = Math.hypot(nr - targetR, ng - targetG, nb - targetB);
        if (dist <= colorDistThreshold) {
          visited[nIdx] = 1;
          queueX[tail] = nx;
          queueY[tail] = ny;
          tail++;
        }
      }
    }

    mCtx.putImageData(mImgData, 0, 0);
    recompositeFromMask();
    setBgStatus(`Purged background color at clicked position (RGB ${targetR}, ${targetG}, ${targetB}).`);
  };

  // Pointer event handlers for Stage 3 canvas
  const handleStage3PointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (touchUpTool === 'view') return;

    const coords = getPreviewCanvasCoords(e);
    if (!coords) return;

    if (touchUpTool === 'eyedropper') {
      purgeBackgroundColorAt(coords.x, coords.y);
      return;
    }

    if (touchUpTool === 'erase' || touchUpTool === 'restore') {
      isPaintingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      paintBrushAt(coords.x, coords.y, touchUpTool);
    }
  };

  const handleStage3PointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getPreviewCanvasCoords(e);
    if (!coords) {
      setBrushCursor((prev) => ({ ...prev, visible: false }));
      return;
    }

    // Update floating circular brush cursor
    const canvas = bgPreviewCanvasRef.current;
    if (canvas) {
      const scaleScreen = coords.rect.width / canvas.width;
      const screenR = (brushSize / 2) * scaleScreen;
      setBrushCursor({
        x: e.clientX,
        y: e.clientY,
        visible: touchUpTool === 'erase' || touchUpTool === 'restore',
        screenRadius: Math.max(4, screenR),
      });
    }

    if (!isPaintingRef.current) return;
    if (touchUpTool === 'erase' || touchUpTool === 'restore') {
      paintBrushAt(coords.x, coords.y, touchUpTool);
    }
  };

  const handleStage3PointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPaintingRef.current = false;
  };

  const handleStage3PointerLeave = () => {
    isPaintingRef.current = false;
    setBrushCursor((prev) => ({ ...prev, visible: false }));
  };

  const handleApplyFinal = () => {
    if (processedBlob && processedResultUrl && onApplyPhoto) {
      onApplyPhoto(processedBlob, processedResultUrl);
    }
  };

  // Aspect ratio option list matching reference image style
  const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
    {
      id: 'freeform',
      label: 'Freeform',
      sublabel: '4-Corner Warp',
      icon: (
        <div className="w-5 h-5 relative flex items-center justify-center">
          <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-current" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-current" />
          <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-current" />
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-current" />
        </div>
      ),
    },
    {
      id: 'passport',
      label: '35×45 mm',
      sublabel: 'Passport',
      icon: <div className="w-4 h-5.5 rounded-xs border-2 border-current" />,
    },
    {
      id: 'square',
      label: '1:1',
      sublabel: 'Square',
      icon: <div className="w-5 h-5 rounded-xs border-2 border-current" />,
    },
    {
      id: 'idcard',
      label: '3:4',
      sublabel: 'Student ID',
      icon: <div className="w-4 h-5 rounded-xs border-2 border-current" />,
    },
    {
      id: 'banner',
      label: '16:9',
      sublabel: 'Banner',
      icon: <div className="w-6.5 h-4 rounded-xs border-2 border-current" />,
    },
  ];

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${
        embedded ? 'p-4' : 'p-6 sm:p-8 max-w-4xl mx-auto'
      }`}
    >
      {/* Studio Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#e6197f] flex items-center justify-center text-xl font-bold">
            🖼️
          </div>
          <div>
            <h2 className="font-outfit font-extrabold text-xl text-slate-900 leading-tight">
              Photo Studio & Warper
            </h2>
            <p className="text-xs text-slate-500">
              Crop, 4-corner perspective warp, color balance & studio-grade background removal
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel / Close
          </button>
        )}
      </div>

      {/* Stage 1: Upload */}
      {stage === 'upload' && (
        <div className="py-12 px-4 text-center">
          <label className="cursor-pointer group block max-w-md mx-auto p-10 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#1f6fd6] bg-slate-50 hover:bg-blue-50/40 transition-all">
            <input type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />
            <div className="w-16 h-16 rounded-2xl bg-white text-[#1f6fd6] shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="font-outfit font-bold text-base text-slate-800">
              Upload Student or Document Photo
            </h3>
            <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, or WEBP up to 25MB</p>
            <span className="inline-block mt-4 px-4 py-2 rounded-xl bg-[#1f6fd6] text-white text-xs font-bold shadow-sm">
              Choose Photo from Device
            </span>
          </label>
        </div>
      )}

      {/* Stage 2: 4-Corner Straighten & Color Adjustment */}
      {stage === 'corners' && (
        <div className="py-6 space-y-6">
          {/* Top Instruction & Utilities Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-[#1f6fd6] shrink-0" />
              <span>
                <strong>Drag the 4 corner blue dots</strong> to align with photo edges, or choose a ready-made ratio below.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => rotateSource(-1)}
                className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 flex items-center gap-1 font-semibold shadow-2xs"
                title="Rotate Left"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>⟲ Rotate</span>
              </button>
              <button
                onClick={() => rotateSource(1)}
                className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 flex items-center gap-1 font-semibold shadow-2xs"
                title="Rotate Right"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>⟳ Rotate</span>
              </button>
              <button
                onClick={() => {
                  setAspectRatio('freeform');
                  setCorners(defaultCornersFor(cw, ch));
                }}
                className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 flex items-center gap-1 font-semibold shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* READY-MADE ASPECT RATIO SELECTOR (Matching User Reference Image) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-outfit font-bold text-xs uppercase tracking-wider text-slate-500 block">
                  Aspect ratio
                </span>
                <span className="text-xs text-slate-500">
                  Pick a standard format to auto-snap or fine-tune corners freely
                </span>
              </div>

              {aspectRatio !== 'freeform' && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Snap Active · Handles still adjustable
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {ASPECT_RATIO_OPTIONS.map((opt) => {
                const isActive = aspectRatio === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => snapCornersToRatio(opt.id)}
                    className={`flex flex-col items-center justify-center p-2.5 sm:p-3 min-w-[76px] sm:min-w-[84px] h-[72px] sm:h-[78px] rounded-2xl border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#7c3aed] bg-purple-50/60 text-[#7c3aed] ring-2 ring-purple-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-center text-current">{opt.icon}</div>
                    <span className="text-[11px] font-bold leading-none">{opt.label}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 leading-none">{opt.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="flex justify-center bg-slate-100 p-2 sm:p-4 rounded-2xl border border-slate-200 overflow-hidden">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="max-h-[50vh] max-w-full rounded-lg shadow-md cursor-crosshair touch-none select-none"
            />
          </div>

          {/* Image Adjustments Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Brightness</span>
                <span className="font-mono">{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-[#1f6fd6]"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Contrast</span>
                <span className="font-mono">{contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-[#1f6fd6]"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Saturation</span>
                <span className="font-mono">{saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-[#1f6fd6]"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStage('upload')}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Choose different photo</span>
            </button>

            <button
              onClick={handleNextToBg}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#1f6fd6] hover:bg-[#1a5cb3] text-white shadow-md flex items-center gap-2"
            >
              <span>Next: Remove Background</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stage 3: Background Removal & Color Replacement */}
      {stage === 'background' && (
        <div className="py-6 space-y-6">
          {/* Background Presets Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#e6197f]" />
                  <span>Choose Background Replacement</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a standard studio backdrop, transparent PNG, or custom color
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                <span>Studio Cutout Engine Active</span>
              </div>
            </div>

            {/* Background Color Pickers */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* 1. Original */}
              <button
                type="button"
                onClick={() => handleSelectBackground('none')}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-2 transition-all ${
                  selectedBg === 'none'
                    ? 'border-[#1f6fd6] bg-blue-50/70 text-[#1f6fd6] ring-2 ring-[#1f6fd6]/20'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title="Keep original background"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Original</span>
              </button>

              {/* 2. Transparent */}
              <button
                type="button"
                onClick={() => handleSelectBackground('transparent')}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-2 transition-all ${
                  selectedBg === 'transparent'
                    ? 'border-[#1f6fd6] bg-blue-50/70 text-[#1f6fd6] ring-2 ring-[#1f6fd6]/20'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title="Transparent cutout PNG"
              >
                <div
                  className="w-4 h-4 rounded-sm border border-slate-300"
                  style={{
                    background: 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 0/6px 6px',
                  }}
                />
                <span>Transparent</span>
              </button>

              {/* 3. Studio White */}
              <button
                type="button"
                onClick={() => handleSelectBackground('white')}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-2 transition-all ${
                  selectedBg === 'white'
                    ? 'border-[#1f6fd6] bg-blue-50/70 text-[#1f6fd6] ring-2 ring-[#1f6fd6]/20'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title="Passport White standard"
              >
                <div className="w-4 h-4 rounded-sm bg-white border border-slate-300 shadow-2xs" />
                <span>Studio White</span>
              </button>

              {/* 4. ID Blue */}
              <button
                type="button"
                onClick={() => handleSelectBackground('blue')}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-2 transition-all ${
                  selectedBg === 'blue'
                    ? 'border-[#1f6fd6] bg-blue-50/70 text-[#1f6fd6] ring-2 ring-[#1f6fd6]/20'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title="Standard Student & Staff ID Blue"
              >
                <div className="w-4 h-4 rounded-sm bg-[#2d5fa8] border border-blue-900 shadow-2xs" />
                <span>ID Blue</span>
              </button>

              {/* 5. Passport Red */}
              <button
                type="button"
                onClick={() => handleSelectBackground('red')}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-2 transition-all ${
                  selectedBg === 'red'
                    ? 'border-[#1f6fd6] bg-blue-50/70 text-[#1f6fd6] ring-2 ring-[#1f6fd6]/20'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title="Official Passport Red"
              >
                <div className="w-4 h-4 rounded-sm bg-[#b83a3a] border border-red-900 shadow-2xs" />
                <span>Passport Red</span>
              </button>

              {/* 6. Custom Color */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all ${
                  selectedBg === 'custom'
                    ? 'border-[#1f6fd6] bg-blue-50/70 ring-2 ring-[#1f6fd6]/20'
                    : 'border-slate-300 bg-white'
                }`}
              >
                <label className="cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <span>Custom Color</span>
                </label>
                <span className="font-mono text-[11px] text-slate-500 uppercase">{customBgColor}</span>
              </div>
            </div>

            {/* TOUCH-UP REFINEMENT BRUSH & CUTOUT TOOLS */}
            <div className="pt-4 border-t border-slate-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-outfit font-bold text-xs uppercase tracking-wider text-slate-600 block">
                  Interactive Touch-Up Tools
                </span>
                <span className="text-[11px] text-slate-500">
                  Click Erase to wipe away any leftover background, or Restore to bring back hair/clothing
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* 1. View / Pan Mode */}
                <button
                  type="button"
                  onClick={() => setTouchUpTool('view')}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition-all ${
                    touchUpTool === 'view'
                      ? 'border-[#1f6fd6] bg-blue-50 text-[#1f6fd6] ring-2 ring-[#1f6fd6]/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title="View mode"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>

                {/* 2. Erase Brush */}
                <button
                  type="button"
                  onClick={() => setTouchUpTool('erase')}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition-all ${
                    touchUpTool === 'erase'
                      ? 'border-rose-600 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-rose-50/50 hover:text-rose-700'
                  }`}
                  title="Erase leftover background"
                >
                  <Eraser className="w-3.5 h-3.5 text-rose-600" />
                  <span>🧹 Erase Brush</span>
                </button>

                {/* 3. Restore Brush */}
                <button
                  type="button"
                  onClick={() => setTouchUpTool('restore')}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition-all ${
                    touchUpTool === 'restore'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50/50 hover:text-emerald-700'
                  }`}
                  title="Restore accidentally erased hair or clothing"
                >
                  <Paintbrush className="w-3.5 h-3.5 text-emerald-600" />
                  <span>🖌️ Restore Brush</span>
                </button>

                {/* 4. Eyedropper Purge */}
                <button
                  type="button"
                  onClick={() => setTouchUpTool('eyedropper')}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition-all ${
                    touchUpTool === 'eyedropper'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700'
                  }`}
                  title="Click anywhere on background to purge that color"
                >
                  <Pipette className="w-3.5 h-3.5 text-indigo-600" />
                  <span>🎯 Eyedropper Purge</span>
                </button>

                {/* Reset to Auto Cutout */}
                <button
                  type="button"
                  onClick={handleRerunCutout}
                  className="ml-auto px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  title="Re-run automatic cutout"
                >
                  <Undo2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Re-run Auto Cutout</span>
                </button>
              </div>

              {/* Sliders: Brush Size & Cutout Sensitivity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-rose-600" />
                      <span>Brush Size</span>
                    </span>
                    <span className="font-mono text-rose-700">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-rose-600"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Controls brush diameter for Erase and Restore tools
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#1f6fd6]" />
                      <span>Auto Cutout Sensitivity</span>
                    </span>
                    <span className="font-mono text-blue-700">{tolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="75"
                    value={tolerance}
                    onChange={(e) => {
                      const newTol = Number(e.target.value);
                      setTolerance(newTol);
                      const warped = warpedCanvasRef.current;
                      if (warped) {
                        const mCanvas = computeSubjectSegmentation(warped, newTol, feather);
                        maskCanvasRef.current = mCanvas;
                        recompositeFromMask();
                      }
                    }}
                    className="w-full accent-[#1f6fd6]"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Adjusts background color range for auto cutout & eyedropper
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {bgStatus ? (
                <p className="text-xs text-slate-600 font-medium italic">{bgStatus}</p>
              ) : (
                <span />
              )}
            </div>
          </div>

          {/* Interactive Preview Canvas with Live Brush Cursor */}
          <div className="relative flex justify-center bg-slate-900/5 p-4 rounded-2xl border border-slate-200 select-none overflow-hidden">
            <canvas
              ref={bgPreviewCanvasRef}
              onPointerDown={handleStage3PointerDown}
              onPointerMove={handleStage3PointerMove}
              onPointerUp={handleStage3PointerUp}
              onPointerLeave={handleStage3PointerLeave}
              className={`max-h-[50vh] max-w-full rounded-lg shadow-lg border border-slate-200 touch-none ${
                touchUpTool === 'erase' || touchUpTool === 'restore'
                  ? 'cursor-none'
                  : touchUpTool === 'eyedropper'
                  ? 'cursor-crosshair'
                  : 'cursor-default'
              }`}
            />

            {/* Live Circular Brush Cursor Overlay */}
            {brushCursor.visible && (
              <div
                className="fixed pointer-events-none rounded-full border-2 border-rose-500 bg-rose-500/15 -translate-x-1/2 -translate-y-1/2 z-50 transition-none shadow-xs"
                style={{
                  left: `${brushCursor.x}px`,
                  top: `${brushCursor.y}px`,
                  width: `${brushCursor.screenRadius * 2}px`,
                  height: `${brushCursor.screenRadius * 2}px`,
                  borderColor: touchUpTool === 'restore' ? '#10b981' : '#f43f5e',
                  backgroundColor: touchUpTool === 'restore' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                }}
              />
            )}
          </div>

          {/* Final Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStage('corners')}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Adjustments</span>
            </button>

            <div className="flex items-center gap-2">
              {processedResultUrl && (
                <a
                  href={processedResultUrl}
                  download={selectedBg === 'transparent' ? 'ai-printers-cutout.png' : 'ai-printers-studio-photo.png'}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#1f6fd6]" />
                  <span>Download PNG</span>
                </a>
              )}

              {onApplyPhoto && (
                <button
                  onClick={handleApplyFinal}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#22c35e] hover:bg-[#1eb355] text-white shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Use This Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
