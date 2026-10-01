// MyPersonalPage cloud server. Run: node server.js  then open http://localhost:3000
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const DB = path.join(__dirname, 'db.json');
const h = x => crypto.createHash('sha256').update(String(x)).digest('hex');
let db = {}; try { db = JSON.parse(fs.readFileSync(DB)); } catch {}
const persist = () => fs.writeFileSync(DB, JSON.stringify(db));

http.createServer((q, s) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
  const send = (c, o) => { s.writeHead(c, { 'Content-Type': 'application/json', ...cors }); s.end(JSON.stringify(o || {})); };
  if (q.method === 'OPTIONS') { s.writeHead(204, cors); return s.end(); }
  if (q.method === 'GET' && (q.url === '/' || q.url === '/index.html')) {
    s.writeHead(200, { 'Content-Type': 'text/html' });
    return s.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }
  if (q.url === '/api/ping') return send(200);
  let b = '';
  q.on('data', d => { b += d; if (b.length > 2e7) q.destroy(); });
  q.on('end', () => {
    let j = {}; try { j = JSON.parse(b || '{}'); } catch {}
    const u = String(j.user || '').toLowerCase(), r = db[u];
    if (q.url === '/api/register' && q.method === 'POST') {
      if (!u || !j.key) return send(400);
      if (r) return send(409);
      db[u] = { key: h(j.key), data: null }; persist(); return send(200);
    }
    if (!r) return send(404);
    if (r.key !== h(j.key)) return send(401);
    if (q.url === '/api/login') return send(200, { data: r.data });
    if (q.url === '/api/save') { r.data = j.data; persist(); return send(200); }
    send(404);
  });
}).listen(process.env.PORT || 3000, () => console.log('MyPersonalPage running at http://localhost:3000'));
