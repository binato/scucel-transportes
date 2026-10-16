import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const pages = await fetch('http://127.0.0.1:9223/json').then(response => response.json());
const target = pages.find(page => page.type === 'page' && (page.url === 'about:blank' || page.url.startsWith('http://127.0.0.1:5173/') || page.url.startsWith('http://127.0.0.1:4173/')));
if (!target) throw new Error('Chrome headless em 9223 não está disponível');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let nextId = 0;
const pending = new Map();
socket.onmessage = event => {
  const response = JSON.parse(event.data);
  const waiting = pending.get(response.id);
  if (waiting) {
    pending.delete(response.id);
    if (response.error) waiting.reject(new Error(response.error.message));
    else waiting.resolve(response.result);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

await send('Page.enable');
await send('Runtime.enable');
const width = Number(process.argv[2] || 390);
const baseUrl = process.argv[3] || 'http://127.0.0.1:5173/';
await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true });
await send('Page.navigate', { url: baseUrl });
await pause(3000);
const labels = ['Dashboard Analítico', 'Digitação Rápida', 'App Motorista', 'Frota & Metas'];
for (const [index, label] of labels.entries()) {
  if (index) {
    const clicked = await evaluate(`(() => { const button = [...document.querySelectorAll('nav button')].find(item => item.textContent.includes(${JSON.stringify(label)})); if (!button) return false; button.click(); return true; })()`);
    if (!clicked) throw new Error(`Aba não encontrada: ${label}`);
    await pause(750);
  }
  const metrics = await evaluate('({ viewport: innerWidth, document: document.documentElement.scrollWidth, title: document.title, buttons: [...document.querySelectorAll("nav button")].map(button => ({ text: button.innerText, right: Math.round(button.getBoundingClientRect().right) })) })');
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const path = join(tmpdir(), `scucel-mobile-${width}-${index}.png`);
  await writeFile(path, Buffer.from(screenshot.data, 'base64'));
  console.log(JSON.stringify({ label, ...metrics, screenshot: path }));
  if (label === 'Digitação Rápida') {
    const count = await evaluate('document.querySelectorAll(".recent-entry").length');
    if (count) {
      await evaluate('document.querySelector(".recent-entry .entry-buttons button").click()');
      await pause(100);
      const editing = await evaluate('document.querySelector(".manual-entry .form-actions button")?.innerText');
      await evaluate('document.querySelectorAll(".recent-entry .entry-buttons button")[1].click()');
      await pause(100);
      const duplicate = await evaluate('({ button: document.querySelector(".manual-entry .form-actions button")?.innerText, km: document.querySelector(".manual-entry input[type=number]")?.value })');
      console.log(JSON.stringify({ recentEntries: count, editing, duplicate }));
    }
  }
}
if (process.argv[4] === 'offline') {
  const ready = await evaluate('navigator.serviceWorker.ready.then(() => ({ controlled: !!navigator.serviceWorker.controller, vehicles: JSON.parse(localStorage.getItem("scucel_veiculos_cache") || "[]").length }))');
  await send('Network.enable');
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await send('Page.navigate', { url: baseUrl });
  await pause(1500);
  const offline = await evaluate('({ hasApp: !!document.querySelector("nav"), vehicles: JSON.parse(localStorage.getItem("scucel_veiculos_cache") || "[]").length })');
  console.log(JSON.stringify({ offlineReady: ready, offlineReload: offline }));
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
}
socket.close();
