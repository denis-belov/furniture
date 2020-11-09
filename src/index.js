/*
eslint-disable
no-console,
array-element-newline,
id-length,
id-match,
func-style,
no-magic-numbers,
camelcase,
no-bitwise,
no-multiple-empty-lines,
max-statements,
max-len,
prefer-destructuring,
no-underscore-dangle,
*/

import './index.scss';
import '@babel/polyfill';

import * as THREE from 'three';
import getGLTFLoader from 'three/examples/js/loaders/GLTFLoader.js';
import getOrbitControls from 'three/examples/js/controls/OrbitControls.js';
import getDragControls from 'three/examples/js/controls/DragControls.js';
import getTransformControls from 'three/examples/js/controls/TransformControls.js';



getGLTFLoader(THREE);
getOrbitControls(THREE);
getDragControls(THREE);
getTransformControls(THREE);



const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xEEEEEE);
renderer.clearColor();
document.body.appendChild(renderer.domElement);



const canvas = renderer.domElement;



const GLTFLoader = new THREE.GLTFLoader();
const CubeTextureLoader = new THREE.CubeTextureLoader();



const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
canvas.addEventListener('wheel', (evt) => camera.translateZ((Math.sign(evt.deltaY) * 100)));
camera.translateZ(1000);



const cube_render_target = new THREE.WebGLCubeRenderTarget(2048, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const cube_render_target2 = new THREE.WebGLCubeRenderTarget(2048, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });

const cube_camera = new THREE.CubeCamera(0.1, 100000, cube_render_target);
cube_camera.position.set(0, 0, 100);
const cube_camera2 = new THREE.CubeCamera(0.1, 100000, cube_render_target2);
cube_camera2.position.set(0, 0, 100);



// lights
const hemisphere_light = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 1);
scene.add(hemisphere_light);

const directional_light = new THREE.DirectionalLight(0xFFFFFF, 1);
directional_light.position.set(500, 1000, 200);
scene.add(directional_light);
scene.add(directional_light.target);



const loadGLTF = (url, env_map, _callback = () => 0) => new Promise((resolve) => {
  const meshes = [];

  GLTFLoader.load(
    url,

    (gltf) => {
      gltf.scene.traverse((elm) => {
        if (elm.isMesh) {
          if (Array.isArray(elm.material)) {
            elm.material.forEach((_elm) => {
              _elm.envMap = env_map;
              _elm.side = THREE.FrontSide;
            });
            // elm.material.forEach((_elm) => (_elm.envMap = cube_render_target.texture));
          } else {
            elm.material.envMap = env_map;
            elm.material.side = THREE.FrontSide;
            // elm.material.envMap = cube_render_target.texture;
          }

          meshes.push(elm);

          elm._group = gltf.scene;
          elm._meshes = meshes;

          _callback(elm);
        }
      });

      // _callback(gltf.scene);

      resolve(gltf.scene);
    },
  );
});



let animate = () => 0;



let drag_objects = [];

(async () => {
  CubeTextureLoader.setPath('textures/');
  const cube_map = await CubeTextureLoader.load([ 'posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg' ]);

  console.log(cube_map);

  cube_map.generateMipmaps = true;
  cube_map.minFilter = THREE.LinearFilter;
  cube_map.magFilter = THREE.LinearFilter;

  drag_objects = [
    await loadGLTF('models/ameli_sb_2720.glb', cube_map, (_object) => {
      _object.scale.set(150, 150, 150);
      _object.position.set(49576.31168800746, -35048.892479107446, 0.0047091292764270725);
    }),

    await loadGLTF('models/ilona_sb_3076.glb', cube_map, (_object) => {
      _object.scale.set(15000, 15000, 15000);
      _object.position.set(-54703.92379456464, -31448.78168651748, 0.004225422489745499);
      _object.rotation.set(0, 0, -Math.PI * 0.5);
    }),

    await loadGLTF('models/ilona_sb_3077.glb', cube_map, (_object) => {
      _object.scale.set(15000, 15000, 15000);
      _object.position.set(-71746.02129861472, 4330.789296506358, -0.0005818799174654313);
    }),

    await loadGLTF('models/ilona_sb_3078.glb', cube_map, (_object) => {
      _object.scale.set(15000, 15000, 15000);
      _object.position.set(-87397.19597806271, 17247.599060596625, -0.0023173677675236504);
    }),

    await loadGLTF('models/medeia_sb_2347WH.glb', cube_map, (_object) => {
      _object.scale.set(150, 150, 150);
      _object.position.set(-94822.2870785618, 61346.43131030974, -0.008242436639948265);
      _object.rotation.set(0, 0, -Math.PI * 0.5);
    }),
  ];

  scene.add(await loadGLTF('models/conference_room1.glb', cube_map), ...drag_objects);
  // scene.add(...drag_objects);



  // controls
  const orbit_controls = new THREE.OrbitControls(camera, canvas);
  orbit_controls.enableZoom = false;
  orbit_controls.update();



  let raycasted_mesh = null;
  let attached_mesh = null;

  const transform_control = new THREE.TransformControls(camera, renderer.domElement);
  transform_control.addEventListener('change', () => {
    if (attached_mesh) {
      attached_mesh._meshes.forEach((elm) => {
        elm.position.copy(attached_mesh.position);
        elm.rotation.copy(attached_mesh.rotation);
      });
    }
  });
  transform_control.addEventListener('dragging-changed', (evt) => (orbit_controls.enabled = !evt.value));
  scene.add(transform_control);



  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const _obj = [];

  drag_objects.forEach((_scene) => {
    _scene.traverse((elm) => {
      if (elm.isMesh) {
        _obj.push(elm);
      }
    });
  });

  canvas.addEventListener('mousemove', (evt) => {
    mouse.x = ((evt.clientX / window.innerWidth) * 2) - 1;
    mouse.y = (-(evt.clientY / window.innerHeight) * 2) + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(_obj);

    if (intersects.length) {
      if (raycasted_mesh) {
        raycasted_mesh._meshes.forEach((elm) => elm.material.emissive.set(0x000000));
      }

      raycasted_mesh = intersects.sort((a, b) => (a.distance - b.distance))[0].object;

      raycasted_mesh._meshes.forEach((elm) => elm.material.emissive.set(0x00FF00));
    } else if (raycasted_mesh) {
      raycasted_mesh._meshes.forEach((elm) => elm.material.emissive.set(0x000000));

      raycasted_mesh = null;
    }
  });

  canvas.addEventListener('dblclick', () => {
    // mouse.x = ((evt.clientX / window.innerWidth) * 2) - 1;
    // mouse.y = (-(evt.clientY / window.innerHeight) * 2) + 1;

    // raycaster.setFromCamera(mouse, camera);

    // const _obj = [];

    // drag_objects.forEach((_scene) => {
    //   _scene.traverse((elm) => {
    //     if (elm.isMesh) {
    //       _obj.push(elm);
    //     }
    //   });
    // });

    // const intersects = raycaster.intersectObjects(_obj);

    // if (intersects.length) {
    //   _mesh = intersects.sort((a, b) => (a.distance - b.distance))[0].object;

    //   _mesh._meshes.forEach((elm) => elm.material.emissive.set(0xAAAAAA));

    //   transform_control.attach(_mesh);
    // } else {
    //   _mesh._meshes.forEach((elm) => elm.material.emissive.set(0x000000));

    //   transform_control.detach();
    // }

    // console.log(raycasted_mesh);

    if (raycasted_mesh) {
      attached_mesh = raycasted_mesh;

      transform_control.attach(attached_mesh);
    } else {
      attached_mesh = null;

      transform_control.detach();
    }
  });

  window.addEventListener('keydown', (evt) => {
    const key = evt.key;

    if (key === 't') {
      transform_control.setMode('translate');
    } else if (key === 'r') {
      transform_control.setMode('rotate');
    } else if (key === 'q') {
      console.log(attached_mesh);
    }
  });

  // const drag_controls = new THREE.DragControls(drag_objects, camera, canvas);

  // drag_controls.addEventListener('hoveron', () => {
  //   orbit_controls.enabled = false;
  // });

  // drag_controls.addEventListener('hoveroff', () => (orbit_controls.enabled = true));

  // drag_controls.addEventListener('dragstart', (evt) => evt.object._meshes.forEach((elm) => elm.material.emissive.set(0xAAAAAA)));

  // drag_controls.addEventListener('drag', (evt) => {
  //   console.log(evt.object.position);
  //   console.log(evt.object._group.position);

  //   if (evt.object.position.z > 0) {
  //     evt.object.position.setZ(0);
  //   }

  //   evt.object._meshes.forEach((elm) => elm.position.copy(evt.object.position));
  // });

  // drag_controls.addEventListener('dragend', (evt) => evt.object._meshes.forEach((elm) => elm.material.emissive.set(0x000000)));
})();



// let count = 0;

animate = () => {
  requestAnimationFrame(animate);

  // if (count) {
  //   cube_camera.update(renderer, scene);

  //   drag_objects.forEach((_scene) => {
  //     _scene.traverse((elm) => {
  //       if (elm.isMesh) {
  //         if (Array.isArray(elm.material)) {
  //           elm.material.forEach((_elm) => (_elm.envMap = cube_render_target.texture));
  //         } else {
  //           elm.material.envMap = cube_render_target.texture;
  //         }
  //       }
  //     });
  //   });
  // } else {
  //   cube_camera2.update(renderer, scene);

  //   drag_objects.forEach((_scene) => {
  //     _scene.traverse((elm) => {
  //       if (elm.isMesh) {
  //         if (Array.isArray(elm.material)) {
  //           elm.material.forEach((_elm) => (_elm.envMap = cube_render_target.texture));
  //         } else {
  //           elm.material.envMap = cube_render_target2.texture;
  //         }
  //       }
  //     });
  //   });
  // }

  // count = 1 - count;

  // cube_camera.update(renderer, scene);

  renderer.render(scene, camera);
};

animate();
