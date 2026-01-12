// AddToCart.razor.js
// Implementation matching the JavaScript demo behavior

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
export function initialize() {
  ensureStylesInjected();
}

/**
 * Main animation function - matches the JavaScript demo behavior
 * Supports rapid clicking - multiple animations can run concurrently
 * Supports Count parameter for multiple staggered animations
 */
export async function animateToCart(
  triggerElement,
  destinationSelector,
  speed,
  easingX1, easingXy1, easingX2, easingXy2,
  easingY1, easingYy1, easingY2, easingYy2,
  easingS1, easingSy1, easingS2, easingSy2,
  dotNetRef,
  count = 1,
  triggerSelector = null,
  batchId = 0
) {
  // Ensure global styles are injected
  ensureStylesInjected();

  const destination = document.querySelector(destinationSelector);
  if (!destination || !triggerElement) {
    console.warn('AddToCart: Invalid destination or trigger');
    return;
  }

  // Determine the actual trigger element (use selector if provided, otherwise use triggerElement)
  let actualTriggerElement = triggerElement;
  if (triggerSelector) {
    const foundElement = triggerElement.querySelector?.(triggerSelector) || document.querySelector(triggerSelector);
    if (foundElement) {
      actualTriggerElement = foundElement;
    }
  }

  const animationCount = Math.max(1, Math.floor(count || 1));
  
  // Calculate stagger delay (spread animations over a portion of the animation duration)
  const staggerDelay = animationCount > 1 ? (speed * 1000) / (animationCount * 2) : 0;
  
  // Track progress across all animations
  // Each animation will have its own progress (0-1), we'll track the sum
  const progressTracker = {
    total: animationCount,
    completed: 0,
    progressSum: 0, // Sum of all individual animation progresses
    lastReportedProgress: 0
  };

  // Launch multiple animations with stagger
  for (let i = 0; i < animationCount; i++) {
    const delay = i * staggerDelay;
    
    if (delay > 0) {
      setTimeout(() => {
        animateSingleItem(
          actualTriggerElement,
          destination,
          speed,
          easingX1, easingXy1, easingX2, easingXy2,
          easingY1, easingYy1, easingY2, easingYy2,
          easingS1, easingSy1, easingS2, easingSy2,
          dotNetRef,
          progressTracker,
          batchId
        );
      }, delay);
    } else {
      // First animation starts immediately
      animateSingleItem(
        actualTriggerElement,
        destination,
        speed,
        easingX1, easingXy1, easingX2, easingXy2,
        easingY1, easingYy1, easingY2, easingYy2,
        easingS1, easingSy1, easingS2, easingSy2,
        dotNetRef,
        progressTracker,
        batchId
      );
    }
  }
}

/**
 * Animate a single item to cart
 */
async function animateSingleItem(
  triggerElement,
  destination,
  speed,
  easingX1, easingXy1, easingX2, easingXy2,
  easingY1, easingYy1, easingY2, easingYy2,
  easingS1, easingSy1, easingS2, easingSy2,
  dotNetRef,
  progressTracker,
  batchId = 0
) {
  // Track this animation's individual progress
  let animationProgress = 0;

  // Check for reduced motion preference
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showReducedMotionFeedback(destination);
    // Still report completion for reduced motion
    if (progressTracker) {
      progressTracker.progressSum = progressTracker.progressSum - animationProgress + 1.0;
      progressTracker.completed++;
      if (dotNetRef) {
        const finalProgress = progressTracker.progressSum / progressTracker.total;
        dotNetRef.invokeMethodAsync('OnAnimationProgressUpdate', Math.min(finalProgress, 1.0))
          .catch(() => { /* Ignore errors */ });
        dotNetRef.invokeMethodAsync('OnAnimationCompleted', batchId).catch(() => { /* Ignore errors */ });
      }
    } else if (dotNetRef) {
      dotNetRef.invokeMethodAsync('OnAnimationProgressUpdate', 1.0)
        .catch(() => { /* Ignore errors */ });
      dotNetRef.invokeMethodAsync('OnAnimationCompleted', batchId).catch(() => { /* Ignore errors */ });
    }
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

  // Calculate distance between centers
  const cartCenterX = cartRect.left + cartRect.width / 2;
  const cartCenterY = cartRect.top + cartRect.height / 2;
  const productCenterX = productRect.left + productRect.width / 2;
  const productCenterY = productRect.top + productRect.height / 2;
  const distanceX = cartCenterX - productCenterX;
  const distanceY = cartCenterY - productCenterY;

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

  // To achieve separate easing for X, Y, and scale without GSAP,
  // we'll manually interpolate using cubic bezier easing functions
  const duration = speed * 1000;
  const startTime = performance.now();
  
  // Evaluate cubic bezier at time t (0 to 1)
  const evaluateBezier = (t, x1, y1, x2, y2) => {
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
  
  // Animate using requestAnimationFrame
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Calculate eased values for each component
    const easedX = evaluateBezier(progress, easingX1, easingXy1, easingX2, easingXy2);
    const easedY = evaluateBezier(progress, easingY1, easingYy1, easingY2, easingYy2);
    const easedScale = evaluateBezier(progress, easingS1, easingSy1, easingS2, easingSy2);
    
    // Calculate current values
    const currentX = easedX * distanceX;
    const currentY = easedY * distanceY;
    const currentScale = 1 + (0.2 - 1) * easedScale;
    const currentOpacity = progress < 0.8 ? 1 : 1 - ((progress - 0.8) / 0.2);
    
    // Apply transform
    element.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
    element.style.opacity = currentOpacity;
    
    // Report progress (throttle updates to avoid excessive calls)
    if (progressTracker && dotNetRef) {
      // Calculate overall progress: average of all animation progresses
      // Update the sum: subtract old progress, add new progress
      // IMPORTANT: Calculate delta before updating animationProgress
      const delta = progress - animationProgress;
      progressTracker.progressSum += delta;
      animationProgress = progress; // Update after calculating delta
      
      const overallProgress = progressTracker.progressSum / progressTracker.total;
      
      // Only report if progress changed significantly (reduce callback frequency)
      if (Math.abs(overallProgress - progressTracker.lastReportedProgress) > 0.01 || progress >= 1) {
        progressTracker.lastReportedProgress = overallProgress;
        dotNetRef.invokeMethodAsync('OnAnimationProgressUpdate', Math.min(overallProgress, 1.0))
          .catch(() => { /* Ignore errors if method doesn't exist */ });
      }
    } else {
      // Update animationProgress even if no tracker (for consistency)
      animationProgress = progress;
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Cleanup this specific animation element
      if (element.parentNode) {
        element.remove();
      }
      
      // Update progress tracker
      if (progressTracker) {
        // Update progress sum: this animation is now complete (progress = 1)
        // Calculate final delta before updating
        const finalDelta = 1.0 - animationProgress;
        progressTracker.progressSum += finalDelta;
        animationProgress = 1.0;
        progressTracker.completed++;
        
        // Report final progress
        if (dotNetRef) {
          const finalProgress = progressTracker.progressSum / progressTracker.total;
          dotNetRef.invokeMethodAsync('OnAnimationProgressUpdate', Math.min(finalProgress, 1.0))
            .catch(() => { /* Ignore errors */ });
        }
        
        // Notify .NET that this animation completed
        // The C# side will track completions and only fire OnAnimationComplete when all are done
        if (dotNetRef) {
          dotNetRef.invokeMethodAsync('OnAnimationCompleted', batchId).catch(() => { /* Ignore errors if method doesn't exist */ });
        }
      } else {
        // Fallback for single animation (no progress tracker)
        if (dotNetRef) {
          dotNetRef.invokeMethodAsync('OnAnimationProgressUpdate', 1.0)
            .catch(() => { /* Ignore errors */ });
          dotNetRef.invokeMethodAsync('OnAnimationCompleted', batchId).catch(() => { /* Ignore errors if method doesn't exist */ });
        }
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
