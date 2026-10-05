import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Upload,
  Download,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Palette,
  School as SchoolIcon,
  RotateCcw,
  Check,
  ZoomIn,
  MoveVertical,
  Wand2,
  Layers,
  Phone,
  GraduationCap,
  Award,
  Star,
} from 'lucide-react';

interface AttendancePosterMakerProps {
  onNavigateHome: () => void;
}

export const AttendancePosterMaker: React.FC<AttendancePosterMakerProps> = ({ onNavigateHome }) => {
  // ---------------------------------------------------------------------------
  // School & Header Information (Pre-filled to match exact sample)
  // ---------------------------------------------------------------------------
  const [trustName, setTrustName] = useState('ANJUMAN DARDMANDAN-E TALIM O TARAKKI TRUST, MAHAD');
  const [schoolPrimaryName, setSchoolPrimaryName] = useState('DARDMAND');
  const [schoolSecondaryName, setSchoolSecondaryName] = useState('ABDULLAH MUKADAM ENGLISH SCHOOL');
  const [schoolLocation, setSchoolLocation] = useState('Kamble, Mahad, Raigad, Maharashtra');
  const [affiliationNo, setAffiliationNo] = useState('S.17.14.055');
  const [udiseNo, setUdiseNo] = useState('27240410506');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string>(''); // custom upload or default drawn logo

  // ---------------------------------------------------------------------------
  // Award, Class & Month Details
  // ---------------------------------------------------------------------------
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [headlineTitle, setHeadlineTitle] = useState('STARS OF THE MONTH');
  const [monthName, setMonthName] = useState('SEPTEMBER 2026');
  const [standardName, setStandardName] = useState('STANDARD VIII-C');

  // Motivational Slogans
  const [leftSlogan, setLeftSlogan] = useState('Show Up Daily,\nShine Bright Brightly');
  const [centerQuote, setCenterQuote] = useState('“Success begins with showing up, every single day”');
  const [rightBadgeText, setRightBadgeText] = useState('WELL DONE!\nKEEP IT UP!');

  // ---------------------------------------------------------------------------
  // Group Photo State
  // ---------------------------------------------------------------------------
  const [groupPhotoUrl, setGroupPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200&auto=format&fit=crop'
  );
  const [photoZoom, setPhotoZoom] = useState(1.0);
  const [photoOffsetY, setPhotoOffsetY] = useState(0);

  // ---------------------------------------------------------------------------
  // Student Names List (Exact 13 students from user's sample)
  // ---------------------------------------------------------------------------
  const [studentNamesText, setStudentNamesText] = useState(
    `1. Mast. Ayyan Masoom Kadvekar
2. Mast. Juned Maulali Chikkali
3. Mast. Yusuf Haidar Ali Shivkar
4. Mast. Mohammed Waqas Vaseem Newrekar
5. Mast. Abdullah Siraj Deshmukh
6. Mast. Maaz Mohammad Sufiyan Mulla
7. Mast. Faique Moheebulla Kirkire
8. Mast. Uzair Ibrahim Tambe
9. Mast. Adiyan Gafur Charfare
10. Mast. Farid Faisal Mullaji
11. Mast. Asad Akhtarhusen Jamadar
12. Mast. Mohammed Zain Samir Ahmed Chorghey
13. Mast. Sadik Mutallib Nadkar`
  );

  // ---------------------------------------------------------------------------
  // Sign-off / Officials Information
  // ---------------------------------------------------------------------------
  const [presidentTitle, setPresidentTitle] = useState('PRESIDENT');
  const [presidentName, setPresidentName] = useState('Mufti Rafique M. Shafi Purkar');
  const [presidentPhone, setPresidentPhone] = useState('+91 85510 04848');

  const [principalTitle, setPrincipalTitle] = useState('PRINCIPAL');
  const [principalName, setPrincipalName] = useState('Mr. Yasin Hasanmiya Poshilkar');
  const [principalPhone, setPrincipalPhone] = useState('+91 75881 05689');

  // ---------------------------------------------------------------------------
  // Themes & Styles
  // ---------------------------------------------------------------------------
  const [themeStyle, setThemeStyle] = useState<'sample_dardmand' | 'royal_navy' | 'crimson_ruby' | 'emerald_gold'>('sample_dardmand');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clean parsed student list
  const studentList = studentNamesText
    .split('\n')
    .map((s) => s.trim().replace(/^[\d+.)\-–\s]+/, '').trim())
    .filter(Boolean);

  // ---------------------------------------------------------------------------
  // High-Resolution Master Canvas Renderer (1200 x 1800 px)
  // ---------------------------------------------------------------------------
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1200;
    const H = 1800;
    canvas.width = W;
    canvas.height = H;

    // Theme color palettes
    let primaryGreen = '#065f46'; // Dardmand emerald green
    let primaryPurple = '#4a044e'; // Deep royal purple
    let goldYellow = '#fbbf24';
    let deepGold = '#d97706';
    let goldLight = '#fef3c7';

    if (themeStyle === 'royal_navy') {
      primaryGreen = '#1e3a8a';
      primaryPurple = '#0f172a';
    } else if (themeStyle === 'crimson_ruby') {
      primaryGreen = '#881337';
      primaryPurple = '#4c0519';
    } else if (themeStyle === 'emerald_gold') {
      primaryGreen = '#064e3b';
      primaryPurple = '#064e3b';
    }

    // 1. Base Cream/Gold Sunburst Background
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, W, H);

    // Subtle sunburst golden rays from top center
    ctx.save();
    const rayCenterX = W / 2;
    const rayCenterY = 400;
    const numRays = 48;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.04)';
    for (let i = 0; i < numRays; i += 2) {
      ctx.beginPath();
      ctx.moveTo(rayCenterX, rayCenterY);
      const angle1 = (i * 2 * Math.PI) / numRays;
      const angle2 = ((i + 1) * 2 * Math.PI) / numRays;
      ctx.arc(rayCenterX, rayCenterY, 1500, angle1, angle2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 2. Outer Multi-Border with Gold Beads and Corner Floral Filigrees
    ctx.save();
    // Outermost Dark Green Border Frame
    ctx.strokeStyle = primaryGreen;
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    // Gold Inner Bevel
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Dotted / Beaded Gold Line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.strokeRect(26, 26, W - 52, H - 52);
    ctx.setLineDash([]); // reset

    // Corner Filigree Gold Ornaments
    const drawCornerFloral = (cx: number, cy: number, rot: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.strokeStyle = '#eab308';
      ctx.fillStyle = '#fbbf24';
      ctx.lineWidth = 2;

      // Small spiral flower
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Radiating curls
      for (let a = 0; a < 3; a++) {
        ctx.beginPath();
        ctx.arc(14 + a * 6, 14 + a * 6, 6 + a * 2, 0, Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    };

    drawCornerFloral(40, 40, 0);
    drawCornerFloral(W - 40, 40, Math.PI / 2);
    drawCornerFloral(W - 40, H - 40, Math.PI);
    drawCornerFloral(40, H - 40, -Math.PI / 2);

    // Little gold stars along border edges
    ctx.fillStyle = '#eab308';
    for (let y = 140; y < H - 140; y += 120) {
      drawStar(ctx, 35, y, 5, 7, 3);
      drawStar(ctx, W - 35, y, 5, 7, 3);
    }
    ctx.restore();

    // -------------------------------------------------------------------------
    // 3. HEADER: Trust, School Name, Logo, Trophy & Affiliation Numbers
    // -------------------------------------------------------------------------
    // Top Trust Name
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = primaryGreen;
    ctx.font = '900 20px "Inter", "Segoe UI", sans-serif';
    ctx.letterSpacing = '0.5px';
    ctx.fillText(trustName.toUpperCase(), W / 2, 60);

    // Large School Name Line 1: DARDMAND
    ctx.fillStyle = primaryGreen;
    ctx.font = '900 68px "Impact", "Georgia", "Inter", serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(schoolPrimaryName.toUpperCase(), W / 2, 125);

    // School Name Line 2: ABDULLAH MUKADAM ENGLISH SCHOOL
    ctx.fillStyle = primaryPurple;
    ctx.font = '900 32px "Inter", "Segoe UI", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(schoolSecondaryName.toUpperCase(), W / 2, 165);

    // School Location
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 18px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(schoolLocation, W / 2, 195);
    ctx.restore();

    // Circular School Logo (Left: X=135, Y=130)
    await drawSchoolLogo(ctx, 140, 130, 85, primaryGreen);

    // Graduation Trophy Icon (Right: X=W-140, Y=130)
    drawGraduationTrophyIcon(ctx, W - 140, 130, 85);

    // Affiliation & UDISE Pill Boxes
    drawAffiliationBadges(ctx, W / 2, 230, affiliationNo, udiseNo, primaryGreen);

    // -------------------------------------------------------------------------
    // 4. GROUP PHOTO + 100% ATTENDANCE GOLDEN SHIELD
    // -------------------------------------------------------------------------
    const photoBoxY = 275;
    const photoBoxH = 345;
    const shieldW = 275;
    const photoBoxW = W - 110 - shieldW; // ~775px
    const photoBoxX = 55 + shieldW + 20;

    // Draw Golden 100% Attendance Shield on Left (X=55)
    draw100PercentShield(ctx, 60, photoBoxY, shieldW - 10, photoBoxH, academicYear);

    // Draw Classroom Students Group Photo on Right
    await drawClassGroupPhoto(
      ctx,
      photoBoxX,
      photoBoxY,
      photoBoxW,
      photoBoxH,
      groupPhotoUrl,
      photoZoom,
      photoOffsetY,
      primaryGreen
    );

    // -------------------------------------------------------------------------
    // 5. BIG 3D CURVED HEADLINE RIBBON BANNERS
    // -------------------------------------------------------------------------
    const bannerTopY = 645;

    // Top Green 3D Ribbon: ★ STARS OF THE MONTH ★
    drawRibbonBanner(ctx, W / 2, bannerTopY, 1060, 72, primaryGreen, '#fbbf24', headlineTitle);

    // Purple Ribbon: ★ SEPTEMBER 2026 ★
    drawSecondaryRibbon(ctx, W / 2, bannerTopY + 76, 780, 52, primaryPurple, '#ffffff', monthName);

    // Green Pill: ★ STANDARD VIII-C ★
    drawStandardPill(ctx, W / 2, bannerTopY + 134, 520, 44, primaryGreen, '#ffffff', standardName);

    // -------------------------------------------------------------------------
    // 6. MOTIVATIONAL SLOGANS & BADGES (3-Column Row)
    // -------------------------------------------------------------------------
    const sloganY = bannerTopY + 185;

    // Left Calligraphy: Show Up Daily, Shine Bright Brightly
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = primaryPurple;
    ctx.font = 'italic 700 24px "Brush Script MT", "Georgia", cursive, serif';
    const sloganLines = leftSlogan.split('\n');
    sloganLines.forEach((line, idx) => {
      ctx.fillText(line, 195, sloganY + 28 + idx * 28);
    });

    // Sparkles around left calligraphy
    ctx.fillStyle = '#f59e0b';
    drawStar(ctx, 75, sloganY + 25, 5, 8, 4);
    drawStar(ctx, 315, sloganY + 65, 5, 8, 4);
    ctx.restore();

    // Center Ornamental Green Shield: "Success begins with showing up, every single day"
    drawCenterQuoteShield(ctx, W / 2, sloganY + 12, 380, 85, primaryGreen, centerQuote);

    // Right Sunburst Medal: ★★★ WELL DONE! ★★★ KEEP IT UP!
    drawWellDoneBadge(ctx, W - 195, sloganY + 45, 75, primaryPurple);

    // -------------------------------------------------------------------------
    // 7. STUDENT NAMES ROSTER CARD (2 Columns, 13 Students with Green Badges)
    // -------------------------------------------------------------------------
    const rosterY = sloganY + 115;
    const rosterH = 430;
    const rosterW = W - 110;
    const rosterX = 55;

    drawStudentNamesCard(ctx, rosterX, rosterY, rosterW, rosterH, studentList, primaryGreen);

    // -------------------------------------------------------------------------
    // 8. BOTTOM GOLDEN TROPHY CUP & OFFICIALS FOOTER BANNER
    // -------------------------------------------------------------------------
    const footerY = H - 195;

    // Center Golden Trophy with Laurel Wreath
    drawBottomGoldenTrophy(ctx, W / 2, footerY - 15, 120);

    // Dark Purple Footer Box
    drawFooterBanner(
      ctx,
      50,
      footerY + 30,
      W - 100,
      135,
      primaryPurple,
      presidentTitle,
      presidentName,
      presidentPhone,
      principalTitle,
      principalName,
      principalPhone
    );
  }, [
    trustName,
    schoolPrimaryName,
    schoolSecondaryName,
    schoolLocation,
    affiliationNo,
    udiseNo,
    schoolLogoUrl,
    academicYear,
    headlineTitle,
    monthName,
    standardName,
    leftSlogan,
    centerQuote,
    groupPhotoUrl,
    photoZoom,
    photoOffsetY,
    studentNamesText,
    presidentTitle,
    presidentName,
    presidentPhone,
    principalTitle,
    principalName,
    principalPhone,
    themeStyle,
  ]);

  // ---------------------------------------------------------------------------
  // Helper Canvas Drawing Functions
  // ---------------------------------------------------------------------------

  // Draw 5-pointed Star
  function drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Circular School Logo
  async function drawSchoolLogo(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    greenColor: string
  ) {
    ctx.save();

    // If custom logo uploaded, draw it inside circle
    if (schoolLogoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = schoolLogoUrl;
        });

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
        ctx.restore();
        return;
      } catch (_) {}
    }

    // Default authentic circular crest matching sample
    // Outer green ring with curved text
    ctx.fillStyle = greenColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner white circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 15, 0, Math.PI * 2);
    ctx.fill();

    // Gold rings
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Center Green Emblem: Open Book & Minaret/Dome
    ctx.fillStyle = greenColor;
    ctx.beginPath();
    // Open book
    ctx.moveTo(cx - 20, cy + 10);
    ctx.quadraticCurveTo(cx, cy + 5, cx + 20, cy + 10);
    ctx.lineTo(cx + 20, cy + 18);
    ctx.quadraticCurveTo(cx, cy + 13, cx - 20, cy + 18);
    ctx.closePath();
    ctx.fill();

    // Dome / Building silhouette
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 14, Math.PI, 0);
    ctx.lineTo(cx + 14, cy + 4);
    ctx.lineTo(cx - 14, cy + 4);
    ctx.closePath();
    ctx.fill();

    // Curved Text around green border
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8.5px "Inter", sans-serif';
    ctx.textAlign = 'center';
    drawCurvedText(ctx, 'DARDMAND ABDULLAH MUKADAM ENGLISH SCHOOL', cx, cy, radius - 7, -Math.PI * 0.75, Math.PI * 0.75);

    // Inner motto: "A School with Culture, Humanity and Intelligence"
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 6.5px "Inter", sans-serif';
    drawCurvedText(ctx, 'A School with Culture, Humanity and Intelligence', cx, cy, radius - 20, -Math.PI * 0.7, Math.PI * 0.7);

    ctx.restore();
  }

  // Draw text along curved circle
  function drawCurvedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) {
    const angleStep = (endAngle - startAngle) / text.length;
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      const angle = startAngle + i * angleStep;
      ctx.translate(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
  }

  // Draw Graduation Trophy on Books (Right Header)
  function drawGraduationTrophyIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    ctx.save();
    // Purple & Blue Books base
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(cx - 45, cy + 20, 90, 14);
    ctx.fillStyle = '#4c0519';
    ctx.fillRect(cx - 40, cy + 8, 80, 12);

    // Golden Trophy Cup
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 10);
    ctx.lineTo(cx + 24, cy - 10);
    ctx.lineTo(cx + 16, cy + 8);
    ctx.lineTo(cx - 16, cy + 8);
    ctx.closePath();
    ctx.fill();

    // Trophy Handles
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - 24, cy - 2, 8, Math.PI / 2, -Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 24, cy - 2, 8, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Graduation Mortarboard Cap
    ctx.fillStyle = '#4a044e';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 35);
    ctx.lineTo(cx + 36, cy - 24);
    ctx.lineTo(cx, cy - 13);
    ctx.lineTo(cx - 36, cy - 24);
    ctx.closePath();
    ctx.fill();

    // Golden Tassel
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 24);
    ctx.lineTo(cx + 28, cy - 15);
    ctx.lineTo(cx + 28, cy - 2);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Affiliation & UDISE Pill Boxes
  function drawAffiliationBadges(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    ssc: string,
    udise: string,
    greenColor: string
  ) {
    ctx.save();
    const boxW = 270;
    const boxH = 40;
    const gap = 30;

    // Left Box: S.S.C. Affiliation
    const x1 = cx - boxW - gap / 2;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x1, cy, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // School icon in left box
    ctx.fillStyle = greenColor;
    ctx.fillRect(x1 + 10, cy + 8, 24, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏫', x1 + 22, cy + 25);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.fillText('S.S.C. Affiliation No.:', x1 + 42, cy + 18);
    ctx.font = '900 15px "Inter", sans-serif';
    ctx.fillText(ssc, x1 + 42, cy + 34);

    // Vertical Divider Line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + boxH);
    ctx.stroke();

    // Right Box: UDISE No.
    const x2 = cx + gap / 2;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x2, cy, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // Open book icon in right box
    ctx.fillStyle = greenColor;
    ctx.fillRect(x2 + 10, cy + 8, 24, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📖', x2 + 22, cy + 25);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.fillText('UDISE No.:', x2 + 42, cy + 18);
    ctx.font = '900 15px "Inter", sans-serif';
    ctx.fillText(udise, x2 + 42, cy + 34);

    ctx.restore();
  }

  // Draw Golden 100% Attendance Shield on Left
  function draw100PercentShield(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    acYear: string
  ) {
    ctx.save();

    // Shield Path
    ctx.beginPath();
    ctx.moveTo(x + 20, y);
    ctx.lineTo(x + w - 20, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
    ctx.lineTo(x + w, y + h * 0.65);
    ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.85, x + w / 2, y + h);
    ctx.quadraticCurveTo(x + w * 0.2, y + h * 0.85, x, y + h * 0.65);
    ctx.lineTo(x, y + 20);
    ctx.quadraticCurveTo(x, y, x + 20, y);
    ctx.closePath();

    // Dark Green to Emerald Radial/Linear Gradient
    const shieldGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    shieldGrad.addColorStop(0, '#042f2e');
    shieldGrad.addColorStop(0.5, '#065f46');
    shieldGrad.addColorStop(1, '#022c22');
    ctx.fillStyle = shieldGrad;
    ctx.fill();

    // Golden 3D Bevel Border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top Golden Crown
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 32, y + 36);
    ctx.lineTo(x + w / 2 - 40, y + 16);
    ctx.lineTo(x + w / 2 - 16, y + 24);
    ctx.lineTo(x + w / 2, y + 10);
    ctx.lineTo(x + w / 2 + 16, y + 24);
    ctx.lineTo(x + w / 2 + 40, y + 16);
    ctx.lineTo(x + w / 2 + 32, y + 36);
    ctx.closePath();
    ctx.fill();

    // Stars on crown tips
    ctx.fillStyle = '#ffffff';
    drawStar(ctx, x + w / 2, y + 10, 5, 4, 2);
    drawStar(ctx, x + w / 2 - 40, y + 16, 5, 4, 2);
    drawStar(ctx, x + w / 2 + 40, y + 16, 5, 4, 2);

    // Huge 100% in Gold/Yellow
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 68px "Impact", "Inter", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText('100%', x + w / 2, y + 120);

    // ATTENDANCE Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px "Inter", "Segoe UI", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('ATTENDANCE', x + w / 2, y + 155);

    // Bottom Red Ribbon Banner: ACADEMIC YEAR 2026-27
    const ribbonY = y + 185;
    const rW = w + 16;
    const rX = x - 8;

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(rX, ribbonY, rW, 46, 8);
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.roundRect(rX + 3, ribbonY + 3, rW - 6, 40, 6);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 13px "Inter", sans-serif';
    ctx.fillText('ACADEMIC YEAR', x + w / 2, ribbonY + 20);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 16px "Inter", sans-serif';
    ctx.fillText(`✦ ${acYear} ✦`, x + w / 2, ribbonY + 38);

    ctx.restore();
  }

  // Draw Classroom Students Group Photo in Golden Container
  async function drawClassGroupPhoto(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    photoUrl: string,
    zoom: number,
    offsetY: number,
    greenColor: string
  ) {
    ctx.save();

    // Golden frame border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.roundRect(x, y, w, h, 20);
    ctx.stroke();

    // Inner green border
    ctx.strokeStyle = greenColor;
    ctx.lineWidth = 3;
    ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 16);
    ctx.stroke();

    // Clip photo into rounded frame
    ctx.beginPath();
    ctx.roundRect(x + 7, y + 7, w - 14, h - 14, 14);
    ctx.clip();

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = photoUrl;
      });

      if (img.complete && img.naturalWidth > 0) {
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const targetRatio = w / h;

        let sw = img.naturalWidth;
        let sh = img.naturalHeight;
        let sx = 0;
        let sy = 0;

        if (imgRatio > targetRatio) {
          sw = img.naturalHeight * targetRatio;
          sx = (img.naturalWidth - sw) / 2;
        } else {
          sh = img.naturalWidth / targetRatio;
          sy = (img.naturalHeight - sh) / 2;
        }

        // Apply Zoom & Pan
        sw = sw / Math.max(1.0, zoom);
        sh = sh / Math.max(1.0, zoom);
        sy = Math.max(0, Math.min(img.naturalHeight - sh, sy + offsetY));

        ctx.drawImage(img, sx, sy, sw, sh, x + 7, y + 7, w - 14, h - 14);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Classroom Group Photo', x + w / 2, y + h / 2);
      }
    } catch (_) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
    }

    ctx.restore();
  }

  // Draw 3D Curved Green Ribbon: ★ STARS OF THE MONTH ★
  function drawRibbonBanner(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    bgColor: string,
    goldColor: string,
    text: string
  ) {
    ctx.save();
    const x = cx - w / 2;

    // Ribbon curved / pointed ends
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.moveTo(x + 30, cy);
    ctx.lineTo(x + w - 30, cy);
    ctx.lineTo(x + w, cy + h / 2);
    ctx.lineTo(x + w - 30, cy + h);
    ctx.lineTo(x + 30, cy + h);
    ctx.lineTo(x, cy + h / 2);
    ctx.closePath();
    ctx.fill();

    // Gold Bevel Border
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 34, cy + 4);
    ctx.lineTo(x + w - 34, cy + 4);
    ctx.stroke();

    // Gold Stars on both sides
    ctx.fillStyle = goldColor;
    drawStar(ctx, x + 55, cy + h / 2, 5, 20, 9);
    drawStar(ctx, x + w - 55, cy + h / 2, 5, 20, 9);

    // Text in Golden 3D Impact letters
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a'; // 3D drop shadow
    ctx.font = '900 48px "Impact", "Inter", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(text, cx + 3, cy + h / 2 + 18);

    ctx.fillStyle = goldColor;
    ctx.fillText(text, cx, cy + h / 2 + 16);

    ctx.restore();
  }

  // Draw Secondary Purple Ribbon: ★ SEPTEMBER 2026 ★
  function drawSecondaryRibbon(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    purpleColor: string,
    textColor: string,
    text: string
  ) {
    ctx.save();
    const x = cx - w / 2;

    ctx.fillStyle = purpleColor;
    ctx.beginPath();
    ctx.moveTo(x + 25, cy);
    ctx.lineTo(x + w - 25, cy);
    ctx.lineTo(x + w, cy + h / 2);
    ctx.lineTo(x + w - 25, cy + h);
    ctx.lineTo(x + 25, cy + h);
    ctx.lineTo(x, cy + h / 2);
    ctx.closePath();
    ctx.fill();

    // Gold border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Stars on ends
    ctx.fillStyle = '#f59e0b';
    drawStar(ctx, x + 40, cy + h / 2, 5, 14, 6);
    drawStar(ctx, x + w - 40, cy + h / 2, 5, 14, 6);

    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    ctx.font = '900 28px "Inter", "Segoe UI", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(text, cx, cy + h / 2 + 10);

    ctx.restore();
  }

  // Draw Green Standard Pill: ★ STANDARD VIII-C ★
  function drawStandardPill(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    greenColor: string,
    textColor: string,
    text: string
  ) {
    ctx.save();
    const x = cx - w / 2;

    ctx.fillStyle = greenColor;
    ctx.beginPath();
    ctx.roundRect(x, cy, w, h, 22);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    drawStar(ctx, x + 25, cy + h / 2, 5, 10, 4);
    drawStar(ctx, x + w - 25, cy + h / 2, 5, 10, 4);

    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    ctx.font = '900 22px "Inter", "Segoe UI", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(text, cx, cy + h / 2 + 8);

    ctx.restore();
  }

  // Draw Center Ornamental Quote Shield: "Success begins with showing up..."
  function drawCenterQuoteShield(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    greenColor: string,
    quote: string
  ) {
    ctx.save();
    const x = cx - w / 2;

    // Shield pill with decorative notched corners
    ctx.fillStyle = greenColor;
    ctx.beginPath();
    ctx.roundRect(x, cy, w, h, 30);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Side gold stars
    ctx.fillStyle = '#fbbf24';
    drawStar(ctx, x + 20, cy + h / 2, 5, 9, 4);
    drawStar(ctx, x + w - 20, cy + h / 2, 5, 9, 4);

    // Multi-line quote text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 700 17px "Georgia", serif';

    // Break quote into 2 lines if needed
    const words = quote.split(' ');
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' ');
    const line2 = words.slice(mid).join(' ');

    ctx.fillText(line1, cx, cy + 34);
    ctx.fillText(line2, cx, cy + 58);

    ctx.restore();
  }

  // Draw Sunburst Medal: ★★★ WELL DONE! ★★★ KEEP IT UP!
  function drawWellDoneBadge(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    purpleColor: string
  ) {
    ctx.save();

    // Sunburst rays
    ctx.fillStyle = '#f59e0b';
    const numPoints = 28;
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const a = (i * 2 * Math.PI) / numPoints;
      const r = i % 2 === 0 ? radius : radius - 8;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Inner Dark Ring
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 14, 0, Math.PI * 2);
    ctx.fill();

    // Top Stars
    ctx.fillStyle = '#fbbf24';
    drawStar(ctx, cx - 18, cy - 25, 5, 6, 2.5);
    drawStar(ctx, cx, cy - 30, 5, 8, 3.5);
    drawStar(ctx, cx + 18, cy - 25, 5, 6, 2.5);

    // WELL DONE!
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 18px "Impact", "Inter", sans-serif';
    ctx.fillText('WELL', cx, cy - 10);
    ctx.fillText('DONE!', cx, cy + 10);

    // Purple Ribbon at bottom
    ctx.fillStyle = purpleColor;
    ctx.beginPath();
    ctx.roundRect(cx - 55, cy + 18, 110, 24, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 11px "Inter", sans-serif';
    ctx.fillText('KEEP IT UP!', cx, cy + 34);

    ctx.restore();
  }

  // Draw Student Names Card with 2 Columns and Green Badges
  function drawStudentNamesCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    names: string[],
    greenColor: string
  ) {
    ctx.save();

    // White Card Container
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 20);
    ctx.fill();

    // Golden Double Border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.5;
    ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 16);
    ctx.stroke();

    // Split names into 2 columns (e.g. 7 on left, 6 on right)
    const midPoint = Math.ceil(names.length / 2);
    const col1 = names.slice(0, midPoint);
    const col2 = names.slice(midPoint);

    const colW = (w - 60) / 2;
    const rowH = Math.min(50, (h - 40) / Math.max(col1.length, col2.length));

    // Render Left Column (1 to midPoint)
    col1.forEach((name, i) => {
      const itemX = x + 30;
      const itemY = y + 25 + i * rowH;

      // Dark Green Number Badge
      ctx.fillStyle = greenColor;
      ctx.beginPath();
      ctx.roundRect(itemX, itemY, 44, 34, 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 19px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, itemX + 22, itemY + 25);

      // Student Name in Dark Blue Bold
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f2e5a';
      ctx.font = '700 20px "Inter", "Segoe UI", sans-serif';
      ctx.fillText(name, itemX + 58, itemY + 25);
    });

    // Render Right Column (midPoint+1 to end)
    col2.forEach((name, i) => {
      const globalIdx = midPoint + i + 1;
      const itemX = x + 30 + colW + 20;
      const itemY = y + 25 + i * rowH;

      // Dark Green Number Badge
      ctx.fillStyle = greenColor;
      ctx.beginPath();
      ctx.roundRect(itemX, itemY, 44, 34, 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 19px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${globalIdx}`, itemX + 22, itemY + 25);

      // Student Name in Dark Blue Bold
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f2e5a';
      ctx.font = '700 20px "Inter", "Segoe UI", sans-serif';
      ctx.fillText(name, itemX + 58, itemY + 25);
    });

    ctx.restore();
  }

  // Draw Bottom Golden Trophy
  function drawBottomGoldenTrophy(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    ctx.save();

    // Golden Laurel Wreath behind trophy
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - 35, cy, 32, Math.PI * 0.4, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 35, cy, 32, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();

    // Golden Trophy Cup
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cx - 28, cy - 25);
    ctx.lineTo(cx + 28, cy - 25);
    ctx.lineTo(cx + 20, cy);
    ctx.quadraticCurveTo(cx, cy + 18, cx - 20, cy);
    ctx.closePath();
    ctx.fill();

    // Trophy Stem & Base
    ctx.fillRect(cx - 6, cy + 10, 12, 14);
    ctx.fillRect(cx - 22, cy + 24, 44, 8);

    // Handles
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx - 28, cy - 12, 10, Math.PI / 2, -Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 28, cy - 12, 10, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Star on cup
    ctx.fillStyle = '#ffffff';
    drawStar(ctx, cx, cy - 12, 5, 6, 2.5);

    ctx.restore();
  }

  // Draw Dark Purple Footer Banner with Officials (President & Principal)
  function drawFooterBanner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    purpleColor: string,
    presTitle: string,
    presName: string,
    presPhone: string,
    princTitle: string,
    princName: string,
    princPhone: string
  ) {
    ctx.save();

    // Dark Purple Background
    ctx.fillStyle = purpleColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 20);
    ctx.fill();

    // Golden Border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Vertical Divider Line in Center
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 15);
    ctx.lineTo(x + w / 2, y + h - 15);
    ctx.stroke();

    // Left Column: PRESIDENT
    const col1Center = x + w / 4;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 16px "Inter", sans-serif';
    ctx.fillText(`✦  ${presTitle}  ✦`, col1Center, y + 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 22px "Inter", sans-serif';
    ctx.fillText(presName, col1Center, y + 70);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 18px "Inter", sans-serif';
    ctx.fillText(`📞  ${presPhone}`, col1Center, y + 102);

    // Right Column: PRINCIPAL
    const col2Center = x + (w * 3) / 4;
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 16px "Inter", sans-serif';
    ctx.fillText(`✦  ${princTitle}  ✦`, col2Center, y + 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 22px "Inter", sans-serif';
    ctx.fillText(princName, col2Center, y + 70);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 18px "Inter", sans-serif';
    ctx.fillText(`📞  ${princPhone}`, col2Center, y + 102);

    ctx.restore();
  }

  // Trigger render on any state change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  const handleGroupPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setGroupPhotoUrl(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSchoolLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setSchoolLogoUrl(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (format: 'png' | 'jpeg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `100_Attendance_${monthName.replace(/\s+/g, '_')}_${standardName.replace(/\s+/g, '_')}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, 0.95);
    link.click();
  };

  const handleShareWhatsApp = () => {
    const message = `🏆 *${headlineTitle} - ${monthName}* 🏆\n\n🏫 *${schoolPrimaryName} ${schoolSecondaryName}*\n📍 *${schoolLocation}*\n📚 *Class:* ${standardName}\n\n🌟 *100% Attendance Achievers:*\n${studentList
      .map((name, i) => `${i + 1}. ${name}`)
      .join('\n')}\n\n${centerQuote}\n\n— *${presidentTitle}:* ${presidentName} (${presidentPhone})\n— *${principalTitle}:* ${principalName} (${principalPhone})`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleAiInspireQuote = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              text: `Generate 1 short, inspiring 1-sentence quote about school attendance, showing up daily, discipline, or punctuality for students. Keep it under 15 words. Put quotes around it.`,
            },
          ],
          model: 'gemini-3.5-flash',
          role: 'support',
        }),
      });
      const data = await res.json();
      if (data.text) {
        setCenterQuote(data.text.trim());
      }
    } catch (_) {
      setCenterQuote('“Showing up consistently is the golden secret to excellence”');
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="px-5 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>100% Attendance WhatsApp Poster Generator</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official School Flyer
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Students Group Photo, 100% Attendance Shield, 2-Column Student Roster & WhatsApp sharing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#22c35e] hover:bg-[#1eb355] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownload('png')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Ultra-HD Poster</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Editor Panel Left, Live High-Res Canvas Right) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ================================================================= */}
        {/* LEFT COLUMN: Controls & Form Editor                               */}
        {/* ================================================================= */}
        <div className="w-full lg:w-[480px] bg-slate-950 border-r border-slate-800 overflow-y-auto p-5 space-y-6 shrink-0">
          {/* Theme Palette Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>Color & Pattern Theme</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'sample_dardmand', name: 'Emerald & Royal Purple Gold (Official)', tag: 'As Sample' },
                { id: 'royal_navy', name: 'Royal Navy & Classic Gold', tag: 'Academic Blue' },
                { id: 'crimson_ruby', name: 'Crimson & Ruby House', tag: 'School House' },
                { id: 'emerald_gold', name: 'Pure Emerald & Gold', tag: 'All Green' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setThemeStyle(th.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    themeStyle === th.id
                      ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-200">{th.name}</span>
                  <span className="text-[10px] text-amber-400/80 mt-1">{th.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Classroom Group Photo Upload & Controls */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Classroom Group Photo</span>
              </span>
              <label className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Group Photo</span>
                <input type="file" accept="image/*" onChange={handleGroupPhotoUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Zoom Photo</span>
                  <span className="font-mono text-amber-300">{photoZoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={2.0}
                  step={0.05}
                  value={photoZoom}
                  onChange={(e) => setPhotoZoom(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Pan Up/Down</span>
                  <span className="font-mono text-amber-300">{photoOffsetY}px</span>
                </div>
                <input
                  type="range"
                  min={-150}
                  max={150}
                  step={5}
                  value={photoOffsetY}
                  onChange={(e) => setPhotoOffsetY(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">School Crest / Logo:</span>
              <label className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1">
                <Upload className="w-3 h-3 text-blue-400" />
                <span>Upload Logo</span>
                <input type="file" accept="image/*" onChange={handleSchoolLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Student Names (Multi-line) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Student Names List ({studentList.length} Students)</span>
              </label>
              <span className="text-[10px] text-slate-500">Auto 2-Column Split</span>
            </div>
            <textarea
              rows={8}
              value={studentNamesText}
              onChange={(e) => setStudentNamesText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed"
            />
          </div>

          {/* School & Header Details */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <SchoolIcon className="w-4 h-4 text-blue-400" />
              <span>School Header & Affiliation</span>
            </label>

            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold">Trust Name</span>
                <input
                  type="text"
                  value={trustName}
                  onChange={(e) => setTrustName(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold">Primary Name</span>
                  <input
                    type="text"
                    value={schoolPrimaryName}
                    onChange={(e) => setSchoolPrimaryName(e.target.value)}
                    className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold">Secondary Name</span>
                  <input
                    type="text"
                    value={schoolSecondaryName}
                    onChange={(e) => setSchoolSecondaryName(e.target.value)}
                    className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-semibold">Location / Address</span>
                <input
                  type="text"
                  value={schoolLocation}
                  onChange={(e) => setSchoolLocation(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold">S.S.C. Affiliation No.</span>
                  <input
                    type="text"
                    value={affiliationNo}
                    onChange={(e) => setAffiliationNo(e.target.value)}
                    className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold">UDISE No.</span>
                  <input
                    type="text"
                    value={udiseNo}
                    onChange={(e) => setUdiseNo(e.target.value)}
                    className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Month, Standard & Academic Year */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Award, Month & Standard</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold">Month</span>
                <input
                  type="text"
                  value={monthName}
                  onChange={(e) => setMonthName(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold">Class / Standard</span>
                <input
                  type="text"
                  value={standardName}
                  onChange={(e) => setStandardName(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold">Academic Year</span>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Motivational Quote with AI Helper */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Center Slogan Quote</span>
              </span>
              <button
                type="button"
                onClick={handleAiInspireQuote}
                disabled={isAiGenerating}
                className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 disabled:opacity-50 cursor-pointer"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                <span>{isAiGenerating ? 'Generating...' : 'AI Quote'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={centerQuote}
              onChange={(e) => setCenterQuote(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Officials & Contact Numbers */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-indigo-400" />
              <span>Officials / Sign-offs</span>
            </label>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-amber-400 block uppercase">Left Official</span>
                <input
                  type="text"
                  value={presidentTitle}
                  onChange={(e) => setPresidentTitle(e.target.value)}
                  placeholder="Title (e.g. PRESIDENT)"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  value={presidentName}
                  onChange={(e) => setPresidentName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  value={presidentPhone}
                  onChange={(e) => setPresidentPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-amber-300 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-amber-400 block uppercase">Right Official</span>
                <input
                  type="text"
                  value={principalTitle}
                  onChange={(e) => setPrincipalTitle(e.target.value)}
                  placeholder="Title (e.g. PRINCIPAL)"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  value={principalPhone}
                  onChange={(e) => setPrincipalPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-amber-300 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Real-Time High-Res Canvas Live Preview              */}
        {/* ================================================================= */}
        <div className="flex-1 flex flex-col bg-slate-950 p-4 sm:p-6 overflow-y-auto items-center justify-center">
          <div className="w-full max-w-2xl space-y-4">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-200">Live Poster Preview</span>
                <span className="text-slate-500 font-mono">({studentList.length} students)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload('jpeg')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                >
                  Download JPG
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('png')}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Ultra-HD PNG</span>
                </button>
              </div>
            </div>

            {/* Canvas Preview Box */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex items-center justify-center p-2">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Quick Share Callout */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-emerald-200">
                <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>WhatsApp Ready!</strong> Formatted specifically for class WhatsApp groups and teacher status.
                </span>
              </div>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-4 py-2 rounded-xl bg-[#22c35e] hover:bg-[#1eb355] text-slate-950 text-xs font-black transition-all cursor-pointer shrink-0 shadow-md"
              >
                Send to WhatsApp Group
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
