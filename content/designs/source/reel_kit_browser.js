// Shared browser-side canvas helpers for the Mez Media reels (expects SRC, a {name: dataURL} map, and a <canvas id="c">).
const W=1080,H=1920,TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), lerp=(a,b,k)=>a+(b-a)*k;
const sstep=(k)=>{k=clamp(k);return k*k*(3-2*k)};
const outExpo=(x)=>x<=0?0:x>=1?1:1-Math.pow(2,-10*x);
const inExpo=(x)=>x<=0?0:x>=1?1:Math.pow(2,10*x-10);
const outBack=(x)=>{x=clamp(x);const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const outCubic=(x)=>1-Math.pow(1-clamp(x),3);
let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
const R=(n)=>{seed=n*9301+49297;rnd();return rnd()};              // stable random from an integer

const out=document.getElementById('c'), g=out.getContext('2d');
const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c};
const SC=mk(), s=SC.getContext('2d');          // scene layer
const AC=mk(), a=AC.getContext('2d');          // motion-blur accumulator
const IMG={};
window.ready=Promise.all(Object.entries(SRC).map(([k,v])=>new Promise(r=>{const i=new Image();i.onload=()=>{IMG[k]=i;r()};i.src=v})));

// film grain + static tiles
const NOISE=[];for(let n=0;n<6;n++){const c=document.createElement('canvas');c.width=270;c.height=480;const x=c.getContext('2d');const d=x.createImageData(270,480);
  seed=100+n;for(let i=0;i<d.data.length;i+=4){const v=rnd()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);NOISE.push(c)}

// ---------- drawing helpers ----------
function photo(img,x0,y0,w,h,z=1,fx=.5,fy=.5){
  const sc=Math.max(w/img.width,h/img.height)*z, iw=img.width*sc, ih=img.height*sc;
  let dx=x0+w/2-fx*iw, dy=y0+h/2-fy*ih;
  dx=Math.min(x0,Math.max(x0+w-iw,dx)); dy=Math.min(y0,Math.max(y0+h-ih,dy));
  s.drawImage(img,dx,dy,iw,ih);
}
function setFont(o){s.font=(o.it?'italic ':'')+(o.w||900)+' '+o.size+'px '+(o.f||'Hook');s.letterSpacing=(o.ls??-o.size*0.03)+'px'}
function fit(str,o,max){setFont(o);const w=s.measureText(str).width;if(w>max){o.size*=max/w;setFont(o)}return o}
// text; o: {size,w,f,ls,align,color,a,sc,max}
function T(str,x,y,o){o={...o};s.save();fit(str,o,o.max||940);s.textAlign=o.align||'center';s.textBaseline='alphabetic';
  s.fillStyle=o.color||'#fff';s.globalAlpha=o.a??1;
  if(o.sc&&o.sc!==1){s.translate(x,y-o.size*0.35);s.scale(o.sc,o.sc);s.translate(-x,-(y-o.size*0.35))}
  s.fillText(str,x,y);s.restore();return o.size}
// white box with black type, revealed left to right by k
function boxT(str,x,y,o,k){if(k<=0)return;o={...o};s.save();fit(str,o,o.max||880);s.textBaseline='alphabetic';s.textAlign='left';
  const tw=s.measureText(str).width, padX=o.size*0.16, w=tw+padX*2, top=y-o.size*0.86, h=o.size*1.02;
  const x0=(o.align==='left'?x:x-w/2);
  if(o.sc&&o.sc!==1){s.translate(x,y-o.size*0.35);s.scale(o.sc,o.sc);s.translate(-x,-(y-o.size*0.35))}
  s.beginPath();s.rect(x0,top-4,w*outExpo(k),h+8);s.clip();
  s.fillStyle='#fff';s.fillRect(x0,top,w,h);s.fillStyle='#000';s.fillText(str,x0+padX,y);s.restore()}
const slam=(p)=>p<0?0:1.55-0.55*outBack(p/0.2);
const on=(t,t0)=>t>=t0;
function rr(x,y,w,h,r){s.beginPath();s.roundRect(x,y,w,h,r)}
function shade(alpha){s.fillStyle='rgba(0,0,0,'+alpha+')';s.fillRect(0,0,W,H)}
function glowBlob(x,y,r,alpha){const q=s.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba(255,255,255,'+alpha+')');q.addColorStop(1,'rgba(255,255,255,0)');s.fillStyle=q;s.fillRect(x-r,y-r,2*r,2*r)}
function vignette(c,amt){const q=c.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.75);q.addColorStop(0,'rgba(0,0,0,0)');q.addColorStop(1,'rgba(0,0,0,'+amt+')');c.fillStyle=q;c.fillRect(0,0,W,H)}
function textBacker(y,h,alpha=.75){const q=s.createLinearGradient(0,y-h,0,y+h);q.addColorStop(0,'rgba(0,0,0,0)');q.addColorStop(.5,'rgba(0,0,0,'+alpha+')');q.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=q;s.fillRect(0,y-h,W,2*h)}


function card(img,cx,cy,w,h,o={}){
  s.save();rr(cx-w/2,cy-h/2,w,h,34);s.clip();
  photo(img,cx-w/2,cy-h/2,w,h,o.z||1,o.fx??.5,o.fy??.5);
  const q=s.createLinearGradient(0,cy-h/2,0,cy-h/2+170);q.addColorStop(0,'rgba(0,0,0,.65)');q.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=q;s.fillRect(cx-w/2,cy-h/2,w,170);
  const x0=cx-w/2+30, y0=cy-h/2+30;
  s.strokeStyle='#fff';s.lineWidth=3;s.beginPath();s.arc(x0+28,y0+28,26,0,TAU);s.stroke();
  s.fillStyle='rgba(255,255,255,.9)';rr(x0+70,y0+10,170,16,8);s.fill();
  s.fillStyle='rgba(255,255,255,.75)';s.font='500 24px Body';s.letterSpacing='0px';s.fillText('Sponsored',x0+70,y0+54);
  const bq=s.createLinearGradient(0,cy+h/2-200,0,cy+h/2);bq.addColorStop(0,'rgba(0,0,0,0)');bq.addColorStop(1,'rgba(0,0,0,.7)');s.fillStyle=bq;s.fillRect(cx-w/2,cy+h/2-200,w,200);
  s.fillStyle='#fff';rr(cx-w/2+30,cy+h/2-104,w-60,74,16);s.fill();
  s.fillStyle='#000';s.font='700 32px Body';s.textAlign='center';s.fillText('Shop now',cx,cy+h/2-56);
  s.restore();
  s.save();s.strokeStyle='rgba(255,255,255,.25)';s.lineWidth=2;rr(cx-w/2,cy-h/2,w,h,34);s.stroke();s.restore();
  if(o.skipped){const k=o.skipped;s.save();s.translate(cx,cy-40);s.rotate(-0.16);s.scale(1.8-0.8*outBack(k),1.8-0.8*outBack(k));s.globalAlpha=clamp(k*4);
    s.strokeStyle='#fff';s.lineWidth=8;rr(-230,-72,460,128,14);s.stroke();s.fillStyle='rgba(0,0,0,.35)';s.fill();
    s.fillStyle='#fff';s.font='900 92px Hook';s.letterSpacing='4px';s.textAlign='center';s.fillText('SKIPPED',0,30);s.restore()}
}

