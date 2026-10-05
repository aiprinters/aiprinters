# Precision Aadhaar Border-Free Inset: Left & Bottom Clean Cut

A surgical edge-detection update to eliminate visible black printed border lines from both the left edge and bottom edge of the Front Aadhaar card, with identical inside-border flush cropping applied to the Back card, keeping the red helpline footer and red baseline intact without outline artifacts.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following adjustments were directly confirmed during the clarification interview:

- **Confirmed Decision 1 (4-6px Inset to Exclude Black Border Lines)**:
  - Detect and crop strictly inside the printed black border lines on the left edge ($X$) and bottom edge ($Y$).
  - For the Front Card left edge: Inset the starting $X$ boundary by $+5\text{px}$ inside the detected black vertical border line (advancing from $X \approx 7.6\%$ to $X \approx 8.0\%$).
  - For the Front Card bottom edge: Inset the ending $Y$ boundary by $-5\text{px}$ so the crop ends cleanly inside the bottom black border stroke, leaving the red baseline (*"मेरा आधार, मेरी पहचान"*) flush at the bottom edge with zero black line artifact.
- **Confirmed Decision 2 (Apply Symmetrical Inside-Border Crop to Back Side)**:
  - Back Card left edge: Inset $+5\text{px}$ past the vertical center dashed cut line.
  - Back Card right edge: Inset $-5\text{px}$ inside the right outer black border line.
  - Back Card bottom edge: Inset $-5\text{px}$ inside the bottom black line so the red 1947 helpline bar is cleanly framed with zero black footer artifact.
- **Confirmed Decision 3 (Preset & Manual Tuning Synchronization)**:
  - Synchronize both the auto-cropper `findAadhaarCardBounds` and the interactive preset button `UIDAI Aadhaar (Marked Red Boxes)` with the new borderless inset coordinates.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Portrait A4 UIDAI e-Aadhaar                     │
│                                                                        │
│                  [ Top Section: Demographic & Letter ]                 │
│                                                                        │
│ - - - - - - - - - - - [ Scissor Cut Line ] - - - - - - - - - - - - - - │
│                                                                        │
│   ┌───────────────────────────┐ : ┌───────────────────────────┐        │
│   │ ◄── Inset +5px (No Black) │ : │ ◄── Inset +5px (No Dash)  │        │
│   │                           │ : │                           │        │
│   │         FRONT CARD        │ : │         BACK CARD         │        │
│   │                           │ : │                           │        │
│   │ [Red Baseline: Flush]     │ : │ [1947 Helpline Bar]       │        │
│   │ ▲── Inset -5px (No Black) │ : │ ▲── Inset -5px (No Black) │        │
│   └───────────────────────────┘ : └───────────────────────────┘        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Proposed Implementation Details

#### 1. `src/utils/pvcCardProcessor.ts` (`findAadhaarCardBounds`):
- **Left Vertical Border Scanner**:
  - Scan horizontal slice near $X = 7.0\% - 8.5\%$ to pinpoint the exact pixel column of the printed black outer boundary line.
  - Set `frontLeft = detectedLeftLine + 5` (inset strictly past the black line).
- **Bottom Horizontal Border Scanner**:
  - Scan vertical slice near the bottom of Front and Back cards ($Y = 91.0\% - 93.5\%$) to locate the lowest black border rule.
  - Set `finalCh` to terminate $5\text{px}$ before this black border line, keeping the red baseline and helpline footer crisp and flush.
- **Back Card Symmetry**:
  - Scan right vertical slice near $X = 91.5\% - 93.0\%$ to detect the right printed black border line.
  - Set `backRight = detectedRightLine - 5`.
- **Top Scissor Margin**:
  - Maintain the clean start $8\text{px}$ below the top horizontal dashed cut line.

#### 2. `src/components/PvcCardMaker.tsx`:
- Update `applyPreset('aadhaar')` to immediately pull the updated inset boundaries.
- Ensure the live canvas preview and manual adjust modal sliders reflect the clean border-free crop boxes.

---

### 2. Verification Plan

1. **Compilation & Linting**:
   - Run `compile_applet` and `lint_applet` to verify clean build with zero TypeScript errors.
2. **Visual & Edge Verification**:
   - Verify Front Card has zero black border line on the left side.
   - Verify Front Card has zero black line at the bottom.
   - Verify Back Card has zero black line on any outer side while retaining the red 1947 helpline bar.
   - Verify standard CR80 aspect ratio and rounded corners remain pixel-perfect.
