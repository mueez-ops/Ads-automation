// Shared Node side for the canvas reels: fonts, photos, the post-processing pass and the frame renderer.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FONTS = path.join(__dirname, 'fonts'), PHOTOS = path.join(__dirname, 'photos');
const b64 = (p, mime) => `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`;
const font = (f) => `url(${b64(path.join(FONTS, f), f.endsWith('woff2') ? 'font/woff2' : f.endsWith('otf') ? 'font/otf' : 'font/ttf')})`;
const photos = (names) => Object.fromEntries(names.map((n) => [n, b64(path.join(PHOTOS, n + '.jpg'), 'image/jpeg')]));

const FONT_CSS = `
@font-face{font-family:Hook;font-weight:900;src:${font('Archivo-900.ttf')}}
@font-face{font-family:Hook;font-weight:800;src:${font('Archivo-800.ttf')}}
@font-face{font-family:Body;font-weight:500;src:${font('Inter-500.ttf')}}
@font-face{font-family:Body;font-weight:600;src:${font('Inter-600.ttf')}}
@font-face{font-family:Body;font-weight:700;src:${font('Inter-700.ttf')}}
@font-face{font-family:Logo;font-weight:800;src:${font('InterDisplay-ExtraBold.otf')}}
@font-face{font-family:Logo;font-weight:600;src:${font('InterDisplay-SemiBold.otf')}}
@font-face{font-family:Mono;src:${font('DMMono-Regular.ttf')}}
@font-face{font-family:Serif;font-style:italic;src:${font('InstrumentSerif-Italic.woff2')}}`;
const FACES = ['900 50px Hook', '800 50px Hook', '500 50px Body', '600 50px Body', '700 50px Body', '800 50px Logo', '600 50px Logo', '50px Mono', 'italic 50px Serif'];

// Wraps scene code into a page. The scene script must define drawScene(t), SCENES ([start, end, fn, blurSamples]) and EV.
function page(sceneJs, data) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas><script>
const SRC=${JSON.stringify(data.photos)};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const FPS=30, END=${data.end};
${sceneJs}
// ---------- post: camera punch/shake, flashes, glitch, grain ----------
const kinds=(ks)=>EV.filter(e=>ks.includes(e.k)).map(e=>e.t);
const PUNCH=kinds(['slam','hit','stop','boom','stamp']), SHAKE=kinds(['stop','hit','boom','stamp']);
const FLASH=kinds(['flash','hit']).concat(SCENES.slice(1).map(x=>x[0]));
const GLITCH=kinds(['glitch']);
function decay(list,t,len){let v=0;list.forEach(e=>{const u=t-e;if(u>=0&&u<len)v=Math.max(v,1-u/len)});return v}
const sceneAt=(t)=>SCENES.find(([a,b])=>t>=a&&t<b)||SCENES[SCENES.length-1];
window.setTime=(t)=>{
  const sc=sceneAt(t), n=sc[3]||0;
  a.globalAlpha=1;a.fillStyle='#000';a.fillRect(0,0,W,H);
  if(n>1){for(let i=0;i<n;i++){drawScene(t-i*(1/FPS)*0.6/n);a.globalAlpha=1/(i+1);a.drawImage(SC,0,0)}a.globalAlpha=1}
  else{drawScene(t);a.drawImage(SC,0,0)}
  let z=1+0.05*clamp((t-sc[0])/(Math.min(sc[1],END)-sc[0]));
  PUNCH.forEach(e=>{const u=t-e;if(u>=0&&u<0.5)z+=0.045*Math.exp(-u/0.08)});
  let sx=0,sy=0;SHAKE.forEach(e=>{const u=t-e;if(u>=0&&u<0.5){const m=Math.exp(-u*9)*18;sx+=Math.sin(u*93+e)*m;sy+=Math.cos(u*71+e)*m}});
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,W,H);
  g.translate(W/2+sx,H/2+sy);g.scale(z,z);g.translate(-W/2,-H/2);g.drawImage(AC,0,0);g.setTransform(1,0,0,1,0,0);
  const gl=decay(GLITCH,t,0.16);
  if(gl>0){seed=Math.floor(t*30)*13+5;for(let i=0;i<7;i++){const y=rnd()*H, h=20+rnd()*140, dx=(rnd()-.5)*160*gl;g.drawImage(out,0,y,W,h,dx,y,W,h)}}
  const fl=decay(FLASH,t,0.1);if(fl>0){g.fillStyle='rgba(255,255,255,'+(0.6*fl*fl)+')';g.fillRect(0,0,W,H)}
  if(typeof overlay==='function')overlay(t);
  g.save();g.globalAlpha=0.07;g.globalCompositeOperation='overlay';g.drawImage(NOISE[Math.floor(t*30)%6],0,0,W,H);g.restore();
  vignette(g,0.3);
};
</script></body></html>`;
}

async function render(html, { frames, out, end, flag, list, gl }) {
  fs.mkdirSync(frames, { recursive: true });
  // gl: software WebGL (SwiftShader) for the three.js reels
  const browser = await chromium.launch(gl ? { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } : {});
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.waitForFunction(() => window.ready, null, { timeout: 120000 });
  await pg.evaluate(async (faces) => { await Promise.all(faces.map((f) => document.fonts.load(f))); await window.ready; }, FACES);
  const times = flag === '--preview' ? list.split(',').map(Number) : Array.from({ length: Math.round(30 * end) }, (_, f) => f / 30);
  const el = await pg.$('#c');
  for (let i = 0; i < times.length; i++) {
    await pg.evaluate((t) => window.setTime(t), times[i]);
    const name = flag === '--preview' ? `p_${times[i].toFixed(2)}.jpg` : `f${String(i).padStart(4, '0')}.jpg`;
    await el.screenshot({ path: path.join(frames, name), type: 'jpeg', quality: 92 });
  }
  await browser.close();
  if (flag !== '--preview') {
    execFileSync('ffmpeg', ['-y', '-framerate', '30', '-i', path.join(frames, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', out], { stdio: 'ignore' });
    console.log('wrote', out);
  } else console.log('previews in', frames);
}

module.exports = { page, render, photos, FONT_CSS };
