let yaAbrio = false;
let explosionActivada = false;
const circulosCompletados = [false, false, false];

function activarInvitacion() {
    if (yaAbrio) return;

    const videoSobre = document.getElementById('videoSobre');
    const intro = document.getElementById('contenedor-principal');
    const btnTexto = document.getElementById('btn-toca-abrir');
    const musica = document.getElementById('musicaInvitacion');
    const musicIcon = document.getElementById('music-toggle');

    if (btnTexto) {
        btnTexto.innerHTML = "ABRIENDO INVITACIÓN... 💌";
        btnTexto.style.opacity = "0.7";
    }

    if (musica) {
        musica.play().catch(e => console.log("Audio play err:", e));
    }
    if (musicIcon) musicIcon.style.display = 'flex';

    if (videoSobre) {
        videoSobre.currentTime = 0;
        let playPromise = videoSobre.play();

        const procederAInvitacion = () => {
            if (!yaAbrio) {
                yaAbrio = true;
                transicionAFinal(intro);
            }
        };

        if (playPromise !== undefined) {
            playPromise.then(() => {
                videoSobre.onended = procederAInvitacion;
            }).catch(() => {
                procederAInvitacion();
            });
        } else {
            videoSobre.onended = procederAInvitacion;
        }

        setTimeout(procederAInvitacion, 3500);
    } else {
        transicionAFinal(intro);
    }
}

function transicionAFinal(intro) {
    if (intro) {
        intro.style.transition = "opacity 0.8s ease";
        intro.style.opacity = '0';
    }
    setTimeout(() => {
        if (intro) intro.style.display = 'none';
        const seccionFinal = document.getElementById('seccion-final');

        if (seccionFinal) seccionFinal.classList.remove('oculto');

        window.scrollTo(0, 0);
        iniciarAnimacionesScroll();
        initScratchCircles();
        iniciarContador();
    }, 800);
}

// RASPADITA INTERACTIVA EN LOS 3 CÍRCULOS (#b7d4e4)
function initScratchCircles() {
    const canvases = document.querySelectorAll('.circle-canvas');
    if (!canvases.length) return;

    canvases.forEach((canvas, idx) => {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = 90;

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const SCRATCH_COLOR = '#b7d4e4';
        const label = canvas.getAttribute('data-label') || '';

        ctx.fillStyle = SCRATCH_COLOR;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#4a6fa5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, (size / 2) - 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#2c3528';
        ctx.font = 'bold 11px "TheSeasons", serif';
        ctx.textAlign = 'center';
        ctx.fillText('RASPÁ', size / 2, size / 2 - 2);

        ctx.fillStyle = '#4a6fa5';
        ctx.font = 'normal 9px "TheSeasons", serif';
        ctx.fillText(label, size / 2, size / 2 + 11);

        let isDrawing = false;
        let lastPos = null;

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) * (size / rect.width),
                y: (e.clientY - rect.top) * (size / rect.height)
            };
        }

        function startScratch(e) {
            isDrawing = true;
            lastPos = getPos(e);
            try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
            scratch(e);
        }

        function scratch(e) {
            if (!isDrawing) return;
            if (e.cancelable) e.preventDefault();

            const currentPos = getPos(e);

            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = 24;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            if (lastPos) {
                ctx.moveTo(lastPos.x, lastPos.y);
                ctx.lineTo(currentPos.x, currentPos.y);
            } else {
                ctx.arc(currentPos.x, currentPos.y, 12, 0, Math.PI * 2);
            }
            ctx.stroke();

            lastPos = currentPos;
        }

        function stopScratch(e) {
            if (!isDrawing) return;
            isDrawing = false;
            lastPos = null;
            try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
            verificarReveladoTotal();
        }

        function verificarReveladoTotal() {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let clearPixels = 0;
            const data = imgData.data;

            for (let i = 3; i < data.length; i += 16) {
                if (data[i] === 0) clearPixels++;
            }

            const totalSampled = data.length / 16;
            const porcentaje = (clearPixels / totalSampled) * 100;

            if (porcentaje > 35) {
                canvas.style.opacity = '0';
                setTimeout(() => { canvas.style.display = 'none'; }, 600);

                const container = canvas.parentElement.querySelector('.circle-reveal-content');
                if (container) container.classList.add('revealed-glow');

                circulosCompletados[idx] = true;

                if (circulosCompletados.every(Boolean) && !explosionActivada) {
                    explosionActivada = true;
                    lanzarPetalosDesdeCirculos();

                    const countdown = document.getElementById('countdownCard');
                    if (countdown) {
                        setTimeout(() => {
                            countdown.classList.add('revealed-done');
                        }, 300);
                    }
                }
            }
        }

        canvas.onpointerdown = startScratch;
        canvas.onpointermove = scratch;
        canvas.onpointerup = stopScratch;
        canvas.onpointercancel = stopScratch;
    });
}

// EXPLOSIÓN DE PÉTALOS BLANCOS
function lanzarPetalosDesdeCirculos() {
    const c = document.getElementById('petalsCanvas');
    const circlesWrap = document.getElementById('circlesWrapper');
    if (!c) return;
    const ctx = c.getContext('2d');
    
    c.width = window.innerWidth;
    c.height = window.innerHeight;

    let originX = c.width / 2;
    let originY = c.height / 2;

    if (circlesWrap) {
        const rect = circlesWrap.getBoundingClientRect();
        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 2;
    }

    const petalos = [];
    const numPetalos = 65;

    for (let i = 0; i < numPetalos; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 4;

        petalos.push({
            x: originX,
            y: originY,
            size: Math.random() * 12 + 8,
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed - 2,
            gravity: 0.1,
            rotation: Math.random() * 360,
            rotSpeed: Math.random() * 4 - 2,
            opacity: 1
        });
    }

    let duracion = 0;
    function animar() {
        ctx.clearRect(0, 0, c.width, c.height);
        
        petalos.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = p.opacity;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size / 1.8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += p.gravity;
            p.speedX *= 0.98;
            p.rotation += p.rotSpeed;

            if (duracion > 60) {
                p.opacity -= 0.015;
            }
        });

        duracion++;
        if (duracion < 180) {
            requestAnimationFrame(animar);
        } else {
            ctx.clearRect(0, 0, c.width, c.height);
        }
    }
    animar();
}

// CONTADOR REGRESIVO (03 Octubre 2026)
function iniciarContador() {
    const targetDate = new Date('2026-10-03T19:00:00').getTime();

    function actualizar() {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff <= 0) {
            document.getElementById('cd-days').innerText = '00';
            document.getElementById('cd-hours').innerText = '00';
            document.getElementById('cd-mins').innerText = '00';
            document.getElementById('cd-secs').innerText = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('cd-days').innerText = String(days).padStart(2, '0');
        document.getElementById('cd-hours').innerText = String(hours).padStart(2, '0');
        document.getElementById('cd-mins').innerText = String(mins).padStart(2, '0');
        document.getElementById('cd-secs').innerText = String(secs).padStart(2, '0');
    }

    actualizar();
    setInterval(actualizar, 1000);
}

function toggleMusic() {
    const musica = document.getElementById('musicaInvitacion');
    const icon = document.getElementById('music-toggle');
    if (!musica || !icon) return;
    
    if (musica.paused) {
        musica.play();
        icon.innerHTML = '<i class="fa-solid fa-music"></i>';
    } else {
        musica.pause();
        icon.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    }
}

function iniciarAnimacionesScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function toggleGiftModal() {
  const modal = document.getElementById('gift-modal');
  modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function copiarAliasUeno() {
  navigator.clipboard.writeText('0982073092');
  mostrarToast('¡Alias Ueno copiado al portapapeles! 📋✨');
}

function copiarCuentaFamiliar() {
  navigator.clipboard.writeText('32-1970772');
  mostrarToast('¡Número de cuenta copiado al portapapeles! 📋✨');
}

function mostrarToast(txt) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.innerText = txt;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const seccionFinal = document.getElementById('seccion-final');
    if (seccionFinal && !seccionFinal.classList.contains('oculto')) {
        initScratchCircles();
        iniciarContador();
    }
});