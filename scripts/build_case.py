"""Author the articulated Buds Pro 2 case in Blender and export its web mesh."""
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)

def linear(value):
    return value / 12.92 if value < 0.04045 else ((value + 0.055) / 1.055) ** 2.4

def material(name, color, roughness, metallic=0, coat=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    rgb = [linear(int(color[i:i + 2], 16) / 255) for i in (0, 2, 4)]
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*rgb, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Coat Weight'].default_value = coat
    shader.inputs['Coat Roughness'].default_value = .24
    if metallic > .9:
        shader.inputs['Anisotropic'].default_value = .42
        texture = mat.node_tree.nodes.new('ShaderNodeTexNoise')
        texture.inputs['Scale'].default_value = 160
        texture.inputs['Detail'].default_value = 2
        bump = mat.node_tree.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = .16
        bump.inputs['Distance'].default_value = .0022
        mat.node_tree.links.new(texture.outputs['Fac'], bump.inputs['Height'])
        mat.node_tree.links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    mat.diffuse_color = (*rgb, 1)
    return mat

polymer = material('Orange · satin polymer', 'F74216', .39, coat=.19)
tray_finish = material('Orange · inner tray', 'C82F13', .46, coat=.11)
recess = material('Orange · engraved details', 'BF2D10', .45)
dark = material('Dial gasket', '301510', .43)
silver = material('Smart Dial · brushed aluminium', 'C6C8C9', .29, .96)
gold = material('Charging pins', 'D2904B', .30, .82)
indicator = material('Indicator', 'FFE4B0', .25)

def xyz(x, y, z):
    return x, -z, y

def parent_to(obj, parent):
    if parent:
        bpy.context.view_layer.update()
        world = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_world = world
    return obj

def empty(name, position, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = xyz(*position)
    return parent_to(obj, parent)

def activate(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

def finish(obj, name, mat, parent=None):
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    return parent_to(obj, parent)

def smooth(obj, horizontal_caps=False):
    for face in obj.data.polygons:
        face.use_smooth = not horizontal_caps or abs(face.normal.z) < .999
    return obj

def contour(width, length, radius, segments=16):
    for index, (cx, cy) in enumerate(((width, length), (-width, length), (-width, -length), (width, -length))):
        for i in range(segments + 1):
            angle = (index + i / segments) * math.pi / 2
            yield (cx / 2 - math.copysign(radius, cx) + math.cos(angle) * radius,
                   cy / 2 - math.copysign(radius, cy) + math.sin(angle) * radius)

def loft(name, levels, mat=None, parent=None, center=(0, 0)):
    vertices = [(x + center[0], z + center[1], height)
                for height, width, depth, radius in levels for x, z in contour(width, depth, radius)]
    count = len(vertices) // len(levels)
    faces = [tuple(reversed(range(count)))]
    for level in range(len(levels) - 1):
        start = level * count
        for index in range(count):
            a, b = start + index, start + (index + 1) % count
            faces.append((a, b, b + count, a + count))
    faces.append(tuple(range(len(vertices) - count, len(vertices))))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    smooth(obj, horizontal_caps=True)
    return finish(obj, name, mat, parent)

def disc(name, x, y, z, radius, height, mat, parent=None, axis='y', bevel=.009, segments=72):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments, radius=radius, depth=height, location=xyz(x, y, z))
    obj = bpy.context.object
    if axis == 'x':
        obj.rotation_euler.y = math.pi / 2
    if axis == 'z':
        obj.rotation_euler.x = math.pi / 2
    if bevel:
        modifier = obj.modifiers.new('Machined rim', 'BEVEL')
        modifier.width = min(bevel, height * .33)
        modifier.segments = 4
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return finish(smooth(obj, horizontal_caps=True), name, mat, parent)

def stamp(name, x, y, z, radius, thickness, mat, parent):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=thickness,
                                  major_segments=48, minor_segments=10, location=xyz(x, y, z))
    return finish(smooth(bpy.context.object), name, mat, parent)

root = empty('BudsCase', (0, 0, 0))
hinge = empty('LidHinge', (0, .062, -1.04), root)
loft('Lower shell', [
    (-.32, 2.15, 2.14, .35), (-.30, 2.26, 2.25, .38), (-.245, 2.38, 2.37, .41),
    (-.17, 2.43, 2.43, .42), (-.04, 2.43, 2.43, .42), (.022, 2.42, 2.42, .42),
    (.038, 2.37, 2.37, .405),
], polymer, root)
loft('Parting line', [(.036, 2.374, 2.374, .406), (.068, 2.374, 2.374, .406)], recess, root)
tray = loft('Inner charging tray', [
    (.058, 2.367, 2.365, .409), (.105, 2.346, 2.343, .400), (.135, 2.30, 2.30, .386),
    (.151, 2.248, 2.248, .373),
], tray_finish)
for index, (x, z, angle) in enumerate(((-.48, .34, -.73), (.48, -.32, 2.42))):
    cavity = loft('Charging-well cutter', [
        (-.098, .45, .50, .21), (-.073, .60, .74, .245), (.045, .676, 1.10, .253),
        (.134, .725, 1.18, .27), (.28, .754, 1.224, .278),
    ])
    cavity.location = xyz(x, 0, z)
    cavity.rotation_euler.z = angle
    activate(tray)
    cut = tray.modifiers.new('Recessed charging well', 'BOOLEAN')
    cut.operation = 'DIFFERENCE'
    cut.object = cavity
    bpy.ops.object.modifier_apply(modifier=cut.name)
    bpy.data.objects.remove(cavity, do_unlink=True)
    for pin_x in (-.074, .074):
        offset = Vector((pin_x, -.12))
        rotated_x = offset.x * math.cos(angle) - offset.y * math.sin(angle)
        rotated_y = offset.x * math.sin(angle) + offset.y * math.cos(angle)
        disc(f'Charging contact {index + 1}', x + rotated_x, -.046, z - rotated_y, .021, .045, gold, root, segments=28)
parent_to(tray, root)
disc('Hinge pin', 0, .048, -1.045, .097, 1.30, tray_finish, root, axis='x')
disc('Case LED', 0, -.081, 1.208, .019, .02, indicator, root, axis='z', segments=36)

loft('Lid shell', [
    (.069, 2.373, 2.373, .408), (.105, 2.426, 2.426, .42), (.203, 2.426, 2.425, .42),
    (.281, 2.40, 2.40, .423), (.342, 2.31, 2.31, .393), (.368, 2.16, 2.16, .345),
], polymer, hinge)
loft('Lid inner liner', [(.065, 2.25, 2.25, .36), (.088, 2.29, 2.29, .38)], tray_finish, hinge)

dial = empty('SmartDial', (-.711, .371, -.703), hinge)
disc('Dial gasket', -.711, .371, -.703, .424, .043, dark, dial, bevel=.004, segments=112)
disc('SmartDialFace', -.711, .405, -.703, .402, .049, silver, dial, bevel=.013, segments=112)
stamp('Dial edge', -.711, .418, -.703, .391, .005, silver, dial)

stamp('Etched circle', .377, .368, .718, .097, .006, recess, hinge)
disc('Raised circle', .858, .370, .718, .098, .012, tray_finish, hinge, segments=56)
for row in range(4):
    for column in range(4):
        stamp('CMF dot', .618 + (column - 1.5) * .052, .369,
              .720 + (row - 1.5) * .052, .014, .003, recess, hinge)

activate(root)
for obj in root.children_recursive:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'material/cmf/buds-case.glb'), export_format='GLB',
                          use_selection=True, export_apply=True, export_animations=False)

stage = bpy.context.scene
stage.unit_settings.system = 'METRIC'
stage.unit_settings.scale_length = .0255
stage.render.engine = 'CYCLES'
stage.cycles.samples = 48
stage.render.resolution_x = 1100
stage.render.resolution_y = 900
stage.world = bpy.data.worlds.new('Studio world')
stage.world.color = (.11, .11, .11)
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.324))
finish(bpy.context.object, 'Studio floor', material('Warm gray seamless', '7F7972', .59))

def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()

for name, position, power, size, tint in [
    ('Key softbox', (-3, -4, 7), 720, 4.6, (1, .92, .85)),
    ('Rim strip', (3, 3, 4), 420, 3.2, (.84, .92, 1)),
    ('Dial softbox', (.9, -2, 5), 190, 1.8, (1, .87, .77)),
]:
    bpy.ops.object.light_add(type='AREA', location=position)
    lamp = bpy.context.object
    lamp.name = name
    lamp.data.energy = power
    lamp.data.shape = 'DISK'
    lamp.data.size = size
    lamp.data.color = tint
    aim(lamp, (0, 0, 0))
bpy.ops.object.camera_add(location=(3.1, -3.0, 6.7))
stage.camera = bpy.context.object
stage.camera.data.lens = 56
aim(stage.camera, (0, 0, .05))
activate(root)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'models/buds-pro-2.blend'))
