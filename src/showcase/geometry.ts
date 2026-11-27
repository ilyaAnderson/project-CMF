import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const vector = (x: number, y: number, z: number) => new T.Vector3(x, y, z);

export function finish(color: number, roughness: number, metalness = 0, clearcoat = 0) {
  return new T.MeshPhysicalMaterial({ color, roughness, metalness, clearcoat, clearcoatRoughness: .22 });
}

export function part(
  parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material,
  x = 0, y = 0, z = 0,
) {
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export function box(
  parent: T.Object3D, material: T.Material,
  width: number, height: number, depth: number, radius: number,
  x = 0, y = 0, z = 0,
) {
  return part(parent, new RoundedBoxGeometry(width, height, depth, 3, radius), material, x, y, z);
}

export function ball(
  parent: T.Object3D, material: T.Material,
  width: number, height: number, depth: number, x = 0, y = 0, z = 0,
) {
  const mesh = part(parent, new T.SphereGeometry(1, 32, 20), material, x, y, z);
  mesh.scale.set(width, height, depth);
  return mesh;
}

export function cylinder(
  parent: T.Object3D, material: T.Material, top: number, bottom: number, height: number,
  x: number, y: number, z: number, axis: 'y' | 'z' | 'x' = 'y', segments = 64,
) {
  const mesh = part(parent, new T.CylinderGeometry(top, bottom, height, segments), material, x, y, z);
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  return mesh;
}

export function ring(
  parent: T.Object3D, material: T.Material, radius: number, thickness: number,
  x: number, y: number, z: number,
) {
  return part(parent, new T.TorusGeometry(radius, thickness, 12, 64), material, x, y, z);
}

export function wire(parent: T.Object3D, material: T.Material, points: T.Vector3[], radius: number, segments = 96) {
  return part(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points), segments, radius, 10, false), material);
}

export function canvasTexture(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D unavailable');
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return { context, texture };
}

export function decal(parent: T.Object3D, text: string, color: string, width: number, height: number) {
  const { context, texture } = canvasTexture(512, 128);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.font = '700 72px monospace';
  context.fillText(text, 256, 67, 490);
  return part(parent, new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3,
  }));
}

export function roundedShape(width: number, height: number, radius: number) {
  const x = -width / 2, y = -height / 2;
  const shape = new T.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

export function panelGeometry(width: number, height: number, radius: number) {
  const geometry = new T.ShapeGeometry(roundedShape(width, height, radius), 16);
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, positions.getX(i) / width + .5, positions.getY(i) / height + .5);
  }
  return geometry;
}

export function screw(parent: T.Object3D, metal: T.Material, dark: T.Material, x: number, y: number, z: number, radius: number) {
  cylinder(parent, metal, radius, radius, .014, x, y, z, 'z', 20);
  const cut = box(parent, dark, radius * 1.3, radius * .2, .006, .002, x, y, z + .008);
  cut.rotation.z = x + y + .4;
}
