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
  radius: 1.2,
  segments: 20,
  orbitRadius: 20,
  orbitSpeed: 0.1,
  rotationSpeed: 0.005,
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

// Create a circular line to represent the moon's orbit without the center vertex line
const orbitGeometry = new THREE.RingGeometry(moonParams.orbitRadius, moonParams.orbitRadius, 64);
const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5 }); // Increased opacity for better visibility
const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
orbitLine.rotation.x = Math.PI / 2; // Rotate to align with the XY plane
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
moonFolder.add(moonParams, "radius", 0.5, 2).onChange((value) => {
  moonMesh.geometry = new THREE.SphereGeometry(
    value,
    moonParams.segments,
    moonParams.segments
  );
});
moonFolder.add(moonParams, "segments", 10, 50, 1).onChange((value) => {
  moonMesh.geometry = new THREE.SphereGeometry(moonParams.radius, value, value);
});
moonFolder.add(moonParams, "orbitRadius", 10, 30);
moonFolder.add(moonParams, "orbitSpeed", 0.01, 0.5);
moonFolder.add(moonParams, "rotationSpeed", 0.001, 0.01);
moonFolder.add(moonParams, "bumpScale", 0, 0.5).onChange((value) => {
  moonMaterial.bumpScale = value;
});

const loader = new GLTFLoader();

// Load the 3D model and add a circular orbit line
let satellite;
loader.load("./source/satellite.glb", (gltf) => {
  satellite = gltf.scene;
  satellite.name = "Communications Satellite"; // Added name for the model
  satellite.scale.set(
    satelliteParams.scale,
    satelliteParams.scale,
    satelliteParams.scale
    );
    satellite.position.set(0, 0, 0); // Set initial position to the origin
    satellite.rotation.set(0, 0, 0); // Set initial rotation to the origin
    satellite.lookAt(0, 0, 0); // Make the satellite always face the Earth
  scene.add(satellite);

  // Create a circular orbit line for the satellite with GUI control for inclination and color
  const orbitPath = new THREE.TorusGeometry(satelliteParams.radius, 0.05, 16, 100);
  const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }); // Increased opacity for better visibility
  const orbitMesh = new THREE.Mesh(orbitPath, orbitMaterial);
  orbitMesh.rotation.x = Math.PI / 2; // Initially align with the XY plane
  orbitMesh.name = "Satellite Orbit"; // Added name for the model
  scene.add(orbitMesh);

  // Add GUI controls for the satellite and its orbit
  const satelliteFolder = gui.addFolder("Satellite");
  satelliteFolder
    .add(satelliteParams, "scale", 0.001, 0.1)
    .onChange((value) => {
      satellite.scale.set(value, value, value);
    });
  satelliteFolder.add(satelliteParams, "radius", 5, 20).onChange((value) => {
    orbitMesh.geometry.dispose(); // Dispose old geometry
    orbitMesh.geometry = new THREE.TorusGeometry(value, 0.05, 16, 100); // Update the orbit geometry
  });
  satelliteFolder.add(satelliteParams, "orbitSpeed", 0.1, 2);
  satelliteFolder.add(satelliteParams, "verticalAmplitude", 0, 1);
  satelliteFolder
    .add(orbitMesh.rotation, "x", -Math.PI, Math.PI, Math.PI / 180)
    .name("Orbit Inclination X")
    .onChange((value) => {
      orbitMesh.rotation.x = value;
    });
  satelliteFolder
    .add(orbitMesh.rotation, "y", -Math.PI, Math.PI, Math.PI / 180)
    .name("Orbit Inclination Y")
    .onChange((value) => {
      orbitMesh.rotation.y = value;
    });
  satelliteFolder
    .addColor(orbitMaterial, "color")
    .name("Orbit Color")
    .onChange((value) => {
      orbitMaterial.color.set(value);
    });
  satelliteFolder
    .add(orbitMaterial, "opacity", 0.1, 1)
    .name("Orbit Opacity")
    .onChange((value) => {
      orbitMaterial.opacity = value;
    });
  satelliteFolder.open();

  // Start animating the satellite once it's loaded
  animateSatellite();
});
// GUI controls for the moon's orbit visualization with enhanced 3D and line intensity options
const orbitFolder = gui.addFolder("Moon Orbit");
orbitFolder.addColor(orbitMaterial, "color").name("Orbit Color");
orbitFolder.add(orbitMaterial, "opacity", 0, 1).name("Orbit Opacity").onChange(value => {
  orbitMaterial.opacity = value;
});
orbitFolder.add(orbitGeometry.parameters, "thetaSegments", 3, 128, 1).name("Orbit Segments").onChange(value => {
  const newGeometry = new THREE.TorusGeometry(moonParams.orbitRadius, 0.1, 16, value); // Changed to TorusGeometry for 3D effect
  orbitLine.geometry.dispose(); // Dispose old geometry
  orbitLine.geometry = newGeometry;
});
orbitFolder.add(moonParams, "orbitRadius", 10, 30).name("Orbit Radius").onChange(value => {
  const newGeometry = new THREE.TorusGeometry(value, 0.1, 16, orbitGeometry.parameters.thetaSegments); // Changed to TorusGeometry for 3D effect
  orbitLine.geometry.dispose(); // Dispose old geometry
  orbitLine.geometry = newGeometry;
});
orbitFolder.open();

// Satellite parameters
const satelliteParams = {
  scale: 0.01,
  radius: 8,
  orbitSpeed: 0.5,
  verticalAmplitude: 0.5,
};

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
    satellite.position.y =
      Math.sin(time * orbitSpeed * 0.5) * radius * verticalAmplitude;

    // Make the satellite always face the direction it's moving
    satellite.lookAt(
      satellite.position
        .clone()
        .add(
          new THREE.Vector3(
            -Math.sin(time * orbitSpeed),
            Math.cos(time * orbitSpeed * 0.5) * verticalAmplitude,
            Math.cos(time * orbitSpeed)
          )
        )
    );
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

// Animation loop
function animate() {
  requestAnimationFrame(animate);
    controls.update();
    moonMesh.rotation.y += 100 * 0.005;
  renderer.render(scene, camera);
}
animate();

// Add controls for stars
const starFolder = gui.addFolder("Stars");
starFolder.add(starMaterial, "size", 0.1, 3);
starFolder.addColor(starMaterial, "color");

// Function to update GUI
function updateGUI() {
  for (const controller of gui.controllers) {
    controller.updateDisplay();
  }
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
