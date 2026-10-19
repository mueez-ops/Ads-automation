// Mez Media reel: "Your ad's first second" (Sarah on the train), colour edit. Mueez's own voiceover; visuals and captions timed to it.
// Timing comes from reel_sarah_cues.json (word times of the cleaned voice); the sound design reads reel_sarah_events.json.
// Usage: node reel_sarah.js <frames-dir> <out.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { page, render, photos } = require('./reel_kit');

const [FRAMES, OUT, flag, list] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'reel_sarah_cues.json'), 'utf8'));
const L = C.lines, Hh = C.hits;

// Sound-design events, shared with reel_sarah_audio.py.
const EV = [];
const ev = (t, k) => EV.push({ t: +t.toFixed(3), k });
ev(0, 'tick'); ev(L.thumb1.s - 0.05, 'whoosh'); ev(L.appears.s + 0.35, 'land');
ev(L.forme.s, 'pop'); ev(Hh.logo, 'slam'); ev(Hh.files, 'stamp'); ev(L.slow.e - 0.25, 'drawer');
ev(L.slow.s + 0.4, 'whoosh'); ev(Hh.gone, 'hit'); ev(L.watching.s, 'eye');
[Hh.skip1, Hh.next1, Hh.next2].forEach((t) => ev(t, 'blip'));
ev(L.dislike.s + 0.2, 'fall'); ev(L.rewind.s, 'rewind'); ev(L.rewind.s, 'glitch'); ev(L.same.s, 'slam');
ev(L.problem.s + 0.1, 'whoosh'); ev(L.heels.s, 'slam'); ev(Hh.stops, 'stop'); ev(Hh.taps, 'tap'); ev(L.notices.s, 'eye');
ev(L.more.s + 0.3, 'rise'); ev(Hh.less, 'slam'); ev(Hh.product, 'hit'); ev(Hh.budget, 'hit'); ev(Hh.different, 'hit'); ev(C.voice_end + 0.15, 'boom');

const scene = String.raw`
const C=${JSON.stringify(C)}, L=C.lines, Hh=C.hits, EV=${JSON.stringify(EV)};
const FEED=['headphones_c','fashion_kneel_c','ring_pear_c','sneakers_c','perfume_c','ring_oval_c','fashion_walk_c','model_profile_c','headphones_c'];
const COLOR=true;
const CL={y:'#FFD23F',r:'#FF3B5C',g:'#22E39B',c:'#3BC9FF',p:'#B36BFF',o:'#FF8A3D'};
// colour box behind key words (overrides the kit's white box): o.bg / o.fg
function boxT(str,x,y,o,k){if(k<=0)return;o={...o};s.save();fit(str,o,o.max||880);s.textBaseline='alphabetic';s.textAlign='left';
  const tw=s.measureText(str).width, padX=o.size*0.16, w=tw+padX*2, top=y-o.size*0.86, h=o.size*1.02, x0=x-w/2;
  if(o.sc&&o.sc!==1){s.translate(x,y-o.size*0.35);s.scale(o.sc,o.sc);s.translate(-x,-(y-o.size*0.35))}
  s.beginPath();s.rect(x0,top-4,w*outExpo(k),h+8);s.clip();
  s.shadowColor=(o.bg||CL.y)+'aa';s.shadowBlur=40;s.fillStyle=o.bg||CL.y;s.fillRect(x0,top,w,h);s.shadowBlur=0;s.fillStyle=o.fg||'#0b0b1a';s.fillText(str,x0+padX,y);s.restore()}

// ---------- pieces ----------
function bg(c,t){const tt=t||0;const q=s.createLinearGradient(0,0,W,H);q.addColorStop(0,'#0b1030');q.addColorStop(0.55,'#1a0d3d');q.addColorStop(1,'#2a0a3a');s.fillStyle=q;s.fillRect(0,0,W,H);
  s.save();s.globalCompositeOperation='screen';[[CL.p,0.25,0.3],[CL.c,0.8,0.55],[CL.r,0.4,0.85]].forEach(([col,fx,fy],i)=>{const x=W*fx+Math.sin(tt*0.7+i*2)*160,y=H*fy+Math.cos(tt*0.5+i)*160;
    const g2=s.createRadialGradient(x,y,0,x,y,620);g2.addColorStop(0,col+'40');g2.addColorStop(1,col+'00');s.fillStyle=g2;s.fillRect(0,0,W,H)});s.restore();
  s.save();s.strokeStyle='rgba(255,255,255,.05)';s.lineWidth=2;for(let x=0;x<W;x+=90){s.beginPath();s.moveTo(x,0);s.lineTo(x,H);s.stroke()}for(let y=(tt*30)%90;y<H;y+=90){s.beginPath();s.moveTo(0,y);s.lineTo(W,y);s.stroke()}s.restore()}
function train(t,t0,z0){photo(IMG.sarah_train_c,0,0,W,H,z0+0.035*(t-t0),.47,.40);shade(0.08)}
function pill(str,x,y,size=30){s.save();s.font='500 '+size+'px Mono';s.letterSpacing='3px';const w=s.measureText(str).width+48;
  s.fillStyle=CL.c;rr(x-w/2,y-size-8,w,size+30,(size+30)/2);s.fill();
  s.fillStyle='#0b0b1a';s.textAlign='center';s.fillText(str,x,y+4);s.restore()}
function stopwatch(x,y,r,val,label,col){col=col||CL.y;s.save();s.strokeStyle='#fff';s.lineWidth=6;s.beginPath();s.arc(x,y,r,0,TAU);s.stroke();
  s.fillStyle='#fff';s.fillRect(x-14,y-r-26,28,16);s.lineWidth=5;s.beginPath();s.moveTo(x,y);const a0=-Math.PI/2+val*TAU;s.lineTo(x+Math.cos(a0)*r*0.8,y+Math.sin(a0)*r*0.8);s.stroke();
  s.beginPath();s.arc(x,y,r-14,-Math.PI/2,-Math.PI/2+val*TAU);s.lineWidth=14;s.strokeStyle=col;s.shadowColor=col;s.shadowBlur=25;s.stroke();s.shadowBlur=0;
  if(label){s.font='500 '+Math.round(r*0.42)+'px Mono';s.fillStyle='#fff';s.textAlign='center';s.fillText(label,x,y+r+r*0.62)}s.restore()}
// a sponsored card that opens on a generic logo (no real brand)
function logoCard(cx,cy,w,h,k){
  s.save();rr(cx-w/2,cy-h/2,w,h,34);s.clip();s.fillStyle='#1a1a1a';s.fillRect(cx-w/2,cy-h/2,w,h);
  const q=s.createRadialGradient(cx,cy,10,cx,cy,w);q.addColorStop(0,'#2b2b2b');q.addColorStop(1,'#111');s.fillStyle=q;s.fillRect(cx-w/2,cy-h/2,w,h);
  const sc=w/820*(k===undefined?1:0.6+0.4*outBack(k));
  s.translate(cx,cy-40*w/820);s.scale(sc,sc);s.strokeStyle='#fff';s.lineWidth=12;s.beginPath();s.arc(0,-60,110,0,TAU);s.stroke();
  s.fillStyle='#fff';s.font='900 150px Hook';s.textAlign='center';s.fillText('B',0,-8);
  s.font='800 64px Hook';s.letterSpacing='14px';s.fillText('BRAND',10,150);s.font='500 28px Mono';s.letterSpacing='4px';s.fillStyle='rgba(255,255,255,.6)';s.fillText('EST. 2024',8,205);
  s.restore();
  s.save();s.fillStyle='rgba(255,255,255,.75)';s.font='500 24px Body';s.fillText('Sponsored',cx-w/2+30,cy-h/2+50);s.strokeStyle='rgba(255,255,255,.3)';s.lineWidth=2;rr(cx-w/2,cy-h/2,w,h,34);s.stroke();s.restore();
}
// the second ad: opens on the problem
function problemCard(cx,cy,w,h,t){
  s.save();rr(cx-w/2,cy-h/2,w,h,34);s.clip();photo(IMG.foot_cream_c,cx-w/2,cy-h/2,w,h,1.25+0.03*Math.max(0,t-L.problem.s),.42,.62);
  const q=s.createLinearGradient(0,cy-h/2,0,cy);q.addColorStop(0,'rgba(255,59,92,.85)');q.addColorStop(1,'rgba(255,59,92,0)');s.fillStyle=q;s.fillRect(cx-w/2,cy-h/2,w,h/2);
  s.restore();
  const k=t-L.heels.s;if(k>0){s.save();s.translate(cx,cy-h/2+170*w/820);const sc=(w/820)*slam(k);s.scale(sc,sc);s.font='900 104px Hook';s.letterSpacing='-3px';s.textAlign='center';s.lineWidth=14;s.strokeStyle='#0b0b1a';s.lineJoin='round';s.strokeText('CRACKED HEELS?',0,0);s.fillStyle=CL.y;s.fillText('CRACKED HEELS?',0,0);s.restore()}
  s.save();s.strokeStyle='rgba(255,255,255,.3)';s.lineWidth=2;rr(cx-w/2,cy-h/2,w,h,34);s.stroke();s.restore();
}
function feed(pos,list){const pitch=1260;list.forEach((k,i)=>{const cy=960+i*pitch-pos;if(cy>-700&&cy<H+700)card(IMG[k],W/2,cy,820,1180)})}
function eye(cx,cy,r,open,look,iris){iris=iris||CL.c;
  s.save();s.translate(cx,cy);const o=clamp(open);
  s.beginPath();s.moveTo(-r,0);s.quadraticCurveTo(0,-r*0.9*o,r,0);s.quadraticCurveTo(0,r*0.9*o,-r,0);s.closePath();
  s.fillStyle='#fff';s.fill();s.clip();
  const ig=s.createRadialGradient(look*r*0.25,0,r*0.1,look*r*0.25,0,r*0.42);ig.addColorStop(0,'#000');ig.addColorStop(0.45,iris);ig.addColorStop(1,'#0b0b1a');s.fillStyle=ig;s.beginPath();s.arc(look*r*0.25,0,r*0.42,0,TAU);s.fill();s.fillStyle='#000';s.beginPath();s.arc(look*r*0.25,0,r*0.17,0,TAU);s.fill();
  s.fillStyle='#fff';s.beginPath();s.arc(look*r*0.25+r*0.12,-r*0.12,r*0.09,0,TAU);s.fill();s.restore();
  s.save();s.strokeStyle=iris;s.shadowColor=iris;s.shadowBlur=40;s.lineWidth=7;s.beginPath();s.moveTo(cx-r,cy);s.quadraticCurveTo(cx,cy-r*0.9*o,cx+r,cy);s.quadraticCurveTo(cx,cy+r*0.9*o,cx-r,cy);s.stroke();s.restore();
}
function people(n,lit,dim,y0){const cols=6,rows=5,gx=150,gy=128,x0=W/2-gx*(cols-1)/2;
  for(let i=0;i<cols*rows;i++){const x=x0+(i%cols)*gx, y=y0+Math.floor(i/cols)*gy;
    const isDim=i<dim, isLit=i<lit;s.save();s.globalAlpha=isDim?0.45:1;const pc=[CL.c,CL.p,CL.o,CL.y,CL.g][i%5];s.fillStyle=isDim?CL.r:isLit?pc:'rgba(255,255,255,.6)';
    if(isLit||isDim){s.shadowColor=isDim?CL.r:pc;s.shadowBlur=isLit?30:10}
    s.beginPath();s.arc(x,y-38,24,0,TAU);s.fill();s.beginPath();s.roundRect(x-40,y-6,80,56,[30,30,8,8]);s.fill();s.restore();
    if(isDim&&i===dim-1){s.save();s.font='500 24px Mono';s.fillStyle=CL.r;s.textAlign='center';s.fillText('SKIP',x,y+86);s.restore()}}}
function meter(x,y,w,label,v,arrow,col){col=col||CL.c;s.save();s.font='500 28px Mono';s.letterSpacing='4px';s.fillStyle='#fff';s.fillText(label,x,y-18);
  s.strokeStyle='rgba(255,255,255,.35)';s.lineWidth=2;s.strokeRect(x,y,w,40);s.fillStyle=col;s.shadowColor=col;s.shadowBlur=25;s.fillRect(x+4,y+4,(w-8)*clamp(v),32);s.shadowBlur=0;
  s.font='900 60px Hook';s.textAlign='left';s.fillStyle=col;s.fillText(arrow,x+w+24,y+40);s.restore()}

// ---------- scenes ----------
function sOpen(t){train(t,0,1.12);
  const p=t;pill('SARAH · 7:42 AM',W/2,1180,30);
  if(t<2.0){textBacker(560,260,0.75);const k=clamp(1-(t-1.6)/0.4);s.save();s.globalAlpha=k;
    T("THIS IS YOUR AD'S",W/2,470,{size:84,ls:-2});boxT('FIRST SECOND.',W/2,640,{size:150,ls:-5},clamp(t/0.18));
    stopwatch(W-170,330,70,(t*1.0)%1,'0'+t.toFixed(2)+'s');s.restore()}}
function sScroll(t){bg(0,t);feed((t-L.thumb1.s)*3600,FEED)}
function sAppear(t){bg(0,t);const u=t-L.appears.s, D=L.brain.s-L.appears.s, target=1260*4;
  const pos=target-1500*Math.exp(-u*5.5);feed(pos,FEED.slice(0,4));
  logoCard(W/2,960+4*1260-pos,820,1180);
  const k=outBack((u-0.4)/0.3);if(k>0){s.save();s.globalAlpha=clamp(k);s.fillStyle='#0b1030';s.fillRect(0,0,W,392);T('YOUR AD',W/2,300,{size:96,ls:-2,sc:k,color:CL.y});
    s.strokeStyle=CL.y;s.lineWidth=8;s.beginPath();s.moveTo(W/2,330);s.lineTo(W/2,380);s.moveTo(W/2-22,358);s.lineTo(W/2,382);s.lineTo(W/2+22,358);s.stroke();s.restore()}}
function sBrain(t){photo(IMG.sarah_train_c,0,0,W,H,3.1+0.15*(t-L.brain.s),.55,.235);shade(0.35);
  pill('HER BRAIN ASKS ONE QUESTION',W/2,330,28);
  const u=t-L.forme.s;if(u>0){const str='Is this for me?', n=Math.ceil(clamp(u/0.45)*str.length);
    s.save();s.fillStyle='#fff';rr(140,520,800,220,110);s.fill();s.beginPath();s.arc(330,780,26,0,TAU);s.fill();s.beginPath();s.arc(290,830,14,0,TAU);s.fill();
    s.fillStyle='#000';s.font='italic 110px Serif';s.textAlign='center';s.fillText(str.slice(0,n),W/2,665);s.restore()}
  const v=clamp((t-L.brain.s)/(L.logo.s-L.brain.s));stopwatch(W/2,1060,80,v*0.4,'0.'+String(Math.floor(v*40)).padStart(2,'0')+'s',CL.c)}
function sLogo(t){bg(0,t);const k=clamp((t-Hh.logo+0.25)/0.3);logoCard(W/2,850,820*(0.82+0.08*k),1180*(0.82+0.08*k),t>=Hh.logo-0.25?k:0);
  T('OPENS ON YOUR LOGO',W/2,250,{size:64,ls:-1,a:outExpo((t-L.logo.s)/0.3),color:CL.o})}
function sFile(t){bg(0,t);const u=t-L.files.s, D=L.slow.s-L.files.s;
  const drop=clamp((u-(D-0.5))/0.45), sc=lerp(0.9,0.62,outExpo(u/0.4));
  // the filing drawer
  const dy=lerp(1400,1000,outExpo(u/0.5));s.save();s.fillStyle='#2a1650';s.fillRect(190,dy,700,270);s.strokeStyle='#fff';s.lineWidth=4;s.strokeRect(190,dy,700,270);
  s.fillStyle='#fff';s.fillRect(470,dy+40,140,16);s.font='800 52px Hook';s.letterSpacing='8px';s.textAlign='center';s.fillStyle=CL.r;s.fillText('IGNORED',540,dy+150);s.restore();
  s.save();s.beginPath();s.rect(0,0,W,dy+10);s.clip();s.translate(W/2,620+outCubic(drop)*800);s.scale(sc,sc);s.rotate(drop*0.1);
  logoCard(0,0,820,1180);
  const st=t-Hh.files;if(st>0){const k=1.8-0.8*outBack(st/0.2);s.save();s.rotate(-0.18);s.scale(k,k);s.globalAlpha=clamp(st*6);
    s.strokeStyle=CL.r;s.lineWidth=14;rr(-330,-110,660,200,18);s.stroke();s.fillStyle='rgba(255,59,92,.25)';s.fill();
    s.fillStyle=CL.r;s.font='900 150px Hook';s.letterSpacing='8px';s.textAlign='center';s.fillText('ADVERT',0,50);s.restore()}
  s.restore()}
function sGone(t){bg(0,t);feed((t-L.slow.s)*4200+300,FEED.slice(3));
  const u=t-Hh.gone;if(u>0){shade(0.55*clamp(u/0.1));s.save();s.shadowColor=CL.r;s.shadowBlur=60;T('GONE.',W/2,1040,{size:300,ls:-12,sc:slam(u),color:CL.r});s.restore()}}
function sWatch(t){bg(0,t);glowBlob(W/2,880,700,0.08);
  const str='THE PART NOBODY TELLS YOU', n=Math.ceil(clamp((t-L.nobody.s)/0.9)*str.length);
  s.save();s.font='500 40px Mono';s.letterSpacing='5px';s.fillStyle='#fff';s.textAlign='center';s.fillText(str.slice(0,n),W/2,520);s.restore();
  const o=outExpo((t-L.watching.s+0.1)/0.5);if(o>0){eye(W/2,920,300,o,Math.sin(t*2)*0.6,CL.c);
    boxT('META WAS WATCHING',W/2,1290,{size:80,ls:-2,bg:CL.p,fg:'#fff'},(t-L.watching.s)/0.3)}}
function sSkip(t){bg(0,t);eye(W/2,330,130,1,Math.sin(t*3),CL.r);
  const marks=[Hh.skip1,Hh.next1,Hh.next2];let n=marks.filter(m=>t>=m).length;
  if(t>Hh.next2)n=3+Math.floor(27*inExpo(clamp((t-Hh.next2)/(L.dislike.s-Hh.next2))));
  people(30,0,n,680);
  s.save();s.font='500 40px Mono';s.letterSpacing='4px';s.fillStyle='#fff';s.textAlign='center';s.fillText('SKIPPED: '+n,W/2,545);s.restore()}
function sDislike(t){bg(0,t);const u=clamp((t-L.dislike.s-0.2)/1.2);
  boxT("PEOPLE DON'T LIKE THIS AD",W/2,430,{size:66,ls:-2,bg:CL.r,fg:'#fff'},(t-L.dislike.s)/0.3);
  // gauge
  s.save();s.translate(W/2,800);s.strokeStyle='rgba(255,255,255,.4)';s.lineWidth=26;s.beginPath();s.arc(0,0,260,Math.PI,TAU);s.stroke();
  const v=lerp(0.75,0.08,outCubic(u));s.strokeStyle='#fff';s.beginPath();s.arc(0,0,260,Math.PI,Math.PI+Math.PI*v);s.stroke();
  s.rotate(Math.PI+Math.PI*v);s.fillStyle='#fff';s.fillRect(0,-6,230,12);s.restore();
  s.save();s.font='500 30px Mono';s.letterSpacing='4px';s.fillStyle='#fff';s.textAlign='center';s.fillText('AD SCORE',W/2,860);s.restore();
  meter(200,960,560,'COST',lerp(0.3,0.95,outCubic(u)),'↑',CL.r);meter(200,1100,560,'REACH',lerp(0.8,0.15,outCubic(u)),'↓',CL.c)}
function sRewind(t){const back=L.rewind.s-(t-L.rewind.s)*16;const tt=Math.max(0.05,back);
  const sc=SCENES.find(([a,b])=>tt>=a&&tt<b&&b<=L.rewind.s+0.01)||SCENES[0];sc[2](tt);
  s.save();s.globalAlpha=0.35;for(let y=0;y<H;y+=6){s.fillStyle='rgba(0,0,0,.6)';s.fillRect(0,y,W,2)}s.restore();
  s.save();s.fillStyle='#fff';s.fillRect(0,(t*3000)%H,W,30);s.font='500 64px Mono';s.letterSpacing='6px';s.fillStyle=CL.c;s.fillText('◀◀ REWIND',80,330);s.restore()}
function sSame(t){train(t,L.same.s,1.12);const half=L.same.s+(L.same.e-L.same.s)*0.48;
  textBacker(620,260,0.7);T('SAME TRAIN.',W/2,560,{size:130,ls:-4,sc:slam(t-L.same.s),color:CL.y});if(t>=half)T('SAME SARAH.',W/2,720,{size:130,ls:-4,sc:slam(t-half),color:CL.c})}
function sProblem(t){bg(0,t);const u=t-L.problem.s, target=1260*3;const pos=target-1600*Math.exp(-u*6);feed(pos,FEED.slice(4,7));
  problemCard(W/2,960+3*1260-pos,820,1180,t);
  const w=t-Hh.second1;if(w>0)stopwatch(W-170,330,70,clamp(w),'SECOND 1',CL.g)}
function sStops(t){bg(0,t);const u=t-Hh.stops;problemCard(W/2,960+(u<0?0:-30*Math.exp(-u*9)*Math.sin(u*30)),820,1180,t);
  if(u>0){const k=1.8-0.8*outBack(u/0.2);s.save();s.translate(W/2,1180);s.rotate(-0.12);s.scale(k,k);s.globalAlpha=clamp(u*6);
    s.fillStyle=CL.g;s.shadowColor=CL.g;s.shadowBlur=40;rr(-300,-95,600,160,18);s.fill();s.shadowBlur=0;s.fillStyle='#0b0b1a';s.font='900 130px Hook';s.textAlign='center';s.fillText('STOPPED',0,40);s.restore()}}
function sTaps(t){bg(0,t);problemCard(W/2,900,820*0.92,1180*0.92,t);
  const p=clamp((t-L.taps.s)/(L.notices.s-L.taps.s));s.save();s.fillStyle='rgba(255,255,255,.3)';s.fillRect(160,1460-110,760,10);s.fillStyle='#fff';s.fillRect(160,1460-110,760*p,10);s.restore();
  const u=t-Hh.taps;s.save();s.fillStyle=u>0&&u<0.25?'#bbb':'#fff';rr(220,1390-240,640,96,20);s.fill();s.fillStyle='#000';s.font='700 40px Body';s.textAlign='center';s.fillText('Shop now',W/2,1390-178);s.restore();
  if(u>0){for(let i=0;i<3;i++){const r=(u-i*0.08)*600;if(r>0){s.strokeStyle='rgba(255,255,255,'+clamp(1-r/400)+')';s.lineWidth=6;s.beginPath();s.arc(W/2,1390-192,r,0,TAU);s.stroke()}}}}
function sMore(t){bg(0,t);const u=clamp((t-L.notices.s)/(L.final.s-L.notices.s));eye(W/2,330,130,1,Math.sin(t*3),CL.g);
  people(30,Math.floor(30*outCubic(u*1.15)),0,600);
  const k=t-Hh.less;if(k>0){s.save();s.translate(W/2,1215);s.rotate(-0.06);s.scale(slam(k),slam(k));s.fillStyle=CL.y;rr(-230,-70,460,110,14);s.fill();
    s.fillStyle='#0b0b1a';s.font='900 76px Hook';s.textAlign='center';s.fillText('FOR LESS',0,14);s.restore()}}
function sFinal(t){bg(0,t);glowBlob(W/2,900,700,0.07);
  if(t>=Hh.product)T('SAME PRODUCT.',W/2,600,{size:120,ls:-4,sc:slam(t-Hh.product),color:CL.c});
  if(t>=Hh.budget)T('SAME BUDGET.',W/2,760,{size:120,ls:-4,sc:slam(t-Hh.budget),color:CL.p});
  boxT('DIFFERENT',W/2,960,{size:150,ls:-5,sc:slam(t-Hh.different)},(t-Hh.different)/0.2);
  boxT('FIRST SECOND.',W/2,1130,{size:150,ls:-5,sc:slam(t-Hh.different-0.25),bg:CL.g},(t-Hh.different-0.25)/0.2)}
function sEnd(t){bg(0,t);const u=t-C.voice_end;glowBlob(W/2,700,600,0.08);
  s.save();s.globalAlpha=outExpo(u/0.4);s.font='800 230px Logo';s.letterSpacing='-12px';s.textAlign='center';s.fillStyle='#fff';s.fillText('mez.',W/2,640);
  s.font='600 52px Logo';s.letterSpacing='22px';s.fillText('MEDIA',W/2+11,730);s.restore();
  boxT('DM “TEARDOWN”',W/2,1000,{size:110,ls:-3,sc:slam(u-0.3)},(u-0.3)/0.25);
  const k=outExpo((u-0.7)/0.4);s.save();s.globalAlpha=k;s.font='600 46px Body';s.textAlign='center';s.fillStyle='#fff';s.fillText('for a free review of your ads',W/2,1110);
  s.font='500 40px Mono';s.fillStyle='rgba(255,255,255,.7)';s.fillText('@mezmedia_0',W/2,1210);s.restore()}

const SCENES=[
  [0,L.thumb1.s,sOpen,0],[L.thumb1.s,L.appears.s,sScroll,7],[L.appears.s,L.brain.s,sAppear,5],[L.brain.s,L.logo.s,sBrain,0],
  [L.logo.s,L.files.s,sLogo,0],[L.files.s,L.slow.s,sFile,0],[L.slow.s,L.nobody.s,sGone,6],[L.nobody.s,L.skip.s,sWatch,0],
  [L.skip.s,L.dislike.s,sSkip,0],[L.dislike.s,L.rewind.s,sDislike,0],[L.rewind.s,L.same.s,sRewind,0],[L.same.s,L.problem.s,sSame,0],
  [L.problem.s,L.stops.s,sProblem,5],[L.stops.s,L.taps.s,sStops,0],[L.taps.s,L.notices.s,sTaps,0],[L.notices.s,L.final.s,sMore,0],
  [L.final.s,C.voice_end+0.1,sFinal,0],[C.voice_end+0.1,99,sEnd,0]];
function drawScene(t){(SCENES.find(([a,b])=>t>=a&&t<b)||SCENES[SCENES.length-1])[2](t)}

// burned-in captions: the script line, revealed word by word across the spoken line
function overlay(t){
  const k=Object.keys(L).find(key=>t>=L[key].s&&t<L[key].e+0.15);if(!k||t>C.voice_end+0.1)return;
  const ln=L[k], words=ln.t.split(' '), n=Math.max(1,Math.ceil(clamp((t-ln.s)/Math.max(0.3,(ln.e-ln.s)*0.85))*words.length));
  g.save();g.font='900 50px Hook';g.letterSpacing='0px';g.textAlign='center';g.lineJoin='round';
  const lines=[[]];words.forEach(w=>{const cur=lines[lines.length-1];if(g.measureText([...cur,w].join(' ')).width>860&&cur.length)lines.push([w]);else cur.push(w)});
  let shown=0;const y0=1395-(lines.length-1)*58;
  lines.forEach((lw,i)=>{const full=lw.join(' '), vis=lw.slice(0,Math.max(0,n-shown)).join(' ');shown+=lw.length;
    const fw=g.measureText(full).width, x0=W/2-fw/2, y=y0+i*58;
    g.textAlign='left';let x=x0;lw.forEach((w,j)=>{const idx=shown-lw.length+j;if(idx<n){g.lineWidth=12;g.strokeStyle='#0b0b1a';g.strokeText(w,x,y);g.fillStyle=idx===n-1?CL.y:'#fff';g.fillText(w,x,y)}x+=g.measureText(w+' ').width})});
  g.restore()}
`;

const html = page(scene, { photos: photos(['sarah_train_c', 'foot_cream_c', 'headphones_c', 'sneakers_c', 'fashion_kneel_c', 'ring_pear_c', 'perfume_c', 'ring_oval_c', 'fashion_walk_c', 'model_profile_c']), end: C.end });
fs.writeFileSync(path.join(__dirname, 'reel_sarah_events.json'), JSON.stringify({ cues: C, events: EV }, null, 1));
render(html, { frames: FRAMES, out: OUT, end: C.end, flag, list });
