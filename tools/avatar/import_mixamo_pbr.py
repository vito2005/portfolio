"""
Mixamo FBX clips + the textured source GLB -> one rigged GLB with every clip.

  Blender -b -noaudio --python tools/avatar/import_mixamo_pbr.py -- \
      source.glb out.glb Idle=idle.fbx Wave=waving.fbx [...]

For image-to-3D models that come with their own UVs and PBR maps (Tripo,
Meshy). Mixamo keeps the UVs of the FBX that prepare_mixamo.py exported, but
its FBX carries only a flattened colour map, so the material is taken from
the GLB that went into prepare_mixamo.py (colour + normal + ORM). The first
clip provides the mesh and skeleton; later ones only contribute their action,
retargeted by bone name, which works because all of them come from the same
Mixamo upload. Tested with Blender 5.0.
"""
import sys

import bpy

args = sys.argv[sys.argv.index('--') + 1:]
SOURCE, OUT = args[:2]
CLIPS = [a.split('=', 1) for a in args[2:]]
TARGET_HEIGHT = 2.0

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30


def import_fbx(path):
    before = set(bpy.data.objects)
    actions_before = set(bpy.data.actions)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=False, ignore_leaf_bones=True)
    new = [o for o in bpy.data.objects if o not in before]
    action = next(a for a in bpy.data.actions if a not in actions_before)
    return new, action


# ---- mesh, skeleton and the first clip
(first_name, first_path), rest = CLIPS[0], CLIPS[1:]
objects, action = import_fbx(first_path)
mesh = next(o for o in objects if o.type == 'MESH')
armature = next(o for o in objects if o.type == 'ARMATURE')
action.name = first_name
actions = [action]

# ---- further clips: keep the action, drop their copy of the character
for name, path in rest:
    objects, action = import_fbx(path)
    action.name = name
    actions.append(action)
    for obj in objects:
        bpy.data.objects.remove(obj, do_unlink=True)

for action in actions:
    action.use_fake_user = True
    start, end = action.frame_range
    print(f'STATS clip {action.name}: frames {int(start)}-{int(end)}')

# ---- 2.0 tall, feet on the ground, in the rest pose (Mixamo exports in cm)
armature.animation_data.action = None
for bone in armature.pose.bones:
    bone.matrix_basis.identity()
bpy.context.view_layer.update()
world = [mesh.matrix_world @ v.co for v in mesh.data.vertices]
height = max(v.z for v in world) - min(v.z for v in world)
armature.scale = armature.scale * (TARGET_HEIGHT / height)
bpy.context.view_layer.update()
world = [mesh.matrix_world @ v.co for v in mesh.data.vertices]
armature.location.z -= min(v.z for v in world)
print(f'STATS mesh verts={len(mesh.data.vertices)} faces={len(mesh.data.polygons)} '
      f'bones={len(armature.data.bones)} height_before={height:.3f}')

# ---- the source material, with its full PBR set, onto the rigged mesh
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=SOURCE)
source_objects = [o for o in bpy.data.objects if o not in before]
source_mesh = next(o for o in source_objects if o.type == 'MESH')
material = source_mesh.data.materials[0]
mesh.data.materials.clear()
mesh.data.materials.append(material)
for obj in source_objects:
    bpy.data.objects.remove(obj, do_unlink=True)
print(f'STATS material {material.name}: images {[n.image.name for n in material.node_tree.nodes if n.type == "TEX_IMAGE"]}')

# ---- export: every action becomes a glTF animation named after it
armature.animation_data.action = actions[0]
bpy.ops.object.select_all(action='DESELECT')
armature.select_set(True)
mesh.select_set(True)
bpy.context.view_layer.objects.active = armature
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format='GLB', use_selection=True, export_yup=True,
    export_texcoords=True, export_normals=True, export_skins=True,
    export_animations=True, export_animation_mode='ACTIONS', export_image_format='AUTO',
)
print('EXPORTED', OUT)
