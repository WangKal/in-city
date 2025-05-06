import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, useTexture  } from '@react-three/drei';
import { Box3, Vector3, Color, SRGBColorSpace, ACESFilmicToneMapping,ShaderMaterial, Mesh, DoubleSide } from 'three';
import { ClipLoader } from "react-spinners";


function MySpinner() {
  return <ClipLoader color="#ffffff" size={50} />;
}


// Model component that loads the 3D model and sets up the camera
function Model({ url, controlsRef, cameraRef, setLoading }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (scene && controlsRef.current && cameraRef.current) {
            // Traverse through the scene and update materials
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.envMapIntensity = 1.5; // Boost reflection
        child.material.roughness = 0.4; // Walls should have some roughness
        child.material.metalness = 0.1; // A little bit of metallic to catch light
        child.material.needsUpdate = true;
      }
    });

      const box = new Box3().setFromObject(scene); // ✅ Use imported Box3
      const center = new Vector3();
      const size = new Vector3();
      box.getCenter(center);
      box.getSize(size);

      controlsRef.current.target.copy(center);  // Set target for controls
      controlsRef.current.update();  // Update controls

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

      cameraZ *= 2; // Adjust camera distance based on model size

      cameraRef.current.position.set(center.x, center.y + (size.y * 0.1), cameraZ);
      cameraRef.current.lookAt(center);

     // Wait for one animation frame after loading before hiding the spinner
    requestAnimationFrame(() => {
    requestAnimationFrame(() => {
    setLoading(false);
  });
});


    }
  }, [scene, controlsRef, cameraRef, setLoading]);

  return <primitive object={scene} scale={1} />;
}


function MovingCar({ url, initialPosition, direction = 'forward', curphase  }) {
  const carRef = useRef();
  const { scene } = useGLTF(url);
  const [phase, setPhase] = useState(curphase); // 'zMove' or 'xMove'

  const resetPosition = () => {
    if (carRef.current) {
      carRef.current.position.set(...initialPosition);
    carRef.current.rotation.y = (5 * Math.PI) / 180;; 
    
      setPhase(curphase);
    }
  };

  useFrame((state, delta) => {
    if (carRef.current) {
      
  if (phase === 'zMove') {
  const angle = (-5 * Math.PI) / 180; // 10 degrees tilt
  const moveX = Math.sin(angle); 
  const moveZ = -Math.cos(angle); 
  const speed = 20;

 
  if (direction === 'forward'){ 
  carRef.current.position.x += moveX * speed * delta;
  carRef.current.position.z += moveZ * speed * delta;

if (carRef.current.position.z < -400) {
  carRef.current.rotation.y = (-Math.PI / 2); // Rotate 90 degrees
    
    setPhase('xMove');
  }
  }
  if (direction === 'backward'){
   
   carRef.current.position.x -= moveX * speed * delta;
   carRef.current.position.z -= moveZ * speed * delta;

      if(carRef.current.position.z > -250) {
        resetPosition();
   }
      }
}


else if (phase === 'xMove') {
      

      carRef.current.position.x += (direction === 'forward' ? 1 : -1) * 10 * delta; // Move in x axis

      if (direction === 'forward'){
      
       if(carRef.current.position.x > 300) {
        resetPosition();
      }
    }
      if (direction === 'backward'){
        carRef.current.rotation.y = (Math.PI / 2); // Rotate 90 degrees
 
        if(carRef.current.position.x < 248) {
      
 carRef.current.rotation.y = (185 * Math.PI) / 180;

        setPhase('zMove');
      }
      }
     
    }

    else if (phase === 'xMove2') {
      

      carRef.current.position.x += (direction === 'forward' ? 1 : -1) * 10 * delta; // Move in x axis

      if (direction === 'forward'){
    const angle = (-10 * Math.PI) / 180; // 10 degrees tilt

  carRef.current.rotation.y = (-Math.PI / 2); // Rotate 90 degrees
      
       if(carRef.current.position.x > 300) {
        resetPosition();
      }
    }
      if (direction === 'backward'){
       

        carRef.current.rotation.y = (Math.PI / 2); // Rotate 90 degrees
 
        if(carRef.current.position.x < 80) {
      
 carRef.current.rotation.y = (185 * Math.PI) / 180;

        resetPosition();
      }
      }
     
    }



    }
  });

  return <primitive ref={carRef} object={scene} position={initialPosition} scale={2} curphase={curphase} 
       />;
}
// ToneMapping component to apply realistic lighting and exposure settings
function ToneMapping() {
  const { gl, scene } = useThree();

  useEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping; // ✅ Use stronger tone mapping
    gl.toneMappingExposure = 1.2; // ✅ Slightly boost exposure for a brighter scene
    gl.outputColorSpace = SRGBColorSpace;  // ✅ Set correct color space for output
    gl.physicallyCorrectLights = true; // Ensure lights behave physically correct
    scene.background = new Color('#121212'); // ✅ Set a dark background color for contrast
  }, [gl, scene]);

  return null;
}

function Marker({ position, imageUrl }) {
  const meshRef = useRef();
  const auraRef = useRef();
  const [showImage, setShowImage] = useState(false);
  const texture = useTexture(imageUrl);
  const { camera } = useThree();

  useFrame((state) => {
    const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
    if (meshRef.current && auraRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
      auraRef.current.scale.set(scale * 1.2, scale * 1.2, scale * 1.2);
    }
  });

  return (
    <group position={position}>
      {/* Main clickable sphere */}
      <mesh ref={meshRef} onClick={() => setShowImage(!showImage)}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Aura effect */}
      <mesh ref={auraRef}>
        <sphereGeometry args={[3.2, 64, 64]} />
        <meshStandardMaterial 
          color="#000000"
          transparent
          opacity={0.5}
          emissive="#004080"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Image plane when clicked */}
      {showImage && (
        <mesh position={[6, 4, 0]}>
          <planeGeometry args={[50, 40]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      )}
    </group>
  );
}

function RoadLabel({ position, imageUrl,rotation }) {
  const texture = useTexture(imageUrl);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[30, 20]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}


// Shader code for animated water
const waterShader = {
  vertexShader: `
    varying vec2 vUv;
    uniform float time;
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * 2.0 + time) * 0.3;
      pos.z += cos(pos.y * 3.0 + time * 1.5) * 0.2;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float time;
    void main() {
      float brightness = 0.8 + 0.2 * sin(vUv.x * 10.0 + time * 2.0);
      vec3 waterColor = vec3(0.0, 0.4, 0.7) * brightness;
      gl_FragColor = vec4(waterColor, 1.0);
    }
  `
};

function WaterSurface() {
  const shaderRef = useRef();

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh position={[260, 10, -200]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10, 64, 64]} />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={waterShader.vertexShader}
        fragmentShader={waterShader.fragmentShader}
        uniforms={{ time: { value: 0 } }}
        side={DoubleSide}
      />
    </mesh>
  );

}
function DropUpMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      zIndex: 20,
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: '#222',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        {open ? 'Close ▲' : 'View Duplex ▼'}
      </button>

      {open && (
        <div style={{
          marginTop: '10px',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: '5px',
          padding: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          position: 'absolute',
          bottom: '50px',
          right: '0',
          minWidth: '260px'  // Set minimum width to avoid early wrapping
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li><a href="https://www.youtube.com/watch?v=ZGLsuKx84YQ" target="_blank" rel="noopener noreferrer" style={menuBtnStyle}>289 Incity Suites 3 Bed duplex</a></li>
            <li><a href="https://www.youtube.com/watch?v=U3z-Mwj8omc" target="_blank" rel="noopener noreferrer" style={menuBtnStyle}>289 Incity Suites 2 Bed duplex</a></li>
            <li><a href="https://youtu.be/5H-D-uMpul8" target="_blank" rel="noopener noreferrer" style={menuBtnStyle}>289 Incity Suites 1 Bed duplex</a></li>
            <li><a href="https://www.youtube.com/watch?v=Kq02auvbdn0" target="_blank" rel="noopener noreferrer" style={menuBtnStyle}>289 Incity Suites Studio</a></li>
          </ul>
        </div>
      )}
    </div>
  );
}

const menuBtnStyle = {
  display: 'inline-block',
  whiteSpace: 'nowrap',
  color: '#000',
  padding: '8px 0',
  textDecoration: 'none',
  cursor: 'pointer',
};


export default function Home() {
  const controlsRef = useRef();
  const cameraRef = useRef();
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: 'white', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {loading && (
        <div style={{
          position: 'absolute',
          zIndex: 10,
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
        }}>
          <MySpinner/>
        </div>
      )}
      <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#121212',
       overflow: 'hidden'
      }}>
        <Canvas
          camera={{ position: [0, 5, 5], fov: 60 }}
          onCreated={({ camera }) => {
            cameraRef.current = camera;
          }}
          shadows
          style={{ width: '100%', height: '100%' }}
        >
           {/* HDRI Background and lighting */}
  <Suspense fallback={null}>
  <color attach="background" args={['white']} />
     <Environment preset="sunset"  /> 
    {/* "sunset", "warehouse", "city", "dawn", "forest", etc. */}
    {/* OR use a real HDR file: <Environment files="/path/to/yourHDR.hdr" background /> */}
  </Suspense>

  {/* Optional lights if you still want small boosts */}
  <ambientLight intensity={0.2} />
  <directionalLight 
    position={[10, 30, 10]} 
    intensity={1.2} 
    castShadow 
    shadow-mapSize-width={2048}
    shadow-mapSize-height={2048}
    shadow-camera-near={1}
    shadow-camera-far={100}
    shadow-camera-left={-50}
    shadow-camera-right={50}
    shadow-camera-top={50}
    shadow-camera-bottom={-50}
    color={0xfff0e5}

   />

          {/* OrbitControls for interactive camera movement */}
          <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            enableRotate={true}
            enablePan={true}
            autoRotate={false}
            autoRotateSpeed={1}
            minDistance={1}
            maxDistance={250}
            minPolarAngle={Math.PI / 4}   // 45 degrees down
            maxPolarAngle={Math.PI / 2}/>
          <ToneMapping />
          {/* Suspense to handle the loading state of the model */}
          <Suspense fallback={null}>
          <color attach="background" args={['white']} />
            <Model url="/incity.glb" controlsRef={controlsRef} cameraRef={cameraRef} setLoading={setLoading} />
           <MovingCar url="/car1.glb" initialPosition={[260, 0, -200]} direction="forward" curphase="zMove" />
            <MovingCar url="/car2.glb" initialPosition={[300, 0, -385]} direction="backward" curphase="xMove" />
            <MovingCar url="/car3.glb" initialPosition={[300, 0, -385]} direction="backward" curphase="xMove2" />
            <MovingCar url="/car4.glb" initialPosition={[80, 0, -400]} direction="forward" curphase="xMove2" />
                                   

             {/* Markers */}
          <Marker position={[25, 20, -380]} imageUrl="/MainGate.png" />
          <Marker position={[10, 10, -200]} imageUrl="/MainGate.png" />
          <Marker position={[20, 10, -165]} imageUrl="/MainGate.png" />
          
          <Marker position={[15, 10, -100]} imageUrl="/Boulevard.png" />
          

          <Marker position={[50, 40, -200]} imageUrl="/RoofTerrace.png" />
          <Marker position={[120, 40, -200]} imageUrl="/RoofTerrace.png"/>
          <Marker position={[140, 40, -200]} imageUrl="/RoofTerrace.png"/>
          <Marker position={[160, 40, -150]} imageUrl="/RoofTerrace.png"/>
          <Marker position={[180, 40, -185]} imageUrl="/RoofTerrace.png"/>
          <Marker position={[150, 40, -95]} imageUrl="/RoofTerrace.png"/>
          <Marker position={[80, 40, -95]} imageUrl="/RoofTerrace.png"/>
          <Marker position={[80, 40, -145]} imageUrl="/RoofTerrace.png"/>

          <Marker position={[90, 10, -180]} imageUrl="/ClubHouse.png"/>
          <Marker position={[230, 10, -200]} imageUrl="/ConvenienceStore.png"/>
           <Marker position={[230, 10, -147]} imageUrl="/SecondaryGate.png"/>
           
           <Marker position={[205, 40, -110]} imageUrl="/FoodCourt.png"/>
    
<RoadLabel position={[260, 1, -245]} imageUrl="/MeruRoad.png" rotation ={[-Math.PI / 2, 0, 39.4]} />
  <RoadLabel position={[170, 1, -390]} imageUrl="/GeneralWaruingiStreet.png" rotation ={[-Math.PI / 2, 0, 28.3]}/>
  <RoadLabel position={[120, 1, -68]} imageUrl="/LumbwaStreet.png" rotation ={[-Math.PI / 2, 0, 31.5]}/>
  
 
          </Suspense>



  
        </Canvas>

{/* 🔹 Logo in top-left corner */}
    <img
      src="/Logo.png"
      alt="Logo"
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        height: '60px',
        zIndex: 20
      }}
    />

    {/* 🔹 Drop-up button at bottom-right */}
    <DropUpMenu />



      </div>

      {/* CSS for the loading spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
