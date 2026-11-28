import * as T from 'three';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, cylinder, decal, extrusion, finish, panelGeometry, part, roundedShape, screw, vector } from './geometry';
import { grained } from './materials';
import { createWatchDisplay } from './displays';

const ink = grained({ color: 0x17171b, roughness: .52, metalness: .26 }, 140, .15);
const steel = finish(0x777f83, .29, .82);
const brass = finish(0xc99351, .37, .75);
const blackGlass = finish(0x09090a, .14, .39, .75);

function bezelHalf(material: T.Material, mirrored: boolean) {
  const shape = new T.Shape();
  shape.moveTo(0, 1.70);
  shape.lineTo(1.10, 1.70);
  shape.quadraticCurveTo(1.47, 1.70, 1.47, 1.33);
  shape.lineTo(1.47, -1.33);
  shape.quadraticCurveTo(1.47, -1.70, 1.10, -1.70);
  shape.lineTo(0, -1.70);
  shape.lineTo(0, -1.46);
  shape.lineTo(1.02, -1.46);
  shape.quadraticCurveTo(1.25, -1.46, 1.25, -1.22);
  shape.lineTo(1.25, 1.22);
  shape.quadraticCurveTo(1.25, 1.46, 1.02, 1.46);
  shape.lineTo(0, 1.46);
  shape.closePath();
  const mesh = new T.Mesh(new T.ExtrudeGeometry(shape, {
    depth: .49, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .047, bevelThickness: .062, curveSegments: 16,
  }), material);
  mesh.position.z = -.260;
  if (mirrored) mesh.scale.x = -1;
  return mesh;
}

function createCircuit() {
  const group = new T.Group();
  const pcb = grained({ color: 0x214635, roughness: .72, metalness: .05, clearcoat: .05 }, 145, .20);
  const traces = grained({ color: 0xaf7838, roughness: .37, metalness: .83 }, 143, .20, 3);
  const board = roundedShape(2.46, 2.83, .33);
  part(group, new T.ExtrudeGeometry(board, { depth: .058, bevelEnabled: false }), pcb, 0, 0, -.065);
  for (const x of [-1.02, 1.02]) {
    for (const y of [-1.16, 1.16]) screw(group, brass, ink, x, y, .014, .078);
  }
  const chips = [
    { x: -.49, y: -.02, w: .69, h: .72, text: 'CPU' },
    { x: .58, y: -.57, w: .57, h: .44, text: 'FLASH' },
    { x: .40, y: .66, w: .70, h: .48, text: 'RF' },
  ];
  const lanes: T.Vector3[][] = [];
  chips.forEach(({ x, y, w, h, text }, row) => {
    box(group, brass, w + .086, h + .086, .035, .014, x, y, .025);
    box(group, ink, w, h, .107, .023, x, y, .096);
    box(group, row === 0 ? steel : blackGlass, w - .079, h - .083, .022, .009, x, y, .155);
    const label = decal(group, text, row === 0 ? '#282022' : '#f6b579', w * .67, .11);
    label.position.set(x, y, .168);
    for (let i = 0; i < 10; i++) {
      const pinY = y + h * (i / 10 - .44);
      for (const sign of [-1, 1]) {
        box(group, brass, .103, .023, .023, .006, x + sign * (w / 2 + .03), pinY, .042);
        const tip = x + sign * (w / 2 + .068), next = tip + sign * (.075 + i * .009);
        const endY = pinY + (i - 3) * .034;
        lanes.push([vector(tip, pinY, .008), vector(next, pinY, .008), vector(next + sign * .067, endY, .008)]);
      }
    }
  });
  for (let i = 0; i < 12; i++) {
    const x = -.92 + i * .16;
    box(group, i % 3 === 1 ? steel : ink, .102, .15, .043, .011, x, -.94, .024);
    box(group, brass, .080, .030, .018, .005, x, -1.016, .035);
    lanes.push([vector(x, -1.045, .008), vector(x, -1.146, .008), vector(x * .90, -1.23, .008)]);
  }
  const trackGeometry: T.BufferGeometry[] = [];
  lanes.forEach(points => {
    const curve = new T.CurvePath<T.Vector3>();
    for (let i = 1; i < points.length; i++) curve.add(new T.LineCurve3(points[i - 1], points[i]));
    trackGeometry.push(new T.TubeGeometry(curve, 8, .006, 5, false));
    const last = points.at(-1)!;
    cylinder(group, brass, .014, .014, .010, last.x, last.y, last.z, 'z', 10);
  });
  for (let i = 0; i < 12; i++) {
    const x = -.8 + i * .14;
    box(group, brass, .085, .035, .016, .006, x, 1.025, .013);
    box(group, ink, .059, .095, .039, .006, x, 1.092, .021);
  }
  for (let i = 0; i < 10; i++) {
    const x = -.94 + i * .091;
    const end = new T.CatmullRomCurve3([
      vector(x, .41, .005), vector(x, .55 + i * .018, .006),
      vector(x * .65 - .1, .91 - i * .009, .006), vector(x * .67, 1.16, .007),
    ]);
    trackGeometry.push(new T.TubeGeometry(end, 18, .005, 5, false));
  }
  part(group, mergeGeometries(trackGeometry), traces);
  trackGeometry.forEach(geometry => geometry.dispose());

  const smd = new T.InstancedMesh(new T.BoxGeometry(.042, .066, .029), steel, 94);
  const show = new T.Object3D();
  for (let i = 0; i < 94; i++) {
    const section = Math.floor(i / 24);
    const along = i % 24;
    show.position.set(section % 2 === 0 ? .97 + Math.sin(along) * .085 : -.99 + Math.sin(along) * .07, -.99 + along * .085, .022 + section * .014);
    show.rotation.z = along % 3 === 0 ? Math.PI / 2 : 0;
    show.updateMatrix();
    smd.setMatrixAt(i, show.matrix);
    smd.setColorAt(i, new T.Color(i % 4 ? 0x6d6555 : 0xcba875));
  }
  group.add(smd);
  return group;
}

function strap(parent: T.Object3D, direction: number) {
  const strapMaterial = grained({ color: 0xf4451b, roughness: .63, metalness: .02, clearcoat: .10 }, 180, .20);
  const shape = roundedShape(1.91, 5.35, .12);
  if (direction < 0) {
    for (let i = 0; i < 8; i++) {
      const hole = new T.Path();
      hole.absellipse(0, -1.87 + i * .39, .11, .058, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  }
  const flat = new T.ExtrudeGeometry(shape, {
    depth: .095, bevelEnabled: true, bevelSegments: 3, bevelThickness: .031, bevelSize: .033, curveSegments: 12,
  });
  const geometry = new TessellateModifier(.135, 8).modify(flat);
  if (geometry !== flat) flat.dispose();
  const positions = geometry.getAttribute('position');
  const profile = new T.CatmullRomCurve3([
    vector(0, 1.59, -.22), vector(0, 2.11, -.28), vector(0, 2.43, -.70),
    vector(0, 2.32, -1.35), vector(0, 1.87, -1.97), vector(0, 1.15, -2.34),
    vector(0, .52, -2.50), vector(0, .01, -2.53),
  ]);
  const center = new T.Vector3();
  const normal = new T.Vector3();
  for (let i = 0; i < positions.count; i++) {
    const t = T.MathUtils.clamp((positions.getY(i) + 2.675) / 5.35, 0, 1);
    const thickness = positions.getZ(i) - .048;
    profile.getPoint(t, center);
    profile.getTangent(t, normal);
    positions.setX(i, positions.getX(i) * (1 - t * .14));
    positions.setY(i, direction * (center.y - normal.z * thickness));
    positions.setZ(i, center.z + normal.y * thickness);
  }
  if (direction > 0) {
    const indices = [...Array(positions.count).keys()];
    for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    geometry.setIndex(indices);
  }
  geometry.deleteAttribute('normal');
  geometry.deleteAttribute('uv');
  const smoothGeometry = mergeVertices(geometry, 0.00001);
  geometry.dispose();
  smoothGeometry.computeVertexNormals();
  part(parent, smoothGeometry, strapMaterial);
  if (direction > 0) {
    const buckle = new T.Group();
    buckle.position.set(0, .11, -2.55);
    buckle.rotation.x = .55;
    parent.add(buckle);
    for (const x of [-.71, .71]) box(buckle, steel, .131, .44, .13, .06, x);
    for (const y of [-.19, .19]) box(buckle, steel, 1.52, .13, .13, .062, 0, y);
    box(buckle, steel, .076, .46, .057, .028, 0, .055, .021);
  }
}

export function createWatch() {
  const group = new T.Group();
  const rim = grained({ color: 0x818389, roughness: .38, metalness: .83, clearcoat: .27 }, 160, .14);
  const body = grained({ color: 0x222327, roughness: .52, metalness: .39 }, 160, .18);
  const right = new T.Group();
  const left = new T.Group();
  right.add(bezelHalf(rim, false));
  left.add(bezelHalf(rim, true));
  group.add(right, left);
  cylinder(right, ink, .206, .206, .042, 1.519, .39, -.023, 'x', 64);
  const button = cylinder(right, rim, .176, .186, .103, 1.554, .39, -.023, 'x', 64);
  cylinder(button, rim, .170, .170, .024, 0, .056, 0, 'y', 64);
  for (let i = 0; i < 6; i++) cylinder(right, ink, .033, .033, .025, 1.525, -.09 - i * .11, -.029, 'x', 20);

  const back = new T.Group();
  extrusion(back, body, roundedShape(2.81, 3.28, .322), .18, .05, 0, 0, -.31);
  cylinder(back, blackGlass, .53, .59, .095, 0, 0, -.443, 'z');
  for (const y of [-.13, .14]) cylinder(back, finish(0x1b7364, .18, .51), .082, .082, .021, 0, y, -.502, 'z', 28);
  for (const x of [-.18, .18]) cylinder(back, brass, .045, .045, .018, x, -.74, -.425, 'z', 16);
  back.position.z = -.19;
  group.add(back);

  const band = new T.Group();
  strap(band, 1);
  strap(band, -1);
  group.add(band);

  const board = createCircuit();
  board.position.z = -.251;
  group.add(board);
  const battery = new T.Group();
  box(battery, steel, 1.91, 1.86, .104, .048, 0, -.01, -.22);
  box(battery, ink, 1.75, 1.70, .022, .01, 0, -.012, -.281);
  battery.position.z = -.115;
  group.add(battery);

  const display = createWatchDisplay();
  const face = new T.Group();
  extrusion(face, blackGlass, roundedShape(2.862, 3.323, .38), .077, .033, 0, 0, .288);
  part(face, panelGeometry(2.73, 3.19, .33), new T.MeshBasicMaterial({ map: display.texture, toneMapped: false }), 0, 0, .328);
  const shine = new T.MeshPhysicalMaterial({
    color: 0x8e99ab, roughness: .14, metalness: .7, clearcoat: .60, transparent: true, opacity: .113, depthWrite: false,
  });
  part(face, panelGeometry(2.84, 3.31, .365), shine, 0, 0, .333);
  group.add(face);

  function pose(close: number, entry: number, press: number) {
    const gap = (1 - entry) * 2.78;
    left.position.x = -gap;
    right.position.x = gap;
    const sleeve = Math.sin(entry * Math.PI) * 4.10;
    const depth = (1 - close) * 2.85;
    left.position.z = -depth * .18 + sleeve * .067;
    right.position.z = left.position.z;
    left.scale.z = 1 + sleeve + depth;
    right.scale.z = left.scale.z;
    board.position.z = -.251 - depth * .43;
    battery.position.z = -.385 - depth * .48;
    face.visible = close > .98;
    band.visible = close > .72;
    back.visible = close > .72;
    board.visible = close < .98;
    battery.visible = close < .98;
    button.position.x = 1.554 - press * .101;
  }

  return { group, pose, setDisplay: display.draw };
}
