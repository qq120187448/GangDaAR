const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const PORT = 8124;
const MIME = { ".wasm": "application/wasm", ".js": "text/javascript" };

if (typeof globalThis.FileReader === "undefined") {
  class FileReader {
    constructor() {
      this.result = null;
    }
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (this.onloadend) this.onloadend();
      });
    }
  }
  globalThis.FileReader = FileReader;
}

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

function readBuffer(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => (err ? reject(err) : resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength))));
  });
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const THREE = await import("three");
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");

  const args = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(args[0], "utf8"));

  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(`http://127.0.0.1:${PORT}/tools/preview/node_modules/three/examples/jsm/libs/draco/gltf/`);
  loader.setDRACOLoader(draco);

  for (const item of spec) {
    const input = path.join(ROOT, item.input);
    const output = path.join(ROOT, item.output);
    const buffer = await readBuffer(input);
    const gltf = await new Promise((resolve, reject) =>
      loader.parse(buffer, "", resolve, reject)
    );
    const model = gltf.scene;
    if (item.rotation) {
      const [rx, ry, rz] = item.rotation;
      model.rotation.set(rx, ry, rz);
    }
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const height = size.y;
    const scale = 1 / height;
    const min = box.min.clone();
    const center = box.getCenter(new THREE.Vector3());
    model.position.x += -center.x * scale;
    model.position.z += -center.z * scale;
    model.position.y += -min.y * scale;
    model.scale.multiplyScalar(scale);
    model.updateMatrixWorld(true);

    const result = await new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      exporter.parse(
        model,
        (glb) => resolve(Buffer.from(glb)),
        (err) => reject(err),
        { binary: true }
      );
    });
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, result);
    const after = new THREE.Box3().setFromObject(model);
    const afterSize = new THREE.Vector3();
    after.getSize(afterSize);
    console.log(
      `${path.basename(output)}: height=${afterSize.y.toFixed(4)} minY=${after.min.y.toFixed(4)} size=${afterSize.toArray().map((v) => v.toFixed(3)).join("x")}`
    );
  }
  server.close();
})();
