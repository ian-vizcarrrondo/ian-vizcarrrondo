const fs = require('fs');
const path = require('path');
const {parseCalendar}=require('./calendar.cjs');
(async()=>{
const username=process.env.PROFILE_USERNAME||'ian-vizcarrrondo';
if(!/^[a-zA-Z0-9-]+$/.test(username))throw Error('Invalid username');
const response=await fetch('https://github.com/users/'+username+'/contributions',{headers:{'User-Agent':'Aero-profile-bubbles'},signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error('GitHub calendar request failed: '+response.status);
const cells=parseCalendar(await response.text());
if(cells.length<350||cells.length>378)throw Error('Incomplete calendar; keeping existing artwork');
const out=path.resolve(__dirname,'../assets');
fs.mkdirSync(out,{recursive:true});
const key = p=>`${p.x},${p.y}`;
let body = Array.from({length:5},(_,i)=>({x:25-i,y:-1}));
const frames = [body.map(p=>({...p}))], eaten = {};
let targets = cells.filter(c=>c.level);
function route(target) {
  const queue = [[body[0]]], seen = new Set([key(body[0])]);
  const blocked = new Set(body.slice(1,-1).map(key));
  for(let i=0;i<queue.length;i++) {
    const r=queue[i],p=r.at(-1);
    if(key(p)===key(target)) return r.slice(1);
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]) {
      const q={x:p.x+dx,y:p.y+dy}, k=key(q);
      if(q.x<0||q.x>54||q.y< -1||q.y>7||seen.has(k)||blocked.has(k))continue;
      seen.add(k);queue.push([...r,q]);
    }
  }
  throw Error('No route');
}
while(targets.length) {
  targets.sort((a,b)=>(Math.abs(a.x-body[0].x)+Math.abs(a.y-body[0].y))-(Math.abs(b.x-body[0].x)+Math.abs(b.y-body[0].y)));
  const target=targets[0];
  for(const p of route(target)) {
    body=[p,...body.slice(0,-1)];frames.push(body.map(p=>({...p})));
    const hit=targets.find(t=>key(t)===key(p));
    if(hit) {eaten[hit.date]=frames.length-1;targets=targets.filter(t=>t.date!==hit.date);}
  }
}
for(const p of route({x:54,y:7})) {body=[p,...body.slice(0,-1)];frames.push(body.map(p=>({...p})));}
if(Object.keys(eaten).length!==cells.filter(c=>c.level).length)throw Error('Uneaten cells');
for(let i=0;i<frames.length;i++)for(let j=0;j<5;j++) {
 if(new Set(frames[i].map(key)).size!==5)throw Error('Self collision');
 if(i && Math.abs(frames[i][j].x-frames[i-1][j].x)+Math.abs(frames[i][j].y-frames[i-1][j].y)!==1)throw Error('Teleport');
}
const pct = i => (4+88*i/(frames.length-1)).toFixed(3);
function svg(bubbles,dark) {
 const empty=dark?'#162c39':'#e4f6fb',line=dark?'#254351':'#bfE6ef',bg=dark?'#0d1822':'#ffffff';
 const palette=['', '#a5edee','#65dce5','#20bfd9','#008ebc'];
 let styles=`.scene{animation:scene 28s linear infinite}@keyframes scene{0%,95%{opacity:1}99%,100%{opacity:0}}@media(prefers-reduced-motion:reduce){*{animation:none!important}.bead{display:none}}`;
 let grid='';
 for(const c of cells) {
   const x=31+c.x*16,y=40+c.y*16, t=c.level?pct(eaten[c.date]):null;
   const cls=c.level?`d${c.x}_${c.y}`:'';
   if(t)styles+=`.${cls}{animation:${cls} 28s linear infinite}@keyframes ${cls}{0%,${(Number(t)-.05).toFixed(3)}%{opacity:1}${t}%,100%{opacity:0}}`;
   const shape=bubbles?`<circle cx="${x+5.5}" cy="${y+5.5}" r="5.5"`:`<rect x="${x}" y="${y}" width="11" height="11" rx="2.5"`;
   grid+=`${shape} fill="${empty}" stroke="${line}" stroke-width=".6"/>`;
   if(c.level)grid+=`<g class="${cls}">${shape} fill="${bubbles?'url(#c'+c.level+')':palette[c.level]}"/><title>${c.date}: contribution intensity ${c.level} of 4</title>${bubbles?`<ellipse cx="${x+4.7}" cy="${y+3}" rx="2.8" ry="1.3" fill="white" opacity=".8"/>`:''}</g>`;
 }
 let snake='';
 for(let j=4;j>=0;j--) {
   styles+=`.b${j}{animation:b${j} 28s linear infinite}@keyframes b${j}{0%{transform:translate(${31+frames[0][j].x*16}px,${40+frames[0][j].y*16}px)}`;
   for(let i=0;i<frames.length;i++)styles+=`${pct(i)}%{transform:translate(${31+frames[i][j].x*16}px,${40+frames[i][j].y*16}px)}`;
   styles+=`100%{transform:translate(${31+frames.at(-1)[j].x*16}px,${40+frames.at(-1)[j].y*16}px)}}`;
   snake+=`<g class="bead b${j}"><${bubbles?'circle cx="5.5" cy="5.5" r="6.2"':'rect x="-.5" y="-.5" width="12" height="12" rx="4"'} fill="${bubbles?'url(#snake)':'#21d9ff'}" stroke="${dark?'#b7f7ff':'#0080a9'}" stroke-width=".6"/>${bubbles?'<ellipse cx="4" cy="2.5" rx="3" ry="1.5" fill="white" opacity=".9"/>':''}${j===0?'<circle cx="8" cy="4" r="1" fill="#075269"/><circle cx="8" cy="7.5" r="1" fill="#075269"/>':''}</g>`;
 }
 const defs=[1,2,3,4].map(i=>`<radialGradient id="c${i}" cx="30%" cy="20%" r="90%"><stop stop-color="#f0ffff"/><stop offset=".35" stop-color="${palette[i]}"/><stop offset="1" stop-color="#008aa9"/></radialGradient>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="196" viewBox="0 0 900 196" role="img" aria-labelledby="title desc"><title id="title">Ian's ${bubbles?'Aero bubble':'cyan'} contribution snake</title><desc id="desc">Animated snake eating the ${cells.filter(c=>c.level).length} active days from ${username}'s public GitHub calendar, ${cells[0].date} to ${cells.at(-1).date}.</desc><defs>${defs}<radialGradient id="snake" cx="30%" cy="15%" r="90%"><stop stop-color="#ffffff"/><stop offset=".35" stop-color="#8dfaff"/><stop offset=".7" stop-color="#13ccef"/><stop offset="1" stop-color="#0086bd"/></radialGradient></defs><style>${styles}</style><rect width="900" height="196" rx="12" fill="${bg}"/><g class="scene">${grid}${snake}</g><g fill="${dark?'#91adbc':'#516d7b'}" font-family="Segoe UI,Arial,sans-serif" font-size="10"><text x="31" y="181">${new Date(cells[0].date).toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'})}</text><text x="869" y="181" text-anchor="end">${new Date(cells.at(-1).date).toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'})}</text></g></svg>`;
}
for(const dark of [false,true])fs.writeFileSync(path.join(out,'aero-bubbles'+(dark?'-dark':'')+'.svg'),svg(true,dark));
console.log('Generated both themes from '+cells.length+' calendar days and '+Object.keys(eaten).length+' active days.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
