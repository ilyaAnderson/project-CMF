import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, canvasTexture, cylinder, finish, part } from './geometry';
import { grained } from './materials';

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
  const basalt = new T.Color(0x242b30);
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
  part(terrain, floorGeometry, grained({ vertexColors: true, roughness: .93, metalness: .12 }, 48, .61));

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
  part(terrain, rocks, grained({ color: 0x212629, roughness: .87, metalness: .12 }, 63, .58));

  const obsidian = grained({ color: 0x202223, roughness: .62, metalness: .29 }, 67, .47);
  const rockBase = part(terrain, new T.IcosahedronGeometry(1.9, 3), obsidian, .09, -.86, -.14);
  rockBase.scale.set(1.13, .34, .94);
  softShadow(terrain, 0, -.378, 0, 3.0, 2.94, .58);

  const gallery = new T.Group();
  const bleached = grained({ color: 0x918f8a, roughness: .54, metalness: .28 }, 99, .37);
  const fluting = grained({ color: 0x262628, roughness: .61, metalness: .37 }, 60, .41, 4);
  const black = finish(0x171719, .40, .44);
  const galleryFloor = part(gallery, new T.PlaneGeometry(72, 72), fluting, 0, -1.39, 0);
  galleryFloor.rotation.x = -Math.PI / 2;
  cylinder(gallery, black, 1.87, 1.87, 1.01, 0, -.89, 0, 'y', 96);
  cylinder(gallery, bleached, 1.86, 1.86, .037, 0, -.367, 0, 'y', 96);
  cylinder(gallery, black, 1.21, 1.21, .60, 2.38, -1.07, -1.42, 'y', 72);
  cylinder(gallery, bleached, 1.205, 1.198, .035, 2.38, -.754, -1.42, 'y', 72);
  softShadow(gallery, 0, -.345, 0, 3.4, 3.36, .84);
  for (let i = 0; i < 12; i++) {
    cylinder(gallery, i % 4 === 0 ? black : fluting, .38, .38, 7.1, -7.5 + i * 1.1, 1.8, -5.4 - Math.sin(i * .81), 'y', 22);
  }
  return { terrain, gallery };
}

export function createStudio() {
  const studio = new T.Group();
  const surface = grained({ color: 0x353639, roughness: .71, metalness: .15 }, 53, .10);
  const border = finish(0x28282a, .51, .39);
  const floor = part(studio, new T.PlaneGeometry(100, 39), surface, 13, -1.10, 0);
  floor.rotation.x = -Math.PI / 2;
  for (const z of [-13, -7.5, 6.5]) box(studio, border, 95, .025, .023, .008, 15, -1.089, z);
  const phoneShadow = softShadow(studio, 29.46, -1.075, 0, 7.0, 3.7, .55);
  return { studio, phoneShadow };
}
