// ==========================================
// 1. HERO SECTION: WEBGL CANVAS ANIMATION
// ==========================================
(function() {
    const canvas = document.getElementById('shader-canvas-ANIMATION_2');
    if (!canvas) return;

    function syncSize() {
        const w = canvas.clientWidth || 1280;
        const h = canvas.clientHeight || 720;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
    }
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;
    
    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec3 skyTop = vec3(0.53, 0.81, 0.94);
    vec3 skyBottom = vec3(1.0, 0.8, 0.5);
    vec3 color = mix(skyBottom, skyTop, uv.y);
    float n = snoise(uv * 3.0 + vec2(u_time * 0.05, 0.0));
    n += 0.5 * snoise(uv * 6.0 - vec2(u_time * 0.02, 0.0));
    float clouds = smoothstep(0.4, 0.7, n);
    color = mix(color, vec3(1.0, 1.0, 0.95), clouds * 0.4);
    gl_FragColor = vec4(color, 1.0);
}`;

    function cs(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    window.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width && rect.height) {
            const nx = (event.clientX - rect.left) / rect.width;
            const ny = 1.0 - (event.clientY - rect.top) / rect.height;
            mouse.x = nx * canvas.width;
            mouse.y = ny * canvas.height;
        }
    });

    function render(t) {
        if (typeof ResizeObserver === 'undefined') syncSize();
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (uTime) gl.uniform1f(uTime, t * 0.001);
        if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
        if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }
    render(0);
})();


// ==========================================
// 2. ABOUT ME SECTION: THREE.JS SOOT SPRITES
// ==========================================
(function() {
    const container = document.getElementById('threejs-container-ANIMATION_3');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const sprites = [];
    const spriteCount = 12;

    for (let i = 0; i < spriteCount; i++) {
        const group = new THREE.Group();

        // Soot sprite body
        const bodyGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // Soot sprite eyes
        const eyeGeo = new THREE.SphereGeometry(0.04, 4, 4);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.06, 0.05, 0.12);
        group.add(eyeL);

        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.06, 0.05, 0.12);
        group.add(eyeR);

        group.position.set(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 2
        );

        scene.add(group);
        sprites.push({
            mesh: group,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005
            ),
            phase: Math.random() * Math.PI * 2
        });
    }

    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

        sprites.forEach(s => {
            s.mesh.position.add(s.velocity);
            s.mesh.position.y += Math.sin(time + s.phase) * 0.002;

            if (Math.abs(s.mesh.position.x) > 3) s.velocity.x *= -1;
            if (Math.abs(s.mesh.position.y) > 2) s.velocity.y *= -1;

            s.mesh.rotation.y = Math.sin(time * 0.5 + s.phase) * 0.2;
        });

        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    animate();
})();


// ==========================================
// 3. INTERSECTION OBSERVER & UI EFFECTS
// ==========================================

// --- ANIMASI FADE-UP ---
const fadeOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, fadeOptions);

document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));


// --- DINAMIS NAVBAR NAV-LINK (GARIS BAWAH AKTIF) ---
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const navOptions = {
    // Menggunakan rootMargin agar section terdeteksi aktif saat berada di area tengah/atas layar
    rootMargin: '-30% 0px -60% 0px'
};

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');
            
            navLinks.forEach(link => {
                if (link.getAttribute('data-target') === currentId) {
                    // Tambahkan status aktif (Garis bawah muncul, teks berwarna & tebal)
                    link.classList.add('text-primary', 'font-bold', 'border-primary/50');
                    link.classList.remove('text-on-surface-variant', 'border-transparent');
                } else {
                    // Hapus status aktif dari menu lainnya
                    link.classList.remove('text-primary', 'font-bold', 'border-primary/50');
                    link.classList.add('text-on-surface-variant', 'border-transparent');
                }
            });
        }
    });
}, navOptions);

sections.forEach(section => navObserver.observe(section));


// --- SCROLL BACKGROUND NAVBAR ---
window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav-container');
    if (!nav) return;
    
    if (window.scrollY > 50) {
        nav.classList.add('shadow-md', 'py-3');
        nav.classList.remove('py-4');
    } else {
        nav.classList.remove('shadow-md', 'py-3');
        nav.classList.add('py-4');
    }
});


// --- HOVER EFFECT FOR SKILL CARDS ---
document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.animationPlayState = 'paused';
    });
    card.addEventListener('mouseleave', () => {
        card.style.animationPlayState = 'running';
    });
});