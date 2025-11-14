// AddToCart.razor.js
// Implementation matching the JavaScript demo behavior

// WeakMap for O(1) lookups without memory leaks
const components = new WeakMap();
// Track active animation elements (not triggers) so we can have multiple concurrent animations
const activeAnimationElements = new WeakSet();

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
 * Supports rapid clicking - multiple animations can run concurrently
 */
export async function animateToCart(triggerElement, destinationSelector, speed, easingX, easingY, easingScale, dotNetRef) {
  // Ensure global styles are injected
  ensureStylesInjected();

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
  const triggerDisplay = window.getComputedStyle(triggerElement).display;
  
  // If the trigger has display: contents or zero size, find the first visible child
  if (productRect.width === 0 || productRect.height === 0 || triggerDisplay === 'contents') {
    // Try to find the first visible element child (skip text nodes)
    let firstChild = triggerElement.firstElementChild;
    
    // If no element child, try querySelector for common elements
    if (!firstChild) {
      firstChild = triggerElement.querySelector('img, div, span, button, a');
    }
    
    if (firstChild) {
      sourceElement = firstChild;
      productRect = firstChild.getBoundingClientRect();
      
      // Special handling for images - use natural dimensions if bounding rect is zero
      if ((productRect.width === 0 || productRect.height === 0) && firstChild.tagName === 'IMG') {
        const img = firstChild;
        const computedStyle = window.getComputedStyle(img);
        const computedWidth = parseFloat(computedStyle.width) || 0;
        const computedHeight = parseFloat(computedStyle.height) || 0;
        
        // Try to get dimensions from computed style or natural dimensions
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          let width = computedWidth || img.naturalWidth;
          let height = computedHeight || img.naturalHeight;
          
          // If we have one dimension, calculate the other maintaining aspect ratio
          if (width > 0 && height === 0) {
            height = width / aspectRatio;
          } else if (height > 0 && width === 0) {
            width = height * aspectRatio;
          } else if (width === 0 && height === 0) {
            // Use natural dimensions as fallback
            width = Math.min(img.naturalWidth, 300);
            height = width / aspectRatio;
          }
          
          // Create a rect with proper dimensions
          const imgRect = img.getBoundingClientRect();
          productRect = {
            left: imgRect.left || 0,
            top: imgRect.top || 0,
            width: width,
            height: height,
            right: (imgRect.left || 0) + width,
            bottom: (imgRect.top || 0) + height
          };
        } else if (computedWidth > 0 || computedHeight > 0) {
          // Use computed dimensions even if image not loaded
          productRect = {
            left: productRect.left || 0,
            top: productRect.top || 0,
            width: computedWidth || 300,
            height: computedHeight || 300,
            right: (productRect.left || 0) + (computedWidth || 300),
            bottom: (productRect.top || 0) + (computedHeight || 300)
          };
        }
      }
    }
  }
  
  // Validate we have valid dimensions
  if (productRect.width === 0 || productRect.height === 0) {
    console.warn('AddToCart: Source element has zero dimensions', sourceElement);
    return;
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
  // Special handling for direct image elements
  if (sourceElement.tagName === 'IMG') {
    // Clone the image directly with all attributes
    const clonedImg = sourceElement.cloneNode(true);
    
    // Set explicit styles to ensure visibility (using setProperty to avoid cssText issues)
    clonedImg.style.setProperty('width', '100%', 'important');
    clonedImg.style.setProperty('height', '100%', 'important');
    clonedImg.style.setProperty('object-fit', 'contain', 'important');
    clonedImg.style.setProperty('display', 'block', 'important');
    clonedImg.style.setProperty('opacity', '1', 'important');
    clonedImg.style.setProperty('visibility', 'visible', 'important');
    clonedImg.style.setProperty('max-width', '100%', 'important');
    clonedImg.style.setProperty('max-height', '100%', 'important');
    
    // Ensure src is set (in case it was a data URL or relative path)
    if (!clonedImg.src && sourceElement.src) {
      clonedImg.src = sourceElement.src;
    }
    
    element.appendChild(clonedImg);
  } else {
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
  }

  // Add the element to body
  document.body.appendChild(element);
  
  // Force a reflow to ensure element is rendered before animation starts
  const rect = element.getBoundingClientRect();
  element.offsetHeight;
  
  // Verify element is visible and has dimensions
  if (rect.width === 0 || rect.height === 0) {
    console.warn('AddToCart: Cloned element has zero dimensions', {
      element,
      rect,
      sourceElement,
      sourceRect: productRect
    });
    
    // Try to fix by using source dimensions directly
    element.style.width = `${productRect.width}px`;
    element.style.height = `${productRect.height}px`;
  }
  
  // Small delay to ensure browser has painted the element
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // Mark this specific animation element as active (allows multiple concurrent animations)
  activeAnimationElements.add(element);

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
      // Cleanup this specific animation element
      if (element.parentNode) {
        element.remove();
      }
      activeAnimationElements.delete(element);
      
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
  flying.forEach(el => {
    el.remove();
    activeAnimationElements.delete(el);
  });
}

/**
 * Cleanup function (for component disposal)
 * Note: Individual animations clean themselves up, this is just for component-level cleanup
 */
export function cleanup(triggerElement) {
  // No-op since we track individual animation elements, not triggers
  // All active animations will clean themselves up when they complete
}
