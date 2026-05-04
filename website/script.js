const carousel = document.querySelector(".phone-carousel");

if (carousel) {
  carousel.querySelectorAll('.phone[aria-hidden="true"]').forEach((slide) => slide.remove());

  const realSlides = Array.from(carousel.querySelectorAll(".phone"));
  const firstClone = realSlides[0].cloneNode(true);
  const lastClone = realSlides[realSlides.length - 1].cloneNode(true);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  firstClone.setAttribute("aria-hidden", "true");
  lastClone.setAttribute("aria-hidden", "true");
  carousel.prepend(lastClone);
  carousel.append(firstClone);

  const firstRealSlide = 1;
  const lastRealSlide = realSlides.length;
  const firstCloneSlide = realSlides.length + 1;
  const lastCloneSlide = 0;
  let currentSlide = firstRealSlide;
  let timerId;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let didSwipe = false;
  let isLooping = false;
  let wheelLocked = false;

  const setSlide = (slide, instant = false) => {
    if (instant) {
      carousel.classList.add("is-resetting");
    }

    currentSlide = slide;
    carousel.style.transform = `translateX(calc(var(--phone-step) * -${currentSlide}))`;

    if (instant) {
      void carousel.offsetHeight;
      carousel.classList.remove("is-resetting");
    }
  };

  const resetAfterLoop = () => {
    if (currentSlide === firstCloneSlide) {
      setSlide(firstRealSlide, true);
    }

    if (currentSlide === lastCloneSlide) {
      setSlide(lastRealSlide, true);
    }

    isLooping = false;
  };

  const goNext = () => {
    if (isLooping) return;

    setSlide(currentSlide + 1);

    if (currentSlide === firstCloneSlide) {
      isLooping = true;
      window.setTimeout(resetAfterLoop, 720);
    }
  };

  const goPrevious = () => {
    if (isLooping) return;

    setSlide(currentSlide - 1);

    if (currentSlide === lastCloneSlide) {
      isLooping = true;
      window.setTimeout(resetAfterLoop, 720);
    }
  };

  const restartTimer = () => {
    if (reducedMotion) return;
    window.clearInterval(timerId);
    timerId = window.setInterval(goNext, 4000);
  };

  carousel.addEventListener("click", () => {
    if (didSwipe) {
      didSwipe = false;
      return;
    }

    goNext();
    restartTimer();
  });

  carousel.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    didSwipe = false;
  });

  carousel.addEventListener("pointerup", (event) => {
    if (!event.isPrimary) return;

    const diffX = event.clientX - pointerStartX;
    const diffY = event.clientY - pointerStartY;

    if (Math.abs(diffX) < 35 || Math.abs(diffX) < Math.abs(diffY)) {
      return;
    }

    didSwipe = true;

    if (diffX < 0) {
      goNext();
    } else {
      goPrevious();
    }

    restartTimer();
  });

  carousel.addEventListener("wheel", (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.shiftKey
        ? event.deltaY
        : 0;

    if (Math.abs(delta) < 25 || wheelLocked) {
      return;
    }

    event.preventDefault();
    wheelLocked = true;

    if (delta > 0) {
      goNext();
    } else {
      goPrevious();
    }

    restartTimer();
    window.setTimeout(() => {
      wheelLocked = false;
    }, 700);
  }, { passive: false });

  setSlide(firstRealSlide, true);
  restartTimer();
}
