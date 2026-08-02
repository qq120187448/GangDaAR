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


def strip_vrm(obj):
    if isinstance(obj, dict):
        keys = list(obj.keys())
        for key in keys:
            if key.startswith(("VRM", "VRMC", "MTOON", "EXT_")):
                del obj[key]
            else:
                strip_vrm(obj[key])
    elif isinstance(obj, list):
        for item in obj:
            strip_vrm(item)


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
    src, dst = sys.argv[1], sys.argv[2]
    js, bin_chunk = parse_glb(src)
    kept_used = [
        e
        for e in js.get("extensionsUsed", [])
        if not e.startswith(("VRM", "VRMC", "MTOON", "EXT_"))
    ]
    kept_req = [
        e
        for e in js.get("extensionsRequired", [])
        if not e.startswith(("VRM", "VRMC", "MTOON", "EXT_"))
    ]
    if kept_used:
        js["extensionsUsed"] = kept_used
    else:
        js.pop("extensionsUsed", None)
    if kept_req:
        js["extensionsRequired"] = kept_req
    else:
        js.pop("extensionsRequired", None)
    strip_vrm(js)
    with open(dst, "wb") as f:
        f.write(rebuild_glb(js, bin_chunk))
    print(f"stripped VRM extensions: {src} -> {dst}")


if __name__ == "__main__":
    main()
