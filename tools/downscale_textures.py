import json
import struct
import sys
from io import BytesIO

from PIL import Image


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


def rebuild_glb(js, bin_chunk, replacements=None):
    replacements = replacements or {}
    buffers = js.get("buffers", [])
    if not buffers:
        return None
    views = js.get("bufferViews", [])
    new_parts = []
    new_views = []
    for idx, view in enumerate(views):
        start = view.get("byteOffset", 0)
        length = view.get("byteLength")
        data = bytearray(replacements.get(idx, bin_chunk[start : start + length]))
        new_view = dict(view)
        new_view["byteOffset"] = sum(len(p) for p in new_parts)
        new_view["byteLength"] = len(data)
        new_views.append(new_view)
        new_parts.append(bytes(data))
        if len(new_parts[-1]) % 4:
            new_parts.append(b"\x00" * (4 - len(new_parts[-1]) % 4))
    js["bufferViews"] = new_views
    buffers[0]["byteLength"] = sum(len(p) for p in new_parts)
    js["buffers"] = buffers

    json_bytes = json.dumps(js, separators=(",", ":")).encode("utf-8")
    if len(json_bytes) % 4:
        json_bytes += b" " * (4 - len(json_bytes) % 4)
    bin_bytes = b"".join(new_parts)
    total = 12 + 8 + len(json_bytes) + 8 + len(bin_bytes)
    out = bytearray()
    out += struct.pack("<4sII", b"glTF", 2, total)
    out += struct.pack("<II", len(json_bytes), 0x4E4F534A)
    out += json_bytes
    out += struct.pack("<II", len(bin_bytes), 0x004E4942)
    out += bin_bytes
    return bytes(out)


def main():
    path = sys.argv[1]
    max_side = int(sys.argv[2]) if len(sys.argv) > 2 else 2048
    js, bin_chunk = parse_glb(path)
    replacements = {}
    changed = 0
    for image in js.get("images", []):
        bv_index = image["bufferView"]
        bv = js["bufferViews"][bv_index]
        start = bv.get("byteOffset", 0)
        data = bin_chunk[start : start + bv["byteLength"]]
        img = Image.open(BytesIO(data))
        if max(img.size) <= max_side:
            continue
        img.thumbnail((max_side, max_side), Image.LANCZOS)
        out = BytesIO()
        img.convert("RGBA").save(out, "PNG")
        replacements[bv_index] = out.getvalue()
        bv["byteLength"] = len(out.getvalue())
        image["mimeType"] = "image/png"
        changed += 1
    if not changed:
        print("no textures to downscale")
        return
    out = rebuild_glb(js, bin_chunk, replacements)
    with open(path, "wb") as f:
        f.write(out)
    print(f"downscaled {changed} textures to <= {max_side}px, size={len(out)}")


if __name__ == "__main__":
    main()
