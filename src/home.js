import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment  } from '@react-three/drei';
import { Box3, Vector3, Color, SRGBColorSpace, ACESFilmicToneMapping } from 'three';
import { EffectComposer, Bloom,Vignette,Noise } from '@react-three/postprocessing'; // Optional


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

      setLoading(false); // ✅ Hide loading spinner once model is loaded
    
      

    }
  }, [scene, controlsRef, cameraRef, setLoading]);

  return <primitive object={scene} scale={1} />;
}


function MovingCar({ url, initialPosition, direction = 'forward'  }) {
  const carRef = useRef();
  const { scene } = useGLTF(url);
  const [phase, setPhase] = useState('zMove'); // 'zMove' or 'xMove'

  const resetPosition = () => {
    if (carRef.current) {
      carRef.current.position.set(...initialPosition);
    carRef.current.rotation.y = (5 * Math.PI) / 180;; 
    
      setPhase('zMove');
    }
  };

  useFrame((state, delta) => {
    if (carRef.current) {
      
  if (phase === 'zMove') {
  const angle = (-5 * Math.PI) / 180; // 10 degrees tilt
  const moveX = Math.sin(angle); 
  const moveZ = -Math.cos(angle); 
  const speed = 20;

  carRef.current.position.x += moveX * speed * delta;
  carRef.current.position.z += moveZ * speed * delta;

  if (direction === 'forward' && carRef.current.position.z < -400) {
    carRef.current.rotation.y = (-Math.PI / 2); // Rotate 90 degrees
    setPhase('xMove');
  }
  if (direction === 'backward' && carRef.current.position.z > -250) {
        carRef.current.rotation.y = Math.PI / 2; // Rotate 90 degrees right (clockwise)
        setPhase('xMove');
      }
}


else if (phase === 'xMove') {
      carRef.current.position.x += (direction === 'forward' ? 1 : -1) * 10 * delta; // Move in x axis

      if (direction === 'forward' && carRef.current.position.x > 300) {
        resetPosition();
      }
      if (direction === 'backward' && carRef.current.position.x < 200) {
        resetPosition();
      }
     
    }



    }
  });

  return <primitive ref={carRef} object={scene} position={initialPosition} scale={2} 
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

function Marker({ position }) {
  const meshRef = useRef();
  const auraRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current && auraRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      meshRef.current.scale.set(scale, scale, scale);
      auraRef.current.scale.set(scale * 1.2, scale * 1.2, scale * 1.2); // Aura slightly bigger
    }
  });

  return (
    <group position={position}>
      {/* Main white sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Blue aura */}
      <mesh ref={auraRef}>
        <sphereGeometry args={[3.2, 64, 64]} /> {/* slightly larger radius */}
        <meshStandardMaterial 
          color="#000000"
          transparent
          opacity={0.5} 
          emissive="#004080"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  )
}



export default function Home() {
  const controlsRef = useRef();
  const cameraRef = useRef();
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#121212', 
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
          animation: 'spin 2s linear infinite'
        }}>
          Loading...
        </div>
      )}
      <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1e1e1e',
        borderRadius: '12px',
        boxShadow: '0px 0px 30px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          onCreated={({ camera }) => {
            cameraRef.current = camera;
          }}
          style={{ width: '100%', height: '100%' }}
        >
           {/* HDRI Background and lighting */}
  <Suspense fallback={null}>
  <color attach="background" args={['white']} />
    {/* <Environment preset="sunset" background /> */}
    {/* "sunset", "warehouse", "city", "dawn", "forest", etc. */}
    {/* OR use a real HDR file: <Environment files="/path/to/yourHDR.hdr" background /> */}
  </Suspense>

  {/* Optional lights if you still want small boosts */}
  <ambientLight intensity={0.2} />
  <directionalLight position={[5, 10, 5]} intensity={0.5} castShadow />

          {/* OrbitControls for interactive camera movement */}
          <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            enableRotate={true}
            enablePan={true}
            autoRotate={false}
            autoRotateSpeed={1}
            minDistance={1}
            maxDistance={200}
            minPolarAngle={Math.PI / 4}   // 45 degrees down
            maxPolarAngle={Math.PI / 2}/>
          <ToneMapping />
          {/* Suspense to handle the loading state of the model */}
          <Suspense fallback={null}>
          <color attach="background" args={['white']} />
            <Model url="/incity2.glb" controlsRef={controlsRef} cameraRef={cameraRef} setLoading={setLoading} />
           <MovingCar url="/car1.glb" initialPosition={[260, 0, -200]} direction="forward" />
           

             {/* Markers */}
          <Marker position={[50, 40, -200]} />
          <Marker position={[120, 40, -200]} />
          <Marker position={[140, 40, -200]} />
          <Marker position={[160, 40, -150]} />
          <Marker position={[160, 40, -150]} />
          <Marker position={[180, 40, -185]} />
          <Marker position={[150, 40, -95]} />
          <Marker position={[80, 40, -95]} />
          <Marker position={[80, 40, -145]} />

          <Marker position={[90, 10, -180]} />
          <Marker position={[230, 10, -200]} />
           <Marker position={[205, 10, -110]} />
          <Marker position={[260, 50, -200]} />
          </Suspense>


<EffectComposer>
  <Bloom 
    intensity={1.5}
    luminanceThreshold={0.2}
    luminanceSmoothing={0.05}
    radius={0.8}
  />
  <Vignette 
    eskil={false} 
    offset={0.2} 
    darkness={0.8} 
  />
  <Noise opacity={0.04} />
</EffectComposer>


  
        </Canvas>
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
