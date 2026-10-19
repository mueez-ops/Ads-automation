// Mez Media reel: "Your ad's first second", animated 3D version (colourful explainer style), on Mueez's own voiceover.
// three.js scenes (train carriage, Sarah + her phone, the Meta eye, a crowd, a filing cabinet in her head) are rendered
// per frame, then 2D overlays, captions and VFX go on top. Timing: reel_sarah_cues.json; sound: reel_sarah_events.json.
// Usage: node reel_sarah3d.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { render, FONT_CSS } = require('./reel_kit');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_sarah_cues.json'), 'utf8'));
const EV = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_sarah_events.json'), 'utf8')).events;
const THREE_SRC = fs.readFileSync(path.join(__dirname, 'vendor', 'three.module.min.js'), 'utf8');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}#gl{position:absolute;left:-5000px}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas><canvas id="gl" width="1080" height="1920"></canvas>
<script>
const SRC={};
${fs.readFileSync(path.join(__dirname, 'reel_kit_browser.js'), 'utf8')}
const imgsReady=window.ready; let threeDone; window.ready=Promise.all([imgsReady,new Promise(r=>threeDone=r)]);
const C=${JSON.stringify(C)}, L=C.lines, Hh=C.hits, EV=${JSON.stringify(EV)}, FPS=30;
</script>
<script type="module">
const X = await import(URL.createObjectURL(new Blob([${JSON.stringify(THREE_SRC)}], {type:'text/javascript'})));
${fs.readFileSync(path.join(__dirname, 'reel_sarah3d_scene.js'), 'utf8')}
threeDone();
</script></body></html>`;

render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list, gl: true });
