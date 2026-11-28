import * as T from 'three';
import { ball, box, cylinder, extrusion, finish, part, ring, roundedShape, vector, wire } from './geometry';
import { grained, radialBrush } from './materials';

const polymer = grained({ color: 0xf7491b, roughness: .43, metalness: .04, clearcoat: .23, clearcoatRoughness: .29 }, 125, .17);
const shell = grained({ color: 0xcf3113, roughness: .51, metalness: .02, clearcoat: .14 }, 124, .16);
const soft = grained({ color: 0xd13d22, roughness: .68, metalness: 0 }, 170, .21);
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
  const nozzle = new T.Group();
  nozzle.name = 'Nozzle';
  tip(nozzle, -.197);
  bud.add(nozzle);
  const x = .103 * side;
  const stem = box(bud, polymer, .202, .694, .182, .085, x, -.118, .107);
  stem.rotation.z = -.041 * side;
  extrusion(bud, shell, roundedShape(.153, .618, .072), .026, .008, x, -.115, .197);
  cylinder(bud, polymer, .047, .047, .010, x, .110, .217, 'z', 36);
  cylinder(bud, dark, .018, .018, .011, x, -.369, .206, 'z', 16);
  for (const y of [-.26, -.327]) cylinder(bud, gold, .019, .019, .010, x, y, .011, 'z', 24);
  return bud;
}

export function createBuds(model: T.Group) {
  const caseRig = new T.Group();
  caseRig.add(model);
  const hinge = model.getObjectByName('LidHinge');
  const dial = model.getObjectByName('SmartDial');
  if (!hinge || !dial) throw new Error('Buds Pro 2 model is missing its articulation');

  const orangeFinishes = new Map<T.MeshStandardMaterial, T.MeshPhysicalMaterial>();
  model.traverse(object => {
    if (!(object instanceof T.Mesh) || !(object.material instanceof T.MeshStandardMaterial)) return;
    const material = object.material;
    if (!material.name.includes('satin polymer') && !material.name.includes('inner tray')) return;
    if (!orangeFinishes.has(material)) orangeFinishes.set(material, grained({
      color: material.color.clone(), roughness: material.roughness, metalness: material.metalness,
      clearcoat: .17, clearcoatRoughness: .28,
    }, 140, .115));
    object.material = orangeFinishes.get(material);
  });
  orangeFinishes.forEach((_, source) => source.dispose());

  const brushedFace = part(dial, new T.CircleGeometry(.388, 100), new T.MeshBasicMaterial({
    map: radialBrush(), toneMapped: false,
  }), 0, .065, 0);
  brushedFace.rotation.x = -Math.PI / 2;

  const release = [stemBud(1), stemBud(-1)];
  caseRig.add(...release);
  const explode = new T.Group();
  const solid = stemBud(1);
  solid.rotation.set(-.1, 1.38, -.12);
  explode.add(solid);
  const anatomy = new T.Group();
  explode.add(anatomy);

  const cap = new T.Group();
  tip(cap, 0);
  cap.rotation.y = Math.PI / 2;
  anatomy.add(cap);
  const chamber = new T.Group();
  anatomy.add(chamber);
  cylinder(chamber, shell, .178, .165, .107, 0, .072, 0, 'x');
  cylinder(chamber, dark, .141, .133, .077, -.031, .072, 0, 'x');
  const woofer = new T.Group();
  const tweeter = new T.Group();
  anatomy.add(woofer, tweeter);
  function speaker(mount: T.Group, radius: number) {
    cylinder(mount, silver, radius, radius, .067, 0, .072, 0, 'x');
    cylinder(mount, dark, radius * .88, radius * .88, .072, -.014, .072, 0, 'x');
    ball(mount, silver, .026, radius * .49, radius * .49, -.049, .072, 0);
    const suspension = ring(mount, silver, radius * .90, .007, -.051, .072, 0);
    suspension.rotation.y = Math.PI / 2;
  }
  speaker(woofer, .147);
  speaker(tweeter, .092);

  const housingRim = ring(anatomy, shell, .158, .019, -.177, .087, .002);
  housingRim.rotation.y = Math.PI / 2;
  const socket = cylinder(anatomy, dark, .146, .145, .028, -.172, .087, .002, 'x');
  const companion = new T.Group();
  explode.add(companion);
  companion.position.set(.82, .77, -.58);
  companion.scale.setScalar(.75);
  companion.rotation.set(.1, -.6, .27);
  const other = stemBud(-1);
  companion.add(other);
  const outline = new T.Group();
  const outlineMaterial = new T.LineBasicMaterial({ color: 0xc48d7e, transparent: true, opacity: 0 });
  function outlineLoop(points: T.Vector3[]) {
    outline.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(points), outlineMaterial));
  }
  outlineLoop(Array.from({ length: 64 }, (_, index) => {
    const a = index / 64 * Math.PI * 2;
    return vector(Math.cos(a) * .265, .157 + Math.sin(a) * .235, .02);
  }));
  outlineLoop(roundedShape(.21, .70, .10).getPoints(14).map(point => vector(point.x - .10, point.y - .117, .18)));
  companion.add(outline);

  function pose(open: number, flight: number, separation: number, dialTurn: number) {
    hinge!.rotation.x = -1.76 * open;
    dial!.rotation.y = dialTurn;
    release.forEach((bud, index) => {
      const side = index === 0 ? -1 : 1;
      bud.position.set(side * (.48 + flight * .24), .183 + flight * (1.62 + .12 * side), -side * (.32 - .16 * flight));
      bud.rotation.set(-Math.PI / 2 + flight * 1.66, side * (.77 - flight * .25), (index === 0 ? -.51 : 2.64) * (1 - flight));
      bud.visible = open > .12;
    });
    const spread = T.MathUtils.smoothstep(separation, .03, .92);
    cap.position.set(-.21 - spread * 1.47, 0, 0);
    chamber.position.set(-.17 - spread * 1.04, 0, 0);
    woofer.position.set(-.11 - spread * .70, 0, 0);
    tweeter.position.set(-.06 - spread * .35, 0, 0);
    anatomy.visible = spread > .019;
    socket.visible = spread > .07;
    solid.getObjectByName('Nozzle')!.visible = !anatomy.visible;
    const fade = T.MathUtils.smoothstep(separation, .03, .29);
    other.scale.setScalar(1 - fade * .05);
    other.visible = fade < .52;
    outline.visible = fade > .32;
    outlineMaterial.opacity = fade * .72;
  }

  return { caseRig, explode, pose, anchors: { dial, tip: cap, woofer, tweeter } };
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

export function createNeckband() {
  const group = new T.Group();
  const regularCable = grained({ color: 0xbe2e1a, roughness: .54, clearcoat: .22, clearcoatRoughness: .36 }, 190, .23);
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

  return group;
}
