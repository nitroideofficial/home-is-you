// --- 1. GLOBAL STATE & UNIVERSE ---
let universeCamera, particlesMesh, shootingStar;
let cosmicSpeed = { multiplier: 1 }; 
let isEndingSequence = false;
let isTransitioningToLetter = false;
const PARTICLES_COUNT = 6000; 
let cameraLookAt = null;

const lerp = (start, end, factor) => start + (end - start) * factor;

const initUniverse = () => {
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    
    cameraLookAt = new THREE.Vector3(0, 0, 0);
    universeCamera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    universeCamera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(PARTICLES_COUNT * 3);

    for(let i = 0; i < PARTICLES_COUNT * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 800;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const material = new THREE.PointsMaterial({ size: 0.005, color: 0xffffff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    const ssGeo = new THREE.CylinderGeometry(0.01, 0.06, 12, 8);
    ssGeo.rotateX(Math.PI / 2);
    const ssMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    shootingStar = new THREE.Mesh(ssGeo, ssMat);
    scene.add(shootingStar);

    let targetMouseX = 0, targetMouseY = 0;
    let currentMouseX = 0, currentMouseY = 0;
    
    const uiLayer = document.getElementById('ui-layer');

    const handlePointerMove = (x, y) => {
        if(isEndingSequence) return;
        targetMouseX = (x / window.innerWidth) - 0.5;
        targetMouseY = (y / window.innerHeight) - 0.5;
    };

    document.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
    document.addEventListener('touchmove', (e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

    const clock = new THREE.Clock();
    const tick = () => {
        const elapsedTime = clock.getElapsedTime();
        
        if (!isEndingSequence) {
            currentMouseX = lerp(currentMouseX, targetMouseX, 0.05);
            currentMouseY = lerp(currentMouseY, targetMouseY, 0.05);

            gsap.set(uiLayer, { x: currentMouseX * 15, y: currentMouseY * 15, rotationY: currentMouseX * 2, rotationX: -currentMouseY * 2 });

            particlesMesh.rotation.y = (elapsedTime * 0.015) + (currentMouseX * 0.1);
            particlesMesh.rotation.x = (elapsedTime * 0.01) + (currentMouseY * 0.1);
            
            const camDriftX = Math.sin(elapsedTime * 0.2) * 2;
            const camDriftY = Math.cos(elapsedTime * 0.2) * 2;

            universeCamera.position.x = lerp(universeCamera.position.x, currentMouseX * 8 + camDriftX, 0.02);
            universeCamera.position.y = lerp(universeCamera.position.y, -currentMouseY * 8 + camDriftY, 0.02);
        } else {
            particlesMesh.rotation.y += 0.0005 * cosmicSpeed.multiplier;
            particlesMesh.rotation.x += 0.0005 * cosmicSpeed.multiplier;
        }
        
        universeCamera.lookAt(cameraLookAt);
        renderer.render(scene, universeCamera);
        requestAnimationFrame(tick);
    };
    tick();

    window.addEventListener('resize', () => {
        universeCamera.aspect = window.innerWidth / window.innerHeight;
        universeCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

const triggerCosmicReaction = (type = 'default') => {
    let multi = 2;
    let lightOp = 0.08;
    let dur = 3;

    if (type === 'pulse') { multi = 1.8; lightOp = 0.1; }
    else if (type === 'ripple') { multi = 1.4; lightOp = 0.06; dur = 2; }
    else if (type === 'letter') { multi = 1.2; lightOp = 0.15; dur = 4; }

    gsap.to(cosmicSpeed, { multiplier: multi, duration: 2, ease: "sine.out" });
    gsap.to(cosmicSpeed, { multiplier: 1, duration: 4, delay: dur, ease: "power2.inOut" });
    
    gsap.fromTo("#magical-light", 
        { opacity: 0, scale: 0.9 }, 
        { opacity: lightOp, scale: 1.1, duration: dur, ease: "sine.out" }
    );
    gsap.to("#magical-light", { opacity: 0, duration: dur, delay: dur, ease: "power2.inOut" });
};

let starLoopActive = false;
window.startShootingStarLoop = () => {
    if(starLoopActive) return;
    starLoopActive = true;

    const fireRandomStar = () => {
        if(!starLoopActive) return;
        const startX = universeCamera.position.x + (Math.random() - 0.5) * 200;
        const startY = universeCamera.position.y + 40 + Math.random() * 40; 
        const startZ = universeCamera.position.z - 80 - Math.random() * 80;
        shootingStar.position.set(startX, startY, startZ);

        const endX = startX - 80 - Math.random() * 60;
        const endY = startY - 80 - Math.random() * 60;
        const endZ = startZ - 40 - Math.random() * 40;
        shootingStar.lookAt(endX, endY, endZ);

        const duration = 1.5 + Math.random() * 1.5;
        gsap.to(shootingStar.material, { opacity: 0.9, duration: duration * 0.3, yoyo: true, repeat: 1 });
        gsap.to(shootingStar.position, {
            x: endX, y: endY, z: endZ, duration: duration, ease: "none",
            onComplete: () => { gsap.delayedCall(3 + Math.random() * 5, fireRandomStar); }
        });
    };
    fireRandomStar();
};

// --- 2. OPENING SEQUENCE ---
const playOpeningSequence = () => {
    const tl = gsap.timeline();
    const randomRotX = Math.floor(Math.random() * 4) * 90;
    const randomRotY = Math.floor(Math.random() * 4) * 90;
    gsap.set("#dice-cube", { rotationX: randomRotX, rotationY: randomRotY });

    tl.to("#text-home", { opacity: 1, y: 0, duration: 2.5, ease: "expo.out", delay: 1 })
      .to("#text-home", { opacity: 0, y: -8, duration: 1.5, ease: "power2.inOut", delay: 2 })
      .to("#text-zuzia", { opacity: 1, y: 0, duration: 2.5, ease: "expo.out" }, "-=0.2")
      .to("#text-zuzia", { opacity: 0, y: -8, duration: 1.5, ease: "power2.inOut", delay: 2 })
      .to("#approaching-star", { opacity: 1, duration: 2.5, ease: "sine.inOut" })
      .to("#approaching-star", { scale: 12, opacity: 0, duration: 3, ease: "power2.in" })
      .to("#premium-gift", { opacity: 1, scale: 1, duration: 2.5, ease: "expo.out" }, "-=1.8")
      .to("#btn-begin", { autoAlpha: 1, duration: 1.5 }, "-=1");
};

const handleGiftOpening = () => {
    const btn = document.getElementById("btn-begin");
    gsap.to(btn, { scale: 0.95, duration: 0.1, ease: "power1.in" });
    btn.style.pointerEvents = "none";

    const tl = gsap.timeline();
    tl.to(btn, { opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.1 })
      .to(".gift-lid", { rotation: -32, x: -4, y: -12, duration: 2, ease: "expo.inOut" }, "-=0.4")
      .to("#magical-light", { opacity: 1, scale: 1.8, duration: 2.5, ease: "sine.inOut" }, "-=1")
      .to(universeCamera.position, { z: universeCamera.position.z - 12, duration: 3, ease: "expo.inOut" }, "-=2.5")
      .to('.gift-wrapper', { opacity: 0, duration: 1 }, "-=1")
      .to({}, { duration: 0.4 }) 
      .call(() => {
          document.getElementById("sequence-opening").classList.remove("active");
          document.getElementById("sequence-memories").classList.add("active");
          const mem1 = document.getElementById("mem-1");
          mem1.classList.add("active");
          gsap.fromTo(mem1, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 2, ease: "power2.out" });
      })
      .to({}, { duration: 0.1 })
      .call(() => {
          const bgAudio = document.getElementById('bg-audio');
          bgAudio.volume = 0;
          const playPromise = bgAudio.play();
          if (playPromise !== undefined) {
              playPromise.then(() => {
                  gsap.killTweensOf(bgAudio);
                  gsap.to(bgAudio, { volume: 0.22, duration: 3, ease: "power1.inOut" });
              }).catch(() => {});
          }
      })
      .to("#magical-light", { opacity: 0, duration: 3, ease: "power2.inOut" }, "-=1");
};

// --- 3. MEMORY INTERACTIONS & LOGIC ---
const setupMemories = () => {
    let currentMemory = 1;

    const advanceMemory = () => {
        const currentEl = document.getElementById(`mem-${currentMemory}`);
        const btn = currentEl.querySelector('button');
        
        gsap.to(btn, { scale: 0.95, duration: 0.1, ease: "power1.in" });
        btn.style.pointerEvents = "none";
        
        document.getElementById('canvas-container').classList.remove('cinematic-blur');
        document.getElementById('aurora').classList.remove('cinematic-blur');

        currentMemory++;
        const nextEl = document.getElementById(`mem-${currentMemory}`);

        gsap.to(universeCamera.position, { z: universeCamera.position.z - 8, duration: 2, ease: "sine.inOut" });

        gsap.to(currentEl, { opacity: 0, y: -15, duration: 1.2, ease: "power2.inOut", delay: 0.1, onComplete: () => {
            currentEl.classList.remove('active');
            if(nextEl) {
                nextEl.classList.add('active');
                gsap.fromTo(nextEl, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 1.5, ease: "expo.out" });
            }
        }});
    };

    document.querySelectorAll('.btn-continue').forEach(btn => btn.addEventListener('click', advanceMemory));

    const revealContent = (memId) => {
        const memEl = document.getElementById(`mem-${memId}`);
        const hint = memEl.querySelector('.interaction-hint');
        const content = memEl.querySelector('.mem-content');
        const p = content.querySelector('p');
        const btn = content.querySelector('button');

        document.getElementById('canvas-container').classList.add('cinematic-blur');
        document.getElementById('aurora').classList.add('cinematic-blur');

        const tl = gsap.timeline();
        tl.to(hint, { opacity: 0, y: 8, duration: 0.6, ease: "power2.in" })
          .set(content, { opacity: 1, y: 0 }) 
          .fromTo(p, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" }, "+=0.15") 
          .fromTo(btn, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power2.out" }, "+=0.3"); 
    };

    const setupVisualHover = (el) => {
        el.addEventListener('mouseenter', () => gsap.to(el, { scale: 1.05, duration: 0.6, ease: "expo.out" }));
        el.addEventListener('mouseleave', () => gsap.to(el, { scale: 1, duration: 0.6, ease: "expo.out" }));
        el.addEventListener('focus', () => gsap.to(el, { scale: 1.05, duration: 0.6, ease: "expo.out" }));
        el.addEventListener('blur', () => gsap.to(el, { scale: 1, duration: 0.6, ease: "expo.out" }));
    };

    const handleKeypress = (e, callback) => {
        if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); callback(); }
    };

    // M1: 3D Dice Roll
    const visDice = document.getElementById('vis-dice');
    setupVisualHover(visDice);
    let m1Done = false;
    
    const triggerM1 = () => {
        if(m1Done) return; m1Done = true;
        visDice.classList.remove('floating'); 
        const cube = document.getElementById('dice-cube');
        const shadow = document.createElement('div');
        shadow.style.cssText = "position:absolute; bottom:-15px; left:15%; width:70%; height:10px; background:rgba(0,0,0,0.5); filter:blur(6px); border-radius:50%; opacity:0; pointer-events:none;";
        visDice.querySelector('.dice-scene').appendChild(shadow);
        
        const currentRotX = gsap.getProperty(cube, "rotationX") || 0;
        const currentRotY = gsap.getProperty(cube, "rotationY") || 0;

        gsap.timeline()
            .to(shadow, { opacity: 0.3, scale: 0.5, duration: 0.4, ease: "power2.out" })
            .to(cube, { y: -50, rotationX: currentRotX - 180, rotationY: currentRotY + 270, duration: 0.4, ease: "power2.out" }, "<")
            .to(shadow, { opacity: 0.8, scale: 1, duration: 1.2, ease: "bounce.out" })
            .to(cube, { y: 0, duration: 1.2, ease: "bounce.out" }, "<")
            .to(cube, { rotationX: 1080, rotationY: 1080, duration: 1.4, ease: "power3.out" }, "<")
            .call(() => triggerCosmicReaction('pulse'), null, "-=1.0")
            .call(() => revealContent(1), null, "-=0.2");
    };
    
    visDice.addEventListener('click', triggerM1);
    visDice.addEventListener('keydown', (e) => handleKeypress(e, triggerM1));
	
    // M2: Chat connect
    const visChat = document.getElementById('vis-chat');
    setupVisualHover(visChat);
    let m2Done = false;
    const triggerM2 = () => {
        if(m2Done) return; m2Done = true;
        visChat.classList.remove('floating');
        gsap.timeline()
          .to('.dot-left', { left: "calc(50% - 5px)", duration: 1.2, ease: "back.in(1)" })
          .to('.dot-right', { right: "calc(50% - 5px)", duration: 1.2, ease: "back.in(1)" }, "<")
          .set('.dot-right', { opacity: 0 }) 
          .to('.dot-left', { scale: 2.2, backgroundColor: "#E5C69F", boxShadow: "0 0 25px rgba(229, 198, 159, 0.8)", duration: 0.15, ease: "power1.out" })
          .to('.dot-left', { scale: 1.1, duration: 1, ease: "elastic.out(1, 0.3)" })
          .call(() => triggerCosmicReaction('ripple'))
          .call(() => revealContent(2));
    };
    visChat.addEventListener('click', triggerM2);
    visChat.addEventListener('keydown', (e) => handleKeypress(e, triggerM2));

    // M3: Mafia Photo
    const visMafia = document.getElementById('vis-mafia');
    setupVisualHover(visMafia);
    const photo = document.getElementById('mafia-photo');
    const glare = visMafia.querySelector('.photo-glare');
    const silhouette = visMafia.querySelector('.mafia-silhouette');

    const testImage = (src) => new Promise((resolve, reject) => {
        const img = new Image(); img.onload = () => resolve(src); img.onerror = reject; img.src = src;
    });

    let imageLoaded = false;
    testImage('images/image1.jpg').catch(() => testImage('images/image1.jpeg'))
        .then(src => {
            photo.style.backgroundImage = `url(${src})`; photo.style.backgroundSize = 'cover'; photo.style.backgroundPosition = 'center';
            silhouette.style.display = 'none'; imageLoaded = true;
        }).catch(() => {});

    let m3Done = false;
    const triggerM3 = () => {
        if(m3Done) return; m3Done = true;
        visMafia.classList.remove('floating');
        gsap.timeline()
            .to(photo, { filter: imageLoaded ? "blur(0px) brightness(1.05) contrast(1.05)" : "blur(0px) brightness(1)", scale: 1, rotationY: 0, rotationX: 0, boxShadow: "0 10px 40px rgba(229, 198, 159, 0.3)", duration: 3, ease: "sine.inOut" })
            .to(glare, { x: "150%", duration: 2.5, ease: "power2.inOut" }, "-=2")
            .call(() => triggerCosmicReaction('pulse'), null, "-=1.5")
            .call(() => revealContent(3), null, "-=0.5");
    };
    visMafia.addEventListener('click', triggerM3);
    visMafia.addEventListener('keydown', (e) => handleKeypress(e, triggerM3));

    // M4: Minecraft Island
    const visMc = document.getElementById('vis-mc');
    setupVisualHover(visMc);
    const dirt = visMc.querySelectorAll('.mc-dirt');
    const grass = visMc.querySelectorAll('.mc-grass');
    const tree = visMc.querySelectorAll('.mc-wood, .mc-leaf');
    const lantern = visMc.querySelectorAll('.mc-lantern');
    const mcGlow = visMc.querySelector('.mc-glow');
    const petals = visMc.querySelectorAll('.mc-petal');
    
    gsap.set('.mc-part', { y: -20, opacity: 0, scale: 0.95, transformOrigin: "50% 50%" });
    let m4Done = false;
    
    const triggerM4 = () => {
        if(m4Done) return; m4Done = true;
        visMc.classList.remove('floating');
        gsap.timeline()
            .to([dirt, grass], { y: 0, opacity: 1, scale: 1, stagger: 0.05, duration: 1.2, ease: "back.out(1.2)" })
            .to(tree, { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 1.2, ease: "back.out(1.5)" }, "-=0.6")
            .to(lantern, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }, "-=0.4")
            .to(mcGlow, { opacity: 0.6, duration: 2, ease: "sine.inOut", yoyo: true, repeat: -1 }, "-=0.2")
            .call(() => {
                visMc.classList.add('gentle-float');
                petals.forEach((petal, i) => {
                    gsap.fromTo(petal, { y: -5, x: 0, opacity: 0, scale: 0.5 }, { y: 45, x: (i % 2 === 0 ? 20 : -20), opacity: 0.8, scale: 1.2, duration: 4 + i, ease: "sine.inOut", repeat: -1, delay: i * 0.8 });
                    gsap.to(petal, { opacity: 0, duration: 1.5, repeat: -1, delay: (4 + i) - 1.5 + (i * 0.8), repeatDelay: (4 + i) - 1.5 });
                });
            })
            .call(() => triggerCosmicReaction('ripple'))
            .call(() => revealContent(4));
    };
    visMc.addEventListener('click', triggerM4);
    visMc.addEventListener('keydown', (e) => handleKeypress(e, triggerM4));

    // M5: Distance
    const visDist = document.getElementById('vis-distance');
    setupVisualHover(visDist);
    let m5Done = false;
    const triggerM5 = () => {
        if(m5Done) return; m5Done = true;
        visDist.classList.remove('floating');
        gsap.timeline()
            .to('#node-in', { scale: 1.4, fill: "#E5C69F", duration: 0.4, ease: "back.out(1.5)" })
            .to('#distance-line', { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" })
            .to('#travel-dot', { opacity: 1, duration: 0.1 }, "<")
            .to('#travel-dot', { cx: 166, duration: 1.8, ease: "power2.inOut" }, "<")
            .to('#node-pl', { scale: 1.4, fill: "#E5C69F", duration: 0.4, ease: "back.out(1.5)" })
            .to('#travel-dot', { scale: 2.5, opacity: 0, duration: 0.4 }, "<")
            .call(() => triggerCosmicReaction('pulse'))
            .call(() => revealContent(5));
    };
    visDist.addEventListener('click', triggerM5);
    visDist.addEventListener('keydown', (e) => handleKeypress(e, triggerM5));

    // M6: Home
    const visHome = document.getElementById('vis-home');
    setupVisualHover(visHome);
    let m6Done = false;
    const triggerM6 = () => {
        if(m6Done) return; m6Done = true;
        visHome.classList.remove('floating');
        gsap.timeline()
            .to('.draw-text', { strokeDashoffset: 0, duration: 3, ease: "power2.inOut" })
            .to('.draw-text', { fill: "#E5C69F", stroke: "transparent", filter: "drop-shadow(0 0 15px rgba(229,198,159,0.3))", duration: 1.5, ease: "sine.inOut" }, "-=0.8")
            .call(() => triggerCosmicReaction('letter'))
            .call(() => revealContent(6));
    };
    visHome.addEventListener('click', triggerM6);
    visHome.addEventListener('keydown', (e) => handleKeypress(e, triggerM6));

    // --- 4. THE LETTER CHAPTER ---
    
    const btnToLetter = document.querySelector('.btn-read-letter');
    btnToLetter.addEventListener('click', () => {
        if (isTransitioningToLetter) return;
        isTransitioningToLetter = true;
        
        gsap.to(btnToLetter, { scale: 0.95, duration: 0.1, ease: "power1.in" });
        btnToLetter.style.pointerEvents = "none";
        document.getElementById('canvas-container').classList.remove('cinematic-blur');
        document.getElementById('aurora').classList.remove('cinematic-blur');

        const tl = gsap.timeline({ delay: 0.1 });
        tl.to('.mem-content', { opacity: 0, y: 15, duration: 1.2, ease: "power2.in" })
          .to('#home-text', { opacity: 0, filter: "blur(10px)", duration: 2, ease: "power2.inOut" }, "-=0.5")
          .to(universeCamera.position, { z: 12, duration: 4.5, ease: "power3.inOut" }, "-=1")
          .to(cosmicSpeed, { multiplier: 0.15, duration: 3, ease: "power2.inOut" }, "-=4")
          .to('#aurora', { opacity: 0.2, duration: 3, ease: "power2.inOut" }, "-=4")
          .call(() => {
              document.getElementById("sequence-memories").classList.remove("active");
              document.getElementById("sequence-letter").classList.add("active");
          })
          .fromTo("#envelope-stage", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 2.5, ease: "expo.out" }, "-=1");
    });

    const envelope = document.getElementById('envelope');
    const envelopeHint = document.getElementById('envelope-hint');
    let envelopeOpened = false;

    const openEnvelope = () => {
        if(envelopeOpened) return; 
        envelopeOpened = true;
        envelope.classList.remove('breathing');
        gsap.to(envelopeHint, { opacity: 0, duration: 0.5 });
        
        const tl = gsap.timeline();
        tl.to('#wax-seal', { scale: 0, opacity: 0, duration: 0.6, ease: "back.in(1.5)" })
          .to('#flap-top', { rotateX: 180, duration: 1.2, ease: "power2.inOut" })
          .to('#envelope-preview', { y: -140, duration: 1.5, ease: "power2.out" }, "-=0.2")
          .to('.envelope-stage', { scale: 1.15, opacity: 0, duration: 1.2, ease: "power2.in" }, "+=0.3")
          .call(() => document.getElementById('envelope-stage').style.display = 'none')
          .to('#letter-view', { autoAlpha: 1, duration: 2, ease: "expo.out" }, "-=0.5")
          .fromTo('.letter-paper', { y: 30, scale: 0.98 }, { y: 0, scale: 1, duration: 2, ease: "expo.out" }, "<")
          .to('#magical-light', { opacity: 0.12, scale: 2, duration: 3, ease: "sine.inOut" }, "-=2")
          .to('#aurora', { opacity: 0.4, duration: 3, ease: "power2.inOut" }, "-=3") 
          .to('#btn-continue-journey', { autoAlpha: 1, pointerEvents: "auto", duration: 1.5, ease: "power2.out" }, "+=1.5");
    };

    envelope.addEventListener('click', openEnvelope);
    envelope.addEventListener('keydown', (e) => handleKeypress(e, openEnvelope));

    const btnVoice = document.getElementById('btn-voice-note');
    const playIcon = btnVoice.querySelector('.play-icon');
    const pauseIcon = btnVoice.querySelector('.pause-icon');
    const voiceStatus = document.getElementById('voice-status');
    const visualizer = document.getElementById('visualizer');
    const voiceAudio = document.getElementById('voice-audio');
    const bgAudio = document.getElementById('bg-audio');
    
    const voiceTracks = ['voice/voice1.mp3', 'voice/voice2.mp3', 'voice/voice3.mp3', 'voice/voice4.mp3', 'voice/voice5.mp3'];
    let playQueue = [];
    let lastPlayed = null;

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    const setNextRandomVoice = () => {
        if (playQueue.length === 0) {
            playQueue = [...voiceTracks];
            shuffleArray(playQueue);
            if (playQueue[0] === lastPlayed && playQueue.length > 1) {
                [playQueue[0], playQueue[1]] = [playQueue[1], playQueue[0]];
            }
        }
        const nextTrack = playQueue.shift();
        lastPlayed = nextTrack;
        voiceAudio.src = nextTrack;
        voiceAudio.load();
    };

    setNextRandomVoice();
    let isPlaying = false;

    voiceAudio.addEventListener('ended', () => {
        isPlaying = false;
        playIcon.style.display = 'block'; pauseIcon.style.display = 'none'; visualizer.classList.remove('active');
        voiceStatus.textContent = "Listen to my voice";
        gsap.to(voiceStatus, { opacity: 0.6, color: "rgba(44, 41, 37, 0.4)", duration: 0.3 });
        gsap.to(cosmicSpeed, { multiplier: 0.15, duration: 1, ease: "power2.in" });
        if (bgAudio) { gsap.killTweensOf(bgAudio); gsap.to(bgAudio, { volume: 0.22, duration: 2, ease: "power2.inOut", delay: 2 }); }
        setNextRandomVoice(); 
    });

    btnVoice.addEventListener('click', () => {
        gsap.to(btnVoice, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
        if (!isPlaying) {
            const playPromise = voiceAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    isPlaying = true; playIcon.style.display = 'none'; pauseIcon.style.display = 'block'; visualizer.classList.add('active');
                    voiceStatus.textContent = "Playing...";
                    gsap.to(voiceStatus, { opacity: 1, color: "var(--ink-color)", duration: 0.3 });
                    gsap.to(cosmicSpeed, { multiplier: 0.05, duration: 1, ease: "power2.out" });
                    if (bgAudio) { gsap.killTweensOf(bgAudio); gsap.to(bgAudio, { volume: 0.05, duration: 1.5, ease: "power2.inOut" }); }
                }).catch(error => {
                    isPlaying = false; voiceStatus.textContent = "Error playing audio";
                    gsap.to(voiceStatus, { opacity: 0.8, color: "#a32222", duration: 0.3 });
                });
            }
        } else {
            isPlaying = false; voiceAudio.pause(); playIcon.style.display = 'block'; pauseIcon.style.display = 'none'; visualizer.classList.remove('active');
            voiceStatus.textContent = "Listen to my voice";
            gsap.to(voiceStatus, { opacity: 0.6, color: "rgba(44, 41, 37, 0.4)", duration: 0.3 });
            gsap.to(cosmicSpeed, { multiplier: 0.15, duration: 1, ease: "power2.in" });
            if (bgAudio) { gsap.killTweensOf(bgAudio); gsap.to(bgAudio, { volume: 0.22, duration: 1.5, ease: "power2.inOut" }); }
        }
    });
};

// --- 5. THE FINAL CHAPTER PRESENTATION ---
const setupEnding = () => {
    const btnEnd = document.getElementById('btn-continue-journey');
    
    btnEnd.addEventListener('click', () => {
        if(isEndingSequence) return;
        isEndingSequence = true;
        btnEnd.style.pointerEvents = "none";

        const tl = gsap.timeline();
        document.getElementById('envelope-stage').style.display = 'flex';
        gsap.set('.envelope-stage', { scale: 1.15, opacity: 1 });

        tl.to('.letter-paper', { rotationX: 15, y: 150, scale: 0.7, opacity: 0, duration: 1.2, ease: "power2.in" })
          .to('#letter-view', { autoAlpha: 0, duration: 0.3 }, "-=0.3")
          .to('#envelope-preview', { y: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")
          .to('#flap-top', { rotateX: 0, duration: 1, ease: "power2.inOut" }, "-=0.2")
          .to('.envelope-wrapper', { y: -80, opacity: 0, scale: 0.7, filter: "blur(12px)", duration: 1.8, ease: "power2.inOut" })
          .call(() => {
              document.getElementById("sequence-letter").classList.remove("active");
              document.getElementById("sequence-ending").classList.add("active");
          })
          .to(universeCamera.position, { y: 15, z: 65, duration: 8, ease: "power2.inOut" }, "-=2")
          .to(cosmicSpeed, { multiplier: 3, duration: 2 }, "-=8")
          .to('#aurora', { opacity: 0.8, duration: 4 }, "-=8")
          .to(cosmicSpeed, { multiplier: 0.2, duration: 6 }, "-=6")
          .to({}, { duration: 2 });

        const msgs = ['#end-msg-1', '#end-msg-2', '#end-msg-3', '#end-msg-4', '#end-msg-5'];
        msgs.forEach((msg, index) => {
            const isLast = index === msgs.length - 1;
            gsap.set(msg, { xPercent: -50, yPercent: -50, y: 15, opacity: 0 });
            tl.to(msg, { opacity: 1, y: 0, duration: 3, ease: "power2.out" }).to({}, { duration: isLast ? 6 : 4 }); 
            
            if (!isLast) {
                tl.to(msg, { opacity: 0, y: -15, duration: 2.5, ease: "power2.in" }).to({}, { duration: 0.8 }); 
            } else {
                tl.call(() => { 
                    if(window.startShootingStarLoop) window.startShootingStarLoop(); 
                    gsap.to('#keepsake-btn', { opacity: 1, pointerEvents: 'auto', duration: 3, delay: 4, ease: "power2.inOut" });
                })
                  .to(msg, { opacity: 0, duration: 5, ease: "power2.inOut" }, "+=1") 
                  .to(universeCamera.position, { z: 120, duration: 25, ease: "sine.inOut" }, "-=4")
                  .to(cosmicSpeed, { multiplier: 0.05, duration: 15 }, "-=25")
                  .to('#aurora', { opacity: 0.1, duration: 15 }, "-=25");

                const bgAudio = document.getElementById('bg-audio');
                if (bgAudio) { gsap.killTweensOf(bgAudio); tl.to(bgAudio, { volume: 0, duration: 15, ease: "power2.inOut" }, "-=25"); }
            }
        });
    });

    // Premium Fix: Keepsake Generator Logic forces FULL scroll height
    const keepsakeBtn = document.getElementById('keepsake-btn');
    if (keepsakeBtn) {
        keepsakeBtn.addEventListener('mouseenter', () => {
            gsap.to(keepsakeBtn, { color: "rgba(255, 255, 255, 0.8)", duration: 0.3 });
            gsap.to('#stardust-cursor', { scale: 2.5, opacity: 0.8, duration: 0.3, ease: "expo.out" });
        });
        
        keepsakeBtn.addEventListener('mouseleave', () => {
            gsap.to(keepsakeBtn, { color: "rgba(255, 255, 255, 0.3)", duration: 0.3 });
            gsap.to('#stardust-cursor', { scale: 1, opacity: 1, duration: 0.3, ease: "expo.out" });
        });

        keepsakeBtn.addEventListener('click', () => {
            gsap.to(keepsakeBtn, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
            const originalLetter = document.getElementById('actual-letter');
            
            const clone = originalLetter.cloneNode(true);
            document.body.appendChild(clone);
            
            // Force the clone to unroll entirely off-screen
            gsap.set(clone, { 
                position: 'absolute', top: 0, left: 0, 
                opacity: 1, scale: 1, rotationX: 0, y: 0, 
                zIndex: -9999, pointerEvents: 'none',
                width: '680px', 
                height: 'auto', 
                maxHeight: 'none',
                overflow: 'visible'
            });
            
            const cloneContent = clone.querySelector('.paper-content');
            if(cloneContent) {
                gsap.set(cloneContent, { height: 'auto', maxHeight: 'none', overflow: 'visible' });
            }
            
            const ignoreElements = clone.querySelectorAll('[data-html2canvas-ignore]');
            ignoreElements.forEach(el => el.style.display = 'none');
            
            html2canvas(clone, { backgroundColor: null, scale: 3, logging: false }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'Letter-from-Yash.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                clone.remove(); 
            }).catch(err => {
                console.error("Snapshot failed:", err);
                clone.remove();
            });
        });
    }
};

// --- Premium Upgrade: 3D Parallax Magnetic Buttons ---
const initMagneticButtons = () => {
    const magneticElements = document.querySelectorAll('.magnetic-btn');
    
    magneticElements.forEach((btn) => {
        const text = btn.querySelector('.btn-text') || btn;
        
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Pull the button
            gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.4, ease: "power2.out" });
            // Move the inner text slightly less to create depth parallax
            if(text !== btn) {
                gsap.to(text, { x: x * 0.1, y: y * 0.1, duration: 0.4, ease: "power2.out" });
            }
        });

        btn.addEventListener('mouseleave', () => {
            // Elastic snap back
            gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
            if(text !== btn) {
                gsap.to(text, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
            }
        });
    });
};

// --- 6. STARDUST CURSOR LOGIC ---
const initStardustCursor = () => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = document.getElementById('stardust-cursor');
    const canvas = document.getElementById('cursor-canvas');
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth; let height = window.innerHeight;
    canvas.width = width; canvas.height = height;

    window.addEventListener('resize', () => {
        width = window.innerWidth; height = window.innerHeight;
        canvas.width = width; canvas.height = height;
    });

    const particles = [];
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    const setCursorX = gsap.quickSetter(cursor, "x", "px");
    const setCursorY = gsap.quickSetter(cursor, "y", "px");

    document.addEventListener('mousemove', (e) => {
        setCursorX(e.clientX); setCursorY(e.clientY);
        particles.push({
            x: e.clientX, y: e.clientY,
            vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8 + 0.2, 
            life: 1, size: Math.random() * 1.5 + 0.5
        });
    });

    const clickables = document.querySelectorAll('button, [role="button"], a');
    clickables.forEach(el => {
        el.addEventListener('mouseenter', () => gsap.to(cursor, { scale: 2.5, opacity: 0.8, duration: 0.3, ease: "expo.out" }));
        el.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3, ease: "expo.out" }));
    });

    const renderParticles = () => {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.025; 
            if (p.life <= 0) { particles.splice(i, 1); i--; continue; }
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(229, 198, 159, ${p.life})`; ctx.fill();
        }
        requestAnimationFrame(renderParticles);
    };
    renderParticles();
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    initUniverse();
    initStardustCursor();
    initMagneticButtons();
    playOpeningSequence();
    setupMemories();
    setupEnding();
    document.getElementById("btn-begin").addEventListener("click", handleGiftOpening);
});
