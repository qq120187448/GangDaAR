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
    for view in views:
        start = view.get("byteOffset", 0)
        length = view.get("byteLength")
        idx = len(new_views)
        data = bytearray(replacements.get(idx, bin_chunk[start : start + length]))
        new_view = dict(view)
        new_view["byteOffset"] = sum(len(p) for p in new_parts)
        new_view["byteLength"] = len(data)
        new_views.append(new_view)
        new_parts.append(bytes(data))
        # glTF bufferView alignment is 4 bytes.
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
    js, bin_chunk = parse_glb(path)
    converted = 0
    replacements = {}
    for image in js.get("images", []):
        if image.get("mimeType") != "image/webp":
            continue
        bv_index = image["bufferView"]
        bv = js["bufferViews"][bv_index]
        start = bv.get("byteOffset", 0)
        data = bin_chunk[start : start + bv["byteLength"]]
        png = BytesIO()
        Image.open(BytesIO(data)).convert("RGBA").save(png, "PNG")
        png_bytes = png.getvalue()
        bv["byteLength"] = len(png_bytes)
        replacements[bv_index] = png_bytes
        image["mimeType"] = "image/png"
        converted += 1
    if not converted:
        print("no webp images")
        return

    out = rebuild_glb(js, bin_chunk, replacements)
    with open(path, "wb") as f:
        f.write(out)
    print(f"converted {converted} webp textures -> png, size={len(out)}")


if __name__ == "__main__":
    main()
