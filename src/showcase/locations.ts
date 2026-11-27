import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, cylinder, finish, part, ring } from './geometry';

const noise = (x: number, y: number) => {
  const value = Math.sin(x * 125.21 + y * 156.73) * 43758.5453;
  return value - Math.floor(value);
};

export function softShadow(parent: T.Object3D, x: number, y: number, z: number, width: number, depth: number, opacity = .62) {
  const { context, texture } = canvasTexture(128, 128);
  const gradient = context.createRadialGradient(64, 64, 3, 64, 64, 62);
  gradient.addColorStop(0, '#000');
  gradient.addColorStop(.45, '#000b');
  gradient.addColorStop(1, '#0000');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const shadow = part(parent, new T.PlaneGeometry(width, depth), new T.MeshBasicMaterial({
    map: texture, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  }), x, y, z);
  shadow.rotation.x = -Math.PI / 2;
  return shadow;
}

function valueNoise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const sx = T.MathUtils.smoothstep(x - ix, 0, 1), sy = T.MathUtils.smoothstep(y - iy, 0, 1);
  return T.MathUtils.lerp(
    T.MathUtils.lerp(noise(ix, iy), noise(ix + 1, iy), sx),
    T.MathUtils.lerp(noise(ix, iy + 1), noise(ix + 1, iy + 1), sx),
    sy,
  );
}

function ridgeHeight(x: number, z: number) {
  const roll = Math.sin(z * .91 + x * .35) * .51 + Math.cos(x * 1.23 - z * .44) * .43;
  const distance = Math.hypot(x * .65, z * .73);
  const basin = T.MathUtils.smoothstep(distance, 1.75, 8);
  const mesa = Math.max(0, Math.cos(x * .52 + z * .24) * Math.sin(z * .59 - .33));
  const fines = valueNoise(x * 4.2, z * 4.2);
  const strata = Math.sin(z * 8.7 - x * 1.4 + valueNoise(x * 1.7, z * 1.7) * 6);
  const fracture = (valueNoise(x * 2.1, z * 2.1) - .5) * .66 * basin;
  return -.93 - .27 * roll * (1 - basin) + (roll + 2.9 * mesa ** 2) * basin + fracture + strata * .052 + fines * .075;
}

export function createBudsLocations() {
  const terrain = new T.Group();
  const floorGeometry = new T.PlaneGeometry(44, 44, 154, 154);
  floorGeometry.rotateX(-Math.PI / 2);
  const floorVertices = floorGeometry.getAttribute('position');
  const shades: number[] = [];
  const basalt = new T.Color(0x30252a);
  for (let i = 0; i < floorVertices.count; i++) {
    const x = floorVertices.getX(i), z = floorVertices.getZ(i);
    const fine = noise(x, z);
    floorVertices.setY(i, ridgeHeight(x, z) + .061 * fine);
    const shade = .72 + fine * .30 + Math.sin(x * .58 + z * .71) * .16;
    const color = basalt.clone().multiplyScalar(shade);
    shades.push(color.r, color.g, color.b);
  }
  floorGeometry.setAttribute('color', new T.Float32BufferAttribute(shades, 3));
  floorGeometry.computeVertexNormals();
  part(terrain, floorGeometry, new T.MeshStandardMaterial({ vertexColors: true, roughness: .94, metalness: .11 }));

  const rockGeometry: T.BufferGeometry[] = [];
  for (let i = 0; i < 77; i++) {
    const theta = noise(i, 19) * Math.PI * 2;
    const distance = 2.3 + noise(i, 83) * 12;
    const x = Math.cos(theta) * distance, z = Math.sin(theta) * distance * 1.2;
    const size = .10 + noise(i, 12) ** 3 * 1.25;
    const rock = new T.IcosahedronGeometry(size, i % 3 === 0 ? 5 : 2);
    const vertices = rock.getAttribute('position');
    for (let j = 0; j < vertices.count; j++) {
      const px = vertices.getX(j) / size, py = vertices.getY(j) / size, pz = vertices.getZ(j) / size;
      const distance = .75 + valueNoise(px * 2.3 + py * .9 + i, pz * 2.7) * .48;
      vertices.setXYZ(j, px * size * distance, py * size * distance, pz * size * distance);
    }
    rock.computeVertexNormals();
    rock.scale(1.2, .49 + noise(i, 2) * 1.11, .87);
    rock.rotateY(theta);
    rock.translate(x, ridgeHeight(x, z) - .05, z);
    rockGeometry.push(rock);
  }
  const rocks = mergeGeometries(rockGeometry);
  rockGeometry.forEach(geometry => geometry.dispose());
  part(terrain, rocks, finish(0x262327, .87, .14));

  const obsidian = finish(0x242024, .42, .38);
  cylinder(terrain, obsidian, 1.49, 1.68, .58, 0, -.622, 0);
  const band = ring(terrain, finish(0x944121, .35, .57), 1.475, .012, 0, -.369, 0);
  band.rotation.x = Math.PI / 2;
  softShadow(terrain, 0, -.329, 0, 2.94, 2.94, .65);

  const gallery = new T.Group();
  const floor = finish(0x3d221c, .60, .32);
  const light = new T.MeshBasicMaterial({ color: 0xe3653b, toneMapped: false });
  const concrete = finish(0x97503c, .57, .22);
  const dark = finish(0x2b1b19, .53, .36);
  const galleryFloor = part(gallery, new T.PlaneGeometry(72, 72), floor, 0, -.94, 0);
  galleryFloor.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 5; i++) {
    const radius = 2.11 + i * .73;
    const track = ring(gallery, i % 2 === 0 ? light : concrete, radius, i % 2 === 0 ? .014 : .029, 0, -.918, 0);
    track.rotation.x = Math.PI / 2;
  }
  cylinder(gallery, dark, 2.04, 2.47, .28, 0, -.795, 0);
  cylinder(gallery, concrete, 1.66, 1.68, .35, 0, -.49, 0);
  cylinder(gallery, dark, 1.735, 1.72, .11, 0, -.306, 0);
  softShadow(gallery, 0, -.246, 0, 3.3, 3.3);
  for (let i = 0; i < 4; i++) {
    const arch = part(gallery, new T.TorusGeometry(3.25, .17 + i * .022, 8, 48, Math.PI), concrete, 0, -.92, -4.6 - i * 2.35);
    arch.scale.set(1.35, 1.42, 1);
    part(gallery, new T.TorusGeometry(3.25, .021, 6, 48, Math.PI), light, 0, -.92, -4.41 - i * 2.35)
      .scale.copy(arch.scale);
  }
  return { terrain, gallery };
}

export function createStudio() {
  const studio = new T.Group();
  const surface = finish(0x242326, .60, .31);
  const border = finish(0x625151, .38, .51);
  const floor = part(studio, new T.PlaneGeometry(82, 82), surface, 0, -.53, 0);
  floor.rotation.x = -Math.PI / 2;
  for (const z of [-4.2, 5.8, 7.5]) {
    part(studio, new T.BoxGeometry(24, .025, .014), border, 0, -.52, z);
  }
  for (const x of [-5.6, -1.48, 4.95]) {
    part(studio, new T.BoxGeometry(.015, .025, 16), border, x, -.52, .8);
  }
  softShadow(studio, -.4, -.51, 2.6, 9, 6, .48);
  const phoneShadow = softShadow(studio, 2.37, -.509, -1.57, 3.95, 5.6, .72);
  return { studio, phoneShadow };
}
