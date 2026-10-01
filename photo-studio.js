const MAX_DIM=1000;
let sourceImg=null,cw=0,ch=0,corners=[],dragIndex=-1,warpedCanvas=null,currentFinalCanvas=null,selfieSeg=null;
const editorCanvas=document.getElementById('editorCanvas');

function showStage(id){['stageUpload','stage1','stage2'].forEach(s=>document.getElementById(s).classList.toggle('active',s===id))}

document.getElementById('dropzone').onclick=()=>document.getElementById('fileInput').click();
document.getElementById('fileInput').addEventListener('change',e=>{let file=e.target.files[0];if(file)openEditor(file)});
document.getElementById('startOver1').onclick=()=>{document.getElementById('fileInput').value='';showStage('stageUpload')};
document.getElementById('startOver2').onclick=()=>{document.getElementById('fileInput').value='';showStage('stageUpload')};

function solveLinear(A,b){let n=8;for(let i=0;i<n;i++)A[i].push(b[i]);
for(let i=0;i<n;i++){let maxEl=Math.abs(A[i][i]),maxRow=i;for(let k=i+1;k<n;k++)if(Math.abs(A[k][i])>maxEl){maxEl=Math.abs(A[k][i]);maxRow=k}
[A[i],A[maxRow]]=[A[maxRow],A[i]];
for(let k=i+1;k<n;k++){let c=-A[k][i]/A[i][i];for(let j=i;j<n+1;j++){if(i===j)A[k][j]=0;else A[k][j]+=c*A[i][j]}}}
let x=new Array(n).fill(0);
for(let i=n-1;i>=0;i--){x[i]=A[i][n]/A[i][i];for(let k=i-1;k>=0;k--)A[k][n]-=A[k][i]*x[i]}
return x}
function getPerspectiveTransform(src,dst){let A=[],b=[];
for(let i=0;i<4;i++){let [x,y]=src[i],[X,Y]=dst[i];
A.push([x,y,1,0,0,0,-x*X,-y*X]);b.push(X);
A.push([0,0,0,x,y,1,-x*Y,-y*Y]);b.push(Y)}
let h=solveLinear(A,b);return [h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1]}
function applyTransform(m,x,y){let d=m[6]*x+m[7]*y+m[8];return [(m[0]*x+m[1]*y+m[2])/d,(m[3]*x+m[4]*y+m[5])/d]}
function sampleBilinear(data,w,h,x,y){if(x<0||y<0||x>=w-1||y>=h-1)return [255,255,255,255];
let x0=Math.floor(x),y0=Math.floor(y),x1=x0+1,y1=y0+1,fx=x-x0,fy=y-y0;
function px(xx,yy){let i=(yy*w+xx)*4;return [data[i],data[i+1],data[i+2],data[i+3]]}
let p00=px(x0,y0),p10=px(x1,y0),p01=px(x0,y1),p11=px(x1,y1),out=[0,0,0,0];
for(let c=0;c<4;c++){let top=p00[c]*(1-fx)+p10[c]*fx,bot=p01[c]*(1-fx)+p11[c]*fx;out[c]=top*(1-fy)+bot*fy}
return out}

function filterStr(){return `brightness(${document.getElementById('adjBrightness').value}%) contrast(${document.getElementById('adjContrast').value}%) saturate(${document.getElementById('adjSaturate').value}%)`}
function redraw(){let ctx=editorCanvas.getContext('2d');ctx.filter=filterStr();ctx.drawImage(sourceImg,0,0,cw,ch);ctx.filter='none';
ctx.strokeStyle='#316bff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(corners[0][0],corners[0][1]);for(let i=1;i<4;i++)ctx.lineTo(corners[i][0],corners[i][1]);ctx.closePath();ctx.stroke();
corners.forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#316bff';ctx.stroke()})}
function defaultCorners(){return [[cw*0.08,ch*0.08],[cw*0.92,ch*0.08],[cw*0.92,ch*0.92],[cw*0.08,ch*0.92]]}

function openEditor(file){sourceImg=new Image();sourceImg.onload=()=>{
let scale=Math.min(1,MAX_DIM/Math.max(sourceImg.naturalWidth,sourceImg.naturalHeight));
cw=Math.round(sourceImg.naturalWidth*scale);ch=Math.round(sourceImg.naturalHeight*scale);
editorCanvas.width=cw;editorCanvas.height=ch;
corners=defaultCorners();
document.getElementById('adjBrightness').value=100;document.getElementById('adjContrast').value=100;document.getElementById('adjSaturate').value=100;
redraw();showStage('stage1')};
sourceImg.src=URL.createObjectURL(file)}

function getCanvasPos(e){let rect=editorCanvas.getBoundingClientRect();let sx=editorCanvas.width/rect.width,sy=editorCanvas.height/rect.height;return [(e.clientX-rect.left)*sx,(e.clientY-rect.top)*sy]}
editorCanvas.addEventListener('pointerdown',e=>{let [x,y]=getCanvasPos(e);let best=-1,bestD=30;corners.forEach(([cx,cy],i)=>{let d=Math.hypot(cx-x,cy-y);if(d<bestD){bestD=d;best=i}});if(best>=0){dragIndex=best;editorCanvas.setPointerCapture(e.pointerId)}});
editorCanvas.addEventListener('pointermove',e=>{if(dragIndex<0)return;let [x,y]=getCanvasPos(e);corners[dragIndex]=[Math.max(0,Math.min(cw,x)),Math.max(0,Math.min(ch,y))];redraw()});
window.addEventListener('pointerup',()=>{dragIndex=-1});
['adjBrightness','adjContrast','adjSaturate'].forEach(id=>document.getElementById(id).addEventListener('input',redraw));
document.getElementById('resetCorners').onclick=()=>{corners=defaultCorners();redraw()};
function rotateSource(sign){let newW=ch,newH=cw;let rc=document.createElement('canvas');rc.width=newW;rc.height=newH;let rctx=rc.getContext('2d');rctx.translate(newW/2,newH/2);rctx.rotate(sign*Math.PI/2);rctx.drawImage(sourceImg,-cw/2,-ch/2,cw,ch);sourceImg=rc;cw=newW;ch=newH;editorCanvas.width=cw;editorCanvas.height=ch;corners=defaultCorners();redraw()}
document.getElementById('rotateLeft').onclick=()=>rotateSource(-1);
document.getElementById('rotateRight').onclick=()=>rotateSource(1);

function computeWarpedCanvas(){
let wTop=Math.hypot(corners[1][0]-corners[0][0],corners[1][1]-corners[0][1]);
let wBot=Math.hypot(corners[2][0]-corners[3][0],corners[2][1]-corners[3][1]);
let hLeft=Math.hypot(corners[3][0]-corners[0][0],corners[3][1]-corners[0][1]);
let hRight=Math.hypot(corners[2][0]-corners[1][0],corners[2][1]-corners[1][1]);
let outW=Math.max(100,Math.min(1200,Math.round(Math.max(wTop,wBot))));
let outH=Math.max(100,Math.min(1200,Math.round(Math.max(hLeft,hRight))));
let srcCanvas=document.createElement('canvas');srcCanvas.width=cw;srcCanvas.height=ch;
let sctx=srcCanvas.getContext('2d');sctx.filter=filterStr();sctx.drawImage(sourceImg,0,0,cw,ch);
let srcData=sctx.getImageData(0,0,cw,ch).data;
let dstPts=[[0,0],[outW,0],[outW,outH],[0,outH]];
let M=getPerspectiveTransform(dstPts,corners);
let outCanvas=document.createElement('canvas');outCanvas.width=outW;outCanvas.height=outH;
let octx=outCanvas.getContext('2d');let outImg=octx.createImageData(outW,outH);
for(let dy=0;dy<outH;dy++)for(let dx=0;dx<outW;dx++){let [sx,sy]=applyTransform(M,dx,dy);let p=sampleBilinear(srcData,cw,ch,sx,sy);let di=(dy*outW+dx)*4;outImg.data[di]=p[0];outImg.data[di+1]=p[1];outImg.data[di+2]=p[2];outImg.data[di+3]=p[3]}
octx.putImageData(outImg,0,0);
return outCanvas}

function drawToPreview(canvas){let pv=document.getElementById('bgPreviewCanvas');pv.width=canvas.width;pv.height=canvas.height;let ctx=pv.getContext('2d');
for(let y=0;y<pv.height;y+=12)for(let x=0;x<pv.width;x+=12){ctx.fillStyle=((Math.floor(x/12)+Math.floor(y/12))%2===0)?'#eee':'#fff';ctx.fillRect(x,y,12,12)}
ctx.drawImage(canvas,0,0)}

function updateDownloadLink(){document.getElementById('downloadBtn').href=currentFinalCanvas.toDataURL('image/png')}

document.getElementById('nextToBg').onclick=()=>{
warpedCanvas=computeWarpedCanvas();currentFinalCanvas=warpedCanvas;
document.querySelectorAll('.bg-opt').forEach(x=>x.classList.remove('selected'));
document.querySelector('.bg-opt[data-bg="none"]').classList.add('selected');
document.getElementById('bgStatus').textContent='';
drawToPreview(warpedCanvas);updateDownloadLink();
showStage('stage2')};
document.getElementById('backToStage1').onclick=()=>showStage('stage1');

function getSegmentation(){if(!selfieSeg){selfieSeg=new SelfieSegmentation({locateFile:(file)=>`https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`});selfieSeg.setOptions({modelSelection:0})}return selfieSeg}
function segmentImage(canvas){return new Promise((resolve,reject)=>{try{let seg=getSegmentation();seg.onResults(r=>resolve(r.segmentationMask));seg.send({image:canvas})}catch(e){reject(e)}})}
function maskToAlphaCanvas(maskImg,w,h){let c=document.createElement('canvas');c.width=w;c.height=h;let ctx=c.getContext('2d');ctx.drawImage(maskImg,0,0,w,h);let id=ctx.getImageData(0,0,w,h);for(let i=0;i<id.data.length;i+=4){let v=id.data[i];id.data[i]=0;id.data[i+1]=0;id.data[i+2]=0;id.data[i+3]=v}ctx.putImageData(id,0,0);return c}

async function applyBackground(bgChoice){
if(bgChoice==='none'){currentFinalCanvas=warpedCanvas;drawToPreview(warpedCanvas);updateDownloadLink();document.getElementById('bgStatus').textContent='';return}
document.getElementById('bgStatus').textContent='Processing background… please wait a few seconds.';
try{
let maskImg=await segmentImage(warpedCanvas);
let w=warpedCanvas.width,h=warpedCanvas.height;
let alphaMask=maskToAlphaCanvas(maskImg,w,h);
let personCanvas=document.createElement('canvas');personCanvas.width=w;personCanvas.height=h;
let pctx=personCanvas.getContext('2d');pctx.drawImage(warpedCanvas,0,0,w,h);
pctx.globalCompositeOperation='destination-in';pctx.drawImage(alphaMask,0,0,w,h);
let out=document.createElement('canvas');out.width=w;out.height=h;let octx=out.getContext('2d');
if(bgChoice!=='transparent'){octx.fillStyle=bgChoice==='white'?'#ffffff':bgChoice==='blue'?'#2d5fa8':'#b83a3a';octx.fillRect(0,0,w,h)}
octx.drawImage(personCanvas,0,0,w,h);
currentFinalCanvas=out;drawToPreview(out);updateDownloadLink();
document.getElementById('bgStatus').textContent='Background applied.'
}catch(err){document.getElementById('bgStatus').textContent='Could not process background. Please try again or keep the original.'}}

document.querySelectorAll('.bg-opt').forEach(el=>el.onclick=()=>{document.querySelectorAll('.bg-opt').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');applyBackground(el.dataset.bg)});
