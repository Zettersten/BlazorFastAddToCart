// AddToCart.Ultimate.razor.js
// Ultimate version: Web Animations API with CSS fallback, zero allocations

// WeakMap for O(1) lookups without memory leaks
const components = new WeakMap();
const activeAnimations = new WeakSet();

// Feature detection (done once)
const supportsWebAnimations = 'animate' in document.createElement('div');
const supportsComposite = supportsWebAnimations && 'composite' in KeyframeEffect.prototype;

/**
 * Initialize component
 */
export function initialize(triggerElement, destinationSelector, dotNetRef) {
  if (!triggerElement || components.has(triggerElement)) return;

  components.set(triggerElement, {
    destination: destinationSelector,
    dotNetRef
  });
}

/**
 * Main animation function with automatic fallback
 */
export function animateToCart(triggerElement, destinationSelector, speed, easingX, easingY, easingScale) {
  // Early exit if already animating
  if (activeAnimations.has(triggerElement)) return;

  const destination = document.querySelector(destinationSelector);
  if (!destination || !triggerElement) {
    console.warn('AddToCart: Invalid destination or trigger');
    return;
  }

  // Check for reduced motion preference
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Skip animation, just show a brief flash
    showReducedMotionFeedback(destination);
    return;
  }

  // Use Web Animations API if supported, otherwise fall back to CSS
  if (supportsWebAnimations && supportsComposite) {
    animateWithWebAPI(triggerElement, destination, speed, easingX, easingY, easingScale);
  } else {
    animateWithCSS(triggerElement, destination, speed, easingX, easingY, easingScale);
  }
}

/**
 * Web Animations API implementation (best performance)
 */
function animateWithWebAPI(triggerElement, destination, speed, easingX, easingY, easingScale) {
  const { element, distanceX, distanceY } = createFlyingElement(triggerElement, destination);

  // Mark as active
  activeAnimations.add(triggerElement);

  // Create independent animations with accumulate compositing
  // This allows each transform to have its own easing
  const animations = [
    // X-axis with custom easing
    element.animate(
      { transform: [`translateX(0)`, `translateX(${distanceX}px)`] },
      { duration: speed, easing: easingX, fill: 'forwards', composite: 'accumulate' }
    ),

    // Y-axis with custom easing
    element.animate(
      { transform: [`translateY(0)`, `translateY(${distanceY}px)`] },
      { duration: speed, easing: easingY, fill: 'forwards', composite: 'accumulate' }
    ),

    // Scale with custom easing
    element.animate(
      { transform: ['scale(1)', 'scale(0.2)'] },
      { duration: speed, easing: easingScale, fill: 'forwards', composite: 'accumulate' }
    ),

    // Opacity (ease-out)
    element.animate(
      [
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.8 },
        { opacity: 0, offset: 1 }
      ],
      { duration: speed, easing: 'ease-out', fill: 'forwards' }
    )
  ];

  // Cleanup when all animations complete
  Promise.all(animations.map(a => a.finished))
    .then(() => cleanup(element, triggerElement))
    .catch(() => cleanup(element, triggerElement));
}

/**
 * CSS-based animation fallback
 */
function animateWithCSS(triggerElement, destination, speed, easingX, easingY, easingScale) {
  const { element, distanceX, distanceY } = createFlyingElement(triggerElement, destination);

  // Mark as active
  activeAnimations.add(triggerElement);

  // Set CSS variables for animation
  const style = element.style;
  style.setProperty('--translate-x', `${distanceX}px`);
  style.setProperty('--translate-y', `${distanceY}px`);
  style.setProperty('--duration', `${speed}ms`);
  style.setProperty('--easing-x', easingX);
  style.setProperty('--easing-y', easingY);
  style.setProperty('--easing-scale', easingScale);

  // Trigger reflow and add animation class
  element.offsetHeight;
  element.classList.add('animating');

  // Cleanup after animation
  const cleanupHandler = () => cleanup(element, triggerElement);
  element.addEventListener('animationend', cleanupHandler, { once: true });
  setTimeout(cleanupHandler, speed + 100); // Fallback cleanup
}

/**
 * Create flying element (shared between both implementations)
 */
function createFlyingElement(triggerElement, destination) {
  // Single batched read of layout properties
  const triggerRect = triggerElement.getBoundingClientRect();
  const destRect = destination.getBoundingClientRect();

  // Calculate centers and distances
  const triggerCenterX = triggerRect.left + (triggerRect.width >> 1); // Bit shift for faster division
  const triggerCenterY = triggerRect.top + (triggerRect.height >> 1);
  const destCenterX = destRect.left + (destRect.width >> 1);
  const destCenterY = destRect.top + (destRect.height >> 1);

  const distanceX = destCenterX - triggerCenterX;
  const distanceY = destCenterY - triggerCenterY;

  // Create element
  const element = document.createElement('div');
  element.className = 'add-to-cart-flying';

  // Clone content efficiently using DocumentFragment
  const fragment = document.createDocumentFragment();
  const children = triggerElement.childNodes;
  for (let i = 0, len = children.length; i < len; i++) {
    fragment.appendChild(children[i].cloneNode(true));
  }
  element.appendChild(fragment);

  // Batch all style updates
  element.style.cssText = `
        left: ${triggerCenterX}px;
        top: ${triggerCenterY}px;
        width: ${triggerRect.width}px;
        height: ${triggerRect.height}px;
    `;

  // Single DOM write
  document.body.appendChild(element);

  return { element, distanceX, distanceY };
}

/**
 * Cleanup flying element
 */
function cleanup(element, triggerElement) {
  element.remove();
  activeAnimations.delete(triggerElement);
}

/**
 * Reduced motion feedback (accessibility)
 */
function showReducedMotionFeedback(destination) {
  destination.classList.add('cart-ping');
  setTimeout(() => destination.classList.remove('cart-ping'), 200);
}

/**
 * Component cleanup
 */
export function cleanup(triggerElement) {
  if (triggerElement) {
    components.delete(triggerElement);
    activeAnimations.delete(triggerElement);
  }
}

/**
 * Cancel all active animations (for cleanup)
 */
export function cancelAll() {
  const flying = document.querySelectorAll('.add-to-cart-flying');
  flying.forEach(el => el.remove());
  activeAnimations.clear();
}

/**
 * Utility: Preload images to prevent jank during animation
 */
export function preloadImages(triggerElement) {
  const images = triggerElement.querySelectorAll('img');
  images.forEach(img => {
    if (!img.complete) {
      const preload = new Image();
      preload.src = img.src;
    }
  });
}

/**
 * Performance monitoring (development only)
 */
let perfObserver;
export function enablePerformanceMonitoring(enabled = true) {
  if (!enabled && perfObserver) {
    perfObserver.disconnect();
    perfObserver = null;
    return;
  }

  if (enabled && 'PerformanceObserver' in window && !perfObserver) {
    perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 16.67) { // Longer than 1 frame at 60fps
          console.warn(`Slow animation detected: ${entry.duration.toFixed(2)}ms`);
        }
      }
    });
    perfObserver.observe({ entryTypes: ['measure'] });
  }
}
