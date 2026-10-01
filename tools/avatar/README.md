# Hero avatar

`public/models/alex.glb` is a Tripo image-to-3D model, rigged in Mixamo.
ChatGPT drew a Pixar-style front/side/back sheet from photos, Tripo turned the
front view into a GLB **with its own UVs and PBR maps** (colour, normal, ORM).
Download GLB from the generator, never STL: an STL has no colour at all.

```bash
npx @gltf-transform/cli weld tripo.glb /tmp/weld.glb
npx @gltf-transform/cli simplify /tmp/weld.glb /tmp/60k.glb --ratio 0.03 --error 0.002
npx @gltf-transform/cli resize /tmp/60k.glb /tmp/60k-2k.glb --width 2048 --height 2048
Blender -b -noaudio --python tools/avatar/prepare_mixamo.py -- /tmp/60k-2k.glb /tmp/alex-for-mixamo.fbx
# Mixamo: upload the FBX, Standard Skeleton, download each clip as FBX Binary, With Skin, 30 fps
Blender -b -noaudio --python tools/avatar/import_mixamo_pbr.py -- \
  /tmp/60k-2k.glb /tmp/alex-rigged.glb Idle=idle.fbx Wave=waving.fbx
npx @gltf-transform/cli webp /tmp/alex-rigged.glb /tmp/alex-webp.glb --quality 85
npx @gltf-transform/cli meshopt /tmp/alex-webp.glb public/models/alex.glb --level medium
```

- meshoptimizer's `simplify` keeps UV seams, so 2M → 60k triangles does not
  smear the texture. 2K maps look the same as 4K at the hero's size and halve
  the file (~1.3 MB).
- `prepare_mixamo.py` turns the model to face -Y (found from where the toes
  point), scales it to 2.0 tall and stands it on the ground.
- `import_mixamo_pbr.py` takes the rig and clips from Mixamo and the material
  from the source GLB, because Mixamo's FBX keeps only a flat colour map. Each
  clip becomes a glTF animation named after it.
- `HeroAvatar.vue` plays `Wave` once on arrival, then loops `Idle` (breathing).
  `HeroAvatar.vue` registers three's `MeshoptDecoder` for the compressed file.

Tested with Blender 5.0. Source images, the Tripo GLB and the Mixamo FBX files
are kept outside the repo.
