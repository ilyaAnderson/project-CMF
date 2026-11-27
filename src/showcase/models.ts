import * as T from 'three';
import { ball, box, cylinder, decal, finish, panelGeometry, part, ring, roundedShape, screw, vector, wire } from './geometry';
import { createPhoneDisplay, createWatchDisplay } from './displays';

const ink = finish(0x161316, .45, .25);
const steel = finish(0x9e9893, .25, .86);
const brass = finish(0xe2a362, .32, .74);
const orange = finish(0xee4d24, .37, .07, .36);
const orangeEdge = finish(0xae331c, .35, .12, .34);
const rubber = finish(0x8a271b, .68);
const blackGlass = finish(0x09090b, .15, .35, .6);

function earbud(inEarMonitor = false) {
  const group = new T.Group();
  if (inEarMonitor) {
    cylinder(group, orange, .29, .24, .27, 0, 0, 0, 'z');
    cylinder(group, orangeEdge, .245, .28, .075, 0, 0, .15, 'z');
    ring(group, steel, .20, .01, 0, 0, .192);
    cylinder(group, orange, .12, .15, .14, 0, 0, -.18, 'z');
    ball(group, rubber, .215, .205, .145, 0, 0, -.28);
    cylinder(group, ink, .081, .081, .012, 0, 0, -.411, 'z');
    box(group, orangeEdge, .16, .26, .15, .06, 0, -.24, 0);
  } else {
    ball(group, orange, .31, .29, .225, 0, .17, -.027);
    ball(group, rubber, .192, .17, .135, 0, .155, -.252);
    cylinder(group, ink, .085, .085, .01, 0, .155, -.366, 'z', 28);
    const stem = box(group, orange, .186, .74, .19, .088, .12, -.17, .105);
    stem.rotation.z = .17;
    box(group, orangeEdge, .075, .023, .01, .005, .12, -.06, .203);
    cylinder(group, ink, .023, .023, .008, .166, -.50, .137, 'z', 16);
    for (const x of [.105, .175]) cylinder(group, brass, .018, .018, .02, x, -.41, .01, 'z', 16);
  }
  return group;
}

export function createBuds() {
  const group = new T.Group();
  cylinder(group, orange, 1.16, 1.08, .29, 0, -.17, 0);
  cylinder(group, orangeEdge, 1.13, 1.08, .065, 0, -.31, 0);
  cylinder(group, orange, 1.17, 1.16, .07, 0, -.003, 0);
  cylinder(group, orangeEdge, 1.06, 1.06, .025, 0, .038, 0);
  for (const x of [-.43, .43]) {
    const cradle = new T.Group();
    cradle.position.set(x, .053, -.05);
    cradle.rotation.y = x > 0 ? -.24 : .24;
    cylinder(cradle, rubber, .307, .292, .013, 0, 0, -.235);
    box(cradle, rubber, .216, .014, .514, .006, .045, .001, .117);
    ball(cradle, orangeEdge, .24, .014, .21, 0, .008, -.246);
    for (const offset of [-.042, .042]) cylinder(group, brass, .022, .022, .016, x + offset, .07, .26, 'y', 16);
  }

  box(group, ink, .24, .052, .024, .023, 0, -.19, -1.132);
  box(group, steel, .15, .015, .028, .006, 0, -.19, -1.142);
  const led = new T.MeshBasicMaterial({ color: 0xffdbc4 });
  ball(group, led, .031, .012, .007, 0, -.072, 1.166);
  cylinder(group, orangeEdge, .077, .077, .53, 0, .023, -1.084, 'x');

  const hinge = new T.Group();
  hinge.position.set(0, .032, -1.075);
  group.add(hinge);
  cylinder(hinge, orange, 1.112, 1.162, .21, 0, .112, 1.075);
  cylinder(hinge, orange, 1.061, 1.112, .055, 0, .244, 1.075);
  cylinder(hinge, orangeEdge, 1.052, 1.052, .015, 0, -.002, 1.075);
  const innerLip = ring(hinge, orange, .985, .025, 0, -.013, 1.075);
  innerLip.rotation.x = Math.PI / 2;
  const lidLogo = decal(hinge, 'CMF', '#7e2114', .56, .15);
  lidLogo.rotation.x = -Math.PI / 2;
  lidLogo.position.set(0, .276, .99);

  const buds = [earbud(), earbud()];
  group.add(...buds);

  function pose(open: number, rise: number, orbit: number) {
    hinge.rotation.x = -1.73 * open;
    buds.forEach((bud, i) => {
      const side = i === 0 ? -1 : 1;
      bud.position.set(side * (.43 + rise * .41), .23 + rise * (1.03 + i * .18), -.035 + rise * .13);
      bud.rotation.set(-1.12 + rise * 1.41, side * rise * (.32 + orbit * .27), side * (.18 + rise * .32));
      bud.visible = open > .085;
    });
  }

  return { group, pose };
}

const phoneWidth = 1.78;
const phoneHeight = 3.76;
export const phonePosition = vector(2.37, .39, -1.57);
export const phonePort = vector(phonePosition.x, phonePosition.y, phonePosition.z + phoneHeight / 2);

export function createPhone() {
  const group = new T.Group();
  group.position.copy(phonePosition);
  const darkOrange = finish(0x9f2f1b, .45, .08);
  const back = finish(0xec5c34, .58, .04);
  box(group, darkOrange, phoneWidth, phoneHeight, .177, .081);
  box(group, back, phoneWidth - .013, phoneHeight - .015, .083, .038, 0, 0, -.079);
  box(group, ink, phoneWidth - .025, phoneHeight - .022, .055, .027, 0, 0, .097);
  const screen = new T.MeshBasicMaterial({ map: createPhoneDisplay(), toneMapped: false });
  part(group, panelGeometry(phoneWidth - .114, phoneHeight - .119, .114), screen, 0, 0, .128);

  box(group, ink, .47, .93, .068, .034, .543, 1.238, -.156);
  for (const y of [1.435, 1.055]) {
    cylinder(group, steel, .177, .177, .045, .543, y, -.202, 'z');
    cylinder(group, ink, .146, .146, .033, .543, y, -.23, 'z');
    ball(group, finish(0x22334d, .11, .62, .5), .112, .112, .025, .543, y, -.249);
    ring(group, blackGlass, .098, .008, .543, y, -.270);
  }
  cylinder(group, finish(0xffdab1, .34, .28), .048, .048, .015, .216, 1.43, -.131, 'z', 24);
  for (const x of [-.746, .746]) {
    for (const y of [-1.477, 1.681]) {
      screw(group, steel, ink, x, y, -.13, .037);
      group.children.at(-1)!.rotation.y = Math.PI;
      group.children.at(-2)!.position.z = -.133;
      group.children.at(-1)!.position.z = -.142;
    }
  }
  cylinder(group, darkOrange, .233, .255, .062, .56, -1.51, -.15, 'z');
  cylinder(group, back, .189, .205, .028, .56, -1.51, -.199, 'z');
  const logo = decal(group, 'CMF', '#652211', .39, .125);
  logo.position.set(-.52, -1.48, -.127);
  logo.rotation.y = Math.PI;

  box(group, back, .042, .39, .064, .017, .895, .78, .028);
  box(group, back, .042, .27, .064, .017, -.895, .86, .028);
  box(group, back, .042, .27, .064, .017, -.895, .49, .028);
  box(group, steel, .34, .024, .108, .011, 0, -1.873, 0);
  box(group, ink, .297, .027, .077, .012, 0, -1.888, 0);
  box(group, steel, .166, .033, .022, .007, 0, -1.890, 0);
  for (let i = 0; i < 6; i++) {
    const hole = cylinder(group, ink, .017, .017, .016, .38 + i * .064, -1.882, 0, 'y', 12);
    hole.position.z = .013;
  }

  return group;
}

export function createCable() {
  const group = new T.Group();
  const cableMaterial = finish(0xe44924, .34, .04, .26);
  const shell = finish(0x222020, .32, .35);
  const path = new T.CatmullRomCurve3([
    vector(-4.15, .22, 4.6), vector(-3.75, .13, 3.28), vector(-2.72, .17, 1.68),
    vector(-1.20, .35, .47), vector(.28, .70, .64), vector(.70, .92, 2.02),
    vector(1.43, .66, 3.25), vector(2.23, .43, 3.02), vector(phonePort.x, phonePort.y, 2.14),
  ]);
  part(group, new T.TubeGeometry(path, 188, .041, 12, false), cableMaterial);
  const split = box(group, shell, .157, .106, .35, .045, -4.18, .22, 4.59);
  split.rotation.y = -.32;
  for (const side of [-1, 1]) {
    const position = vector(-4.53 + side * .60, .60 + side * .19, 5.18 + side * .26);
    const bud = earbud(true);
    bud.position.copy(position);
    bud.rotation.set(-.55, side * .67, side * .55);
    group.add(bud);
    const base = vector(0, -.31, 0).applyEuler(bud.rotation).add(position);
    wire(group, cableMaterial, [
      base, base.clone().add(vector(-side * .15, -.2, .21)), vector(-4.52 + side * .38, .21, 4.88), path.getPoint(0),
    ], .028, 38);
  }
  const remote = new T.Group();
  remote.position.copy(path.getPointAt(.17));
  remote.quaternion.setFromUnitVectors(vector(0, 0, 1), path.getTangentAt(.17));
  group.add(remote);
  box(remote, shell, .153, .11, .60, .05);
  box(remote, cableMaterial, .098, .023, .14, .011, 0, .061, .04);
  cylinder(remote, ink, .014, .014, .009, 0, .058, -.122, 'y', 12);

  const tail = wire(group, cableMaterial, [
    vector(phonePort.x, phonePort.y, 0), vector(phonePort.x, phonePort.y, -.33), vector(phonePort.x, phonePort.y, -.68),
    vector(phonePort.x, phonePort.y, -1),
  ], .041, 22);
  tail.position.z = 2.14;
  const plug = new T.Group();
  group.add(plug);
  box(plug, shell, .433, .176, .48, .069, 0, 0, .23);
  box(plug, orange, .427, .169, .122, .052, 0, 0, .069);
  box(plug, steel, .286, .075, .24, .034, 0, 0, -.111);
  box(plug, ink, .197, .040, .015, .007, 0, 0, -.232);
  for (let i = 0; i < 4; i++) {
    box(plug, brass, .016, .015, .012, .003, -.068 + i * .044, 0, -.244);
  }
  for (let i = 0; i < 5; i++) {
    box(plug, shell, .145 - i * .010, .125 - i * .008, .037, .016, 0, 0, .48 + i * .036);
  }

  function pose(insertion: number) {
    plug.position.set(phonePort.x, phonePort.y, phonePort.z + .83 - insertion * .806);
    tail.scale.z = 2.14 - (plug.position.z + .61);
  }

  return { group, path, pose };
}

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
    depth: .35, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .047, bevelThickness: .062, curveSegments: 16,
  }), material);
  mesh.position.z = -.19;
  if (mirrored) mesh.scale.x = -1;
  return mesh;
}

function createCircuit() {
  const group = new T.Group();
  const pcb = finish(0x273730, .57, .28);
  const traces = finish(0x9b6c38, .44, .7);
  const board = roundedShape(2.46, 2.83, .33);
  part(group, new T.ExtrudeGeometry(board, { depth: .058, bevelEnabled: false }), pcb, 0, 0, -.065);
  for (const x of [-1.02, 1.02]) {
    for (const y of [-1.16, 1.16]) screw(group, brass, ink, x, y, .014, .078);
  }
  const chips = [
    { x: -.32, y: .31, w: .81, h: .83, text: 'CPU' },
    { x: .57, y: -.51, w: .64, h: .52, text: 'FLASH' },
    { x: .59, y: .63, w: .54, h: .49, text: 'RF' },
  ];
  const lanes: T.Vector3[][] = [];
  chips.forEach(({ x, y, w, h, text }, row) => {
    box(group, brass, w + .086, h + .086, .035, .014, x, y, .025);
    box(group, ink, w, h, .088, .025, x, y, .078);
    box(group, row === 0 ? steel : blackGlass, w - .12, h - .12, .024, .01, x, y, .119);
    const label = decal(group, text, row === 0 ? '#282022' : '#f6b579', w * .72, .13);
    label.position.set(x, y, .138);
    for (let i = 0; i < 7; i++) {
      const pinY = y + h * (i / 7 - .42);
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
  lanes.forEach(points => {
    const curve = new T.CurvePath<T.Vector3>();
    for (let i = 1; i < points.length; i++) curve.add(new T.LineCurve3(points[i - 1], points[i]));
    part(group, new T.TubeGeometry(curve, 7, .009, 5, false), traces);
    const last = points.at(-1)!;
    cylinder(group, brass, .014, .014, .010, last.x, last.y, last.z, 'z', 10);
  });
  for (let i = 0; i < 12; i++) {
    const x = -.8 + i * .14;
    box(group, brass, .085, .035, .016, .006, x, 1.025, .013);
    box(group, ink, .059, .095, .039, .006, x, 1.092, .021);
  }
  return group;
}

function strap(parent: T.Object3D, direction: number) {
  const strapMaterial = finish(0xd54b2e, .67, .02);
  const shape = roundedShape(1.88, 2.53, .23);
  if (direction < 0) {
    for (let i = 0; i < 5; i++) {
      const hole = new T.Path();
      hole.absellipse(0, -.93 + i * .255, .087, .054, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  }
  const geometry = new T.ExtrudeGeometry(shape, {
    depth: .095, bevelEnabled: true, bevelSegments: 3, bevelThickness: .031, bevelSize: .033, curveSegments: 12,
  });
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i) + 1.265;
    positions.setX(i, positions.getX(i) * (1 - y * .085));
    positions.setY(i, direction * (1.47 + y * .79));
    positions.setZ(i, positions.getZ(i) - y * y * .25 - .22);
  }
  if (direction < 0) {
    const indices = [...Array(positions.count).keys()];
    for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    geometry.setIndex(indices);
  }
  geometry.computeVertexNormals();
  part(parent, geometry, strapMaterial);
  if (direction > 0) {
    const buckle = new T.Group();
    buckle.position.set(0, 3.36, -1.49);
    buckle.rotation.x = -.88;
    parent.add(buckle);
    for (const x of [-.71, .71]) box(buckle, steel, .131, .44, .13, .06, x);
    for (const y of [-.19, .19]) box(buckle, steel, 1.52, .13, .13, .062, 0, y);
    box(buckle, steel, .076, .46, .057, .028, 0, .055, .021);
  }
}

export function createWatch() {
  const group = new T.Group();
  const rim = finish(0x9e9186, .29, .79, .28);
  const body = finish(0x2b2423, .54, .42);
  const right = new T.Group();
  const left = new T.Group();
  right.add(bezelHalf(rim, false));
  left.add(bezelHalf(rim, true));
  group.add(right, left);
  const button = box(right, rim, .157, .47, .161, .069, 1.51, .44, -.035);
  box(right, body, .027, .185, .105, .012, 1.52, -.04, -.055);
  for (let i = 0; i < 4; i++) cylinder(left, ink, .034, .034, .017, -1.52, -.14 + i * .13, -.01, 'x', 12);

  const back = new T.Group();
  box(back, body, 2.81, 3.28, .15, .075, 0, 0, -.33);
  cylinder(back, blackGlass, .53, .59, .095, 0, 0, -.443, 'z');
  for (const y of [-.13, .14]) cylinder(back, finish(0x1b7364, .18, .51), .082, .082, .021, 0, y, -.502, 'z', 28);
  for (const x of [-.18, .18]) cylinder(back, brass, .045, .045, .018, x, -.74, -.425, 'z', 16);
  group.add(back);

  const band = new T.Group();
  strap(band, 1);
  strap(band, -1);
  group.add(band);

  const board = createCircuit();
  group.add(board);
  const battery = new T.Group();
  box(battery, steel, 1.91, 1.86, .104, .048, 0, -.01, -.22);
  box(battery, ink, 1.75, 1.70, .022, .01, 0, -.012, -.281);
  group.add(battery);

  const display = createWatchDisplay();
  const face = new T.Group();
  box(face, blackGlass, 2.57, 2.99, .088, .041, 0, 0, .192);
  part(face, panelGeometry(2.39, 2.78, .242), new T.MeshBasicMaterial({ map: display.texture, toneMapped: false }), 0, 0, .243);
  const shine = new T.MeshPhysicalMaterial({
    color: 0xcaa493, roughness: .15, metalness: .6, transparent: true, opacity: .065, depthWrite: false,
  });
  part(face, panelGeometry(2.44, 2.82, .245), shine, 0, 0, .250);
  group.add(face);

  function pose(close: number, entry: number, press: number) {
    const spread = (1 - entry) * 1.92 + (1 - close) * .19;
    left.position.x = -spread;
    right.position.x = spread;
    board.position.z = (1 - close) * .23;
    battery.position.z = (1 - close) * -.29;
    back.position.z = (1 - close) * -.39;
    band.position.z = (1 - close) * -.44;
    face.position.set(0, (1 - close) * 3.75, (1 - close) * .88);
    face.rotation.x = (1 - close) * .18;
    face.visible = close > .16;
    button.position.x = 1.51 - press * .080;
  }

  return { group, pose, setDisplay: display.draw };
}
