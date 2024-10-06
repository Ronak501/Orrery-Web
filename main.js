import * as THREE from "three";

// Import GUI
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Import and load GLTF model
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// Create GUI
const gui = new GUI();
// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  25,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create orbit controls with mouse rotation
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 2000;
controls.maxPolarAngle = Math.PI;
controls.enablePan = true;
controls.panSpeed = 0.5;
controls.rotateSpeed = 0.5;

// Add mouse event listeners for rotation
let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};

renderer.domElement.addEventListener('mousedown', (e) => {
    isDragging = true;
});

renderer.domElement.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaMove = {
            x: e.offsetX - previousMousePosition.x,
            y: e.offsetY - previousMousePosition.y
        };

        const rotationSpeed = 0.005;
        scene.rotation.y += deltaMove.x * rotationSpeed;
        scene.rotation.x += deltaMove.y * rotationSpeed;
    }

    previousMousePosition = {
        x: e.offsetX,
        y: e.offsetY
    };
});

renderer.domElement.addEventListener('mouseup', (e) => {
    isDragging = false;
});

// Generate star vertices for a star field with a black star background
const starVertices = [];
for (let i = 0; i < 5000; i++) {
  const x = THREE.MathUtils.randFloatSpread(2000);
  const y = THREE.MathUtils.randFloatSpread(2000);
  const z = THREE.MathUtils.randFloatSpread(2000);
  starVertices.push(x, y, z);
}

// Create star background
const starCount = 10000;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount * 3; i += 3) {
  starPositions[i] = THREE.MathUtils.randFloatSpread(2000); // x
  starPositions[i + 1] = THREE.MathUtils.randFloatSpread(2000); // y
  starPositions[i + 2] = THREE.MathUtils.randFloatSpread(2000); // z
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(starPositions, 3)
);

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1,
  sizeAttenuation: true,
});

const starField = new THREE.Points(starGeometry, starMaterial);
starField.name = "Star Field"; // Added name for the model
scene.add(starField);

// Function to animate stars
function animateStars() {
  requestAnimationFrame(animateStars);
}

// Start the star animation
animateStars();

// Create the points mesh and add it to the scene
const stars = new THREE.Points(starGeometry, starMaterial);
stars.name = "Stars"; // Added name for the model
scene.add(stars);

const textureLoader = new THREE.TextureLoader();
// Moon parameters
const moonParams = {
  radius: 2.5,
  segments: 32,
  orbitRadius: 30,
  orbitSpeed: 0.05,
  rotationSpeed: 100    ,
  bumpScale: 0.1,
};

// Create moon geometry and material
const moonGeometry = new THREE.SphereGeometry(
  moonParams.radius,
  moonParams.segments,
  moonParams.segments
);
const moonTexture = textureLoader.load("./source/8k_moon_day_map.jpg");
const moonMaterial = new THREE.MeshPhongMaterial({
  map: moonTexture,
  bumpMap: moonTexture,
  bumpScale: moonParams.bumpScale,
});

// Create moon mesh and add it to the scene
const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.position.set(moonParams.orbitRadius, 0, 0); // Initial position of the moon
moonMesh.name = "Moon"; // Added name for the model
scene.add(moonMesh);

// Create a dotted line to represent the moon's orbit
const orbitPoints = [];
const orbitSegments = 100;
for (let i = 0; i <= orbitSegments; i++) {
  const angle = (i / orbitSegments) * Math.PI * 2;
  const x = Math.cos(angle) * moonParams.orbitRadius;
  const z = Math.sin(angle) * moonParams.orbitRadius;
  orbitPoints.push(new THREE.Vector3(x, 0, z));
}

const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
const orbitMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, opacity: 0.5, transparent: true });
const orbitLine = new THREE.Points(orbitGeometry, orbitMaterial);
orbitLine.name = "Moon Orbit Line"; // Added name for the model
scene.add(orbitLine);

// Function to animate the moon's orbit and rotation
function animateMoon() {
  const time = Date.now() * 0.001; // Get current time in seconds

  // Update moon's position (orbit around Earth)
  moonMesh.position.x =
    Math.cos(time * moonParams.orbitSpeed) * moonParams.orbitRadius;
  moonMesh.position.z =
    Math.sin(time * moonParams.orbitSpeed) * moonParams.orbitRadius;

  // Rotate the moon on its own axis
  moonMesh.rotation.y += moonParams.rotationSpeed;

  // Make the moon always face the Earth
  moonMesh.lookAt(0, 0, 0);

  // Request the next animation frame
  requestAnimationFrame(animateMoon);
}

// Start the moon's animation
animateMoon();

// Add GUI controls for the moon
const moonFolder = gui.addFolder("Moon");
moonFolder.add(moonParams, "segments", 16, 64, 1).onChange((value) => {
  moonMesh.geometry = new THREE.SphereGeometry(moonParams.radius, value, value);
});
moonFolder.add(moonParams, "orbitRadius", 20, 50).onChange((value) => {
  const newOrbitPoints = orbitPoints.map(point => point.normalize().multiplyScalar(value));
  orbitGeometry.setFromPoints(newOrbitPoints);
});
moonFolder.add(moonParams, "orbitSpeed", 0.01, 0.1);
moonFolder.add(moonParams, "rotationSpeed", 0.001, 0.02);
moonFolder.add(moonParams, "bumpScale", 0, 0.5).onChange((value) => {
  moonMaterial.bumpScale = value;
});
moonFolder.add(orbitMaterial, "size", 0.1, 1).name("Orbit Dot Size");
moonFolder.add(orbitMaterial, "opacity", 0.1, 1).name("Orbit Opacity");

// GUI controls for the moon's orbit visualization
const orbitFolder = gui.addFolder("Moon Orbit");
orbitFolder.addColor(orbitMaterial, "color").name("Orbit Color");
orbitFolder.add(orbitMaterial, "opacity", 0, 1).name("Orbit Opacity").onChange(value => {
  orbitMaterial.opacity = value;
});
orbitFolder.add(moonParams, "orbitRadius", 20, 50).name("Orbit Radius").onChange(value => {
  const newGeometry = new THREE.TorusGeometry(value, 0.1, 16, 100);
  orbitLine.geometry.dispose();
  orbitLine.geometry = newGeometry;
});
orbitFolder.open();

// Load the 3D model and add a circular orbit line
let satellite;
const satelliteParams = {
  scale: 0.02,
  radius: 15,
  orbitSpeed: 0.3,
  verticalAmplitude: 0.5,
};

const loader = new GLTFLoader();
loader.load("./source/satellite.glb", (gltf) => {
  satellite = gltf.scene;
  satellite.name = "Communications Satellite";
  satellite.scale.set(satelliteParams.scale, satelliteParams.scale, satelliteParams.scale);
  satellite.position.set(satelliteParams.radius, 0, 0);
  satellite.rotation.set(0, 0, 0);
  satellite.lookAt(0, 0, 0);
  scene.add(satellite);

  // Create a circular orbit line for the satellite
  const orbitPath = new THREE.RingGeometry(satelliteParams.radius, satelliteParams.radius + 0.05, 64);
  const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
  const orbitMesh = new THREE.Mesh(orbitPath, orbitMaterial);
  orbitMesh.rotation.x = Math.PI / 2; // Align with the XZ plane for horizontal rotation
  orbitMesh.name = "Satellite Orbit";
  scene.add(orbitMesh);

  // Add GUI controls for the satellite and its orbit
  const satelliteFolder = gui.addFolder("Satellite");
  satelliteFolder.add(satelliteParams, "scale", 0.01, 0.1).onChange((value) => {
    satellite.scale.set(value, value, value);
  });
  satelliteFolder.add(satelliteParams, "radius", 10, 25).onChange((value) => {
    orbitMesh.geometry.dispose();
    orbitMesh.geometry = new THREE.RingGeometry(value, value + 0.05, 64);
    satellite.position.set(value, 0, 0);
  });
  satelliteFolder.add(satelliteParams, "orbitSpeed", 0.1, 1);
  satelliteFolder.addColor(orbitMaterial, "color").name("Orbit Color").onChange((value) => {
    orbitMaterial.color.set(value);
  });
  satelliteFolder.add(orbitMaterial, "opacity", 0.1, 1).name("Orbit Opacity").onChange((value) => {
    orbitMaterial.opacity = value;
  });
  satelliteFolder.open();

  // Start animating the satellite once it's loaded
  animateSatellite();
});

// Function to animate the satellite
function animateSatellite() {
  if (satellite) {
    const time = Date.now() * 0.001;
    const radius = satelliteParams.radius;
    const orbitSpeed = satelliteParams.orbitSpeed;
    const verticalAmplitude = satelliteParams.verticalAmplitude;

    // Update satellite's position (orbit around Earth)
    satellite.position.x = Math.cos(time * orbitSpeed) * radius;
    satellite.position.z = Math.sin(time * orbitSpeed) * radius;
    satellite.position.y = Math.sin(time * orbitSpeed * 0.5) * radius * verticalAmplitude;

    // Make the satellite always face the direction it's moving
    const lookAtPoint = satellite.position.clone().add(
      new THREE.Vector3(
        -Math.sin(time * orbitSpeed),
        Math.cos(time * orbitSpeed * 0.5) * verticalAmplitude,
        Math.cos(time * orbitSpeed)
      )
    );
    satellite.lookAt(lookAtPoint);
  }
  // Request the next animation frame
  requestAnimationFrame(animateSatellite);
}

const earthTextures = {
  map: "./source/8k_earth_day_map.jpg",
  clouds: "./source/8k_earth_cloud_map.jpg",
  night: "./source/8k_earth_nightmap.jpg",
  normal: "./source/8k_earth_normal_map.jpg",
  specular: "./source/8k_earth_specular_map.jpg",
};

const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
const earthMaterials = {
  map: new THREE.TextureLoader().load(earthTextures.map),
  clouds: new THREE.TextureLoader().load(earthTextures.clouds),
  night: new THREE.TextureLoader().load(earthTextures.night),
  normal: new THREE.TextureLoader().load(earthTextures.normal),
  specular: new THREE.TextureLoader().load(earthTextures.specular),
};

const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthMaterials.map,
  bumpMap: earthMaterials.normal,
  bumpScale: 0.2,
  specularMap: earthMaterials.specular,
  specular: new THREE.Color("grey"),
});

const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
earthMesh.name = "Earth"; // Added name for the model
scene.add(earthMesh);

const cloudsGeometry = new THREE.SphereGeometry(5.05, 64, 64);
const cloudsMaterial = new THREE.MeshPhongMaterial({
  map: earthMaterials.clouds,
  transparent: true,
  opacity: 0.4,
});
const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
cloudsMesh.name = "Clouds"; // Added name for the model
scene.add(cloudsMesh);

// Function to animate clouds while keeping the earth stable
function animateClouds() {
  cloudsMesh.rotation.y += 0.0003; // Clouds moving independently
  requestAnimationFrame(animateClouds);
  renderer.render(scene, camera);
}

animateClouds(); // Start the animation of Earth and clouds

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

// Add point light (sun-like)
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 3, 5);
scene.add(pointLight);

// Position camera
camera.position.z = 5;
// Add controls for stars
const starFolder = gui.addFolder("Stars");
starFolder.add(starMaterial, "size", 0.1, 3);
starFolder.addColor(starMaterial, "color");

loader.load(
    './source/Sun.glb',
    (gltf) => {
        const model = gltf.scene;
        
        // Set the sun at the center of the scene
        model.position.set(-200, 0, 40);
        
        // Set a small scale for the sun
        const initialScale = 0.06;
        model.scale.set(initialScale, initialScale, initialScale);
        
        scene.add(model);

        // Add a point light to represent the sun's light
        const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
        sunLight.position.copy(model.position);
        scene.add(sunLight);

        // Create a circular line around the sun
        const sunRadius = 10; // Adjust this value to change the size of the circle
        const sunCircleGeometry = new THREE.CircleGeometry(sunRadius, 64);
        const sunCircleMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });
        const sunCircle = new THREE.LineLoop(sunCircleGeometry, sunCircleMaterial);
        sunCircle.rotation.x = Math.PI / 2; // Rotate to align with the XZ plane
        sunCircle.position.copy(model.position); // Position the circle at the sun's position
        scene.add(sunCircle);
    }
);

loader.load("./source/Mars.glb", (gltf) => {
  const model = gltf.scene;

  // Set a fixed initial position for Mars
  const initialPosition = { x: 100, y: 0, z: 41};
  model.position.set(initialPosition.x, initialPosition.y, initialPosition.z);

  // Set an initial scale for Mars
  const initialScale = 0.01;
  model.scale.set(initialScale, initialScale, initialScale);

  scene.add(model);

  // Add a reddish ambient light to represent Mars' atmosphere
  const marsLight = new THREE.AmbientLight(0xff6347, 0.5);
  scene.add(marsLight);

  // Add rotation controls
  const rotationSpeed = { value: 0.005 };
  modelFolder.add(rotationSpeed, "value", 0, 0.02).name("Rotation Speed");

  // Animate Mars rotation
  function animateMars() {
    model.rotation.y += rotationSpeed.value;
    requestAnimationFrame(animateMars);
  }
  animateMars();
});

loader.load("./source/Mercury.glb", (gltf) => {
  const model = gltf.scene;

  // Set a fixed initial position for Mercury
  const initialPosition = { x: -120, y: 0, z: 0 };
  model.position.set(initialPosition.x, initialPosition.y, initialPosition.z);

  // Set an initial scale for Mercury
  const initialScale = 0.009;
  model.scale.set(initialScale, initialScale, initialScale);

  scene.add(model);

  // Add a subtle ambient light to represent Mercury's lack of atmosphere
  const mercuryLight = new THREE.AmbientLight(0xcccccc, 0.2);
  scene.add(mercuryLight);
  // Add rotation controls
  const rotationSpeed = { value: 0.0029 };
  modelFolder.add(rotationSpeed, "value", 0, 0.01).name("Rotation Speed");

  // Animate Mercury rotation
  function animateMercury() {
    model.rotation.y += rotationSpeed.value;
    requestAnimationFrame(animateMercury);
  }
  animateMercury();
});


loader.load("./source/Venus.glb", (gltf) => {
  const model = gltf.scene;

  // Set a fixed initial position for Mercury
  const initialPosition = { x: -60, y: 0, z: 0 };
  model.position.set(initialPosition.x, initialPosition.y, initialPosition.z);

  // Set an initial scale for Mercury
  const initialScale = 0.009;
  model.scale.set(initialScale, initialScale, initialScale);

  scene.add(model);

  // Add a subtle ambient light to represent Venus's thick atmosphere
  const venusLight = new THREE.AmbientLight(0xffcc99, 0.4);
  scene.add(venusLight);

  // Add rotation controls
  const rotationSpeed = { value: 0.0007 };
  modelFolder.add(rotationSpeed, "value", 0, 0.01).name("Rotation Speed");

  // Animate Venus rotation
  function animateVenus() {
    model.rotation.y += rotationSpeed.value;
    requestAnimationFrame(animateVenus);
  }
  animateVenus();
});

// Update animation function
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate(); 

// Update camera position
camera.position.set(0, 50, 100);
camera.lookAt(scene.position);

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});