import glob
import os
import sys

from pxr import Usd


def main():
    roots = [os.path.join(os.path.dirname(__file__), "..", "Models")]
    for root in roots:
        pattern = os.path.join(root, "*.usdz")
        for path in sorted(glob.glob(pattern)):
            try:
                stage = Usd.Stage.Open(path)
                prims = len(list(stage.Traverse()))
                print("OK {} prims={}".format(os.path.basename(path), prims))
            except Exception as exc:
                print("FAIL {} {}".format(os.path.basename(path), repr(exc)))


if __name__ == "__main__":
    main()
