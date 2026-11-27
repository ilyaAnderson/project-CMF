import * as T from 'three';
import { ball, box, cylinder, extrusion, finish, panelGeometry, part, ring, roundedShape, vector, wire } from './geometry';
import { grained, radialBrush } from './materials';

const polymer = grained({ color: 0xda401a, roughness: .43, metalness: .04, clearcoat: .23, clearcoatRoughness: .29 }, 125, .17);
const shell = grained({ color: 0xc52d13, roughness: .51, metalness: .02, clearcoat: .14 }, 124, .16);
const soft = grained({ color: 0xa02e19, roughness: .68, metalness: 0 }, 170, .21);
const seal = finish(0x602411, .57, .02);
const dark = finish(0x141317, .39, .48);
const silver = grained({ color: 0xb5b6ba, roughness: .28, metalness: .87, anisotropy: .49 }, 195, .15, 7);
const gold = finish(0xba9056, .3, .78);

function tip(parent: T.Group, z: number) {
  const profile = [[.092,0], [.130,.018], [.163,.068], [.166,.110], [.147,.161], [.110,.191], [.070,.191], [.065,.170]];
  const shape = new T.LatheGeometry(profile.map(([x, y]) => new T.Vector2(x, y)), 64);
  const nozzle = part(parent, shape, soft, 0, .072, z);
  nozzle.rotation.x = -Math.PI / 2;
  cylinder(parent, dark, .066, .066, .008, 0, .072, z - .168, 'z', 32);
  const grain = finish(0x271817, .54, .22);
  for (let row = -2; row <= 2; row++) for (let col = -2; col <= 2; col++) {
    if (col * col + row * row > 7) continue;
    cylinder(parent, grain, .005, .005, .003, col * .018, .072 + row * .018, z - .173, 'z', 8);
  }
}

function stemBud(side: number) {
  const bud = new T.Group();
  const housing = ball(bud, polymer, .261, .245, .222, -.044 * side, .161, -.039);
  housing.rotation.x = -.24;
  tip(bud, -.197);
  const x = .103 * side;
  const stem = box(bud, polymer, .202, .694, .182, .085, x, -.118, .107);
  stem.rotation.z = -.041 * side;
  extrusion(bud, shell, roundedShape(.153, .618, .072), .026, .008, x, -.115, .197);
  cylinder(bud, polymer, .047, .047, .010, x, .110, .217, 'z', 36);
  cylinder(bud, dark, .018, .018, .011, x, -.369, .206, 'z', 16);
  for (const y of [-.26, -.327]) cylinder(bud, gold, .019, .019, .010, x, y, .011, 'z', 24);
  return bud;
}

export function createBuds() {
  const group = new T.Group();
  const hero = new T.Group();
  group.add(hero);
  const footprint = roundedShape(2.35, 2.35, .39);
  const foot = extrusion(hero, shell, footprint, .434, .071, 0, -.207, 0);
  foot.rotation.x = -Math.PI / 2;
  const seam = extrusion(hero, seal, footprint, .031, .009, 0, .006, 0);
  seam.rotation.x = -Math.PI / 2;
  const tray = extrusion(hero, polymer, roundedShape(2.28, 2.29, .38), .078, .032, 0, .055, 0);
  tray.rotation.x = -Math.PI / 2;
  for (const side of [-1, 1]) {
    const cradle = new T.Group();
    cradle.position.set(side * .43 + .09, .103, .15);
    cradle.rotation.y = side * .27;
    hero.add(cradle);
    ball(cradle, seal, .271, .030, .225, 0, 0, -.262);
    box(cradle, seal, .194, .022, .58, .01, side * .048, 0, .060);
    for (const z of [.15, .224]) cylinder(cradle, gold, .023, .023, .020, side * .048, .017, z, 'y', 24);
  }
  const led = new T.MeshBasicMaterial({ color: 0xffcf9b, toneMapped: false });
  ball(hero, led, .025, .013, .006, 0, -.105, 1.233);
  box(hero, dark, .27, .069, .045, .022, .14, -.16, -1.219);
  box(hero, silver, .15, .024, .05, .011, .14, -.16, -1.241);
  cylinder(hero, shell, .069, .069, 1.36, .19, .004, -1.106, 'x');

  const hinge = new T.Group();
  hinge.position.set(0, .07, -1.10);
  hero.add(hinge);
  const lid = extrusion(hinge, polymer, footprint, .226, .069, 0, .137, 1.10);
  lid.rotation.x = -Math.PI / 2;
  const inner = extrusion(hinge, shell, roundedShape(2.18, 2.18, .334), .038, .012, 0, .042, 1.10);
  inner.rotation.x = Math.PI / 2;
  const dial = new T.Group();
  dial.position.set(-.731, .249, .426);
  hinge.add(dial);
  cylinder(dial, dark, .422, .416, .098, 0, .010, 0, 'y', 96);
  cylinder(dial, silver, .400, .419, .084, 0, .066, 0, 'y', 96);
  const brush = radialBrush();
  const disc = part(dial, new T.CircleGeometry(.391, 96), new T.MeshPhysicalMaterial({
    color: 0xa6a7aa, metalness: .86, roughness: .31, roughnessMap: brush, bumpMap: brush, bumpScale: .003,
  }), 0, .111, 0);
  disc.rotation.x = -Math.PI / 2;
  const lip = ring(dial, silver, .395, .008, 0, .110, 0);
  lip.rotation.x = -Math.PI / 2;
  const insignia = new T.Group();
  insignia.position.set(.48, .254, 1.907);
  insignia.rotation.x = -Math.PI / 2;
  hinge.add(insignia);
  ring(insignia, shell, .093, .010, -.258, 0, 0);
  cylinder(insignia, shell, .095, .095, .005, .252, 0, .002, 'z', 48);
  for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) {
    cylinder(insignia, shell, .014, .014, .005, (x - 1.5) * .044, (y - 1.5) * .044, .002, 'z', 12);
  }

  const buds = [stemBud(-1), stemBud(1)];
  group.add(...buds);

  function pose(open: number, flight: number, macro: number, turn: number) {
    hinge.rotation.x = -1.79 * open;
    dial.rotation.y = turn * 1.75;
    hero.position.y = -macro * 2.8;
    hero.visible = macro < .93;
    buds.forEach((bud, i) => {
      const side = i === 0 ? -1 : 1;
      bud.position.set(side * (.43 + flight * .55 + macro * .37), .29 + flight * (1.03 - side * .23) + macro * .15, .11 + side * flight * .33);
      bud.rotation.set(-1.34 + flight * 1.62 - macro * .34, side * (.20 + flight * .99 + turn * .52), side * (.11 + flight * .34 - macro * .30));
      bud.visible = open > .10 || flight > .05;
    });
  }
  return { group, pose };
}

function neckBud() {
  const bud = new T.Group();
  ball(bud, polymer, .265, .235, .177, 0, .067, -.054);
  cylinder(bud, shell, .173, .182, .152, 0, .068, .082, 'z', 76);
  cylinder(bud, polymer, .134, .167, .054, 0, .068, .169, 'z', 76);
  ring(bud, shell, .086, .009, 0, .068, .198);
  tip(bud, -.185);
  box(bud, shell, .135, .243, .126, .061, -.018, -.172, .001);
  return bud;
}

export const portX = 27.65;
export const portY = .52;

function plugModel() {
  const plug = new T.Group();
  box(plug, dark, .463, .180, .42, .078, 0, 0, .20);
  box(plug, shell, .452, .173, .077, .037, 0, 0, .069);
  box(plug, silver, .292, .078, .232, .036, 0, 0, -.107);
  box(plug, dark, .218, .046, .016, .007, 0, 0, -.225);
  for (let i = 0; i < 5; i++) box(plug, dark, .147 - i * .010, .112, .047, .020, 0, 0, .42 + i * .034);
  plug.rotation.y = -Math.PI / 2;
  return plug;
}

export function createNeckband() {
  const group = new T.Group();
  const regularCable = grained({ color: 0xbe2e1a, roughness: .54, clearcoat: .22, clearcoatRoughness: .36 }, 190, .23);
  const chargeCable = grained({ color: 0x84817e, roughness: .68, metalness: .10 }, 165, .18, 3);
  const moduleX = 22;
  const cableY = (x: number, side: number) => side * (.55 + .47 * Math.sin(x * .82)) + .18 * Math.sin(x * .40);
  const cableZ = (x: number, side: number) => side * (.45 + .31 * Math.sin(x * .69 + .8));
  const getPoint = (x: number, side: number) => vector(x, cableY(x, side), cableZ(x, side));

  for (const side of [-1, 1]) {
    const start = getPoint(0, side);
    const bud = neckBud();
    group.add(bud);
    bud.position.copy(start).add(vector(-.69, .13, .09));
    bud.rotation.set(side * .20, side * .61, Math.PI * .52);
    const anchor = vector(-.018, -.28, .001).applyEuler(bud.rotation).add(bud.position);
    const wavePoints = [anchor, start];
    for (let x = .32; x < 21; x += .38) wavePoints.push(getPoint(x, side));
    const moduleY = side * .48 + .10;
    wavePoints.push(vector(21.23, moduleY, side * .49));
    wire(group, regularCable, wavePoints, .039, 280);
    const module = new T.Group();
    module.position.set(moduleX, moduleY, side * .49);
    group.add(module);
    box(module, polymer, 1.59, .235, .344, .113);
    box(module, shell, 1.47, .045, .320, .020, 0, -.093, 0);
    cylinder(module, shell, .053, .071, .184, -.81, 0, 0, 'x', 30);
    if (side === 1) {
      cylinder(module, dark, .161, .161, .039, -.37, .130, 0, 'y', 48);
      cylinder(module, silver, .146, .155, .041, -.37, .163, 0, 'y', 64);
      box(module, dark, .204, .085, .045, .017, .36, 0, .17);
      box(module, silver, .145, .037, .045, .012, .36, 0, .184);
    } else {
      cylinder(module, dark, .024, .024, .014, -.35, .113, .03, 'y', 24);
    }
  }
  wire(group, regularCable, [
    vector(22.72, -.38, -.49), vector(23.51, -.62, -.53), vector(24.69, -.58, -.91),
    vector(25.22, -.30, -1.66), vector(24.64, .38, -2.11), vector(23.55, .69, -1.45), vector(22.71, .58, .49),
  ], .076, 106);

  const tailEnd = portX - 1.70;
  wire(group, chargeCable, [
    vector(22.35, .581, .69), vector(22.39, .58, .91), vector(22.92, .23, 1.36),
    vector(23.62, -.06, 1.23), vector(24.7, .10, .72), vector(25.22, .47, .18), vector(tailEnd, portY, 0),
  ], .049, 112);
  const assembly = new T.Group();
  group.add(assembly);
  const tail = wire(assembly, chargeCable, [vector(0, portY, 0), vector(.5, portY, 0), vector(1, portY, 0)], .048, 24);
  tail.position.x = tailEnd;
  const plug = plugModel();
  assembly.add(plug);

  function pose(insert: number) {
    plug.position.set(portX - .90 + .862 * insert, portY, 0);
    tail.scale.x = plug.position.x - .57 - tailEnd;
  }
  return { group, pose };
}
