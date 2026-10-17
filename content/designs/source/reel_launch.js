// Mez Media launch reel: renders a fast kinetic-type video frame by frame, then encodes with ffmpeg.
// Usage: node reel_launch.js <frames-dir> <out.mp4> [audio.wav]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [FRAMES, OUT, AUDIO] = process.argv.slice(2);
const FPS = 30, DURATION = 20;
const FONTS = path.join(__dirname, 'fonts');
const font = (f) => `url(data:font/ttf;base64,${fs.readFileSync(path.join(FONTS, f)).toString('base64')})`;

// Timeline: each scene has a start/end (seconds). Items animate in at scene time `at`.
// Exported so the audio script can place hits on the same beats.
const SCENES = [
  { id: 's1', t: [0.0, 1.3] },   // YOU HAVE
  { id: 's2', t: [1.3, 2.7] },   // HALF A SECOND.
  { id: 's3', t: [2.7, 4.5] },   // 0.0s -> 0.5s counter
  { id: 's4', t: [4.5, 6.1] },   // feed scroll: SKIP
  { id: 's5', t: [6.1, 7.7] },   // MOST SKINCARE ADS GET SKIPPED.
  { id: 's6', t: [7.7, 8.7] },   // green flash: NOT YOURS.
  { id: 's7', t: [8.7, 10.0] },  // 01
  { id: 's8', t: [10.0, 11.3] }, // 02
  { id: 's9', t: [11.3, 12.6] }, // 03
  { id: 's10', t: [12.6, 14.4] },// META + TIKTOK ADS FOR UK SKINCARE BRANDS
  { id: 's11', t: [14.4, 16.4] },// logo
  { id: 's12', t: [16.4, 20.0] },// CTA
];
fs.writeFileSync(path.join(__dirname, 'reel_launch_cues.json'), JSON.stringify(SCENES));

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Hook;font-weight:900;src:${font('Archivo-900.ttf')}}
@font-face{font-family:Body;font-weight:500;src:${font('Inter-500.ttf')}}
@font-face{font-family:Body;font-weight:700;src:${font('Inter-700.ttf')}}
:root{--bg:#F7F9F8;--ink:#0F2A3A;--green:#14B07F;--muted:#71818B;--line:#DDE6E2}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:var(--bg)}
#stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:var(--bg)}
.scene{position:absolute;inset:0;display:none;flex-direction:column;justify-content:center;padding:0 90px}
.hook{font-family:Hook;font-weight:900;text-transform:uppercase;line-height:.9;letter-spacing:-.03em;color:var(--ink)}
.mark{background:var(--green);color:#fff;padding:0 .1em;display:inline-block}
.g{color:var(--green)}
.small{font-family:Body;font-weight:500;font-size:44px;line-height:1.35;color:var(--muted)}
.it{will-change:transform,opacity}
.top{position:absolute;left:90px;right:90px;top:110px;display:flex;justify-content:space-between;align-items:center;font-family:Body;font-weight:700;font-size:30px;color:var(--muted);z-index:5}
.logo{font-family:Hook;font-weight:900;font-size:56px;color:var(--ink);letter-spacing:-.04em}.logo i{font-style:normal;color:var(--green)}
.card{height:300px;background:#fff;border:3px solid var(--line);margin-bottom:40px;display:flex;align-items:center;padding:0 50px;gap:40px}
.card .ph{width:200px;height:200px;background:#EEF3F1}
.card .ln{flex:1}.card .ln b{display:block;height:24px;background:#E6ECEA;margin:18px 0}
.stamp{position:absolute;font-family:Hook;font-weight:900;font-size:120px;color:#fff;background:var(--ink);padding:6px 30px;transform:rotate(-6deg)}
</style></head><body><div id="stage">
<div class="top" id="topbar"><div class="logo">mez<i>.</i></div><div>@mezmedia_0</div></div>

<div class="scene" id="s1"><div class="hook" style="font-size:250px"><div class="it" data-a="slam" data-at="0">YOU</div><div class="it" data-a="slam" data-at="0.35">HAVE</div></div></div>

<div class="scene" id="s2"><div class="hook" style="font-size:196px"><span class="mark it" data-a="wipe" data-at="0">HALF A</span><br><span class="mark it" data-a="wipe" data-at="0.3">SECOND.</span></div></div>

<div class="scene" id="s3" style="align-items:flex-start">
  <div class="hook g it" id="counter" data-a="slam" data-at="0" style="font-size:400px;letter-spacing:-.05em;text-transform:none">0.0s</div>
  <div class="small it" data-a="up" data-at="0.8" style="margin-top:40px;font-size:56px;color:var(--ink);font-weight:700;font-family:Body">to stop the scroll.</div>
</div>

<div class="scene" id="s4" style="justify-content:flex-start;padding-top:0">
  <div id="feed" style="position:absolute;left:90px;right:90px;top:0">${Array.from({ length: 12 }, () => '<div class="card"><div class="ph"></div><div class="ln"><b style="width:80%"></b><b style="width:55%"></b><b style="width:70%"></b></div></div>').join('')}</div>
  <div class="stamp it" data-a="pop" data-at="0.25" style="left:120px;top:560px">SKIP.</div>
  <div class="stamp it" data-a="pop" data-at="0.65" style="left:420px;top:960px;transform:rotate(5deg)">SKIP.</div>
  <div class="stamp it" data-a="pop" data-at="1.05" style="left:200px;top:1360px;transform:rotate(-3deg)">SKIP.</div>
</div>

<div class="scene" id="s5"><div class="hook" style="font-size:170px">
  <div class="it" data-a="slam" data-at="0">MOST</div><div class="it" data-a="slam" data-at="0.2">SKINCARE</div><div class="it" data-a="slam" data-at="0.4">ADS GET</div>
  <span class="mark it" data-a="wipe" data-at="0.7">SKIPPED.</span></div></div>

<div class="scene" id="s6" style="background:var(--green)"><div class="hook" style="font-size:230px;color:#fff"><div class="it" data-a="slam" data-at="0.05">NOT</div><div class="it" data-a="slam" data-at="0.3">YOURS.</div></div></div>

${[['01', 'STOP THE', 'SCROLL.'], ['02', 'SELL THE', 'RIGHT OFFER.'], ['03', 'MATCH THE', 'AD TO THE PAGE.']].map(([n, a, b], i) => `
<div class="scene" id="s${7 + i}">
  <div class="hook g it" data-a="slam" data-at="0" style="font-size:300px;letter-spacing:-.05em">${n}</div>
  <div class="hook" style="font-size:${b.length > 12 ? 128 : 150}px;margin-top:40px"><div class="it" data-a="up" data-at="0.15">${a}</div><span class="mark it" data-a="wipe" data-at="0.35">${b}</span></div>
</div>`).join('')}

<div class="scene" id="s10"><div class="hook" style="font-size:150px">
  <div class="it" data-a="slam" data-at="0">META +</div><div class="it" data-a="slam" data-at="0.2">TIKTOK ADS</div></div>
  <div class="small it" data-a="up" data-at="0.55" style="margin-top:50px;font-size:60px">for</div>
  <div class="hook" style="font-size:150px;margin-top:20px"><span class="mark it" data-a="wipe" data-at="0.7">UK SKINCARE</span><br><span class="mark it" data-a="wipe" data-at="0.9">BRANDS.</span></div></div>

<div class="scene" id="s11" style="align-items:center;text-align:center">
  <div class="hook it" data-a="slam" data-at="0" style="font-size:340px;text-transform:none;letter-spacing:-.06em">mez<span class="g it" data-a="pop" data-at="0.45">.</span></div>
  <div class="it" data-a="track" data-at="0.6" style="font-family:Body;font-weight:700;font-size:64px;color:var(--muted);margin-top:30px">MEDIA</div>
</div>

<div class="scene" id="s12">
  <div class="small it" data-a="up" data-at="0" style="font-size:60px;color:var(--ink);font-weight:700;font-family:Body">Run a skincare brand?</div>
  <div class="hook it" data-a="slam" data-at="0.35" style="font-size:200px;margin-top:40px">DM</div>
  <div class="hook" style="font-size:124px;margin-top:10px"><span class="mark it" data-a="wipe" data-at="0.6">“TEARDOWN”</span></div>
  <div class="small it" data-a="up" data-at="1.0" style="margin-top:56px">Free 2-minute review of your ads.</div>
  <div class="it" data-a="up" data-at="1.2" style="margin-top:24px;font-family:Body;font-weight:700;font-size:48px;color:var(--ink)">@mezmedia_0</div>
</div>
</div>
<script>
const SCENES=${JSON.stringify(SCENES)};
const clamp=(x)=>Math.max(0,Math.min(1,x));
const outBack=(x)=>{const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const outExpo=(x)=>x>=1?1:1-Math.pow(2,-10*x);
function anim(el,lt){
  const at=parseFloat(el.dataset.at||0), a=el.dataset.a, p=lt-at;
  const base=el.dataset.base??(el.dataset.base=el.style.transform||'');
  if(p<0){el.style.opacity=0;return}
  el.style.opacity=1;
  if(a==='slam'){const k=clamp(p/0.22);el.style.transform=base+' scale('+(1.45-0.45*outBack(k))+')';el.style.opacity=clamp(p/0.06)}
  else if(a==='wipe'){const k=outExpo(clamp(p/0.28));el.style.clipPath='inset(0 '+((1-k)*100)+'% 0 0)'}
  else if(a==='up'){const k=outExpo(clamp(p/0.3));el.style.transform=base+' translateY('+((1-k)*70)+'px)';el.style.opacity=k}
  else if(a==='pop'){const k=clamp(p/0.16);el.style.transform=base+' scale('+(0.2+0.8*outBack(k))+')'}
  else if(a==='track'){const k=outExpo(clamp(p/0.5));el.style.letterSpacing=(0.1+0.5*k)+'em';el.style.opacity=k}
}
window.setTime=(t)=>{
  let cur=null;
  for(const s of SCENES){const el=document.getElementById(s.id);const on=t>=s.t[0]&&t<s.t[1];el.style.display=on?'flex':'none';if(on)cur={el,lt:t-s.t[0],s}}
  if(!cur)return;
  cur.el.querySelectorAll('.it').forEach(e=>anim(e,cur.lt));
  // scene specials
  if(cur.s.id==='s3'){const v=Math.min(0.5,Math.max(0,(cur.lt-0.1)/0.7*0.5));document.getElementById('counter').textContent=v.toFixed(1)+'s'}
  if(cur.s.id==='s4'){document.getElementById('feed').style.transform='translateY('+(-cur.lt*2400)+'px)'}
  // impact shake for the first 0.12s of every scene
  const k=cur.lt<0.12?(1-cur.lt/0.12):0;document.getElementById('stage').style.transform='translate('+(Math.sin(t*170)*10*k)+'px,'+(Math.cos(t*130)*10*k)+'px)';
  document.getElementById('topbar').style.display=(cur.s.id==='s6'||cur.s.id==='s11')?'none':'flex';
};
</script></body></html>`;

(async () => {
  fs.mkdirSync(FRAMES, { recursive: true });
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  const total = FPS * DURATION;
  for (let f = 0; f < total; f++) {
    await pg.evaluate((t) => window.setTime(t), f / FPS);
    await pg.screenshot({ path: path.join(FRAMES, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  await browser.close();
  const args = ['-y', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%04d.jpg')];
  if (AUDIO) args.push('-i', AUDIO, '-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', OUT);
  execFileSync('ffmpeg', args, { stdio: 'ignore' });
  console.log('wrote', OUT);
})();
