import json
import os
import subprocess
import sys


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
MODELS_JSON = os.path.join(ROOT, "Models", "models.json")
MODELS_DIR = os.path.join(ROOT, "Models")


def main():
    blender = sys.argv[1] if len(sys.argv) > 1 else "blender"
    with open(MODELS_JSON, "r", encoding="utf-8") as handle:
        spec = json.load(handle)
    for entry in spec["models"]:
        source = os.path.normpath(os.path.join(MODELS_DIR, entry["source"]))
        output = os.path.join(MODELS_DIR, entry["file"])
        if not os.path.exists(source):
            print("skip missing source: {}".format(source))
            continue
        env = os.environ.copy()
        env["BLENDER_GLB"] = source
        env["BLENDER_USDZ"] = output
        env["BLENDER_HEIGHT"] = str(entry["heightMeters"])
        command = [
            blender,
            "--background",
            "--python",
            os.path.join(ROOT, "scripts", "glb_to_usdz.py"),
        ]
        print(" ".join(command))
        subprocess.run(command, check=True, env=env)
    print("all models converted")


if __name__ == "__main__":
    main()
