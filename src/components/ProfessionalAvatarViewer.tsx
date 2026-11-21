import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
export function ProfessionalAvatarViewer({onClose}:{onClose:()=>void}) {
 const mount=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null);
 const engine=useRef<{load:(f:File)=>void;rotate:(n:number)=>void;zoom:(n:number)=>void;play:(n:number)=>void}|null>(null);
 const [status,setStatus]=useState('Importa un archivo GLB de avatar profesional.');
 const [clips,setClips]=useState<string[]>([]);
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{
  const host=mount.current;if(!host)return;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#21170f');
  const camera=new THREE.PerspectiveCamera(35,1,.01,100);camera.position.set(0,1.4,4);
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xfff3dd,0x6d4a36,2));
  const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(-3,6,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffe6b7,2);rim.position.set(4,4,-4);scene.add(rim);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,1.4,0);
  let model:THREE.Group|null=null,mixer:THREE.AnimationMixer|null=null,animations:THREE.AnimationClip[]=[],action:THREE.AnimationAction|null=null,disposed=false;
  const resize=()=>{const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const clock=new THREE.Clock();let frame=0;
  const draw=()=>{frame=requestAnimationFrame(draw);mixer?.update(Math.min(clock.getDelta(),.05));controls.update();renderer.render(scene,camera)};draw();
  engine.current={
   load(file){if(!file.name.toLowerCase().endsWith('.glb')){setStatus('Se requiere un archivo .glb');return}
    if(file.size>150000000){setStatus('Archivo demasiado grande (máximo 150 MB)');return}
    const url=URL.createObjectURL(file);setStatus('Cargando avatar…');setLoaded(false);
    new GLTFLoader().load(url,gltf=>{URL.revokeObjectURL(url);if(disposed)return;
     if(model)scene.remove(model);mixer?.stopAllAction();model=gltf.scene;scene.add(model);
     const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
     if(size.y<.001){setStatus('El modelo no contiene geometría visible');return}
     const scale=2.8/size.y;model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
     camera.position.set(0,1.4,Math.max(3.4,size.x*scale*2));controls.target.set(0,1.4,0);controls.update();
     animations=gltf.animations;mixer=new THREE.AnimationMixer(model);setClips(animations.map((c,i)=>c.name||'Pose '+(i+1)));
     setStatus('Modelo cargado: '+file.name);setLoaded(true);
    },undefined,e=>{URL.revokeObjectURL(url);setStatus('Error GLB: '+String(e))});
   },
   rotate(n){const offset=camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0),n);camera.position.copy(controls.target).add(offset);controls.update()},
   zoom(n){camera.position.sub(controls.target).multiplyScalar(n).add(controls.target);controls.update()},
   play(n){if(!mixer||!animations[n])return;action?.fadeOut(.2);action=mixer.clipAction(animations[n]);action.reset().fadeIn(.2).play()}
  };
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.dispose();renderer.domElement.remove();engine.current=null};
 },[]);
 return <div className="absolute inset-0 z-50 flex flex-col bg-[#21170f] text-[#ffe4b5] rounded-xl overflow-hidden">
  <div className="flex gap-2 p-2 bg-[#3c2b1d] items-center flex-wrap">
   <strong className="text-xs mr-auto">Avatar 3D · GLB profesional</strong>
   <input ref={input} type="file" accept=".glb" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)engine.current?.load(f);e.target.value=''}}/>
   <button type="button" onClick={()=>input.current?.click()} className="bg-[#9d712f] px-2 py-1 rounded text-xs">Importar GLB</button>
   <button type="button" disabled={!loaded} title="Guardar imagen PNG" onClick={()=>{const canvas=mount.current?.querySelector('canvas');if(!canvas)return;const link=document.createElement('a');link.download='vestidor-dorado-avatar.png';link.href=canvas.toDataURL('image/png');link.click()}} className="border border-[#a68a56] px-2 py-1 rounded text-xs disabled:opacity-40">Foto PNG</button>
   <button type="button" onClick={onClose} className="border border-[#a68a56] px-2 py-1 rounded text-xs">Cerrar</button>
  </div>
  <div ref={mount} className="flex-1 min-h-0"/>
  <div className="flex gap-2 p-2 bg-[#3c2b1d] items-center flex-wrap text-xs">
   <button type="button" onClick={()=>engine.current?.rotate(-Math.PI/4)}>↶ 45°</button>
   <button type="button" onClick={()=>engine.current?.rotate(Math.PI/4)}>↷ 45°</button>
   <button type="button" onClick={()=>engine.current?.zoom(.8)}>＋</button>
   <button type="button" onClick={()=>engine.current?.zoom(1.25)}>－</button>
   {clips.length>0&&<select aria-label="Animaciones" defaultValue="" className="bg-[#513923]" onChange={e=>engine.current?.play(Number(e.target.value))}><option value="" disabled>Animación</option>{clips.map((c,i)=><option value={i} key={i}>{c}</option>)}</select>}
   <span role="status">{status}</span>
  </div>
 </div>;
}
