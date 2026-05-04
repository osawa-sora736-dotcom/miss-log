const carousel = document.querySelector(".phone-carousel");

if (carousel) {
  const slides = carousel.querySelectorAll(".phone");
  const lastRealSlide = slides.length - 1;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let currentSlide = 0;
  let timerId;
  let isLooping = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let didSwipe = false;

  const setSlide = (slide) => {
    currentSlide = slide;
    carousel.style.transform = `translateX(calc(var(--phone-step) * -${currentSlide}))`;
  };

  const jumpToStart = () => {
    carousel.classList.add("is-resetting");
    carousel.style.transform = "translateX(0)";
    currentSlide = 0;
    void carousel.offsetHeight;
    carousel.classList.remove("is-resetting");
    isLooping = false;
  };

  const goNext = () => {
    if (isLooping) return;

    setSlide(currentSlide + 1);

    if (currentSlide === lastRealSlide) {
      isLooping = true;
      window.setTimeout(jumpToStart, 720);
    }
  };

  const goPrevious = () => {
    if (isLooping) return;

    if (currentSlide === 0) {
      setSlide(lastRealSlide - 1);
      return;
    }

    setSlide(currentSlide - 1);
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

  carousel.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    didSwipe = false;
  }, { passive: true });

  carousel.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    if (Math.abs(diffX) < 40 || Math.abs(diffX) < Math.abs(diffY)) {
      return;
    }

    didSwipe = true;

    if (diffX < 0) {
      goNext();
    } else {
      goPrevious();
    }

    restartTimer();
  }, { passive: true });

  restartTimer();
}
