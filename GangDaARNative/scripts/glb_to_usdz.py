import argparse
import math
import os
import sys

import bpy
from mathutils import Vector


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for collection in list(bpy.data.collections):
        if collection.users == 0:
            bpy.data.collections.remove(collection)


def import_glb(path):
    bpy.ops.import_scene.gltf(filepath=path)


def world_bounds():
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    min_corner = Vector((math.inf, math.inf, math.inf))
    max_corner = Vector((-math.inf, -math.inf, -math.inf))
    found = False
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        evaluated = obj.evaluated_get(dg)
        mesh = getattr(evaluated, "data", None)
        if mesh is None or not hasattr(mesh, "vertices"):
            mesh = getattr(obj, "data", None)
        if mesh is None or not hasattr(mesh, "vertices"):
            continue
        for vertex in mesh.vertices:
            world = evaluated.matrix_world @ vertex.co
            for i in range(3):
                min_corner[i] = min(min_corner[i], world[i])
                max_corner[i] = max(max_corner[i], world[i])
        found = True
    if not found:
        raise RuntimeError("No mesh geometry found in scene")
    return min_corner, max_corner


def normalize_height(target_height):
    min_corner, max_corner = world_bounds()
    height = max_corner.y - min_corner.y
    if height <= 0.0001:
        raise RuntimeError("Model has zero height")
    scale = target_height / height
    roots = [obj for obj in bpy.data.objects if obj.parent is None]
    for obj in roots:
        obj.scale = [obj.scale[0] * scale, obj.scale[1] * scale, obj.scale[2] * scale]
    bpy.context.view_layer.update()
    min_corner, _ = world_bounds()
    for obj in roots:
        obj.location.y -= min_corner.y
    bpy.context.view_layer.update()
    return scale


def downscale_textures(max_dimension):
    for image in bpy.data.images:
        if image.users == 0 or image.size[0] <= 0 or image.size[1] <= 0:
            continue
        largest = max(image.size)
        if largest <= max_dimension:
            continue
        factor = max_dimension / float(largest)
        image.scale(
            max(1, int(round(image.size[0] * factor))),
            max(1, int(round(image.size[1] * factor))),
        )
        image.update()
    bpy.context.view_layer.update()


def export_usdz(output_path):
    output_dir = os.path.dirname(os.path.abspath(output_path))
    os.makedirs(output_dir, exist_ok=True)
    result = bpy.ops.wm.usd_export(
        filepath=os.path.abspath(output_path),
        export_animation=False,
        export_hair=False,
        export_mesh_colors=True,
        export_uvmaps=True,
        export_normals=True,
        export_materials=True,
        export_armatures=False,
        export_shapekeys=False,
        evaluation_mode="RENDER",
        generate_preview_surface=True,
        export_textures=True,
    )
    if "FINISHED" not in str(result):
        raise RuntimeError("USD export failed: {}".format(result))


def main():
    glb_path = os.environ.get("BLENDER_GLB", "")
    usdz_path = os.environ.get("BLENDER_USDZ", "")
    height = float(os.environ.get("BLENDER_HEIGHT", "2.0"))
    max_texture = int(os.environ.get("BLENDER_MAX_TEXTURE", "2048"))
    if not glb_path or not usdz_path:
        raise SystemExit("BLENDER_GLB and BLENDER_USDZ environment variables are required")

    clear_scene()
    import_glb(os.path.abspath(glb_path))
    downscale_textures(max_texture)
    scale = normalize_height(height)
    export_usdz(usdz_path)
    print("converted {} -> {} height={}m scale={:.6f}".format(
        glb_path, usdz_path, height, scale
    ))


if __name__ == "__main__":
    main()
