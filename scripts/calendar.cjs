exports.parseCalendar = html => {
  const days=[];
  for(const match of html.matchAll(/<td\b[^>]*>/gi)) {
    const date=match[0].match(/\bdata-date=["'](\d{4}-\d{2}-\d{2})["']/)?.[1];
    if(!date)continue;
    const levelText=match[0].match(/\bdata-level=["']([^"']+)["']/)?.[1];
    if(!/^[0-4]$/.test(levelText||''))throw Error('Invalid contribution level');
    const time=Date.parse(date+'T00:00:00Z');
    if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==date)throw Error('Invalid calendar date');
    days.push({date,level:Number(levelText)});
  }
  days.sort((a,b)=>a.date.localeCompare(b.date));
  if(!days.length)throw Error('No contribution calendar found');
  for(let i=1;i<days.length;i++) {
    if(days[i].date===days[i-1].date)throw Error('Duplicate calendar day');
    if(Date.parse(days[i].date)-Date.parse(days[i-1].date)!==864e5)throw Error('Calendar has missing days');
  }
  if(new Date(days[0].date+'T00:00:00Z').getUTCDay()!==0)throw Error('Calendar must start on Sunday');
  return days.map((day,i)=>({...day,x:Math.floor(i/7),y:i%7}));
};
