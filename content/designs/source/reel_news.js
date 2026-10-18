// Mez Media launch reel: "Breaking news" broadcast, black and white. Everything is drawn on canvas, frame by frame.
// Timing comes from reel_news_cues.json (written by reel_news_vo.py); the sound design reads reel_news_events.json (written here).
// Usage: node reel_news.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const FPS = 30;
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_news_cues.json'), 'utf8'));
const DURATION = C.end;
const FONTS = path.join(__dirname, 'fonts'), PHOTOS = path.join(__dirname, 'photos');
const b64 = (p, mime) => `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`;
const font = (f) => `url(${b64(path.join(FONTS, f), f.endsWith('woff2') ? 'font/woff2' : f.endsWith('otf') ? 'font/otf' : 'font/ttf')})`;
const IMGS = Object.fromEntries(fs.readdirSync(PHOTOS).filter((f) => f.endsWith('.jpg')).map((f) => [f.slice(0, -4), b64(path.join(PHOTOS, f), 'image/jpeg')]));

// Word-level moments inside the voice lines (found with whisper by reel_news_vo.py).
const W = { ...C.at };
W.tvoff = C.back[1] + 0.3;
W.click = C.cant[0] - 0.06;

// Sound-design events, shared with reel_news_audio.py.
const EV = [];
const ev = (t, k, extra = {}) => EV.push({ t: +t.toFixed(3), k, ...extra });
ev(0, 'static'); ev(0.3, 'flash'); ev(C.breaking[0], 'sting'); ev(C.breaking[0] + 0.62, 'slam');
ev(C.thumb[0] - 0.05, 'whoosh'); ev(W.stop1, 'stop');
ev(C.witness[0], 'glitch'); ev(W.stop2, 'beep'); ev(C.forad[0], 'shutter');
ev(C.everyday[0], 'glitch');
ev(C.scattered[0], 'slam'); ev(C.random[0], 'slam'); ev(C.noplan[0], 'tapestop');
ev(C.connect[0] + 0.05, 'whoosh'); ev(W.dots, 'slam');
C.words.forEach((t) => ev(t, 'hit'));
ev(C.build[0], 'glitch'); ev(W.click, 'click'); ev(C.cant[0], 'drop');
ev(W.cant, 'slam'); ev(W.scroll, 'slam');
ev(C.brand[0] - 0.3, 'whiteout'); ev(C.brand[0], 'boom'); ev(C.brand[0] + 0.3, 'sparkle'); ev(C.live[0], 'ding');
ev(C.run[0], 'slam'); ev(C.dm[0], 'hit'); ev(W.teardown, 'slam'); ev(C.free[0] + 0.6, 'tick');
ev(C.back[0] - 0.05, 'glitch'); ev(W.back, 'rewind'); ev(W.scrolling, 'slam'); ev(W.tvoff, 'tvoff');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Hook;font-weight:900;src:${font('Archivo-900.ttf')}}
@font-face{font-family:Hook;font-weight:800;src:${font('Archivo-800.ttf')}}
@font-face{font-family:Body;font-weight:500;src:${font('Inter-500.ttf')}}
@font-face{font-family:Body;font-weight:600;src:${font('Inter-600.ttf')}}
@font-face{font-family:Body;font-weight:700;src:${font('Inter-700.ttf')}}
@font-face{font-family:Logo;font-weight:800;src:${font('InterDisplay-ExtraBold.otf')}}
@font-face{font-family:Logo;font-weight:600;src:${font('InterDisplay-SemiBold.otf')}}
@font-face{font-family:Mono;src:${font('DMMono-Regular.ttf')}}
@font-face{font-family:Serif;font-style:italic;src:${font('InstrumentSerif-Italic.woff2')}}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas>
<div style="position:absolute;opacity:0;font-family:Hook;font-weight:900">a<b style="font-weight:800">a</b><span style="font-family:Body">a</span><span style="font-family:Logo;font-weight:800">a</span><span style="font-family:Mono">a</span><i style="font-family:Serif">a</i></div>
<script>
const C=${JSON.stringify(C)}, Wd=${JSON.stringify(W)}, EV=${JSON.stringify(EV)};
const SRC=${JSON.stringify(IMGS)};
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

// broadcast studio backdrop: perspective floor grid rushing forward + rotating rings
function studio(t,alpha=1){
  s.fillStyle='#000';s.fillRect(0,0,W,H);
  s.save();s.globalAlpha=alpha;
  glowBlob(W/2,H*0.46,900,0.10+0.03*Math.sin(t*3));
  const hz=H*0.62;
  s.strokeStyle='rgba(255,255,255,.16)';s.lineWidth=2;
  for(let i=-14;i<=14;i++){s.beginPath();s.moveTo(W/2+i*18,hz);s.lineTo(W/2+i*260,H+40);s.stroke()}
  for(let i=0;i<14;i++){const z=((i+t*1.6)%14)/14, y=hz+(H-hz)*z*z;s.globalAlpha=alpha*z;s.beginPath();s.moveTo(0,y);s.lineTo(W,y);s.stroke()}
  s.globalAlpha=alpha;
  const fade=s.createLinearGradient(0,hz-10,0,hz+260);fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=fade;s.fillRect(0,hz-10,W,270);
  s.translate(W/2,H*0.46);
  [[420,0.35,18],[520,-0.22,40],[610,0.15,64]].forEach(([r,sp,n],j)=>{s.save();s.rotate(t*sp);s.strokeStyle='rgba(255,255,255,'+(0.10-j*0.025)+')';s.lineWidth=j?2:5;
    for(let i=0;i<n;i++){const a0=i/n*TAU;s.beginPath();s.arc(0,0,r,a0,a0+TAU/n*0.55);s.stroke()}s.restore()});
  s.restore();
}
function staticNoise(t,alpha){s.save();s.imageSmoothingEnabled=false;s.globalAlpha=alpha;s.drawImage(NOISE[Math.floor(t*60)%6],0,0,W,H);
  s.globalAlpha=alpha*0.5;s.fillStyle='#fff';const y=(t*2400)%H;s.fillRect(0,y,W,60);s.restore()}

// ---------- chrome: LIVE bug, timecode, lower third, ticker ----------
function liveBug(t){
  s.save();s.fillStyle='#fff';rr(70,120,178,62,8);s.fill();
  s.fillStyle='#000';s.globalAlpha=(Math.floor(t*2)%2)?1:0.25;s.beginPath();s.arc(104,151,11,0,TAU);s.fill();s.globalAlpha=1;
  s.font='800 38px Hook';s.letterSpacing='2px';s.fillText('LIVE',126,165);
  s.font='26px Mono';s.letterSpacing='3px';s.fillStyle='rgba(255,255,255,.85)';
  const f=Math.floor(t*30)%30, sec=Math.floor(t);s.fillText('MEZ. NEWS',270,146);s.fillStyle='rgba(255,255,255,.55)';
  s.fillText('00:00:'+String(sec).padStart(2,'0')+':'+String(f).padStart(2,'0'),270,180);s.restore();
}
function lowerThird(t,t0,label,head,y=1290){
  const p=t-t0;if(p<0)return;
  const k=outExpo(p/0.35), k2=outExpo((p-0.12)/0.4);
  s.save();
  s.fillStyle='#fff';s.fillRect(60,y,270*k,70);
  s.fillStyle='#000';s.font='900 40px Hook';s.letterSpacing='1px';s.save();s.beginPath();s.rect(60,y,270*k,70);s.clip();s.fillText(label,82,y+50);s.restore();
  s.fillStyle='rgba(0,0,0,.88)';s.fillRect(60,y+70,960*k2,96);s.fillStyle='#fff';s.fillRect(60,y+70,8,96*k2);
  s.beginPath();s.rect(60,y+70,960*k2,96);s.clip();
  const o={size:54,w:900,ls:-1};fit(head,o,900);s.fillStyle='#fff';s.fillText(head,92,y+136);s.restore();
}
const TICK='THUMB STOPS MID-SCROLL  •  BRANDS STUNNED  •  MEZ MEDIA NOW LIVE  •  PAID ADS FOR BRANDS  •  DM “TEARDOWN” FOR A FREE AD REVIEW  •  ';
function ticker(t,t0){
  const k=outExpo((t-t0)/0.3);if(k<=0)return;const y=1500;
  s.save();s.fillStyle='#fff';s.fillRect(0,y,W*k,58);
  s.beginPath();s.rect(0,y,W*k,58);s.clip();
  s.fillStyle='#000';s.font='800 32px Hook';s.letterSpacing='2px';
  const tw=s.measureText(TICK).width, x=250-((t*230)%tw);s.fillText(TICK+TICK,x,y+41);
  s.fillStyle='#000';s.fillRect(0,y,230,58);s.fillStyle='#fff';s.font='900 32px Hook';s.fillText('BREAKING',22,y+41);s.restore();
}

// ---------- feed card (a generic sponsored post, no real brand) ----------
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

// ================= scenes =================
function sIntro(t){
  const b=C.breaking[0];
  studio(t,clamp((t-0.3)/0.3));
  if(t<0.34)staticNoise(t,1-clamp((t-0.2)/0.14)*0.6);
  // broadcast stripes sweeping in behind the headline
  for(let i=0;i<4;i++){const p=outExpo((t-b+0.12-i*0.04)/0.45);if(p<=0)continue;
    s.fillStyle='rgba(255,255,255,'+(0.9-i*0.2)+')';const y=1180+i*26, w=W*p;
    i%2?s.fillRect(W-w,y,w,i?6:14):s.fillRect(0,y,w,i?6:14)}
  if(on(t,b)){const o={size:200,ls:-8};T('BREAKING',W/2,900,{...o,sc:slam(t-b),a:clamp((t-b)/0.04)});
    // light sheen across the word
    const p=(t-b-0.25)/0.6;if(p>0&&p<1){s.save();s.globalCompositeOperation='source-atop';const x=lerp(-200,W+200,p);const q=s.createLinearGradient(x-120,0,x+120,0);
      q.addColorStop(0,'rgba(0,0,0,0)');q.addColorStop(.5,'rgba(0,0,0,.55)');q.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=q;s.fillRect(0,700,W,260);s.restore()}}
  boxT('NEWS',W/2,1110,{size:200,ls:-6},(t-b-0.62)/0.3);
}
function sThumb(t){
  const t0=C.thumb[0], ts=Wd.stop1;
  const feed=['fashion_walk','perfume','ring_pear','fashion_kneel','ring_black','hand_scroll'];
  const N=feed.length-1;let pos;
  if(t<ts){const k=(t-t0+0.15)/(ts-t0+0.15);pos=N*H*(0.15+0.85*k)}            // already mid-scroll when we cut in
  else{const u=t-ts;pos=N*H-70*Math.exp(-u*9)*Math.sin(u*26)}                // dead stop, small spring
  s.fillStyle='#000';s.fillRect(0,0,W,H);
  feed.forEach((k,i)=>{const y=i*H-pos;if(y>-H&&y<H){s.save();s.beginPath();s.rect(0,y,W,H);s.clip();
    const z=i===N?1.0+0.06*clamp(t-ts):1;photo(IMG[k],0,y,W,H,z,i===N?.6:.5,.5);s.restore();
    s.fillStyle='#000';s.fillRect(0,y-6,W,12)}});
  if(t>ts){shade(0.18)}
  lowerThird(t,ts+0.1,'BREAKING','THUMB STOPS MID-SCROLL');
}
function viewfinder(t,fx,fy,lock){
  s.save();s.strokeStyle='#fff';s.lineWidth=5;const m=70,L=90;
  [[m,240],[W-m,240],[m,H-430],[W-m,H-430]].forEach(([x,y],i)=>{const sx=i%2?-1:1, sy=i<2?1:-1;s.beginPath();s.moveTo(x,y+sy*L);s.lineTo(x,y);s.lineTo(x+sx*L,y);s.stroke()});
  s.fillStyle='#fff';s.globalAlpha=(Math.floor(t*2.5)%2)?1:0.2;s.beginPath();s.arc(W-238,288,12,0,TAU);s.fill();s.globalAlpha=1;
  s.font='30px Mono';s.letterSpacing='3px';s.fillText('REC',W-216,299);
  s.fillStyle='rgba(255,255,255,.8)';s.font='24px Mono';s.fillText('EYEWITNESS FOOTAGE',m+24,H-452);
  // focus reticle hunting, then locking
  const r=lock>0?lerp(150,96,outBack(lock)):150+10*Math.sin(t*20);
  s.lineWidth=4;s.strokeStyle=lock>0?'#fff':'rgba(255,255,255,.7)';const q=r*0.35;
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{s.beginPath();s.moveTo(fx+sx*r,fy+sy*(r-q));s.lineTo(fx+sx*r,fy+sy*r);s.lineTo(fx+sx*(r-q),fy+sy*r);s.stroke()});
  s.beginPath();s.moveTo(fx-14,fy);s.lineTo(fx+14,fy);s.moveTo(fx,fy-14);s.lineTo(fx,fy+14);s.stroke();
  if(lock>0){s.font='24px Mono';s.fillStyle='#fff';s.fillText('LOCKED',fx-r,fy+r+40)}
  s.restore();
}
function sWitness(t){
  const t0=C.witness[0], tf=C.forad[0];
  // phone screen sits at about (0.53,0.47) of the photo
  const P={x:.53,y:.47};
  let z=1.08+0.05*(t-t0), fx=P.x, fy=P.y;
  if(t>=tf){const k=outExpo((t-tf)/0.25);z=lerp(z,2.2,k)}
  photo(IMG.dark_phone,0,0,W,H,z,fx,fy);
  if(t<tf){
    const hunt=[[300,700],[760,820],[480,1260],[620,900]];const p=clamp((t-t0)/(Wd.stop2-t0));
    const i=Math.min(hunt.length-2,Math.floor(p*(hunt.length-1))), k=sstep(p*(hunt.length-1)-i);
    let rx=lerp(hunt[i][0],hunt[i+1][0],k), ry=lerp(hunt[i][1],hunt[i+1][1],k);
    const lock=clamp((t-Wd.stop2)/0.25);
    viewfinder(t,rx,ry,lock);
  } else {
    shade(0.55*outExpo((t-tf)/0.2));
    // typed serif line
    const str='for an ad.', n=Math.floor(clamp((t-tf-0.05)/0.5)*str.length);
    s.save();s.font='italic 210px Serif';s.letterSpacing='-2px';s.textAlign='left';s.fillStyle='#fff';
    const full=s.measureText(str).width, x0=W/2-full/2, y=1030;
    s.fillText(str.slice(0,n),x0,y);
    const cw=s.measureText(str.slice(0,n)).width;
    if(Math.floor(t*4)%2===0||n<str.length){s.fillRect(x0+cw+10,y-160,8,190)}
    const u=clamp((t-tf-0.6)/0.3);if(u>0){s.fillRect(x0,y+44,full*outExpo(u),6)}
    s.restore();
  }
  lowerThird(t,t0+0.2,'LIVE','WITNESSES SPEAK OUT',1290);
}
function sFeed(t){
  const t0=C.everyday[0];
  s.fillStyle='#050505';s.fillRect(0,0,W,H);
  const imgs=['ring_oval','fashion_kneel','perfume','ring_pear','fashion_walk','ring_black','lens_wide'];
  const pitch=1260, speed=2900, start=-(t-t0)*speed+700;
  for(let i=0;i<imgs.length;i++){
    const cy=start+i*pitch+700;if(cy<-700||cy>H+700)continue;
    const passT=t0+(i*pitch+700+700-760)/speed;   // when the card reaches the upper area
    card(IMG[imgs[i]],W/2,cy+260,820,1180,{skipped:t>passT?clamp((t-passT)/0.25):0});
  }
  const q=s.createLinearGradient(0,0,0,700);q.addColorStop(0,'rgba(0,0,0,1)');q.addColorStop(.75,'rgba(0,0,0,.92)');q.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=q;s.fillRect(0,0,W,700);
  const u=t-t0;
  T('Every day, brands pay to be',W/2,350,{size:52,w:600,f:'Body',ls:0,a:outExpo(u/0.3)});
  if(t<Wd.scrolled)T('SCROLLED PAST.',W/2,520,{size:128,ls:-4,a:0.18});
  boxT('SCROLLED PAST.',W/2,520,{size:128,ls:-4,sc:slam(t-Wd.scrolled)},(t-Wd.scrolled)/0.25);
}
const LABELS=['POST','BOOST','REEL','STORY','PROMO','20% OFF','GIVEAWAY','REPOST','NEW DROP','BOOST POST','TRENDING','COLLAB','SALE','LINK IN BIO','FREE SHIPPING','RESTOCK','BOOST AGAIN','FLASH SALE','POST AGAIN','UGC','DISCOUNT','HASHTAGS'];
const NODES=LABELS.map((l,i)=>({l,x:(R(i*3+1)-.5)*1400,y:(R(i*3+2)-.5)*2100,z:420+R(i*3+3)*1500,ph:R(i+77)*TAU,fill:R(i+300)<0.28}));
function project(n,t,ang){const ca=Math.cos(ang),sa=Math.sin(ang);const x=n.x*ca-(n.z-1200)*sa, z=n.x*sa+(n.z-1200)*ca+1200;return {x:W/2+x*900/z,y:H/2+n.y*900/z,sc:900/z,z}}
function sScatter(t){
  const t0=C.scattered[0], tn=C.noplan[0];
  s.fillStyle='#000';s.fillRect(0,0,W,H);glowBlob(W/2,H/2,900,0.06);
  const ang=0.35*Math.sin((t-t0)*0.7)+(t-t0)*0.12;
  const focus=lerp(650,1400,sstep((t-t0)/(tn-t0)));
  const pts=NODES.map((n,i)=>{let m={...n,x:n.x+Math.sin(t*1.3+n.ph)*60,y:n.y+Math.cos(t*1.1+n.ph)*50};
    let p=project(m,t,ang);const u=t-tn;let rot=Math.sin(t+n.ph)*0.15;
    if(u>0){p.y+=0.5*3800*u*u*(0.6+R(i)*0.8);rot+=u*(R(i+5)-.5)*6}
    return {...p,n,rot,u}}).sort((A,B)=>B.z-A.z);
  pts.forEach(p=>{const blur=Math.min(9,Math.abs(p.z-focus)/160);s.save();if(blur>0.7)s.filter='blur('+blur.toFixed(1)+'px)';
    s.globalAlpha=clamp(1.8-p.z/1500)*(p.u>0?clamp(1-p.u*1.6):1);s.translate(p.x,p.y);s.rotate(p.rot);s.scale(p.sc,p.sc);
    s.font='700 46px Body';s.letterSpacing='2px';const w=s.measureText(p.n.l).width+64;
    rr(-w/2,-38,w,76,38);if(p.n.fill){s.fillStyle='#fff';s.fill();s.fillStyle='#000'}else{s.strokeStyle='#fff';s.lineWidth=3;s.stroke();s.fillStyle='#fff'}
    s.textAlign='center';s.fillText(p.n.l,0,16);s.restore()});
  textBacker(980,260,0.7);
  const lines=[[C.scattered[0],'SCATTERED POSTS.'],[C.random[0],'RANDOM BOOSTS.']];
  let cur=null;lines.forEach(l=>{if(t>=l[0])cur=l});
  if(t>=tn){boxT('NO PLAN.',W/2,1040,{size:190,ls:-6,sc:slam(t-tn)},(t-tn)/0.2)}
  else if(cur)T(cur[1],W/2,1040,{size:150,ls:-5,sc:slam(t-cur[0])});
}
// dots that settle into a rising path, then get connected
const PATH=[[150,1420],[260,1300],[330,1350],[450,1180],[540,1220],[640,1020],[720,1060],[820,850],[930,700]];
function sConnect(t){
  const t0=C.connect[0], td=Wd.dots;
  s.fillStyle='#000';s.fillRect(0,0,W,H);
  s.fillStyle='rgba(255,255,255,.09)';for(let x=60;x<W;x+=60)for(let y=640;y<1600;y+=60){s.fillRect(x-1.5,y-1.5,3,3)}
  const pts=PATH.map(([x,y],i)=>{const k=outExpo((t-t0-0.05-i*0.03)/0.55);const sx=(R(i+40)-.5)*1000+W/2, sy=(R(i+60)-.5)*1100+1100;return [lerp(sx,x,k),lerp(sy,y,k)]});
  const segT=(td-t0-0.35)/(PATH.length-1);
  s.save();s.strokeStyle='#fff';s.lineWidth=7;s.lineCap='round';s.shadowColor='rgba(255,255,255,.9)';s.shadowBlur=24;
  for(let i=0;i<PATH.length-1;i++){const k=clamp((t-t0-0.35-i*segT)/segT);if(k<=0)break;
    s.beginPath();s.moveTo(...pts[i]);s.lineTo(lerp(pts[i][0],pts[i+1][0],k),lerp(pts[i][1],pts[i+1][1],k));s.stroke()}
  s.restore();
  pts.forEach(([x,y],i)=>{const lit=t>t0+0.35+i*segT;s.fillStyle=lit?'#fff':'rgba(255,255,255,.55)';s.beginPath();s.arc(x,y,lit?16:11,0,TAU);s.fill();
    if(lit){const u=t-(t0+0.35+i*segT);if(u<0.4){s.strokeStyle='rgba(255,255,255,'+(1-u/0.4)+')';s.lineWidth=3;s.beginPath();s.arc(x,y,16+u*120,0,TAU);s.stroke()}}});
  // arrow head once the line reaches the top
  const done=clamp((t-td)/0.2);if(done>0){const [x,y]=pts[pts.length-1];s.save();s.translate(x,y);s.rotate(Math.atan2(700-850,930-820));s.scale(done,done);
    s.fillStyle='#fff';s.beginPath();s.moveTo(40,0);s.lineTo(-20,-30);s.lineTo(-20,30);s.closePath();s.fill();s.restore()}
  T('SO WE CONNECT',W/2,380,{size:120,ls:-4,sc:slam(t-t0-0.05),a:clamp((t-t0)/0.05)});
  if(t<td)T('THE DOTS.',W/2,540,{size:150,ls:-5,a:0.15});
  boxT('THE DOTS.',W/2,540,{size:150,ls:-5,sc:slam(t-td)},(t-td)/0.2);
}
const PILLARS=[['HOOK.','lens_24',.5,.45],['STORY.','model_profile',.72,.45],['OFFER.','ring_oval',.5,.5],['SCALE.','crowd_blur',.5,.5]];
function sPillars(t){
  let i=0;C.words.forEach((w,j)=>{if(t>=w)i=j});const tw=C.words[i], u=t-tw;
  const [word,img,fx,fy]=PILLARS[i];
  const z=i===3?1.22-0.12*outExpo(u/0.4)+0.04*Math.max(0,u-0.4):1.2-0.14*outExpo(u/0.35);
  photo(IMG[img],0,0,W,H,z,fx,fy);shade(0.42);vignette(s,0.8);
  s.save();s.strokeStyle='rgba(255,255,255,.6)';s.lineWidth=2;s.strokeRect(50,200,W-100,H-560);s.restore();
  s.save();s.font='34px Mono';s.letterSpacing='4px';s.fillStyle='#fff';s.fillText('0'+(i+1),90,280);s.fillStyle='rgba(255,255,255,.5)';s.fillText('/04',140,280);
  ['HOOK','STORY','OFFER','SCALE'].forEach((n,j)=>{s.fillStyle=j===i?'#fff':'rgba(255,255,255,.3)';s.fillRect(90+j*80,310,64,6)});s.restore();
  T(word,W/2,1060,{size:250,ls:-10,sc:slam(u)});
}
function sPrompt(t){
  const t0=C.build[0], tc=Wd.click;
  s.fillStyle='#000';s.fillRect(0,0,W,H);
  glowBlob(W/2,980,700,0.12+0.04*Math.sin(t*5));
  const zoom=1+0.05*(t-t0);s.save();s.translate(W/2,980);s.scale(zoom,zoom);s.translate(-W/2,-980);
  T('What should your next ad do?',W/2,780,{size:46,w:500,f:'Body',ls:0,color:'rgba(255,255,255,.7)',a:outExpo((t-t0)/0.3)});
  s.save();s.shadowColor='rgba(255,255,255,.35)';s.shadowBlur=60;s.fillStyle='#0d0d0d';rr(90,850,900,270,44);s.fill();s.restore();
  s.strokeStyle='rgba(255,255,255,.45)';s.lineWidth=2;rr(90,850,900,270,44);s.stroke();
  const str='Make it unskippable.', ty0=t0+0.05, ty1=C.build[1]-0.12;
  const n=Math.floor(clamp((t-ty0)/(ty1-ty0))*str.length);
  s.font='500 54px Body';s.letterSpacing='0px';s.fillStyle='#fff';s.textAlign='left';s.fillText(str.slice(0,n),140,950);
  const cw=s.measureText(str.slice(0,n)).width;if(Math.floor(t*4)%2===0||n<str.length)s.fillRect(146+cw,906,4,60);
  // send button
  const press=t>tc?1-0.15*Math.exp(-(t-tc)*10)*Math.sin(clamp((t-tc)/0.15)*Math.PI):1;
  s.save();s.translate(905,1055);s.scale(press,press);s.fillStyle='#fff';s.beginPath();s.arc(0,0,40,0,TAU);s.fill();
  s.strokeStyle='#000';s.lineWidth=6;s.lineCap='round';s.beginPath();s.moveTo(0,16);s.lineTo(0,-16);s.moveTo(-13,-3);s.lineTo(0,-16);s.lineTo(13,-3);s.stroke();s.restore();
  if(t>tc){const u=t-tc;s.strokeStyle='rgba(255,255,255,'+clamp(1-u/0.35)+')';s.lineWidth=5;s.beginPath();s.arc(905,1055,40+u*900,0,TAU);s.stroke()}
  // pointer
  const mk=sstep((t-(ty1-0.05))/(tc-ty1+0.02));const px=lerp(760,915,mk), py=lerp(1420,1070,mk);
  s.save();s.translate(px,py);s.scale(1.4,1.4);s.fillStyle='#fff';s.strokeStyle='#000';s.lineWidth=2.5;s.beginPath();
  s.moveTo(0,0);s.lineTo(0,34);s.lineTo(9,26);s.lineTo(16,41);s.lineTo(22,38);s.lineTo(15,24);s.lineTo(27,24);s.closePath();s.fill();s.stroke();s.restore();
  s.restore();
}
const TUN=['ring_oval','fashion_kneel','perfume','lens_24','ring_pear','fashion_walk','model_profile','ring_black','hand_phone_dark','lens_wide','crowd_blur','perfume','ring_oval','fashion_kneel'];
function sTunnel(t){
  const t0=C.cant[0], te=C.brand[0]-0.3;
  s.fillStyle='#000';s.fillRect(0,0,W,H);
  const u=t-t0, speed=0.55+0.6*inExpo(clamp((t-t0)/(te-t0)));
  const travel=u*speed+0.25*Math.min(u,0.6)*0;
  // warp streaks
  s.save();s.translate(W/2,H/2);s.strokeStyle='rgba(255,255,255,.5)';s.lineWidth=2.5;
  for(let i=0;i<110;i++){const a0=R(i+500)*TAU, d0=((R(i+600)+travel*1.8)%1);const r1=80+d0*d0*1500, r2=r1*(1+0.12+speed*0.25);
    s.globalAlpha=d0;s.beginPath();s.moveTo(Math.cos(a0)*r1,Math.sin(a0)*r1);s.lineTo(Math.cos(a0)*r2,Math.sin(a0)*r2);s.stroke()}
  s.restore();
  const items=TUN.map((k,i)=>{const z=(1-((i/TUN.length+travel)%1))*3200+120;const ang=i*2.399+u*0.4;return {k,i,z,x:Math.cos(ang)*560,y:Math.sin(ang)*760}}).sort((A,B)=>B.z-A.z);
  items.forEach(it=>{const sc=700/it.z;if(sc>4)return;const cx=W/2+it.x*sc, cy=H/2+it.y*sc, w=520*sc, h=700*sc;
    s.save();s.globalAlpha=clamp((3300-it.z)/900)*clamp((it.z-120)/200);rr(cx-w/2,cy-h/2,w,h,24*sc);s.clip();photo(IMG[it.k],cx-w/2,cy-h/2,w,h,1);s.restore();
    s.save();s.globalAlpha=clamp((3300-it.z)/900)*0.8;s.strokeStyle='#fff';s.lineWidth=Math.max(1,4*sc);rr(cx-w/2,cy-h/2,w,h,24*sc);s.stroke();s.restore()});
  const q=s.createRadialGradient(W/2,1000,50,W/2,1000,620);q.addColorStop(0,'rgba(0,0,0,.85)');q.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=q;s.fillRect(0,300,W,1400);
  T('ADS PEOPLE',W/2,820,{size:110,ls:-3,sc:slam(t-t0)});
  if(on(t,Wd.cant))T("CAN'T",W/2,1030,{size:230,ls:-8,sc:slam(t-Wd.cant)});
  boxT('SCROLL PAST.',W/2,1220,{size:130,ls:-4,sc:slam(t-Wd.scroll)},(t-Wd.scroll)/0.2);
}
const SPARKS=Array.from({length:46},(_,i)=>({a:R(i+900)*TAU,v:300+R(i+950)*900,l:10+R(i+990)*30}));
function sLogo(t){
  const t0=C.brand[0];
  s.fillStyle='#000';s.fillRect(0,0,W,H);
  // drifting light leak
  glowBlob(W/2+Math.sin(t*0.8)*220,880+Math.cos(t*0.6)*120,800,0.10);
  const z=1+0.03*(t-t0);s.save();s.translate(W/2,900);s.scale(z,z);s.translate(-W/2,-900);
  // light streak that reveals the wordmark
  const p=(t-t0+0.25)/0.45, sx=lerp(-100,W+200,outCubic(p));
  s.save();s.font='800 330px Logo';s.letterSpacing='-17px';s.textAlign='left';
  const mw=s.measureText('mez').width, dw=s.measureText('.').width, x0=W/2-(mw+dw)/2, y=980;
  s.save();s.beginPath();s.rect(0,0,clamp(sx,0,W),H);s.clip();
  ['m','e','z'].forEach((ch,i)=>{const k=outBack((t-t0+0.2-i*0.06)/0.35);const pre=s.measureText('mez'.slice(0,i)).width;
    s.save();s.globalAlpha=clamp(k*2);s.translate(x0+pre,y+(1-k)*80);s.fillStyle='#fff';s.fillText(ch,0,0);s.restore()});
  s.restore();
  // the dot: pops in with sparks
  const dk=t-(t0+0.3);if(dk>0){s.save();const sc=outBack(dk/0.25);s.translate(x0+mw+dw/2,y-40);s.scale(sc,sc);s.translate(-(x0+mw+dw/2),-(y-40));
    s.shadowColor='rgba(255,255,255,'+(0.9*Math.exp(-dk*2))+')';s.shadowBlur=60;s.fillStyle='#fff';s.fillText('.',x0+mw,y);s.restore();
    if(dk<0.8){s.save();s.translate(x0+mw+dw/2,y-40);SPARKS.forEach(sp=>{const d=sp.v*dk*(1-dk*0.5);s.strokeStyle='rgba(255,255,255,'+clamp(1-dk/0.8)+')';s.lineWidth=3;
      s.beginPath();s.moveTo(Math.cos(sp.a)*d,Math.sin(sp.a)*d);s.lineTo(Math.cos(sp.a)*(d+sp.l),Math.sin(sp.a)*(d+sp.l));s.stroke()});s.restore()}}
  s.restore();
  // streak itself
  if(p>0&&p<1.1){s.save();const q=s.createLinearGradient(sx-500,0,sx+40,0);q.addColorStop(0,'rgba(255,255,255,0)');q.addColorStop(1,'rgba(255,255,255,.95)');
    s.fillStyle=q;s.fillRect(sx-500,893,540,6);glowBlob(sx,896,160,0.5);s.restore()}
  const mk=outExpo((t-t0-0.45)/0.6);if(mk>0){s.save();s.font='600 72px Logo';s.letterSpacing=(4+26*mk)+'px';s.textAlign='center';s.fillStyle='rgba(255,255,255,'+mk+')';s.fillText('MEDIA',W/2+13*mk,1110);s.restore()}
  s.restore();
  const lv=t-C.live[0];if(lv>0){const k=slam(lv);s.save();s.translate(W/2,1290);s.scale(k,k);s.fillStyle='#fff';rr(-170,-46,340,92,46);s.fill();
    s.fillStyle='#000';s.globalAlpha=(Math.floor(lv*2.5)%2)?0.25:1;s.beginPath();s.arc(-112,0,12,0,TAU);s.fill();s.globalAlpha=1;
    s.font='900 46px Hook';s.letterSpacing='2px';s.textAlign='left';s.fillText('NOW LIVE',-86,17);s.restore()}
}
const COLS=[['ring_oval','fashion_walk','perfume','lens_24'],['model_profile','ring_pear','fashion_kneel','ring_black'],['lens_wide','perfume','ring_oval','fashion_walk']];
function photoWall(t,dim){
  s.fillStyle='#000';s.fillRect(0,0,W,H);
  COLS.forEach((col,ci)=>{const dir=ci%2?1:-1, off=((t*170*dir)%2080+2080)%2080;
    for(let r=-1;r<col.length+1;r++){const k=col[(r+col.length)%col.length];const y=r*520-off+(ci%2?-260:0);
      s.save();rr(30+ci*345,y,330,500,20);s.clip();photo(IMG[k],30+ci*345,y,330,500,1);s.restore()}});
  shade(dim);vignette(s,0.9);
}
function sCTA(t){
  photoWall(t,0.7);
  T('RUN A BRAND?',W/2,640,{size:110,ls:-3,sc:slam(t-C.run[0])});
  if(on(t,C.dm[0]))T('DM US',W/2,880,{size:230,ls:-8,sc:slam(t-C.dm[0])});
  boxT('“TEARDOWN”',W/2,1080,{size:140,ls:-4,sc:slam(t-Wd.teardown)},(t-Wd.teardown)/0.22);
  const f=t-C.free[0];if(f>0)T('Your first ad review is on us.',W/2,1240+(1-outExpo(f/0.3))*40,{size:52,w:600,f:'Body',ls:0,a:outExpo(f/0.3)});
  const h=t-C.free[0]-0.6;if(h>0){s.save();s.font='700 56px Body';s.letterSpacing='1px';s.textAlign='center';s.fillStyle='#fff';s.globalAlpha=outExpo(h/0.3);s.fillText('@mezmedia_0',W/2,1360);
    const w=s.measureText('@mezmedia_0').width;s.fillRect(W/2-w/2,1382,w*outExpo(h/0.4),5);s.restore()}
}
function sBack(t){
  const t0=C.back[0]-0.05, tb=Wd.back;
  s.fillStyle='#000';s.fillRect(0,0,W,H);
  const imgs=['fashion_kneel','ring_pear','perfume','lens_24','ring_oval','fashion_walk','model_profile','ring_black'];
  const vel=(tt)=>tt<tb?40:40+3200*inExpo(clamp((tt-tb)/1.1));
  let pos=0;const n=40;for(let i=0;i<n;i++){const tt=t0+(t-t0)*(i/n);pos+=vel(tt)*(t-t0)/n}
  imgs.forEach((k,i)=>{const cy=i*1260-pos+960;if(cy<-700||cy>H+700)return;card(IMG[k],W/2,cy,820,1180)});
  shade(0.5);
  liveBug(t);
  T('NOW...',W/2,760,{size:90,w:800,ls:2,a:outExpo((t-t0)/0.2)});
  if(on(t,tb))T('BACK TO YOUR',W/2,960,{size:130,ls:-4,sc:slam(t-tb)});
  boxT('SCROLLING.',W/2,1150,{size:170,ls:-6,sc:slam(t-Wd.scrolling)},(t-Wd.scrolling)/0.2);
  ticker(t,t0);
}
function sEnd(t){
  s.fillStyle='#000';s.fillRect(0,0,W,H);
  const k=outExpo((t-Wd.tvoff-0.35)/0.5);if(k<=0)return;
  s.save();s.globalAlpha=k;s.font='800 150px Logo';s.letterSpacing='-8px';s.textAlign='center';s.fillStyle='#fff';s.fillText('mez.',W/2,960);
  s.font='600 34px Logo';s.letterSpacing='14px';s.fillText('MEDIA',W/2+7,1030);
  s.font='500 34px Body';s.letterSpacing='0px';s.fillStyle='rgba(255,255,255,.6)';s.fillText('@mezmedia_0',W/2,1140);s.restore();
}

const SCENES=[
  [0,C.thumb[0],sIntro,0],
  [C.thumb[0],C.witness[0],sThumb,8],
  [C.witness[0],C.everyday[0],sWitness,0],
  [C.everyday[0],C.scattered[0],sFeed,6],
  [C.scattered[0],C.connect[0],sScatter,0],
  [C.connect[0],C.words[0],sConnect,0],
  [C.words[0],C.build[0],sPillars,0],
  [C.build[0],C.cant[0],sPrompt,0],
  [C.cant[0],C.brand[0]-0.3,sTunnel,5],
  [C.brand[0]-0.3,C.run[0],sLogo,0],
  [C.run[0],C.back[0]-0.05,sCTA,0],
  [C.back[0]-0.05,Wd.tvoff,sBack,6],
  [Wd.tvoff,99,sEnd,0],
];
const CHROME_LIVE=[[C.breaking[0]+0.1,C.words[0]]], CHROME_TICK=[[C.thumb[0]+0.3,C.scattered[0]]];
function sceneAt(t){return SCENES.find(([a,b])=>t>=a&&t<b)||SCENES[SCENES.length-1]}
function drawScene(t){
  const sc=sceneAt(t);sc[2](t);
  if(CHROME_LIVE.some(([a,b])=>t>=a&&t<b))liveBug(t);
  if(CHROME_TICK.some(([a,b])=>t>=a&&t<b))ticker(t,CHROME_TICK[0][0]);
}

// ---------- post: camera punch/shake, flashes, glitch, grain ----------
const kinds=(ks)=>EV.filter(e=>ks.includes(e.k)).map(e=>e.t);
const PUNCH=kinds(['slam','hit','stop','sting','drop','boom','shutter']), SHAKE=kinds(['stop','hit','boom','sting','drop','tapestop']);
const FLASH=kinds(['flash','hit','sting','drop','whiteout','shutter']).concat(SCENES.slice(1).map(x=>x[0]));
const GLITCH=kinds(['glitch','tapestop','static']).concat([C.breaking[0],C.scattered[0],C.random[0]]);
function decay(list,t,len){let v=0;list.forEach(e=>{const u=t-e;if(u>=0&&u<len)v=Math.max(v,1-u/len)});return v}

window.setTime=(t)=>{
  const sc=sceneAt(t), n=sc[3];
  if(n>1){a.globalAlpha=1;a.fillStyle='#000';a.fillRect(0,0,W,H);
    for(let i=0;i<n;i++){drawScene(t-i*(1/FPS)*0.6/n);a.globalAlpha=1/(i+1);a.drawImage(SC,0,0)}a.globalAlpha=1}
  else{drawScene(t);a.globalAlpha=1;a.drawImage(SC,0,0)}
  // camera
  let z=1+0.06*clamp((t-sc[0])/(Math.min(sc[1],C.end)-sc[0]));   // every shot keeps pushing in
  PUNCH.forEach(e=>{const u=t-e;if(u>=0&&u<0.5)z+=0.05*Math.exp(-u/0.08)});
  let sx=0,sy=0;SHAKE.forEach(e=>{const u=t-e;if(u>=0&&u<0.5){const m=Math.exp(-u*9)*22;sx+=Math.sin(u*93+e)*m;sy+=Math.cos(u*71+e)*m}});
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,W,H);
  g.translate(W/2+sx,H/2+sy);g.scale(z,z);g.translate(-W/2,-H/2);
  // TV-off squeeze at the end
  const tv=t-Wd.tvoff;
  if(tv>0&&tv<0.3){const ky=Math.max(0.004,1-outExpo(tv/0.12)), kx=tv<0.12?1:Math.max(0,1-outExpo((tv-0.12)/0.12));
    g.translate(W/2,H/2);g.scale(kx,ky);g.translate(-W/2,-H/2);g.drawImage(AC,0,0);g.setTransform(1,0,0,1,0,0);
    g.fillStyle='rgba(255,255,255,'+(1-tv/0.3)+')';g.fillRect(W/2-W*kx/2,H/2-3,W*kx,6);}
  else if(!(tv>=0.3&&t<Wd.tvoff+0.35))g.drawImage(AC,0,0);
  g.setTransform(1,0,0,1,0,0);
  // glitch: shifted horizontal slices + one inverted frame
  const gl=decay(GLITCH,t,0.16);
  if(gl>0){seed=Math.floor(t*30)*13+5;for(let i=0;i<7;i++){const y=rnd()*H, h=20+rnd()*140, dx=(rnd()-.5)*160*gl;g.drawImage(out,0,y,W,h,dx,y,W,h)}
    if(gl>0.8){g.globalCompositeOperation='difference';g.fillStyle='#fff';g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over'}}
  const fl=decay(FLASH,t,0.12);if(fl>0){g.fillStyle='rgba(255,255,255,'+(0.75*fl*fl)+')';g.fillRect(0,0,W,H)}
  // grain + soft vignette
  g.save();g.globalAlpha=0.07;g.globalCompositeOperation='overlay';g.drawImage(NOISE[Math.floor(t*30)%6],0,0,W,H);g.restore();
  vignette(g,0.35);
};
const FPS=${FPS};
</script></body></html>`;

(async () => {
  fs.writeFileSync(path.join(__dirname, 'reel_news_events.json'), JSON.stringify({ cues: C, words: W, events: EV }, null, 1));
  fs.mkdirSync(FRAMES, { recursive: true });
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(async () => {
    const faces = ['900 50px Hook', '800 50px Hook', '500 50px Body', '600 50px Body', '700 50px Body', '800 50px Logo', '600 50px Logo', '50px Mono', 'italic 50px Serif'];
    await Promise.all(faces.map((f) => document.fonts.load(f)));
    await window.ready;
  });
  const times = flag === '--preview' ? list.split(',').map(Number) : Array.from({ length: Math.round(FPS * DURATION) }, (_, f) => f / FPS);
  const el = await pg.$('#c');
  for (let i = 0; i < times.length; i++) {
    await pg.evaluate((t) => window.setTime(t), times[i]);
    const name = flag === '--preview' ? `p_${times[i].toFixed(2)}.jpg` : `f${String(i).padStart(4, '0')}.jpg`;
    await el.screenshot({ path: path.join(FRAMES, name), type: 'jpeg', quality: 92 });
  }
  await browser.close();
  if (flag !== '--preview') {
    execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', OUT], { stdio: 'ignore' });
    console.log('wrote', OUT);
  } else console.log('previews in', FRAMES);
})();
