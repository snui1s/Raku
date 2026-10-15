import { CylinderGeometry, Group, Mesh, MeshToonMaterial, SphereGeometry } from "three";
import { windGust } from "./wind";
import type { ScenePart } from "./index";

/** Where the four paper lanterns hang: one for each number, spread in front of the gate (world coordinates). */
export const LANTERNS: [number, number, number][] = [
  [-2.6, 6.3, -14.5],
  [-0.6, 7.4, -15.1],
  [1.0, 6.5, -13.5],
  [3.2, 7.2, -13.1],
];

const CORD_LENGTH = 9;

/** Four glowing paper lanterns on cords. They are scaled to nothing until `getShow()` rises, so the hero never shows them. */
export function buildLanterns(getShow: () => number): ScenePart {
  const group = new Group();
  group.name = "lanterns";
  const paper = new MeshToonMaterial({ color: 0xffbb66, emissive: 0xff8f3d, emissiveIntensity: 0.95 });
  const dark = new MeshToonMaterial({ color: 0x2b1f1a });
  const lanterns = LANTERNS.map((p, i) => {
    const l = new Group();
    l.name = `lantern-${i}`;
    l.position.set(...p);
    const body = new Mesh(new SphereGeometry(1, 20, 14), paper);
    body.name = `lantern-${i}-body`;
    body.scale.set(0.34, 0.46, 0.34);
    const top = new Mesh(new CylinderGeometry(0.17, 0.2, 0.06, 14), dark);
    top.position.y = 0.45;
    const bottom = new Mesh(new CylinderGeometry(0.2, 0.17, 0.06, 14), dark);
    bottom.position.y = -0.45;
    const cord = new Mesh(new CylinderGeometry(0.01, 0.01, CORD_LENGTH, 5), dark);
    cord.position.y = 0.45 + CORD_LENGTH / 2;
    l.add(body, top, bottom, cord);
    group.add(l);
    return l;
  });
  return {
    object: group,
    update: (t) => {
      const show = getShow();
      const gust = windGust(t);
      lanterns.forEach((l, i) => {
        l.visible = show > 0.001;
        l.scale.setScalar(Math.max(show, 0.001));
        l.rotation.z = Math.sin(t * 0.9 + i * 1.7) * 0.05 + gust * 0.06;
      });
    },
  };
}
