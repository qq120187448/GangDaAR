const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/12018/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");

const ROOT = path.resolve(__dirname, "../..");
const SHOTS = path.join(__dirname, "shots");
const PORT = 8123;

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".glb": "model/gltf-binary",
  ".json": "application/json",
  ".png": "image/png",
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
  page.on("console", (msg) => console.log(`[console:${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => console.log(`[pageerror] ${err.message}`));
  const files = process.argv.slice(2);
  for (const entry of files) {
    const [f, rot] = entry.split(":");
    const name = path.basename(f, ".glb");
    const rotQuery = rot ? `&rot=${encodeURIComponent(rot)}` : "";
    const modelPath = f.includes("/") ? f : `model_src/${f}`;
    await page.goto(`http://127.0.0.1:${PORT}/tools/preview/render.html?f=${encodeURIComponent(modelPath)}${rotQuery}`, {
      waitUntil: "load",
    });
    for (let i = 0; i < 80; i++) {
      if (await page.evaluate(() => window.__done)) break;
      await wait(250);
    }
    const err = await page.evaluate(() => window.__error || "");
    if (err) {
      console.log(`${name}: ERROR ${err}`);
      continue;
    }
    const pixelInfo = await page.evaluate(() => {
      const c = document.getElementById("c");
      const ctx = c.getContext("webgl2") || c.getContext("webgl");
      const data = new Uint8Array(4);
      ctx.readPixels(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, data);
      return { w: c.width, h: c.height, px: Array.from(data) };
    });
    console.log(`${name}: canvas ${pixelInfo.w}x${pixelInfo.h} center ${pixelInfo.px.join(",")}`);
    const info = await page.evaluate(() => window.__info || null);
    if (info) console.log(`${name}: info ${JSON.stringify(info)}`);
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
    console.log(`${name}: ok`);
  }
  await browser.close();
  server.close();
})();
