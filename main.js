

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {RectAreaLightHelper} from 'three/addons/helpers/RectAreaLightHelper.js';

//i just want the watering can to move 
class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
    //watering can reference
    this.wateringCanObject = null; 

    //record reference 

    this.recordObject = null; 
    this.doorObject = null;
    this.doorKnobObject = null;
    this.doorKnob2Object = null;
  }
  
  // set the watering can object
  setWateringCan(wateringCan) {
    this.wateringCanObject = wateringCan;
  }

  setRecord(record){
    this.recordObject = record; 
  }
  setDoor(door){
    this.doorObject = door; 
  }
  setDoorKnob(doorKnob){
    this.doorKnobObject = doorKnob; 
  }
  setDoorKnob2(doorKnob2){
    this.doorKnob2Object = doorKnob2; 
  }
  pick(normalizedPosition, scene, camera, time) {
    // restore the color if there is a picked object
    if (this.pickedObject) {
  //    this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      this.pickedObject = undefined;
    }
 
    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children, true);
    if (intersectedObjects.length) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObjects[0].object;
      // save its color
      this.pickedObjectSavedColor = this.pickedObject.material.emissive ? 
      this.pickedObject.material.emissive.getHex() : 0;
      

    }
    
    return this.pickedObject;
  }
}

function main() {
  // only use one loader for efficieny
  const textureLoader = new THREE.TextureLoader();
 // const textureLoader2 = new THREE.TextureLoader();

  //load the textures
  const woodTexture = textureLoader.load('wood_texture.jpg');
  const whiteTexture = textureLoader.load('white.jpg');
  const checkerboardTexture = textureLoader.load('checkerboard.jpg');
  const recordTexture = textureLoader.load('record.jpg');
  const blueTexture = textureLoader.load('water.jpg');
  const fishTexture = textureLoader.load('petfish.png');
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  whiteTexture.colorSpace = THREE.SRGBColorSpace;
  checkerboardTexture.colorSpace = THREE.SRGBColorSpace;
  recordTexture.colorSpace = THREE.SRGBColorSpace;
  blueTexture.colorSpace = THREE.SRGBColorSpace;
  fishTexture.colorSpace = THREE.SRGBColorSpace;
  
  
  // checkerboard floor pattern 
  checkerboardTexture.wrapS = THREE.RepeatWrapping;
  checkerboardTexture.wrapT = THREE.RepeatWrapping;
  checkerboardTexture.magFilter = THREE.NearestFilter;

  // create the materials once
  const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.7,
    metalness: 0.2
  });

  const whiteMaterial = new THREE.MeshStandardMaterial({
    map: whiteTexture,
  });

 

  const checkerboardMaterial = new THREE.MeshStandardMaterial({
    map: checkerboardTexture,
    side: THREE.DoubleSide,
  });

    const recordMaterial = new THREE.MeshStandardMaterial({
    map: recordTexture,

  });
  const waterMat = new THREE.MeshStandardMaterial({
    map: blueTexture,

  });
  //const fishMat = new THREE.MeshStandardMaterial({
  //  map: fishTexture,

 // });

  function makeLabelCanvas(baseWidth, size, label_name) {
    const borderSize = 2;
    const ctx = document.createElement('canvas').getContext('2d');
    const font =  `${size}px bold sans-serif`;
    ctx.font = font;
    // measure how long the name will be
    const textWidth = ctx.measureText(label_name).width;


  const doubleBorderSize = borderSize * 2;
  const width = baseWidth + doubleBorderSize;
  const height = size + doubleBorderSize;
  ctx.canvas.width = width;
  ctx.canvas.height = height;
 
  // need to set font again after resizing canvas
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
 
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, width, height);
 
  // scale to fit but don't stretch
  const scaleFactor = Math.min(1, baseWidth / textWidth);
  ctx.translate(width / 2, height / 2);
  ctx.scale(scaleFactor, 1);
  ctx.fillStyle = 'white';
  ctx.fillText(label_name, borderSize, borderSize);
 
  return ctx.canvas;
}

  //set canvas and camera
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.shadowMap.enabled = true;
  RectAreaLightUniformsLib.init();

  const fov = 45;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 19);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  //set so u cant go under the plane
  controls.minPolarAngle = Math.PI / 3;
controls.maxPolarAngle = Math.PI / 2;

  controls.update();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('black');

  const cameraPole = new THREE.Object3D();
  scene.add(cameraPole);
  cameraPole.add(camera);

  // pick helper
  const pickHelper = new PickHelper();
  
  // track if the watering can is moving
  let isWateringCanMoving = false;
  let isRecordSpinning = false;
  let isDoorOpened = false; 
  let recordObject = null;
  let doorObject = null;
  let doorKnobObject = null;
  let doorKnob2Object = null;

  let wateringCanTargetY = 0;
  let wateringCanTargetX = 0; 
  let wateringCanTargetZ = 0; 
  let wateringCanObject = null;
  let billboardObject = null;
  const planeSize = 40;
    
  const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
  {
  
    // checkerboard texture
    const repeats = planeSize / 2;
    checkerboardTexture.repeat.set(repeats, repeats);

 
    const mesh = new THREE.Mesh(planeGeo, checkerboardMaterial);
    mesh.receiveShadow = true;
    mesh.rotation.x = Math.PI * -0.5;
    scene.add(mesh);
  }

  {
    //bottom counters
    const boxWidth = 40;
    const boxHeight = 1.75;
    const boxDepth = 2.7;

    //top counters
    const counterW = 40; 
    const counterH = 0.5;
    const counterDepth = 4.5;

    //walls 
    const wallW = 6.5; 
    const wallH = 16; 
    const wallDepth = 0.5; 

    const wallLW =13.5; 
    const wallLH = 16; 
    const wallLDepth = 0.5; 


    const wall2W = 17; 
    const wall2H = 16; 
    const wall2Depth = 0.5; 

    //part above and below window


    const wind2W = 8.5; 
    const wind2H = 5; 
    const wind2D = 0.5; 
    //ceiling 
    const ceilW = 40; 
    const ceilH = 0.5; 
    const ceilD = 40; 

    //side wall 1
    const side1W = 0.3; 
    const side1H = 16;
    const side1D = 40;  

    //shelf for plant
    const shelW = 38; 
    const shelH = 0.5; 
    const shelD = 2.0; 

    //windows 
    const windW = 1; 
    const windH = 6.5; 
    const windD = 0.5;

    const windHW = 8; 
    const windHH = 1; 
    const windHD = 0.5;

 
    //chair bottom
    const chairW = 2; 
    const chairH = 0.3;
    const chairD = 2; 

    //chair back 
    const chairBW = 0.3; 
    const chairBH = 2.5; 
    const chairBD = 2; 

    //record player shelf

    const recordPW = 3;
    const recordPH = 3;
    const recordPD = 3; 
    
    //record player bottom

    const playerBW = 2; 
    const playerBH = 0.5;
    const playerBD = 2; 

    //needle for record player

    const needleW = 0.1;
    const needleH = 0.1;
    const needleD = 0.5;

    const stand2W = 0.1;
    const stand2H = 0.3;
    const stand2D = 0.1;


    //door 
    const doorW = 6.95;
    const doorH = 11;
    const doorD = 0.3;

    //speakers 

    const speakerW = 1.5; 
    const speakerH = 2.5;
    const speakerD = 1.5;


    //table cylinders 
    const tableTopRad = 2; 
    const tableBottomrad = 2; 
    const tableHeight = 0.2; 
    const tableTopSeg = 20; 

    //table stand 
    const standRad = 0.2; 
    const standBrad = 0.2; 
    const standH = 2.9;
    const standSeg = 20;

    //table bottom
    const tableBTRad = 0.75; 
    const tableBBrad = 1; 
    const tableBH = 0.2; 
    const tableBSeg = 20; 

    //plate 
    const plateRad = 0.65; 
    const plateBrad = 0.65; 
    const plateH = 0.1; 
    const plateSeg = 20; 

      const recordRad = 0.9; 
    const recordBrad = 0.9; 
    const recordH = 0.03; 
    const recordSeg = 13; 

    //door knob
    const knobRad = 0.4; 
    const knobBrad = 0.2; 
    const knobH = 0.5; 
    const knobSeg = 13; 

    //water 
    const waterR = 1.0; 
    const waterBR = 0.7;
    const waterH = 0.1;
    const waterSeg = 13; 

    //dodecohedron for fish 
    const fishR = 1; 
    const fishD = 5; 


    const table = new THREE.CylinderGeometry(tableTopRad, tableBottomrad, tableHeight, tableTopSeg);
    const tableS = new THREE.CylinderGeometry(standRad, standBrad, standH, standSeg);
    const tableB = new THREE.CylinderGeometry(tableBTRad, tableBBrad, tableBH, tableBSeg);
    const plate = new THREE.CylinderGeometry(plateRad, plateBrad, plateH, plateSeg);
    const counter = new THREE.BoxGeometry(counterW, counterH, counterDepth);
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const wall = new THREE.BoxGeometry(wallW, wallH, wallDepth);
    const wall2 = new THREE.BoxGeometry(wall2W, wall2H, wall2Depth);
    const wallL = new THREE.BoxGeometry(wallLW, wallLH, wallLDepth);
    const ceiling = new THREE.BoxGeometry(ceilW, ceilH, ceilD);
const recordPlayer = new THREE.BoxGeometry(recordPW, recordPH, recordPD);
const recordBottom = new THREE.BoxGeometry(playerBW, playerBH, playerBD);
const record = new THREE.CylinderGeometry(recordRad, recordBrad, recordH, recordSeg);
const knob = new THREE.CylinderGeometry(knobRad, knobBrad, knobH, knobSeg);
const water = new THREE.CylinderGeometry(waterR, waterBR, waterH, waterSeg);
    const shelf = new THREE.BoxGeometry(shelW, shelH, shelD);
    const window = new THREE.BoxGeometry(windW, windH, windD);
    const windowH = new THREE.BoxGeometry(windHW, windHH, windHD);
    const wind2 = new THREE.BoxGeometry(wind2W, wind2H, wind2D);
    const side1 = new THREE.BoxGeometry(side1W, side1H, side1D);
    const chair_seat = new THREE.BoxGeometry(chairW, chairH, chairD);
    const chair_back = new THREE.BoxGeometry(chairBW, chairBH, chairBD);
 //   const needle = new THREE.BoxGeometry(needleW, needleH, needleD);
 //   const stand = new THREE.BoxGeometry(stand2W, stand2H, stand2D);

 //   const speaker = new THREE.BoxGeometry(speakerW, speakerH, speakerD);

 //   const fish = new THREE.IcosahedronGeometry( fishR, fishD );
    const door = new THREE.BoxGeometry(doorW, doorH, doorD);

    recordObject = makeInstance(record, recordMaterial, -17, 2.85, 1);
    recordObject.name = "record";
  
    doorObject = makeInstance(door, whiteMaterial, 0,5.5,20); 
    doorObject.name = "door1";
    doorKnobObject = makeInstance(knob, woodMaterial, 2, 5, 19.2);
    doorKnobObject.rotation.z += 180;  
    doorKnobObject.rotation.y -= 30; 
    doorKnobObject.rotation.x += 0.9; 
    doorKnobObject.name = "knob";
   
   // doorKnob.name = "knob1";
     doorKnob2Object = makeInstance(knob, woodMaterial, 2,5,20.5);
 //  doorKnob2.rotation.z += 10;  
    doorKnob2Object.rotation.y -= 30; 
    doorKnob2Object.rotation.x += 1.5; 
    doorKnob2Object.name = "knob2";




    const cubes = [

      makeInstance(geometry, woodMaterial, 0, 1, -18),
      
      
      makeInstance(counter, woodMaterial, 0, 2, -17),
   
     
   
      makeInstance(wall, woodMaterial, -17.5, 8.5, -20),
      makeInstance(wall, woodMaterial, 17.5, 8.5, -20),
      makeInstance(wallL, woodMaterial, 0.2, 8.5, -19.998),
     // makeInstance(wall, woodMaterial, -2.5, 10, -20),
     // makeInstance(wall, woodMaterial, 3, 10, -20),
      makeInstance(wall2, woodMaterial, 12, 8, 20),  
      makeInstance(wall2, woodMaterial, -12, 8, 20),  
      makeInstance(ceiling, woodMaterial, 0, 15.75, 0),  
      makeInstance(shelf, woodMaterial, -1, 4.25, -18.5),
      makeInstance(side1, woodMaterial, 20, 8, 0),
      makeInstance(side1, woodMaterial, -20, 8, 0),
      makeInstance(window, woodMaterial, 10, 7.75, -20),
      makeInstance(window, woodMaterial, -10, 7.75, -20),
      makeInstance(windowH, woodMaterial, -10.25, 7.75, -20),
      makeInstance(windowH, woodMaterial, 10.25, 7.75, -20),
      makeInstance(wind2, woodMaterial, -10.5, 13.3, -20),
      makeInstance(wind2, woodMaterial, -10, 2, -20),  
      makeInstance(wind2, woodMaterial, 10, 13.3, -20),,
      makeInstance(wind2, woodMaterial, 10, 2, -20),
      makeInstance(chair_seat, whiteMaterial, 9, 1.5, 0),
      makeInstance(chair_back, whiteMaterial, 10, 2.75, 0),
      makeInstance(recordPlayer, woodMaterial, -17, 1, 1),
      makeInstance(recordBottom, whiteMaterial, -17, 2.5, 1),
   
      makeInstance(wind2, woodMaterial, 0,13.5,20.2),
    
    ];
    
    const cylinders = [
      makeInstance(table, whiteMaterial, 6, 3, 0), 
      makeInstance(tableS, whiteMaterial, 6, 1.5,0), 
      makeInstance(tableS, whiteMaterial, 9.8, 0, -0.7), 
      makeInstance(tableS, whiteMaterial, 8.75, 0, -0.7), 
      makeInstance(tableS, whiteMaterial, 9.8, 0, 0.5), 
      makeInstance(tableS, whiteMaterial, 8.75, 0, 0.5), 
      makeInstance(tableB, whiteMaterial, 6, 0.2, 0), 
      makeInstance(plate, woodMaterial, 6.75, 3.2, 0),
     
      makeInstance(water, waterMat, 0.2,2.45,-17),

    //    makeInstance(record, recordMaterial,-15, 3.75, 0),
    ];

  //  const dodecohedron = [

   //   makeInstance(fish, fishMat, 0,5,0),
    //]
    
    function makeInstance(geometry, material, x, y, z) {
      const cube = new THREE.Mesh(geometry, material);
      cube.castShadow = true;
      scene.add(cube)
      
      // position the cube
      cube.position.x = x;
      cube.position.y = y;
      cube.position.z = z;
      
      return cube;
    }

    function createBillboard() {
      // create the label canvas
      const labelCanvas = makeLabelCanvas(128, 56, "Click Watering Can");
      const billboardTexture = new THREE.CanvasTexture(labelCanvas);
      
      // texture properties
      billboardTexture.minFilter = THREE.LinearFilter;
      billboardTexture.wrapS = THREE.ClampToEdgeWrapping;
      billboardTexture.wrapT = THREE.ClampToEdgeWrapping;
      
      //  material with the canvas texture
      const labelMaterial = new THREE.SpriteMaterial({
       
        map: billboardTexture,
        transparent: true
      });
      labelMaterial.color.setStyle('green');
      
   
      const label = new THREE.Sprite(labelMaterial);

      label.scale.set(3, 1, 1);
    
      label.position.set(10, 5, -11);
      
      // add the billboard to the scene
      scene.add(label);
      
      return label;
    }
    
    // create the billboard
    billboardObject = createBillboard();


    const objLoader = new OBJLoader();
    const objLoader2 = new OBJLoader();
    const objLoader3 = new OBJLoader();
      const objLoader4 = new OBJLoader();
      const objLoader5 = new OBJLoader();
      const objLoader6 = new OBJLoader();
      const objLoader7 = new OBJLoader();
      const objLoader8 = new OBJLoader();
      const objLoader9 = new OBJLoader();
    const mtlLoader = new MTLLoader();
    
     
    mtlLoader.load('plant.mtl', (mtl) => {
      mtl.preload();
      objLoader.setMaterials(mtl);
  
      objLoader.load('plant.obj', (root) => {
        root.scale.set(0.4,0.4,0.4);	
        root.position.set(5,4,-18)
        root.castShadow = true;
        scene.add(root);
      });
    });
   
    const mtlLoader2 = new MTLLoader();
    mtlLoader2.load('stick.mtl', (mtl) => {
      mtl.preload();
      objLoader2.setMaterials(mtl);
      objLoader2.load('stick.obj', (root) => {
        root.scale.set(0.4,0.4,0.4);	
        root.position.set(5,3,0);
        root.rotation.set(0,20,0);
        scene.add(root);
      });
    });
    
    //  reusable materials for the OBJ models
    const greenMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x7bde79,  // green
    });
    
    const blueMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x79dade,  // blue
    });
    
 

   
    mtlLoader.load('sink.mtl', (mtl) => {
      mtl.preload();
      objLoader3.setMaterials(mtl);
      objLoader3.load('sink.obj', (root) => {
        root.scale.set(0.005,0.005,0.005);	
        root.position.set(-2,2.5,-17);
        scene.add(root);
      });
    });

    mtlLoader.load('stove.mtl', (mtl) => {
      mtl.preload();
      objLoader6.setMaterials(mtl);
      objLoader6.load('stove.obj', (root) => {
        root.scale.set(0.5,0.5,0.5);	
        root.position.set(-10,2.29,-16.5);
        scene.add(root);
      });
    });
 



    mtlLoader.load('fridge.mtl', (mtl) => {
      mtl.preload();
      objLoader4.setMaterials(mtl);
      objLoader4.load('fridge.obj', (root) => {
        root.scale.set(5, 5, 5);
        root.rotation.set(0, -30, 0);
        root.position.set(-17.5, 0, -7);
        
        //  shadows for all meshes in the model
        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true; //
          }
        });
        
        scene.add(root);
      });
    });
    mtlLoader.load('cup.mtl', (mtl) => {
      mtl.preload();
      objLoader5.setMaterials(mtl);
      objLoader5.load('cup.obj', (root) => {
        root.scale.set(0.2, 0.2, 0.2);
        root.rotation.set(0, -220, 0);
        root.position.set(6, 3.25, 1);
        

        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true; 
          }
        });
        
        scene.add(root);
      });
    });
    mtlLoader.load('bowl.mtl', (materials) => {
      materials.preload();
      
      objLoader7.setMaterials(materials);
      objLoader7.load('bowl.obj', (root) => {
        root.scale.set(1.25, 1.25, 1.25);
        root.position.set(-10,5.5,-18);
        root.traverse((child) => {
          if (child.isMesh) {
         
            child.castShadow = true;
          
          }
        });
        scene.add(root);
      });
    });

    objLoader.load('bed.obj', (root) => {
  
      
     
        root.scale.set(0.05, 0.05, 0.05);
        root.position.set(15,0,15);
        root.traverse((child) => {
          if (child.isMesh) {
            child.material = whiteMaterial;
            child.castShadow = true;
            child.receiveShadow = true; 
           // child.name = "limb";
           // child.userData.isMan = true; 
          }
        });
        scene.add(root);
      
    });
    mtlLoader.load('pet.mtl', (materials) => {
      materials.preload();
      
      objLoader8.setMaterials(materials);
      objLoader8.load('pet.obj', (root) => {
        root.scale.set(0.05, 0.05, 0.05);
        root.position.set(-10,5,-18);
        
        scene.add(root);
      });
    });
    

    objLoader.load('wateringcan.obj', (root) => {
      root.position.set(13, 2.5, -15);
      root.scale.set(0.25, 0.4, 0.25);
      root.name = "wateringCan"; //  identification
      

      root.traverse((child) => {
        if (child.isMesh) {
          child.material = greenMaterial;
          child.name = "wateringCan_part"; 
        child.userData.isWateringCan = true;
        }
      });
      
      // set to object and get position 
      wateringCanObject = root;
      wateringCanTargetY = root.position.y;
      wateringCanTargetX = root.position.x; 
      wateringCanTargetZ = root.position.z;
      
      //watering can reference in the pick helper
      pickHelper.setWateringCan(root);
      
      // confirm the watering can was loaded
      console.log("Watering can loaded", root);
      
      scene.add(root);
    });

    let man;

    objLoader.load('man.obj', (root) => {
      root.scale.set(1.25, 1.25, 1.25);
      root.name = "man";
    
      root.traverse((child) => {
        if (child.isMesh) {
          child.material = blueMaterial;
          child.castShadow = true;
          child.name = "limb";
          child.userData.isMan = true; 
        }
      });
    
      man = root;
      scene.add(root);
    });
      
    document.addEventListener('keydown', onKeyDown, false);
    
    function onKeyDown(event) {
    
        
        const speed = 0.8; 
        switch (event.keyCode) {
            case 37: // left
            if(man.position.x < 20 && man.position.x > -20){
                man.position.x -= speed;
                
            }
            break;
            case 38: // up
            if(man.position.z < 19 && man.position.z > -14){
              man.position.z -= speed;
           
           }
           break;
            case 39: // right
            if(man.position.x < 17 && man.position.x > -20){
              man.position.x += speed;
             
          }
          break;
             
            case 40: // down
            if(man.position.z < 19){
                man.position.z += speed;
              
            }
               
            break;
            case 81://q
              man.rotation.y += speed/4;
              break;

            
            case 69://e
              man.rotation.y -= speed/4;
              break;
            
          // case 70://f
        
          //   man.rotation.z += speed/4;
          
          //   break;
          
          // case 83: //s
          //   man.rotation.z -= speed/4; 
          //   break;
        }
    }
  
    {
      // skybox
      const cubeTextureLoader = new THREE.CubeTextureLoader();
      const skyboxTexture = cubeTextureLoader.load([
        'fish.jpg',
        'fish.jpg',
        'fish.jpg',
        'fish.jpg',
        'fish.jpg',
        'fish.jpg',
      ]);
      
      scene.background = skyboxTexture;
    }

    //lighting: firectional, hemisphere, rectangular
 //   function updateLight() {
   //   helper.update();
    //}
    

    //rectangular 
    const width = 12;
    const height = 4;

    const skyColor = 0xffcd77; // light blue
    const color = 0xffdd7e;
    const groundColor = 0xffdd7e; // brownish orange
    const intensity = 10;
    const intensityr = 3;
 //  better shadow casting
const light = new THREE.DirectionalLight(color, intensity);

light.castShadow = true;

  

    const rectLight = new THREE.RectAreaLight(color, intensityr, width, height);
    const rectLight2 = new THREE.RectAreaLight(color, intensityr, width, height);
    const hemL = new THREE.HemisphereLight(skyColor, groundColor, intensityr);

    //light.rotation.set(-10,0,0);
    light.position.set(-6, 5, -5);
    rectLight.position.set(10, 4, -18);
    rectLight2.position.set(-10,4,-18);
  
    scene.add(light);
    scene.add(rectLight);
    scene.add(rectLight2);
    camera.add(hemL);
    //const shadowHelper = new THREE.CameraHelper(light.shadow.camera);
    //scene.add(shadowHelper);
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  const pickPosition = {x: 0, y: 0};
  clearPickPosition();
 
  function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width  / rect.width,
      y: (event.clientY - rect.top ) * canvas.height / rect.height,
    };
  }
 
  function setPickPosition(event) {
    const pos = getCanvasRelativePosition(event);
    pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
    pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
  }
 
  function clearPickPosition() {
    // unlike the mouse which always has a position
    // if the user stops touching the screen we want
    // to stop picking. For now we just pick a value
    // unlikely to pick something
    pickPosition.x = -100000;
    pickPosition.y = -100000;
  }
  

  function handleClick(event) {
    // same position as for picking
    setPickPosition(event);
    
    // raycaster for clicking
    const clickRaycaster = new THREE.Raycaster();
    clickRaycaster.setFromCamera(pickPosition, camera);
    
    // intersected objects
    const intersects = clickRaycaster.intersectObjects(scene.children, true);
    
    
    if (intersects.length > 0) {
      console.log("clicked object:", intersects[0].object);
    }
    
    // check if any of the intersected objects is the watering can
    //or if it is the record
    let foundWateringCan = false;
    let foundRecord = false;
    let foundDoor = false;

  
   
    for (let i = 0; i < intersects.length; i++) {
      const obj = intersects[i].object;
      
      // check if  the watering can or part of it
      //i asked claude to help me with this part
      if (obj.name === "wateringCan" || 
          obj.name === "wateringCan_part" || 
          (obj.userData && obj.userData.isWateringCan) ||
          (obj.parent && (obj.parent.name === "wateringCan"))) {
        
    
        foundWateringCan = true;
        console.log("watering can clicked");
        break;
          }

      if(obj.name == "record"){
        foundRecord = true; 
        isRecordSpinning = true; 
        toggleAudio();
        console.log("record clicked");
        
        break;
      }

      if(obj.name == "door1"){

        foundDoor = true; 
        isDoorOpened = true; 
        console.log("door clicked");
        break;

      }
    }
    
    // if watering can was found in the intersects and there is a reference
    if (foundWateringCan && wateringCanObject) {
      // move up if it is at starting position, move down otherwise
      if (!isWateringCanMoving) {
        isWateringCanMoving = true;
        
        // go to plant
        if (wateringCanObject.position.y < 6) {
     
          wateringCanTargetY = 6; 
          wateringCanTargetX = 4; 
          wateringCanTargetZ = -18; 
        } else {
     
          wateringCanTargetY = 3;
          wateringCanTargetX = 13; 
          wateringCanTargetZ = -13; 
          
        }
      }
    }

    
   



}

const listener = new THREE.AudioListener();
camera.add( listener );

// create a global audio source
const sound = new THREE.Audio( listener );
let audioLoaded = false; 

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'bootleg.ogg', function( buffer ) {


console.log(sound.isPlaying);
  sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 0.5 );
//	sound.play();
audioLoaded = true; 

});

//toggle audio on and off 

function toggleAudio(){

  if(!audioLoaded){
    return;
  }

  if(sound.isPlaying){
    console.log("sound playing, pausing");
    
      sound.pause();
      isRecordSpinning = false;
    }
    else{

      console.log("starting audio");
      
      sound.play();
    }
  }


  

  window.addEventListener('mousemove', setPickPosition);
  window.addEventListener('mouseout', clearPickPosition);
  window.addEventListener('mouseleave', clearPickPosition);
  window.addEventListener('click', handleClick); 

  function render(time) {
    time *= 0.001;  // convert to seconds
    
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

   
    pickHelper.pick(pickPosition, scene, camera, time);
    
    // Handle watering can movement if active
    if (isWateringCanMoving && wateringCanObject) {
      // calculate step size based on distance to target
     // move towards target
const stepX = 1;
const stepY = 1;
const stepZ = 1; 
const currentX = wateringCanObject.position.x;
const currentY = wateringCanObject.position.y;
const currentZ = wateringCanObject.position.z;

//const wateringCanTargetX = 4; 
//const wateringCanTargetY = 6;

      
    
      if (Math.abs(currentX - wateringCanTargetX) > 1 || Math.abs(currentY - wateringCanTargetY) > 1 || Math.abs(currentZ - wateringCanTargetZ) > 1) {
        //move x
        
        if (currentX > wateringCanTargetX) {
          wateringCanObject.position.x -= stepX;
        } else if (currentX < wateringCanTargetX) {
          wateringCanObject.position.x += stepX;
        
        }
        
        // move Y 
        if (currentY < wateringCanTargetY) {
          wateringCanObject.position.y += stepY;
        } else if (currentY > wateringCanTargetY) {
          wateringCanObject.position.y -= stepY;
         
        }

        if (currentZ > wateringCanTargetZ) {
          wateringCanObject.position.z -= stepZ;
    
        } else if (currentZ < wateringCanTargetZ) {
          wateringCanObject.position.z += stepZ;


          
        }
      } else {
        //reached targets
        wateringCanObject.position.x = wateringCanTargetX;
        wateringCanObject.position.y = wateringCanTargetY;
        isWateringCanMoving = false;

        if(wateringCanObject.position.x == 4){
        wateringCanObject.rotation.z += 5;
        }
        else if(wateringCanObject.position.x == 13){
          wateringCanObject.rotation.z = 0;
        }
      
      }
    }

    
    cameraPole.rotation.y = 0.1;
   if (isRecordSpinning) {
      // rotate y around y axis 
      recordObject.rotation.y += 0.1; 
    }

  // if(isDoorOpened){

  //   doorObject.rotation.y = -20; 
  //   doorObject.position.x = -2;
  //   doorObject.position.z = 23.5; 
  //  //doorKnobObject.rotation.y = -20; 
 


  

  // }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();