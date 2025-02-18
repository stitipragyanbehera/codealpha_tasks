export function humanize (value) {
  if (!value) { value = ""; }

  const camelMatch = /([A-Z])/g;
  const underscoreMatch = /_/g;

  const camelCaseToSpaces = value.replace(camelMatch, " $1");
  const underscoresToSpaces = camelCaseToSpaces.replace(underscoreMatch, " ");
  const caseCorrected =
    underscoresToSpaces.charAt(0).toUpperCase() +
    underscoresToSpaces.slice(1).toLowerCase();

  return caseCorrected.replace(/\-/g, " ").replace(/([0-9]+)$/g, " - T$1");
}

export function trackEvent(name, options) {
  if (process.env.NODE_ENV === "production") {
    gtag('event', name, options);
  }
}

// 15 rotating lights to reuse
const lightPool = [
  new THREE.PointLight(0x1c80e4, 0, 0),
  new THREE.PointLight(0x1c80e4, 0, 0),
  new THREE.PointLight(0x1c80e4, 0, 0),
  new THREE.PointLight(0x1c80e4, 0, 0),
  new THREE.PointLight(0x1c80e4, 0, 0),
  new THREE.PointLight(0x1c80e4, 0, 0),
  new THREE.PointLight(0x1c80e4, 0, 0),
  // More lights than 8 are causing WebGL issues on low end devices.

  // new THREE.PointLight(0x1c80e4, 0, 0),
  // new THREE.PointLight(0x1c80e4, 0, 0),
  // new THREE.PointLight(0x1c80e4, 0, 0),
  // new THREE.PointLight(0x1c80e4, 0, 0),
  // new THREE.PointLight(0x1c80e4, 0, 0),
  // new THREE.PointLight(0x1c80e4, 0, 0),
  // new THREE.PointLight(0x1c80e4, 0, 0),
  // new THREE.PointLight(0x1c80e4, 0, 0),
];

let currentLight = 0;
export function getLightFromPool() {
  let retries = 0;

  do {
    currentLight = (currentLight + 1) % lightPool.length;
    retries++;
  } while (lightPool[currentLight].intensity !== 0 && retries < lightPool.length);

  return lightPool[currentLight];
}

export function getLightPoolCount() {
  return lightPool.length;
}

export function removeLight(light) {
  light.getEntity().destroy();
  light.intensity = 0;
  light.distance = 0;
  window.scene.add(light);
}

export function toScreenPosition(camera, obj) {
  var vector = new THREE.Vector3();

  var widthHalf = 0.5 * window.innerWidth;
  var heightHalf = 0.5 * window.innerHeight;

  obj.updateMatrixWorld();
  vector.setFromMatrixPosition(obj.matrixWorld);
  vector.project(camera);

  vector.x = (vector.x * widthHalf) + widthHalf;
  vector.y = - (vector.y * heightHalf) + heightHalf;

  return {
    x: vector.x,
    y: vector.y
  };

}
