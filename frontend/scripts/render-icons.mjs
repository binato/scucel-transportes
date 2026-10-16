import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const pages = await fetch('http://127.0.0.1:9223/json').then(response => response.json());
const target = pages.find(page => page.type === 'page' && page.url.startsWith('http://127.0.0.1:'));
if (!target) throw new Error('Chrome headless em 9223 não está disponível');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0;
const pending = new Map();
socket.onmessage = event => {
  const response = JSON.parse(event.data);
  const task = pending.get(response.id);
  if (task) {
    pending.delete(response.id);
    if (response.error) task.reject(new Error(response.error.message));
    else task.resolve(response.result);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
await send('Page.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:5173/icon.svg' });
await new Promise(resolve => setTimeout(resolve, 500));
for (const size of [192, 512]) {
  await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: `document.documentElement.style.cssText='margin:0;width:100%;height:100%';document.body.innerHTML='<img src="/icon.svg" style="display:block;width:${size}px;height:${size}px">';document.body.style.cssText='margin:0;width:100%;height:100%'` });
  await new Promise(resolve => setTimeout(resolve, 300));
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const path = resolve(`frontend/public/icon-${size}.png`);
  await writeFile(path, Buffer.from(screenshot.data, 'base64'));
  console.log(path);
}
socket.close();
