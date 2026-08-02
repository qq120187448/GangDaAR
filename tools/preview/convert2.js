const fs = require("fs");
const path = require("path");
const { NodeIO } = require("@gltf-transform/core");
const { KHRDracoMeshCompression, EXTTextureWebP } = require("@gltf-transform/extensions");
const { getBounds } = require("@gltf-transform/functions");
const draco3d = require("draco3d");

const ROOT = path.resolve(__dirname, "../..");

function eulerToQuat(rx, ry, rz) {
  const cx = Math.cos(rx / 2);
  const sx = Math.sin(rx / 2);
  const cy = Math.cos(ry / 2);
  const sy = Math.sin(ry / 2);
  const cz = Math.cos(rz / 2);
  const sz = Math.sin(rz / 2);
  return [
    sx * cy * cz - cx * sy * sz,
    cx * sy * cz + sx * cy * sz,
    cx * cy * sz - sx * sy * cz,
    cx * cy * cz + sx * sy * sz,
  ];
}

(async () => {
  const decoderModule = await draco3d.createDecoderModule({});
  const encoderModule = await draco3d.createEncoderModule({});
  const ioRead = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression, EXTTextureWebP])
    .registerDependencies({
      "draco3d.decoder": decoderModule,
      "draco3d.encoder": encoderModule,
    });
  const ioWrite = new NodeIO();
  const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

  for (const item of spec) {
    const input = path.join(ROOT, item.input);
    const output = path.join(ROOT, item.output);
    const doc = await ioRead.read(input);
    const root = doc.getRoot();
    const scene = root.getDefaultScene() || root.listScenes()[0];

    const rot = item.rotation || [0, 0, 0];
    const quat = eulerToQuat(rot[0], rot[1], rot[2]);

    const rootNode = doc.createNode("NormalizedRoot");
    rootNode.setRotation(quat);
    for (const child of [...scene.listChildren()]) {
      rootNode.addChild(child);
    }
    scene.addChild(rootNode);

    const bounds = getBounds(scene);
    const height = bounds.max[1] - bounds.min[1];
    const scale = 1 / height;
    rootNode.setScale([scale, scale, scale]);
    const scaledBounds = getBounds(scene);
    rootNode.setTranslation([
      -((scaledBounds.min[0] + scaledBounds.max[0]) / 2),
      -scaledBounds.min[1],
      -((scaledBounds.min[2] + scaledBounds.max[2]) / 2),
    ]);

    fs.mkdirSync(path.dirname(output), { recursive: true });
    await ioWrite.write(output, doc);
    const after = getBounds(scene);
    console.log(
      `${path.basename(output)}: height=${(after.max[1] - after.min[1]).toFixed(4)} minY=${after.min[1].toFixed(4)} size=${[
        after.max[0] - after.min[0],
        after.max[1] - after.min[1],
        after.max[2] - after.min[2],
      ].map((v) => v.toFixed(3)).join("x")}`
    );
  }
})();
