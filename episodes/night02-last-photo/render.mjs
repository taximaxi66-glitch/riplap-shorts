// node render.mjs frames out_prefix "t1,t2"  |  node render.mjs sheet out.jpg step  |  node render.mjs video out.mp4 t0 t1  |  node render.mjs cues x
import { createRequire } from 'module'; const chromium = createRequire('/home/claude/')('playwright').chromium;
import fs from 'fs'; import { spawn, execFileSync } from 'child_process';
const [mode, out, a3, a4] = process.argv.slice(2);
const timing = JSON.parse(fs.readFileSync('data/timing.json'));
const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('PAGE', m.text()); }); page.on('pageerror', e => console.log('PAGEERR', e.message));
await page.goto('file://' + process.cwd() + '/index.html');
await page.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
const info = await page.evaluate(t => window.init(t), timing);
const dec = d => Buffer.from(d.split(',')[1], 'base64');
if (mode === 'cues') fs.writeFileSync('data/cues.json', JSON.stringify(info.cues, null, 0));
if (mode === 'frames') { for (const t of a3.split(',')) { fs.writeFileSync(`${out}_${t}.jpg`, dec(await page.evaluate(t => frameJPG(+t, 0.9), t))); } }
if (mode === 'sheet') {
  const step = +a3 || 0.5, ts = []; for (let t = 0.05; t < info.dur; t += step) ts.push(t);
  fs.mkdirSync('review/tmp', { recursive: true });
  for (const [i, t] of ts.entries()) fs.writeFileSync(`review/tmp/${String(i).padStart(3, '0')}.jpg`, dec(await page.evaluate(t => frameJPG(t, 0.8), t)));
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', 'review/tmp/%03d.jpg', '-vf', `scale=216:384,tile=8x${Math.ceil(ts.length / 8)}`, '-frames:v', '1', out]);
  fs.rmSync('review/tmp', { recursive: true });
}
if (mode === 'video') {
  const t0 = +a3, t1 = +a4, n = Math.round((t1 - t0) * 30);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', out + '.tmp.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) { const b = dec(await page.evaluate(t => frameJPG(t, 0.94), t0 + i / 30)); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 60 === 0) console.log(out, i, '/', n); }
  ff.stdin.end(); await new Promise(r => ff.on('close', c => { if (c === 0) fs.renameSync(out + '.tmp.mp4', out); r(); }));
}
await browser.close();
