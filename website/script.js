const carousel = document.querySelector(".phone-carousel");

if (carousel) {
  const slides = carousel.querySelectorAll(".phone");
  const lastRealSlide = slides.length - 1;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let currentSlide = 0;
  let timerId;
  let isLooping = false;

  const jumpToStart = () => {
    carousel.classList.add("is-resetting");
    carousel.style.transform = "translateX(0)";
    currentSlide = 0;
    carousel.offsetHeight;
    carousel.classList.remove("is-resetting");
    isLooping = false;
  };

  const goNext = () => {
    if (isLooping) return;

    currentSlide += 1;
    carousel.style.transform = `translateX(calc(var(--phone-step) * -${currentSlide}))`;

    if (currentSlide === lastRealSlide) {
      isLooping = true;
      window.setTimeout(jumpToStart, 720);
    }
  };

  const restartTimer = () => {
    if (reducedMotion) return;
    window.clearInterval(timerId);
    timerId = window.setInterval(goNext, 4000);
  };

  carousel.addEventListener("click", () => {
    goNext();
    restartTimer();
  });

  restartTimer();
}
