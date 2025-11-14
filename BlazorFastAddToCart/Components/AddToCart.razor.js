// AddToCart.razor.js
// Implementation matching the JavaScript demo behavior

// WeakMap for O(1) lookups without memory leaks
const components = new WeakMap();
const activeAnimations = new WeakSet();

// Inject global styles for cart-item (since it's appended to body, outside component scope)
let stylesInjected = false;
function ensureStylesInjected() {
  if (stylesInjected) return;
  
  const styleId = 'blazor-fast-add-to-cart-styles';
  if (document.getElementById(styleId)) {
    stylesInjected = true;
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Cart item animation - JavaScript handles the animation */
    .cart-item {
      position: fixed;
      z-index: 99999;
      pointer-events: none;
      will-change: transform, opacity;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transform-origin: center center;
      transform: translate(0, 0) scale(1);
      opacity: 1;
      visibility: visible;
      display: block;
      overflow: visible;
      box-sizing: border-box;
    }
    
    .cart-item img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
      display: block;
    }
    
    .cart-item > * {
      width: 100%;
      height: 100%;
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .cart-item {
        display: none !important;
      }
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .cart-item {
        outline: 2px solid currentColor;
        outline-offset: -2px;
      }
    }
    
    /* Dark mode optimizations */
    @media (prefers-color-scheme: dark) {
      .cart-item {
        filter: brightness(0.9);
      }
    }
    
    /* Print styles */
    @media print {
      .cart-item {
        display: none !important;
      }
    }
    
    /* Forced colors mode */
    @media (forced-colors: active) {
      .cart-item {
        border: 1px solid CanvasText;
      }
    }
  `;
  
  document.head.appendChild(style);
  stylesInjected = true;
}

/**
 * Initialize component
 */
export function initialize(triggerElement, destinationSelector, dotNetRef) {
  if (!triggerElement || components.has(triggerElement)) return;
  
  // Ensure global styles are injected
  ensureStylesInjected();

  components.set(triggerElement, {
    destination: destinationSelector,
    dotNetRef
  });
}

/**
 * Main animation function - matches the JavaScript demo behavior
 */
export async function animateToCart(triggerElement, destinationSelector, speed, easingX, easingY, easingScale, dotNetRef) {
  // Ensure global styles are injected
  ensureStylesInjected();
  
  // Early exit if already animating
  if (activeAnimations.has(triggerElement)) return;

  const destination = document.querySelector(destinationSelector);
  if (!destination || !triggerElement) {
    console.warn('AddToCart: Invalid destination or trigger');
    return;
  }

  // Check for reduced motion preference
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showReducedMotionFeedback(destination);
    return;
  }

  // Get bounding rectangles for both elements
  const cartRect = destination.getBoundingClientRect();
  
  // Handle display: contents - get the actual rendered element
  let sourceElement = triggerElement;
  let productRect = triggerElement.getBoundingClientRect();
  
  // If the trigger has display: contents or zero size, find the first visible child
  if (productRect.width === 0 || productRect.height === 0 || 
      window.getComputedStyle(triggerElement).display === 'contents') {
    const firstChild = triggerElement.firstElementChild;
    if (firstChild) {
      sourceElement = firstChild;
      productRect = firstChild.getBoundingClientRect();
    }
  }

  // Calculate center points
  const cartCenter = {
    x: cartRect.left + cartRect.width / 2,
    y: cartRect.top + cartRect.height / 2
  };

  const productCenter = {
    x: productRect.left + productRect.width / 2,
    y: productRect.top + productRect.height / 2
  };

  // Calculate distance between centers
  const distance = {
    x: cartCenter.x - productCenter.x,
    y: cartCenter.y - productCenter.y
  };

  // Create a new element for the item (matching demo code structure)
  const element = document.createElement('div');
  element.className = 'cart-item';
  element.setAttribute('bfatc', '');
  
  // Position element at the center of the source element
  // We position at top-left, then offset by half width/height to center
  const elementWidth = productRect.width;
  const elementHeight = productRect.height;
  const centerX = productRect.left + productRect.width / 2;
  const centerY = productRect.top + productRect.height / 2;
  
  // Set initial position (centered on source element)
  element.style.left = `${centerX - elementWidth / 2}px`;
  element.style.top = `${centerY - elementHeight / 2}px`;
  element.style.width = `${elementWidth}px`;
  element.style.height = `${elementHeight}px`;
  element.style.zIndex = '99999'; // Ensure it's above everything
  element.style.pointerEvents = 'none';
  element.style.backgroundColor = 'transparent'; // Ensure no background blocks content

  // Clone the content from the actual source element
  // Try to clone innerHTML first to preserve styles, fallback to node cloning
  if (sourceElement.innerHTML) {
    element.innerHTML = sourceElement.innerHTML;
  } else {
    const fragment = document.createDocumentFragment();
    const children = sourceElement.childNodes;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      // Only clone element nodes, skip text nodes
      if (child.nodeType === Node.ELEMENT_NODE) {
        fragment.appendChild(child.cloneNode(true));
      }
    }
    element.appendChild(fragment);
  }
  
  // Ensure images and other content are properly sized
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
  });

  // Add the element to body
  document.body.appendChild(element);
  
  // Force a reflow to ensure element is rendered before animation starts
  element.offsetHeight;
  
  // Small delay to ensure browser has painted the element
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // Mark as active
  activeAnimations.add(triggerElement);

  // To achieve separate easing for X, Y, and scale without GSAP,
  // we'll manually interpolate using cubic bezier easing functions
  const duration = speed * 1000;
  const startTime = performance.now();
  
  // Parse cubic bezier strings to get control points
  const parseEasing = (easingStr) => {
    const match = easingStr.match(/cubic-bezier\s*\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (!match) return null;
    return {
      x1: parseFloat(match[1]),
      y1: parseFloat(match[2]),
      x2: parseFloat(match[3]),
      y2: parseFloat(match[4])
    };
  };
  
  // Evaluate cubic bezier at time t (0 to 1)
  const evaluateBezier = (t, bezier) => {
    if (!bezier) return t; // Fallback to linear
    const { x1, y1, x2, y2 } = bezier;
    
    // Use Newton-Raphson to find t for given x, then return y
    // Simplified: approximate using de Casteljau's algorithm
    let currentT = t;
    for (let i = 0; i < 8; i++) {
      const x = cubicBezierX(currentT, x1, x2);
      const error = x - t;
      if (Math.abs(error) < 0.001) break;
      const dx = cubicBezierDerivative(currentT, x1, x2);
      currentT -= error / dx;
      currentT = Math.max(0, Math.min(1, currentT));
    }
    return cubicBezierY(currentT, y1, y2);
  };
  
  const cubicBezierX = (t, x1, x2) => {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    return mt3 * 0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * 1;
  };
  
  const cubicBezierY = (t, y1, y2) => {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    return mt3 * 0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * 1;
  };
  
  const cubicBezierDerivative = (t, x1, x2) => {
    const mt = 1 - t;
    return 3 * mt * mt * x1 + 6 * mt * t * (x2 - x1) + 3 * t * t * (1 - x2);
  };
  
  const easingXBezier = parseEasing(easingX);
  const easingYBezier = parseEasing(easingY);
  const easingScaleBezier = parseEasing(easingScale);
  
  // Animate using requestAnimationFrame
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Calculate eased values for each component
    const easedX = evaluateBezier(progress, easingXBezier);
    const easedY = evaluateBezier(progress, easingYBezier);
    const easedScale = evaluateBezier(progress, easingScaleBezier);
    
    // Calculate current values
    const currentX = easedX * distance.x;
    const currentY = easedY * distance.y;
    const currentScale = 1 + (0.2 - 1) * easedScale;
    const currentOpacity = progress < 0.8 ? 1 : 1 - ((progress - 0.8) / 0.2);
    
    // Apply transform
    element.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
    element.style.opacity = currentOpacity;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Cleanup
      element.remove();
      activeAnimations.delete(triggerElement);
      
      // Notify .NET that animation completed
      if (dotNetRef) {
        dotNetRef.invokeMethodAsync('OnAnimationCompleted').catch(() => { /* Ignore errors if method doesn't exist */ });
      }
    }
  };
  
  // Start animation
  requestAnimationFrame(animate);
}

/**
 * Reduced motion feedback (accessibility)
 */
function showReducedMotionFeedback(destination) {
  destination.classList.add('cart-ping');
  setTimeout(() => destination.classList.remove('cart-ping'), 200);
}

/**
 * Cancel all active animations (for cleanup)
 */
export function cancelAll() {
  const flying = document.querySelectorAll('.cart-item');
  flying.forEach(el => el.remove());
  activeAnimations.clear();
}

/**
 * Cleanup function
 */
export function cleanup(triggerElement) {
  activeAnimations.delete(triggerElement);
}
