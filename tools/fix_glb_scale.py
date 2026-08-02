import json
import struct
import sys


def parse_glb(path):
    with open(path, "rb") as f:
        raw = f.read()
    off = 12
    js = None
    bin_chunk = b""
    while off < len(raw):
        clen, ctype = struct.unpack("<II", raw[off : off + 8])
        chunk = raw[off + 8 : off + 8 + clen]
        if ctype == 0x4E4F534A:
            js = json.loads(chunk.decode("utf-8"))
        elif ctype == 0x004E4942:
            bin_chunk = chunk
        off += 8 + clen
    return js, bin_chunk


def rebuild_glb(js, bin_chunk):
    json_bytes = json.dumps(js, separators=(",", ":")).encode("utf-8")
    if len(json_bytes) % 4:
        json_bytes += b" " * (4 - len(json_bytes) % 4)
    total = 12 + 8 + len(json_bytes) + 8 + len(bin_chunk)
    out = bytearray()
    out += struct.pack("<4sII", b"glTF", 2, total)
    out += struct.pack("<II", len(json_bytes), 0x4E4F534A)
    out += json_bytes
    out += struct.pack("<II", len(bin_chunk), 0x004E4942)
    out += bin_chunk
    return bytes(out)


def main():
    path = sys.argv[1]
    mn = [float(v) for v in sys.argv[2].split(",")]
    size = [float(v) for v in sys.argv[3].split(",")]
    js, bin_chunk = parse_glb(path)
    nodes = js.get("nodes", [])
    root = next((n for n in nodes if n.get("name") == "NormalizedRoot"), None)
    if root is None:
        raise SystemExit("NormalizedRoot not found")
    old_scale = root.get("scale", [1, 1, 1])
    old_trans = root.get("translation", [0, 0, 0])
    s0 = old_scale[0]
    h0 = size[1]
    k = 1.0 / h0
    center = [mn[i] + size[i] / 2 for i in range(3)]
    t1 = [
        -k * (center[0] - old_trans[0]),
        -k * (mn[1] - old_trans[1]),
        -k * (center[2] - old_trans[2]),
    ]
    root["scale"] = [s0 * k, s0 * k, s0 * k]
    root["translation"] = t1
    with open(path, "wb") as f:
        f.write(rebuild_glb(js, bin_chunk))
    print(f"fixed {path}: scale {s0:.5f} -> {s0*k:.5f}, translate {t1}")


if __name__ == "__main__":
    main()
