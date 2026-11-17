const cards = document.querySelectorAll(".trayectoria .card");

cards.forEach(card => {

    const button = card.querySelector(".card-header");
    const icon = card.querySelector(".icon");

    button.addEventListener("click", () => {

        const isActive = card.classList.contains("active");

        card.classList.toggle("active");

        icon.textContent = isActive ? "+" : "−";

        button.setAttribute("aria-expanded", String(!isActive));

    });

});

/* ==========================================================================
   CARRUSEL DE PROYECTOS (Deslizamiento automático y manual)
   ========================================================================== */

function initProyectosCarousel() {
    const carouselWrapper = document.getElementById("proyectosCarousel");
    const viewport = document.getElementById("carouselViewport");
    const track = document.getElementById("carouselTrack");
    const prevBtn = document.getElementById("carouselPrevBtn");
    const nextBtn = document.getElementById("carouselNextBtn");
    const indicatorsContainer = document.getElementById("carouselIndicators");

    if (!carouselWrapper || !viewport || !track) return;

    const originalCards = Array.from(track.querySelectorAll(".proyecto-card"));
    const totalOriginal = originalCards.length;
    if (totalOriginal < 2) return;

    // Crear clones para bucle infinito suave (2 al inicio y 2 al final)
    const cloneStart1 = originalCards[totalOriginal - 2].cloneNode(true);
    const cloneStart2 = originalCards[totalOriginal - 1].cloneNode(true);
    const cloneEnd1 = originalCards[0].cloneNode(true);
    const cloneEnd2 = originalCards[1].cloneNode(true);

    [cloneStart1, cloneStart2, cloneEnd1, cloneEnd2].forEach(clone => {
        clone.classList.add("is-clone");
        clone.setAttribute("aria-hidden", "true");
    });

    track.insertBefore(cloneStart2, track.firstChild);
    track.insertBefore(cloneStart1, track.firstChild);
    track.appendChild(cloneEnd1);
    track.appendChild(cloneEnd2);

    let allCards = Array.from(track.querySelectorAll(".proyecto-card"));
    const CLONES_BEFORE = 2;
    let currentIndex = CLONES_BEFORE; // Inicia en el primer proyecto real (índice 2)
    let isAnimating = false;

    // Crear puntos indicadores (dots)
    indicatorsContainer.innerHTML = "";
    const dots = [];
    for (let i = 0; i < totalOriginal; i++) {
        const dot = document.createElement("button");
        dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
        dot.setAttribute("aria-label", `Ir al proyecto ${i + 1}`);
        dot.addEventListener("click", () => {
            moveToIndex(i + CLONES_BEFORE);
            restartAutoplay();
        });
        indicatorsContainer.appendChild(dot);
        dots.push(dot);
    }

    // Obtener la posición del centro de la tarjeta respecto al viewport
    function getCenterOffset(index) {
        const card = allCards[index];
        if (!card) return 0;
        const viewportCenter = viewport.offsetWidth / 2;
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        return viewportCenter - cardCenter;
    }

    function updateClasses() {
        allCards.forEach((card, idx) => {
            const isActive = idx === currentIndex;
            card.classList.toggle("is-active", isActive);
        });

        const activeRealIndex = ((currentIndex - CLONES_BEFORE) % totalOriginal + totalOriginal) % totalOriginal;
        dots.forEach((dot, idx) => {
            dot.classList.toggle("is-active", idx === activeRealIndex);
        });
    }

    function updatePosition(animate = true) {
        if (animate) {
            track.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
        } else {
            track.style.transition = "none";
        }
        const offset = getCenterOffset(currentIndex);
        track.style.transform = `translateX(${offset}px)`;
        updateClasses();
    }

    let animationTimeout = null;

    function moveToIndex(index) {
        if (isAnimating) return;
        isAnimating = true;
        currentIndex = index;
        updatePosition(true);

        clearTimeout(animationTimeout);
        animationTimeout = setTimeout(() => {
            isAnimating = false;
        }, 550);
    }

    function nextSlide() {
        if (isAnimating) return;
        moveToIndex(currentIndex + 1);
    }

    function prevSlide() {
        if (isAnimating) return;
        moveToIndex(currentIndex - 1);
    }

    // Manejar salto invisible al llegar a los clones
    track.addEventListener("transitionend", (e) => {
        if (e.target !== track || e.propertyName !== "transform") return;
        isAnimating = false;

        // Si sobrepasamos el final (hacia los clones del final)
        if (currentIndex >= CLONES_BEFORE + totalOriginal) {
            currentIndex = currentIndex - totalOriginal;
            updatePosition(false);
        }
        // Si retrocedemos antes del inicio (hacia los clones del inicio)
        else if (currentIndex < CLONES_BEFORE) {
            currentIndex = currentIndex + totalOriginal;
            updatePosition(false);
        }
    });

    // Clic en tarjetas laterales para centrarlas
    allCards.forEach((card, idx) => {
        card.addEventListener("click", () => {
            if (wasDragging) return;
            if (idx !== currentIndex) {
                moveToIndex(idx);
                restartAutoplay();
            }
        });
    });

    // Botones Siguiente / Anterior
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            nextSlide();
            restartAutoplay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            prevSlide();
            restartAutoplay();
        });
    }

    // -------------------------------------------------------------
    // DESLIZADO AUTOMÁTICO (Autoplay)
    // -------------------------------------------------------------
    const AUTOPLAY_INTERVAL = 3500;
    let autoplayTimer = null;
    let isHovered = false;
    let isPointerDown = false;

    function startAutoplay() {
        stopAutoplay();
        if (isHovered || isPointerDown) return;
        autoplayTimer = setInterval(() => {
            nextSlide();
        }, AUTOPLAY_INTERVAL);
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function restartAutoplay(delay = 3000) {
        stopAutoplay();
        setTimeout(() => {
            if (!isHovered && !isPointerDown) {
                startAutoplay();
            }
        }, delay);
    }

    carouselWrapper.addEventListener("mouseenter", () => {
        isHovered = true;
        stopAutoplay();
    });

    carouselWrapper.addEventListener("mouseleave", () => {
        isHovered = false;
        startAutoplay();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopAutoplay();
        } else {
            startAutoplay();
        }
    });

    // -------------------------------------------------------------
    // DESLIZADO MANUAL (Mouse Drag & Touch Swipe con Pointer Events)
    // -------------------------------------------------------------
    let startX = 0;
    let startY = 0;
    let currentDragOffset = 0;
    let isDragging = false;
    let wasDragging = false;
    let baseTranslate = 0;
    let dragStartTime = 0;

    viewport.addEventListener("pointerdown", (e) => {
        // Solo botón izquierdo del ratón o toque
        if (e.button !== undefined && e.button !== 0) return;

        isPointerDown = true;
        isAnimating = false;
        clearTimeout(animationTimeout);
        wasDragging = false;
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        currentDragOffset = 0;
        dragStartTime = Date.now();
        baseTranslate = getCenterOffset(currentIndex);

        stopAutoplay();
    });

    window.addEventListener("pointermove", (e) => {
        if (!isPointerDown) return;

        const diffX = e.clientX - startX;
        const diffY = e.clientY - startY;

        if (!isDragging) {
            // Comprobar si el movimiento es horizontal dominante
            if (Math.abs(diffX) > 8 && Math.abs(diffX) > Math.abs(diffY)) {
                isDragging = true;
                wasDragging = true;
                viewport.classList.add("is-dragging");
                track.style.transition = "none";
            }
        }

        if (isDragging) {
            currentDragOffset = diffX;
            track.style.transform = `translateX(${baseTranslate + diffX}px)`;
            if (e.cancelable) e.preventDefault();
        }
    });

    function endDrag(e) {
        if (!isPointerDown) return;
        isPointerDown = false;
        viewport.classList.remove("is-dragging");

        if (isDragging) {
            const dragTime = Date.now() - dragStartTime;
            const isFlick = dragTime < 280 && Math.abs(currentDragOffset) > 25;
            const threshold = 50;

            if (currentDragOffset < -threshold || (isFlick && currentDragOffset < 0)) {
                nextSlide();
            } else if (currentDragOffset > threshold || (isFlick && currentDragOffset > 0)) {
                prevSlide();
            } else {
                updatePosition(true); // Regresar al centro si no superó el umbral
            }

            // Pequeño timeout para evitar que el clic posterior active enlaces o tarjetas
            setTimeout(() => {
                isDragging = false;
                wasDragging = false;
            }, 100);
        }

        restartAutoplay();
    }

    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    // Navegación con teclado (Flechas Izquierda / Derecha)
    carouselWrapper.setAttribute("tabindex", "0");
    carouselWrapper.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            prevSlide();
            restartAutoplay();
        } else if (e.key === "ArrowRight") {
            nextSlide();
            restartAutoplay();
        }
    });

    // Reajuste responsivo al cambiar tamaño de pantalla
    window.addEventListener("resize", () => {
        updatePosition(false);
    });

    // Inicialización de posición y arranque automático
    updatePosition(false);
    startAutoplay();

    // Reasegurar centrado cuando todos los recursos y fuentes terminen de cargar
    window.addEventListener("load", () => {
        updatePosition(false);
    });
}

// Inicializar el carrusel cuando el DOM esté listo
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProyectosCarousel);
} else {
    initProyectosCarousel();
}
