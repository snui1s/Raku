import {
  ConeGeometry, CubicBezierCurve3, CylinderGeometry, Group, Mesh, MeshToonMaterial, SphereGeometry, Vector3,
  type Texture,
} from "three";
import { hillHeight } from "./hill";
import { windGust } from "./wind";
import { taperedTube } from "./tree";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** A fox sitting on the hill to the left of the gate, facing it (+x) and turned a little toward the camera. */
export const FOX = { position: [-1.3, 0, -12.6] as [number, number, number], yaw: -0.45 };

export function buildFox(palette: Palette, toon?: Texture): ScenePart {
  const mat = (c: number) => new MeshToonMaterial({ color: c, gradientMap: toon ?? null });
  const fur = mat(palette.fox[0]), cream = mat(palette.fox[1]), dark = mat(palette.fox[2]);
  const root = new Group();
  root.name = "fox";

  const ball = (m: MeshToonMaterial, sx: number, sy: number, sz: number, x: number, y: number, z: number, parent: Group = root, name?: string) => {
    const mesh = new Mesh(new SphereGeometry(1, 20, 14), m);
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  // body: tilted so the chest is high and the rump is low, as when sitting
  const body = ball(fur, 0.36, 0.34, 0.26, -0.02, 0.4, 0, root, "fox-body");
  body.rotation.z = 0.5;
  ball(cream, 0.2, 0.27, 0.2, 0.2, 0.47, 0); // chest
  [-1, 1].forEach((s) => {
    ball(fur, 0.22, 0.22, 0.12, -0.14, 0.23, s * 0.17); // haunch
    ball(dark, 0.14, 0.05, 0.075, 0.0, 0.05, s * 0.17); // hind paw
    const leg = new Mesh(new CylinderGeometry(0.045, 0.05, 0.4, 10), fur); // front leg
    leg.position.set(0.22, 0.24, s * 0.09);
    root.add(leg);
    const sock = new Mesh(new CylinderGeometry(0.05, 0.052, 0.17, 10), dark);
    sock.position.set(0.22, 0.09, s * 0.09);
    root.add(sock);
    ball(dark, 0.075, 0.04, 0.06, 0.25, 0.03, s * 0.09);
  });

  // head
  const head = new Group();
  head.name = "fox-head";
  head.position.set(0.3, 0.84, 0);
  root.add(head);
  ball(fur, 0.17, 0.155, 0.16, 0, 0, 0, head);
  [-1, 1].forEach((s) => ball(cream, 0.11, 0.075, 0.075, 0.03, -0.06, s * 0.1, head)); // cheeks
  const snout = new Mesh(new ConeGeometry(0.075, 0.22, 14), fur);
  snout.rotation.z = -Math.PI / 2; // cone points along +x
  snout.position.set(0.2, -0.04, 0);
  head.add(snout);
  ball(cream, 0.1, 0.04, 0.05, 0.19, -0.075, 0, head);
  ball(dark, 0.03, 0.026, 0.03, 0.315, -0.035, 0, head); // nose
  const eyes = [-1, 1].map((s) => ball(dark, 0.02, 0.022, 0.014, 0.1, 0.035, s * 0.115, head));
  const ears = [-1, 1].map((s) => {
    const ear = new Group();
    ear.name = s < 0 ? "fox-ear-l" : "fox-ear-r";
    ear.position.set(-0.02, 0.14, s * 0.1);
    ear.rotation.x = -s * 0.3; // leaned outward
    const outer = new Mesh(new ConeGeometry(0.075, 0.24, 12), fur);
    outer.position.y = 0.11;
    const tip = new Mesh(new ConeGeometry(0.05, 0.11, 12), dark);
    tip.position.y = 0.19;
    ear.add(outer, tip);
    head.add(ear);
    return ear;
  });

  // tail: bushy, curled around the feet, with a cream tip
  const tail = new Group();
  tail.name = "fox-tail";
  tail.position.set(-0.3, 0.2, 0.03);
  const curve = new CubicBezierCurve3(new Vector3(0, 0, 0), new Vector3(-0.42, -0.12, 0.2), new Vector3(-0.2, -0.17, 0.5), new Vector3(0.38, -0.16, 0.42));
  tail.add(new Mesh(taperedTube(curve, 0.07, 0.12, 22, 12), fur));
  const tip = ball(cream, 0.1, 0.09, 0.1, 0.4, -0.16, 0.43, tail);
  tip.scale.set(0.13, 0.1, 0.1);
  root.add(tail);

  // place on the hill, facing the gate
  const [fx, , fz] = FOX.position;
  root.position.set(fx, hillHeight(fx, fz) - 0.02, fz);
  root.rotation.y = FOX.yaw;
  root.scale.setScalar(1.25); // stylized: bigger than life so it reads from across the hill

  const earBase = ears[1].rotation.z;
  return {
    object: root,
    update: (t) => {
      const gust = windGust(t);
      body.scale.y = 0.34 * (1 + 0.018 * Math.sin(t * 2.1)); // breathing
      head.rotation.z = Math.sin(t * 0.5) * 0.03;
      tail.rotation.y = Math.sin(t * 1.1) * 0.1 + gust * 0.12; // swishes, and the wind lifts it
      const flick = Math.pow(Math.max(0, Math.sin(t * 1.05)), 40); // a quick ear twitch every six seconds or so
      ears[1].rotation.z = earBase + flick * 0.3;
      const blink = Math.pow(Math.max(0, Math.sin(t * 0.8 + 0.7)), 80);
      eyes.forEach((e) => (e.scale.y = 0.022 * (1 - 0.9 * blink)));
    },
  };
}
