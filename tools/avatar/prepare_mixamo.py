"""
Textured image-to-3D GLB (Tripo, Meshy...) -> FBX ready for Mixamo's auto-rigger.

  Blender -b -noaudio --python tools/avatar/prepare_mixamo.py -- in.glb out.fbx

Simplify and downsize the GLB first (see README): Mixamo chokes on millions of
triangles, and its rig keeps whatever topology and UVs we upload. The model is
turned to face -Y (Blender's front, Mixamo's +Z after export), scaled to 2.0
tall and stood on the ground, so the site's framing matches the previous avatar.
Tested with Blender 5.0.
"""
import math
import sys

import bpy
from mathutils import Vector

GLB, FBX = sys.argv[sys.argv.index('--') + 1:][:2]
TARGET_HEIGHT = 2.0

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if len(meshes) != 1:
    sys.exit(f'expected one mesh, got {len(meshes)}')
mesh = meshes[0]

# Bake the glTF import's parent transforms into the mesh, then work in world space.
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def bounds():
    vs = [v.co for v in mesh.data.vertices]
    return (Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))),
            Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs))))


# Front = where the toes point. In A-pose the arms make the body wider than
# deep, so the front axis is the shorter horizontal one. Measured from the
# shin (knee height), the shoes reach far forward and barely back past the
# heel. (The head is no good for this: voluminous hair sticks out behind
# more than the nose does in front.)
lo, hi = bounds()
height = hi.z - lo.z
feet = [v.co for v in mesh.data.vertices if v.co.z < lo.z + height * 0.03]
shins = [v.co for v in mesh.data.vertices if lo.z + height * 0.15 < v.co.z < lo.z + height * 0.25]
axis = 0 if (hi.x - lo.x) < (hi.y - lo.y) else 1
shin_centre = sum(c[axis] for c in shins) / len(shins)
reach_pos = max(c[axis] for c in feet) - shin_centre
reach_neg = shin_centre - min(c[axis] for c in feet)
facing = Vector((0, 0, 0))
facing[axis] = 1 if reach_pos > reach_neg else -1
turn = facing.to_2d().angle_signed(Vector((0, -1)))
# The glTF importer leaves objects in quaternion mode, where rotation_euler is ignored.
mesh.rotation_mode = 'XYZ'
# angle_signed is clockwise-positive, Blender Z rotation counter-clockwise.
mesh.rotation_euler = (0, 0, -turn)
print(f'STATS facing={tuple(facing)} turn_deg={math.degrees(-turn):.0f} height_before={height:.3f}')
bpy.ops.object.transform_apply(rotation=True)

mesh.scale = (TARGET_HEIGHT / height,) * 3
bpy.ops.object.transform_apply(scale=True)
lo, hi = bounds()
mesh.location = (-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)
bpy.ops.object.transform_apply(location=True)
lo, hi = bounds()
print(f'STATS bounds={tuple(round(c, 3) for c in lo)}..{tuple(round(c, 3) for c in hi)} '
      f'verts={len(mesh.data.vertices)} faces={len(mesh.data.polygons)}')

# Embedded textures only feed Mixamo's preview; the final GLB gets the original
# PBR maps back from the source file (import_mixamo_pbr.py).
bpy.ops.export_scene.fbx(
    filepath=FBX, use_selection=True, object_types={'MESH'},
    path_mode='COPY', embed_textures=True, add_leaf_bones=False,
)
print('EXPORTED', FBX)
