"use client";

import { useEffect, useRef } from "react";
// Só os TIPOS (some no build); o Three.js de verdade carrega sob demanda lá embaixo.
import type * as THREE from "three";

/**
 * Cena 3D do login: um "bairro" de prédios com janelas acendendo, girando devagar,
 * que reage ao mouse (parallax) + partículas de luz. Three.js só carrega aqui (import
 * dinâmico), então não pesa no resto do sistema. Quem pede menos movimento no sistema
 * (prefers-reduced-motion) vê a cena parada.
 */
export function Cena3D() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelado = false;
    let limpar = () => {};

    (async () => {
      const THREE = await import("three");
      if (cancelado || !el) return;

      const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const largura = () => el.clientWidth || 1;
      const altura = () => el.clientHeight || 1;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(largura(), altura());
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050505, 0.022);

      const camera = new THREE.PerspectiveCamera(38, largura() / altura(), 0.1, 200);
      camera.position.set(0, 9, 26);

      // Luzes (amarelo e preto, pedido do Rodrigo): ambiente neutra + luz dourada + contraluz âmbar.
      scene.add(new THREE.AmbientLight(0x9a8f6a, 0.45));
      const luz = new THREE.DirectionalLight(0xffe08a, 1.2);
      luz.position.set(8, 14, 10);
      scene.add(luz);
      const contraluz = new THREE.PointLight(0xffb000, 1.6, 60);
      contraluz.position.set(-10, 6, -8);
      scene.add(contraluz);

      // Textura de janelas (desenhada num canvas): acesas em amarelo/dourado sobre preto.
      const texturaJanelas = (seed: number) => {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 128;
        const g = c.getContext("2d")!;
        g.fillStyle = "#0a0a0a";
        g.fillRect(0, 0, 64, 128);
        let r = seed;
        const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
        for (let y = 6; y < 124; y += 10) {
          for (let x = 5; x < 60; x += 11) {
            const v = rand();
            g.fillStyle = v > 0.62 ? (v > 0.86 ? "#fff3b0" : "#facc15") : "#1c1a12";
            g.fillRect(x, y, 7, 6);
          }
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.magFilter = THREE.NearestFilter;
        return t;
      };

      // Bairro: prédios em grade, altura variando (os do meio mais altos).
      const grupo = new THREE.Group();
      // Cidade um pouco à direita e mais baixa: o título do login fica livre à esquerda.
      grupo.position.set(4.5, -0.5, 0);
      scene.add(grupo);
      const descartar: { dispose: () => void }[] = [];
      const geoPredio = new THREE.BoxGeometry(1, 1, 1);
      descartar.push(geoPredio);
      const janelasAcesas: THREE.MeshStandardMaterial[] = [];
      let seed = 7;
      for (let i = -4; i <= 4; i++) {
        for (let j = -4; j <= 4; j++) {
          seed += 13;
          const distCentro = Math.hypot(i, j);
          if (distCentro > 4.6 || Math.random() < 0.18) continue;
          const alturaP = Math.max(1.2, 9 - distCentro * 1.6 + Math.random() * 3.2);
          const tex = texturaJanelas(seed);
          tex.repeat.set(1, Math.max(1, Math.round(alturaP / 2.2)));
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          const mat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            map: tex,
            emissive: 0xffffff,
            emissiveMap: tex,
            emissiveIntensity: 0.9 + Math.random() * 0.4,
            roughness: 0.45,
            metalness: 0.35,
          });
          janelasAcesas.push(mat);
          descartar.push(tex, mat);
          const predio = new THREE.Mesh(geoPredio, mat);
          const larg = 0.8 + Math.random() * 0.5;
          predio.scale.set(larg, alturaP, larg);
          predio.position.set(i * 1.45, alturaP / 2, j * 1.45);
          grupo.add(predio);
        }
      }

      // Chão com brilho suave + grade.
      const chaoGeo = new THREE.CircleGeometry(9, 64);
      const chaoMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.1 });
      const chao = new THREE.Mesh(chaoGeo, chaoMat);
      chao.rotation.x = -Math.PI / 2;
      grupo.add(chao);
      const grade = new THREE.PolarGridHelper(9, 16, 8, 64, 0xfacc15, 0x6b5a12);
      (grade.material as THREE.Material).transparent = true;
      (grade.material as THREE.Material).opacity = 0.35;
      grade.position.y = 0.01;
      grupo.add(grade);
      descartar.push(chaoGeo, chaoMat);

      // Partículas de luz subindo.
      const N = 420;
      const pos = new Float32Array(N * 3);
      for (let k = 0; k < N; k++) {
        pos[k * 3] = (Math.random() - 0.5) * 26;
        pos[k * 3 + 1] = Math.random() * 16;
        pos[k * 3 + 2] = (Math.random() - 0.5) * 26;
      }
      const partGeo = new THREE.BufferGeometry();
      partGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const partMat = new THREE.PointsMaterial({
        color: 0xfacc15,
        size: 0.07,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const particulas = new THREE.Points(partGeo, partMat);
      scene.add(particulas);
      descartar.push(partGeo, partMat);

      // Mouse → parallax suave da câmera.
      const alvo = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        alvo.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        alvo.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      };
      window.addEventListener("pointermove", onMove);

      const onResize = () => {
        renderer.setSize(largura(), altura());
        camera.aspect = largura() / altura();
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(el);

      const relogio = new THREE.Clock();
      let raf = 0;
      const quadro = () => {
        const t = relogio.getElapsedTime();
        if (!reduzido) {
          grupo.rotation.y = t * 0.08;
          grupo.position.y = -0.5 + Math.sin(t * 0.6) * 0.15;
          // Janelas "respirando" (acendem e apagam devagar, cada prédio num ritmo).
          janelasAcesas.forEach((m, idx) => {
            m.emissiveIntensity = 0.95 + Math.sin(t * 0.9 + idx * 1.7) * 0.3;
          });
          const p = partGeo.attributes.position as THREE.BufferAttribute;
          for (let k = 0; k < N; k++) {
            let y = p.getY(k) + 0.012;
            if (y > 16) y = 0;
            p.setY(k, y);
          }
          p.needsUpdate = true;
          camera.position.x += (alvo.x * 3 - camera.position.x) * 0.03;
          camera.position.y += (9 - alvo.y * 2 - camera.position.y) * 0.03;
        }
        camera.lookAt(3, 3.5, 0);
        renderer.render(scene, camera);
        if (!reduzido) raf = requestAnimationFrame(quadro);
      };
      quadro();

      limpar = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        ro.disconnect();
        descartar.forEach((d) => d.dispose());
        (grade.geometry as THREE.BufferGeometry).dispose();
        (grade.material as THREE.Material).dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      cancelado = true;
      limpar();
    };
  }, []);

  return <div ref={ref} className="absolute inset-0" aria-hidden="true" />;
}
