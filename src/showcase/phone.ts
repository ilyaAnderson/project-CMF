import * as T from 'three';
import { ball, box, canvasTexture, cylinder, extrusion, finish, panelGeometry, part, ring, roundedShape, vector } from './geometry';
import { grained } from './materials';
import { createPhoneDisplay } from './displays';
import { portX, portY } from './audio';

export const phoneLength = 3.66;
export const phoneCenter = vector(portX + phoneLength / 2, portY, 0);
const width = 1.747;
const rest = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(
  vector(0, 0, 1), vector(1, 0, 0), vector(0, 1, 0),
));
const lacquer = grained({
  color: 0xd2d4d6, roughness: .24, metalness: .54, clearcoat: .31, clearcoatRoughness: .19,
}, 184, .10, 3);
const steel = finish(0x999da3, .25, .83);
const black = grained({ color: 0x0b0c0d, roughness: .32, metalness: .36, clearcoat: .23 }, 155, .16);
const lens = new T.MeshPhysicalMaterial({
  color: 0x151b39, metalness: .62, roughness: .10, clearcoat: 1, clearcoatRoughness: .075, iridescence: .18,
});

export function createPhone(backTexture?: T.Texture) {
  const root = new T.Group();
  root.position.copy(phoneCenter);
  const device = new T.Group();
  root.add(device);
  extrusion(device, lacquer, roundedShape(width - .044, phoneLength - .043, .155), .205, .022);
  extrusion(device, black, roundedShape(width - .067, phoneLength - .067, .145), .050, .010, 0, 0, .111);
  const screen = part(device, panelGeometry(width - .140, phoneLength - .138, .137), new T.MeshBasicMaterial({
    map: createPhoneDisplay(), toneMapped: false,
  }), 0, 0, .138);
  const screenGlass = finish(0x718196, .12, .65, .53);
  screenGlass.transparent = true;
  screenGlass.opacity = .069;
  screenGlass.depthWrite = false;
  part(device, screen.geometry, screenGlass, 0, 0, .141);

  const backFinish = new T.MeshStandardMaterial({
    color: backTexture ? 0xffffff : 0xdadbdc, map: backTexture ?? null, roughness: .39, metalness: .14,
  });
  const rear = part(device, panelGeometry(width - .020, phoneLength - .020, .171), backFinish, 0, 0, -.108);
  rear.rotation.y = Math.PI;
  const clearBack = new T.MeshPhysicalMaterial({
    color: 0xe6e9ed, metalness: .26, roughness: .15, clearcoat: .64, clearcoatRoughness: .15,
    transparent: true, opacity: .079, depthWrite: false,
  });
  const rearGlass = part(device, rear.geometry, clearBack, 0, 0, -.111);
  rearGlass.rotation.y = Math.PI;
  for (const [x, y, radius, folded] of [[.618, 1.439, .169, 1], [.515, .953, .177, 0], [-.006, .953, .177, 0]]) {
    cylinder(device, steel, radius + .018, radius + .023, .054, x, y, -.13, 'z', 80);
    cylinder(device, black, radius, radius + .007, .072, x, y, -.164, 'z', 80);
    ring(device, black, radius * .74, .016, x, y, -.203);
    if (folded) box(device, black, .133, .139, .026, .018, x, y, -.198);
    ball(device, lens, radius * .35, radius * .35, .025, x, y, -.204);
    ring(device, lens, radius * .37, .005, x, y, -.222);
  }

  const { context, texture } = canvasTexture(320, 320);
  const glyph = new T.MeshBasicMaterial({ map: texture, toneMapped: false });
  cylinder(device, black, .262, .260, .034, -.526, 1.475, -.119, 'z', 96);
  const matrix = part(device, new T.CircleGeometry(.250, 96), glyph, -.526, 1.475, -.139);
  matrix.rotation.y = Math.PI;
  const outline = ring(device, steel, .256, .008, -.526, 1.475, -.140);
  outline.rotation.y = Math.PI;
  let lastFrame = -1;

  function glyphFrame(progress: number) {
    const frame = Math.floor(progress * 40);
    if (frame === lastFrame) return;
    lastFrame = frame;
    context.fillStyle = '#131413';
    context.fillRect(0, 0, 320, 320);
    const pitch = 10, midpoint = 15;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      if (Math.hypot(x - 15.5, y - 15.5) > 14.6) continue;
      const peak = Math.max(0, 1 - Math.abs(x - 15) / 14);
      const wave = Math.abs(Math.sin((x + frame * .87) * 1.20) + Math.sin(x * .41 + frame * .24) * .58);
      context.fillStyle = Math.abs(y - midpoint) < (wave * peak * 7 + .66) ? '#fff7e2' : '#282929';
      context.fillRect(x * pitch + 1, y * pitch + 1, 7, 7);
    }
    texture.needsUpdate = true;
  }

  box(device, steel, .346, .024, .114, .010, 0, -phoneLength / 2, 0);
  box(device, black, .289, .025, .084, .013, 0, -phoneLength / 2 - .013, 0);
  box(device, lacquer, .165, .031, .021, .007, 0, -phoneLength / 2 - .016, 0);
  for (const side of [-1, 1]) {
    for (let i = 0; i < (side === 1 ? 6 : 3); i++) cylinder(device, black, .015, .015, .018, side * (.37 + i * .060), -phoneLength / 2 - .003, .011, 'y', 20);
  }
  for (const [x, y, height] of [[-.877, .71, .43], [.877, .35, .31], [.877, -.35, .28]]) {
    box(device, lacquer, .049, height, .077, .020, x, y, .031);
  }

  const turn = new T.Quaternion();
  const orientation = new T.Quaternion();
  function pose(lift: number, spin: number, signal: number) {
    root.position.set(phoneCenter.x, phoneCenter.y + lift * .55, 0);
    turn.setFromEuler(new T.Euler(-.14 * lift, spin, -.18 * lift));
    orientation.copy(rest).slerp(turn, lift);
    device.quaternion.copy(orientation);
    glyphFrame(signal);
  }
  return { root, pose };
}
