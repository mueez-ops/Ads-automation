// Mez Media "needle + water balloon" hook reel. Canvas-rendered scene + DOM type, frame by frame.
// Usage: node reel_balloon.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const FPS = 30, DURATION = 25;
const FONTS = path.join(__dirname, 'fonts');
const font = (f) => `url(data:font/ttf;base64,${fs.readFileSync(path.join(FONTS, f)).toString('base64')})`;

// Key moments, shared with the audio script.
const CUES = { approachEnd: 0.9, macroIn: 3.4, macroOut: 5.7, held: 7.0, textA: 7.1, textB: 9.7, textC: 11.7, punch: 14.5, pop: 14.85, logo: 17.6, cta: 19.4, end: DURATION };
fs.writeFileSync(path.join(__dirname, 'reel_balloon_cues.json'), JSON.stringify(CUES));

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Hook;font-weight:900;src:${font('Archivo-900.ttf')}}
@font-face{font-family:Body;font-weight:600;src:${font('Inter-600.ttf')}}
@font-face{font-family:Body;font-weight:700;src:${font('Inter-700.ttf')}}
@font-face{font-family:Mono;src:${font('DMMono-Regular.ttf')}}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#071820}
canvas{position:absolute;inset:0}
.layer{position:absolute;inset:0;pointer-events:none}
.hud{position:absolute;top:110px;font-family:Mono;color:rgba(230,250,244,.85);font-size:24px;letter-spacing:.18em;text-transform:uppercase}
.hud b{display:block;font-family:Mono;font-weight:400;font-size:58px;letter-spacing:.02em;color:#fff;margin-top:10px}
.hud .dot{display:inline-block;width:14px;height:14px;border-radius:50%;background:#14B07F;margin-right:12px;vertical-align:1px}
.txt{position:absolute;left:90px;right:90px;top:230px;display:none}
.small{font-family:Body;font-weight:600;font-size:50px;color:rgba(255,255,255,.82);line-height:1.25}
.hook{font-family:Hook;font-weight:900;text-transform:uppercase;color:#fff;line-height:.92;letter-spacing:-.03em}
.mark{background:#14B07F;color:#fff;padding:0 .1em;display:inline-block}
.it{will-change:transform,opacity}
.center{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 90px}
</style></head><body>
<canvas id="c" width="1080" height="1920"></canvas>
<div class="layer" id="ui">
  <div class="hud" id="hudL" style="left:80px"><span class="dot"></span>Attention held<b id="tm">00.0s</b></div>
  <div class="hud" id="hudR" style="right:80px;text-align:right">Gap<b id="gap">40.00 mm</b></div>

  <div class="txt" id="A"><div class="small it" data-a="up" data-at="0">You just watched this for</div>
    <div class="hook" style="font-size:190px;margin-top:22px"><span class="mark it" data-a="wipe" data-at="0.35" style="font-size:150px">7 SECONDS.</span></div></div>
  <div class="txt" id="B"><div class="small it" data-a="up" data-at="0">Now imagine it was</div>
    <div class="hook" style="font-size:190px;margin-top:22px"><span class="mark it" data-a="wipe" data-at="0.35" style="font-size:150px">YOUR BRAND.</span></div></div>
  <div class="txt" id="C"><div class="hook" style="font-size:108px"><div class="it" data-a="slam" data-at="0">WE MAKE CONTENT</div><div class="it" data-a="slam" data-at="0.3">PEOPLE CAN'T</div>
    <span class="mark it" data-a="wipe" data-at="0.6">SCROLL PAST.</span></div></div>

  <div class="center" id="D"><div class="hook it" data-a="slam" data-at="0" style="font-size:330px;text-transform:none;letter-spacing:-.06em">mez<span class="it" data-a="pop" data-at="0.4" style="color:#14B07F;display:inline-block">.</span></div>
    <div class="it" data-a="track" data-at="0.5" style="font-family:Body;font-weight:700;font-size:62px;color:rgba(255,255,255,.7);margin-top:24px">MEDIA</div></div>
  <div class="center" id="E" style="align-items:flex-start;text-align:left">
    <div class="small it" data-a="up" data-at="0" style="color:#fff">Run a skincare brand?</div>
    <div class="hook it" data-a="slam" data-at="0.35" style="font-size:200px;margin-top:36px">DM</div>
    <div class="hook" style="font-size:124px;margin-top:10px"><span class="mark it" data-a="wipe" data-at="0.6">“TEARDOWN”</span></div>
    <div class="small it" data-a="up" data-at="1.0" style="margin-top:50px;font-size:44px;color:rgba(255,255,255,.7)">Free 2-minute review of your ads.</div>
    <div class="it" data-a="up" data-at="1.2" style="margin-top:22px;font-family:Body;font-weight:700;font-size:48px;color:#14B07F">@mezmedia_0</div>
  </div>
</div>
<script>
const C=${JSON.stringify(CUES)};
const cv=document.getElementById('c'), g=cv.getContext('2d');
const W=1080,H=1920, TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,k)=>a+(b-a)*k;
const sstep=(k)=>{k=clamp(k);return k*k*(3-2*k)};
const outExpo=(x)=>x>=1?1:1-Math.pow(2,-10*x);
const outBack=(x)=>{const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
// seeded random so every frame agrees
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};

// ---------- world ----------
const BX=610, BY=1180, A=272, B=236;           // balloon centre and radii
const FLOOR=BY+B*0.78;                          // resting surface
const CONTACT={x:BX-A, y:BY-6};
const MM=14;                                    // px per mm

function gapMM(t){
  if(t<C.approachEnd) return lerp(40,12,outExpo(t/C.approachEnd));
  if(t<C.held) return 0.22+(12-0.22)*Math.exp(-(t-C.approachEnd)*0.75);
  if(t<C.punch) return 0.22+ (0.2-0.22)*sstep((t-C.held)/(C.punch-C.held));
  if(t<C.pop) return 0.2*(1-sstep((t-C.punch)/(C.pop-C.punch)));
  return 0;
}
function wobbleAmp(t){return 1+ (t>C.textC? (t-C.textC)*0.25:0)}
function outline(t,dimple){
  const pts=[], amp=wobbleAmp(t);
  for(let i=0;i<220;i++){
    const th=i/220*TAU, s=Math.sin(th), c=Math.cos(th);
    const w=amp*(0.011*Math.sin(3*th+2.1*t)+0.008*Math.sin(5*th-3.3*t)+0.006*Math.sin(2*th+1.3*t));
    let x=c*(1+w)*A, y=s*(1+w)*B;
    if(s>0){y*=0.78; x*=1+0.07*s}else{x*=1-0.06*(-s)}
    let px=BX+x, py=BY+y;
    if(dimple>0){const d=Math.hypot(px-CONTACT.x,py-CONTACT.y);px+=dimple*Math.exp(-d*d/1800)}
    pts.push([px,py]);
  }
  return pts;
}
function pathOf(pts){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath()}

// ---------- camera ----------
const shots=[ // [t, zoom, fx, fy] ; hard cut when next key has cut:true
  {t:0,z:1.0,fx:560,fy:1020},{t:C.approachEnd,z:1.12,fx:520,fy:1060},{t:C.macroIn-0.01,z:1.42,fx:450,fy:1110},
  {t:C.macroIn,z:3.9,fx:CONTACT.x-30,fy:CONTACT.y,cut:true},{t:C.macroOut-0.01,z:3.2,fx:CONTACT.x-10,fy:CONTACT.y+10},
  {t:C.macroOut,z:1.2,fx:520,fy:1000,cut:true},{t:C.punch,z:1.36,fx:470,fy:1010},
  {t:C.pop,z:2.3,fx:CONTACT.x+40,fy:CONTACT.y},{t:C.pop+1.6,z:1.08,fx:560,fy:1060},{t:C.end,z:0.98,fx:560,fy:1040}];
function camera(t){
  let i=0;while(i<shots.length-1&&shots[i+1].t<=t)i++;
  const a=shots[i],b=shots[Math.min(i+1,shots.length-1)];
  const k=b===a||b.cut?0:sstep((t-a.t)/(b.t-a.t));
  let z=lerp(a.z,b.z,k),fx=lerp(a.fx,b.fx,k),fy=lerp(a.fy,b.fy,k);
  // handheld drift
  fx+=Math.sin(t*0.9)*6+Math.sin(t*2.3)*2; fy+=Math.cos(t*0.7)*5;
  // pop shake
  const u=t-C.pop; let sx=0,sy=0;
  if(u>0&&u<0.9){const e=Math.exp(-u*5)*26;sx=Math.sin(u*90)*e;sy=Math.cos(u*77)*e}
  return {z,tx:W/2-fx*z+sx,ty:H/2-fy*z+sy};
}

// ---------- backdrop ----------
const bokeh=[];for(let i=0;i<14;i++)bokeh.push({x:rnd()*W,y:rnd()*H*0.7,r:30+rnd()*120,a:0.03+rnd()*0.06,p:0.2+rnd()*0.5});
function backdrop(t,cam){
  g.setTransform(1,0,0,1,0,0);
  g.fillStyle='#071820';g.fillRect(0,0,W,H);
  const vg=g.createRadialGradient(W*0.55,H*0.6,100,W*0.55,H*0.6,1300);
  vg.addColorStop(0,'#0F2A3A');vg.addColorStop(1,'#050F15');g.fillStyle=vg;g.fillRect(0,0,W,H);
  bokeh.forEach(b=>{const x=b.x+(cam.tx-W/2)*b.p*0.05, y=b.y+(cam.ty-H/2)*b.p*0.05;
    const rg=g.createRadialGradient(x,y,0,x,y,b.r*(1+cam.z*0.15));rg.addColorStop(0,'rgba(120,230,200,'+b.a+')');rg.addColorStop(1,'rgba(120,230,200,0)');
    g.fillStyle=rg;g.beginPath();g.arc(x,y,b.r*(1+cam.z*0.15),0,TAU);g.fill()});
}
function floor(t){
  const fg=g.createLinearGradient(0,FLOOR,0,FLOOR+700);fg.addColorStop(0,'rgba(20,60,72,.55)');fg.addColorStop(1,'rgba(5,15,21,0)');
  g.fillStyle=fg;g.fillRect(-2000,FLOOR,6000,1400);
  g.strokeStyle='rgba(160,240,215,.10)';g.lineWidth=2;g.beginPath();g.moveTo(-2000,FLOOR);g.lineTo(4000,FLOOR);g.stroke();
}

// ---------- balloon ----------
const bubbles=[];for(let i=0;i<34;i++)bubbles.push({x:(rnd()-.5)*1.6*A,y:(rnd()-.2)*1.2*B,r:2+rnd()*6,s:8+rnd()*20});
function drawBody(pts,t,alpha=1){
  g.save();g.globalAlpha=alpha;
  pathOf(pts);
  const rg=g.createRadialGradient(BX-90,BY-100,20,BX,BY+20,A*1.15);
  rg.addColorStop(0,'rgba(170,255,225,.96)');rg.addColorStop(.33,'rgba(46,205,155,.9)');rg.addColorStop(.78,'rgba(10,122,90,.92)');rg.addColorStop(1,'rgba(4,58,46,.96)');
  g.fillStyle=rg;g.fill();
  g.save();pathOf(pts);g.clip();
  // light focused through the water, pooling low
  const cg=g.createRadialGradient(BX+30,BY+B*0.55,10,BX+30,BY+B*0.55,A*0.8);
  cg.addColorStop(0,'rgba(200,255,235,.55)');cg.addColorStop(1,'rgba(200,255,235,0)');g.fillStyle=cg;g.fillRect(BX-A*1.2,BY-B*1.2,A*2.4,B*2.4);
  // fresnel edge
  g.lineWidth=46;g.strokeStyle='rgba(2,40,32,.28)';pathOf(pts);g.stroke();
  // drifting bubbles
  g.lineWidth=1.6;
  bubbles.forEach(b=>{const y=BY+b.y-((t*b.s)%(B*1.4));g.strokeStyle='rgba(225,255,245,.35)';g.beginPath();g.arc(BX+b.x+Math.sin(t*2+b.s)*3,y,b.r,0,TAU);g.stroke()});
  g.restore();
  // rim light
  g.lineWidth=3;g.strokeStyle='rgba(205,255,238,.45)';pathOf(pts);g.stroke();
  g.restore();
}
function drawHighlights(t,alpha=1){
  g.save();g.globalAlpha=alpha;
  const hg=g.createRadialGradient(BX-120,BY-120,4,BX-120,BY-120,120);hg.addColorStop(0,'rgba(255,255,255,.75)');hg.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=hg;g.beginPath();g.ellipse(BX-120,BY-120,130,80,-0.5,0,TAU);g.fill();
  // studio softbox reflection: a soft rounded window
  g.translate(BX+95,BY-150);g.rotate(0.38);g.fillStyle='rgba(255,255,255,.82)';
  g.beginPath();g.roundRect(-46,-18,92,36,16);g.fill();
  g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.arc(-150,40,7,0,TAU);g.fill();
  g.restore();
}
function drawKnot(alpha=1){
  g.save();g.globalAlpha=alpha;g.translate(BX+28,BY-B+4);
  g.fillStyle='#0E7D5E';g.beginPath();g.ellipse(0,-10,24,16,0.2,0,TAU);g.fill();
  g.fillStyle='#14B07F';g.beginPath();g.moveTo(-10,-20);g.quadraticCurveTo(10,-70,34,-56);g.quadraticCurveTo(16,-44,6,-18);g.closePath();g.fill();
  g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.ellipse(-6,-14,8,4,0.2,0,TAU);g.fill();
  g.restore();
}
function drawReflection(pts,alpha){
  g.save();g.globalAlpha=alpha*0.07;g.translate(0,2*FLOOR);g.scale(1,-0.55);g.translate(0,-FLOOR*0.818);pathOf(pts);g.fillStyle='#2bd59f';g.fill();g.restore();
  const cg=g.createRadialGradient(BX+20,FLOOR+6,4,BX+20,FLOOR+6,300);cg.addColorStop(0,'rgba(120,255,205,'+(0.45*alpha)+')');cg.addColorStop(1,'rgba(120,255,205,0)');
  g.fillStyle=cg;g.beginPath();g.ellipse(BX+20,FLOOR+6,320,40,0,0,TAU);g.fill();
}
function drawNeedle(t){
  const tip=CONTACT.x-gapMM(t)*MM, y=CONTACT.y, L=1100, w=10;
  g.save();
  const ng=g.createLinearGradient(0,y-w/2,0,y+w/2);
  ng.addColorStop(0,'#5d6b74');ng.addColorStop(.3,'#f5fafc');ng.addColorStop(.55,'#9fb0ba');ng.addColorStop(1,'#26323a');
  g.fillStyle=ng;g.beginPath();g.moveTo(tip-L,y-w/2);g.lineTo(tip-120,y-w/2);g.lineTo(tip,y);g.lineTo(tip-120,y+w/2);g.lineTo(tip-L,y+w/2);g.closePath();g.fill();
  g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1.2;g.beginPath();g.moveTo(tip-L,y-w/2+2);g.lineTo(tip-125,y-w/2+2);g.stroke();
  // glint travelling along the shaft
  const gx=tip-120-((t*260)%900);const gg=g.createRadialGradient(gx,y-2,0,gx,y-2,40);gg.addColorStop(0,'rgba(255,255,255,.9)');gg.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gg;g.fillRect(gx-40,y-40,80,80);
  g.restore();
  // its reflection on the balloon skin, brighter as it nears
  const near=clamp(1-gapMM(t)/12);
  if(near>0){g.strokeStyle='rgba(255,255,255,'+(0.55*near)+')';g.lineWidth=3;g.beginPath();g.moveTo(CONTACT.x+6,y-2);g.lineTo(CONTACT.x+6+70*near,y-2+8*near);g.stroke()}
}

// ---------- pop ----------
function simTime(u){return u<1.6? u*0.25 : 0.4+(u-1.6)*0.85}
const drops=[];
for(let i=0;i<460;i++){
  const th=rnd()*TAU, rr=Math.sqrt(rnd());
  let x=Math.cos(th)*rr*A*0.95, y=Math.sin(th)*rr*B*0.85; if(y>0)y*=0.78;
  const px=BX+x, py=BY+y, dx=px-CONTACT.x, dy=py-CONTACT.y, dist=Math.hypot(dx,dy);
  const sp=260+rnd()*780, dir=Math.atan2(py-BY,px-(BX-60));
  drops.push({x:px,y:py,vx:Math.cos(dir)*sp+(rnd()-.5)*160,vy:Math.sin(dir)*sp-260-rnd()*520,r:2.5+rnd()*rnd()*15,born:0.05+dist/(2*A)*0.09});
}
const shards=[];for(let i=0;i<6;i++){const th=Math.PI+(rnd()-.5)*4.2;shards.push({th,v:1100+rnd()*700,rot:(rnd()-.5)*18,len:22+rnd()*26})}
function drawPop(t){
  const s=simTime(t-C.pop), G=2600;
  // skin retracting from the puncture
  const front=clamp(s/0.06)*Math.PI;
  if(s<0.07){
    const pts=outline(t,0);
    drawBody(pts,t,1);
    g.save();g.lineWidth=7;g.strokeStyle='rgba(30,190,140,.95)';g.beginPath();
    pts.forEach(([x,y],i)=>{let a=Math.abs(((i/220*TAU)-Math.PI+3*Math.PI)%(TAU)-Math.PI);a=Math.PI-a;if(a>front)g.lineTo(x,y);else g.moveTo(x,y)});g.stroke();g.restore();
    if(front<Math.PI*0.6)drawHighlights(t,1-front/Math.PI);
  } else {
    // naked water holding its shape, then breaking up
    const k=clamp((s-0.07)/0.12);
    if(k<1){const pts=outline(t*3,0).map(([x,y])=>[BX+(x-BX)*(1+k*0.12),BY+(y-BY)*(1-k*0.1)]);
      g.save();g.globalAlpha=1-k;pathOf(pts);
      const wg=g.createRadialGradient(BX-60,BY-60,10,BX,BY,A);wg.addColorStop(0,'rgba(200,255,235,.75)');wg.addColorStop(1,'rgba(20,160,120,.55)');
      g.fillStyle=wg;g.fill();g.restore()}
  }
  // rubber shards flung outward
  shards.forEach(sh=>{const d=sh.v*s, x=BX+Math.cos(sh.th)*(A+d), y=BY+Math.sin(sh.th)*(B*0.8+d)+0.5*G*s*s*0.6;
    if(s>0.01&&s<0.45){g.save();g.translate(x,y);g.rotate(sh.rot*s);g.strokeStyle='rgba(20,176,127,'+(0.9*(1-s/0.45))+')';g.lineWidth=8;g.lineCap='round';
      g.beginPath();g.arc(0,0,sh.len,0,1.1);g.stroke();g.restore()}});
  // droplets
  drops.forEach(d=>{
    if(s<d.born)return;const q=s-d.born;
    let x=d.x+d.vx*q, y=d.y+d.vy*q+0.5*G*q*q, vy=d.vy+G*q;
    if(y>FLOOR){ // splat into the puddle
      g.fillStyle='rgba(120,240,200,.35)';g.beginPath();g.ellipse(x,FLOOR+3,d.r*2.4,d.r*0.5,0,0,TAU);g.fill();return}
    const sp=Math.hypot(d.vx,vy), ang=Math.atan2(vy,d.vx), st=Math.min(3,1+sp/900);
    g.save();g.translate(x,y);g.rotate(ang);
    g.fillStyle='rgba(150,250,215,.85)';g.beginPath();g.ellipse(0,0,d.r*st,d.r,0,0,TAU);g.fill();
    g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.arc(-d.r*0.2,-d.r*0.35,Math.max(1,d.r*0.28),0,TAU);g.fill();
    g.restore()});
  // puddle spreading on the surface
  const pw=640*(1-Math.exp(-s*5)), pa=clamp(s*4)*0.5;
  const pg=g.createRadialGradient(BX,FLOOR+4,10,BX,FLOOR+4,pw);pg.addColorStop(0,'rgba(90,230,185,'+pa+')');pg.addColorStop(1,'rgba(90,230,185,0)');
  g.fillStyle=pg;g.beginPath();g.ellipse(BX,FLOOR+4,pw,pw*0.08,0,0,TAU);g.fill();
}

// ---------- DOM type ----------
function anim(el,lt){
  const at=parseFloat(el.dataset.at||0),a=el.dataset.a,p=lt-at;
  if(p<0){el.style.opacity=0;return}el.style.opacity=1;
  if(a==='slam'){const k=clamp(p/0.22);el.style.transform='scale('+(1.45-0.45*outBack(k))+')';el.style.opacity=clamp(p/0.06)}
  else if(a==='wipe'){el.style.clipPath='inset(0 '+((1-outExpo(clamp(p/0.28)))*100)+'% 0 0)'}
  else if(a==='up'){const k=outExpo(clamp(p/0.3));el.style.transform='translateY('+((1-k)*60)+'px)';el.style.opacity=k}
  else if(a==='pop'){el.style.transform='scale('+(0.2+0.8*outBack(clamp(p/0.16)))+')'}
  else if(a==='track'){const k=outExpo(clamp(p/0.5));el.style.letterSpacing=(0.1+0.5*k)+'em';el.style.opacity=k}
}
const groups=[['A',C.textA,C.textB],['B',C.textB,C.textC],['C',C.textC,C.punch],['D',C.logo,C.cta],['E',C.cta,C.end+1]];

window.setTime=(t)=>{
  seed=7; // (all random tables are built once above; nothing random per frame)
  const cam=camera(t);
  backdrop(t,cam);
  g.setTransform(cam.z,0,0,cam.z,cam.tx,cam.ty);
  floor(t);
  if(t<C.pop){
    const dim=t>C.punch?6*sstep((t-C.punch)/(C.pop-C.punch)):0;
    const pts=outline(t,dim);
    drawReflection(pts,1);drawBody(pts,t);drawHighlights(t);drawKnot();drawNeedle(t);
  } else {
    drawReflection(outline(t,0),Math.max(0,1-(t-C.pop)*3));
    drawPop(t);
    drawNeedle(t);
  }
  // pop flash + end darkening
  g.setTransform(1,0,0,1,0,0);
  const u=t-C.pop; if(u>=0&&u<0.14){g.fillStyle='rgba(235,255,248,'+(0.85*(1-u/0.14))+')';g.fillRect(0,0,W,H)}
  if(t>C.logo-0.4){g.fillStyle='rgba(5,15,21,'+(0.82*sstep((t-C.logo+0.4)/0.5))+')';g.fillRect(0,0,W,H)}
  // HUD
  const showHud=t>0.25&&t<C.pop;
  ['hudL','hudR'].forEach(id=>document.getElementById(id).style.opacity=showHud?clamp((t-0.25)/0.3):0);
  document.getElementById('tm').textContent=String(Math.min(t,99).toFixed(1)).padStart(4,'0')+'s';
  document.getElementById('gap').textContent=gapMM(t).toFixed(2)+' mm';
  document.getElementById('tm').style.color=(t>C.held-0.05&&t<C.textB)?'#14B07F':'#fff';
  groups.forEach(([id,a,b])=>{const el=document.getElementById(id);const on=t>=a&&t<b;
    el.style.display=on?(id==='D'||id==='E'?'flex':'block'):'none';if(on)el.querySelectorAll('.it').forEach(e=>anim(e,t-a))});
};
</script></body></html>`;

(async () => {
  fs.mkdirSync(FRAMES, { recursive: true });
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  const times = flag === '--preview' ? list.split(',').map(Number) : Array.from({ length: FPS * DURATION }, (_, f) => f / FPS);
  for (let i = 0; i < times.length; i++) {
    await pg.evaluate((t) => window.setTime(t), times[i]);
    const name = flag === '--preview' ? `p_${times[i].toFixed(2)}.jpg` : `f${String(i).padStart(4, '0')}.jpg`;
    await pg.screenshot({ path: path.join(FRAMES, name), type: 'jpeg', quality: 92 });
  }
  await browser.close();
  if (flag !== '--preview') {
    execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', OUT], { stdio: 'ignore' });
    console.log('wrote', OUT);
  } else console.log('previews in', FRAMES);
})();
