const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseCalendar}=require('./calendar.cjs');
test('preserves date and intensity when GitHub renders days in row order',()=>{
  const html='<td data-date="2026-11-02" data-level="4"></td><td data-level="0" data-date="2026-11-01"></td><td data-date="2026-11-03" data-level="2"></td>';
  assert.deepEqual(parseCalendar(html),[{date:'2026-11-01',level:0,x:0,y:0},{date:'2026-11-02',level:4,x:0,y:1},{date:'2026-11-03',level:2,x:0,y:2}]);
});
test('refuses a login/error page instead of replacing artwork with an empty calendar',()=>{
  assert.throws(()=>parseCalendar('<html>Please sign in</html>'),/calendar/i);
});
test('refuses duplicate days or out-of-range intensity',()=>{
  assert.throws(()=>parseCalendar('<td data-date="2026-11-01" data-level="0"></td><td data-date="2026-11-01" data-level="1"></td>'),/duplicate/i);
  assert.throws(()=>parseCalendar('<td data-date="2026-11-01" data-level="9"></td>'),/level/i);
});
