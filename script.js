/* =============================================
   PABLO CORREA RIBEIRO — PORTFOLIO JS
   Three.js 3D Particles + Interactions
   ============================================= */

(() => {
  'use strict';

  // ─────────────── LOADER ───────────────
  const loader = document.getElementById('loader');
  const loaderProgress = document.getElementById('loader-progress');
  const loaderText = document.getElementById('loader-text');

  let loadProgress = 0;
  const loadInterval = setInterval(() => {
    loadProgress += Math.random() * 15 + 5;
    if (loadProgress >= 100) {
      loadProgress = 100;
      clearInterval(loadInterval);
      loaderText.textContent = '¡Listo!';
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
        initAll();
      }, 400);
    }
    loaderProgress.style.width = loadProgress + '%';
  }, 100);

  document.body.style.overflow = 'hidden';

  // ─────────────── INIT ALL ───────────────
  function initAll() {
    initThreeJS();
    initCustomCursor();
    initNavigation();
    initTypingEffect();
    init3DCard();
    initScrollReveal();
    initCountUp();
    initSmoothScroll();
  }

  // ─────────────── THREE.JS 3D PARTICLES ───────────────
  function initThreeJS() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particles
    const particleCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const accentColor = new THREE.Color(0x00d4ff);
    const secondaryColor = new THREE.Color(0x0080ff);
    const tertiaryColor = new THREE.Color(0x6c5ce7);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 120;
      positions[i3 + 1] = (Math.random() - 0.5) * 120;
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      const colorChoice = Math.random();
      let color;
      if (colorChoice < 0.4) color = accentColor;
      else if (colorChoice < 0.7) color = secondaryColor;
      else color = tertiaryColor;

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for glow particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;
        
        void main() {
          vColor = color;
          vec3 pos = position;
          pos.y += sin(uTime * 0.3 + position.x * 0.05) * 2.0;
          pos.x += cos(uTime * 0.2 + position.z * 0.05) * 1.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * uPixelRatio * (80.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= 0.6;
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Lines connecting nearby particles (constellation effect)
    const lineCount = 200;
    const linePositions = new Float32Array(lineCount * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse interaction
    const mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Scroll interaction
    let scrollY = 0;
    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;
    });

    // Animation loop
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsed;

      // Rotate particles based on mouse
      particles.rotation.y = mouse.x * 0.15;
      particles.rotation.x = mouse.y * 0.1;

      // Scroll-based movement
      particles.position.y = scrollY * 0.02;

      // Subtle auto-rotation
      particles.rotation.z = elapsed * 0.02;

      // Update constellation lines
      const posArray = geometry.attributes.position.array;
      let lineIdx = 0;
      const maxDist = 15;

      for (let i = 0; i < Math.min(particleCount, 100) && lineIdx < lineCount; i++) {
        for (let j = i + 1; j < Math.min(particleCount, 100) && lineIdx < lineCount; j++) {
          const dx = posArray[i * 3] - posArray[j * 3];
          const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
          const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDist) {
            const li = lineIdx * 6;
            linePositions[li] = posArray[i * 3];
            linePositions[li + 1] = posArray[i * 3 + 1];
            linePositions[li + 2] = posArray[i * 3 + 2];
            linePositions[li + 3] = posArray[j * 3];
            linePositions[li + 4] = posArray[j * 3 + 1];
            linePositions[li + 5] = posArray[j * 3 + 2];
            lineIdx++;
          }
        }
      }

      lineGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    });
  }

  // ─────────────── CUSTOM CURSOR ───────────────
  function initCustomCursor() {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    if (!cursor || !follower) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      cursor.style.left = cursorX - 4 + 'px';
      cursor.style.top = cursorY - 4 + 'px';
    });

    function updateFollower() {
      followerX += (cursorX - followerX) * 0.12;
      followerY += (cursorY - followerY) * 0.12;
      follower.style.left = followerX + 'px';
      follower.style.top = followerY + 'px';
      requestAnimationFrame(updateFollower);
    }
    updateFollower();

    // Hover effect on interactive elements
    const hoverables = document.querySelectorAll('a, button, .skill-item, .stat-card, .project-card, .contact-card');
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', () => follower.classList.add('hover'));
      el.addEventListener('mouseleave', () => follower.classList.remove('hover'));
    });
  }

  // ─────────────── NAVIGATION ───────────────
  function initNavigation() {
    const nav = document.getElementById('nav');
    const hamburger = document.getElementById('nav-hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const navLinks = document.querySelectorAll('.nav-link');

    // Hide/show on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 100) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }
      lastScroll = currentScroll;

      // Active section highlighting
      const sections = document.querySelectorAll('.section, .hero');
      let currentSection = '';
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom > 150) {
          currentSection = section.id;
        }
      });

      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + currentSection);
      });
    });

    // Hamburger toggle
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ─────────────── TYPING EFFECT ───────────────
  function initTypingEffect() {
    const element = document.getElementById('typed-role');
    if (!element) return;

    const roles = [
      'Full Stack Developer',
      'Symfony & React Expert',
      'AI & Automation Enthusiast',
      'Docker DevOps',
      'Spring Boot Developer',
    ];

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 80;

    function type() {
      const currentRole = roles[roleIndex];

      if (isDeleting) {
        element.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 40;
      } else {
        element.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 80;
      }

      if (!isDeleting && charIndex === currentRole.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typeSpeed = 300;
      }

      setTimeout(type, typeSpeed);
    }

    type();
  }

  // ─────────────── 3D CARD EFFECT ───────────────
  function init3DCard() {
    const card = document.getElementById('hero-card');
    if (!card) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / centerY * -12;
      const rotateY = (x - centerX) / centerX * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  }

  // ─────────────── SCROLL REVEAL ───────────────
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger the animation
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px',
    });

    reveals.forEach(el => observer.observe(el));
  }

  // ─────────────── COUNT UP ───────────────
  function initCountUp() {
    const counters = document.querySelectorAll('.stat-number[data-count]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.count);
          animateCount(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));

    function animateCount(el, target) {
      let current = 0;
      const increment = target / 40;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = Math.floor(current) + '+';
      }, 40);
    }
  }

  // ─────────────── SMOOTH SCROLL ───────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

})();
