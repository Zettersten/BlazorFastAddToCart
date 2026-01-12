# Blazor Fast Add To Cart

[![NuGet](https://img.shields.io/nuget/v/BlazorFastAddToCart.svg)](https://www.nuget.org/packages/BlazorFastAddToCart/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Zettersten/BlazorFastAddToCart)

A high-performance Blazor component that animates items flying into a shopping cart (or any destination) with customizable easing functions. Optimized for AOT compilation, trimming-friendly, and designed for both Blazor Server and WebAssembly hosting models.

## 🚀 Live Demo

**[View the interactive demo](https://zettersten.github.io/BlazorFastAddToCart/)**

![Sample 1](https://github.com/Zettersten/BlazorFastAddToCart/blob/main/sample-1.gif?raw=true)

## ✨ Features

- **High Performance**: Allocation-conscious cubic bezier easing (passes control points to JS to avoid per-click easing-string formatting and regex parsing)
- **Customizable Animations**: Independent easing functions for X, Y, and scale transformations
- **Multiple Items**: Animate multiple items with staggered timing using the `Count` parameter
- **Custom Triggers**: Specify which element triggers the animation with the `Trigger` parameter
- **Progress Tracking**: Track animation progress in real-time with `OnAnimationProgress`
- **Accessibility**: Respects `prefers-reduced-motion` and provides fallback feedback
- **Concurrent Animations**: Supports multiple simultaneous animations without conflicts
- **Flexible Content**: Works with images, buttons, divs, or any HTML content
- **Blazor Server & WASM**: Compatible with both hosting models
- **Trimming-Friendly**: Fully compatible with .NET trimming and AOT compilation
- **Type-Safe**: Strongly-typed easing functions with compile-time constants

## 📦 Installation

Install the package via NuGet Package Manager:

```bash
dotnet add package BlazorFastAddToCart
```

Or via Package Manager Console:

```powershell
Install-Package BlazorFastAddToCart
```

Or add directly to your `.csproj`:

```xml
<PackageReference Include="BlazorFastAddToCart" Version="1.0.0" />
```

## 🎯 Quick Start

### 1. Add Namespace

Add the namespace to your `_Imports.razor` file:

```razor
@using BlazorFastAddToCart
```

### 2. Basic Usage

Wrap any content you want to animate with the `AddToCart` component:

```razor
<!-- Cart destination -->
<div id="cart" class="cart-icon">🛒</div>

<!-- Product with animation -->
<AddToCart Destination="#cart">
    <img src="product.jpg" alt="Product" />
</AddToCart>
```

### 3. With Event Callback

Handle when the animation completes:

```razor
<AddToCart Destination="#cart" OnAnimationComplete="HandleAddToCart">
    <button class="btn btn-primary">Add to Cart</button>
</AddToCart>

@code {
    private void HandleAddToCart()
    {
        // Update cart count, make API call, etc.
        cartCount++;
    }
}
```

## 📚 Component Parameters

### `Destination` (Required)

**Type**: `string`  
**Default**: None (required)

CSS selector for the destination element where the animation should end. Can be an ID selector (`#cart`), class selector (`.cart-icon`), or any valid CSS selector.

```razor
<AddToCart Destination="#shopping-cart">
    <!-- content -->
</AddToCart>
```

### `Speed`

**Type**: `double`  
**Default**: `0.6`

Animation duration in seconds. Lower values = faster animation.

```razor
<!-- Fast animation (0.5 seconds) -->
<AddToCart Destination="#cart" Speed="0.5">
    <img src="product.jpg" />
</AddToCart>

<!-- Slow animation (2 seconds) -->
<AddToCart Destination="#cart" Speed="2.0">
    <img src="product.jpg" />
</AddToCart>
```

**Note**: The default value of `0.6` seconds provides a smooth, fast animation. For typical e-commerce use cases, values between `0.5` and `1.5` seconds work best.

### `EasingX`

**Type**: `CubicBezier`  
**Default**: `CubicBezier.CartX`

Easing function for horizontal (X-axis) movement. Controls how the item accelerates/decelerates horizontally.

```razor
<AddToCart Destination="#cart" EasingX="@CubicBezier.EaseOut">
    <img src="product.jpg" />
</AddToCart>
```

### `EasingY`

**Type**: `CubicBezier`  
**Default**: `CubicBezier.CartY`

Easing function for vertical (Y-axis) movement. Controls how the item accelerates/decelerates vertically.

```razor
<AddToCart Destination="#cart" EasingY="@CubicBezier.EaseInOut">
    <img src="product.jpg" />
</AddToCart>
```

### `EasingScale`

**Type**: `CubicBezier`  
**Default**: `CubicBezier.CartScale`

Easing function for scale transformation. Controls how the item scales down during the animation.

```razor
<AddToCart Destination="#cart" EasingScale="@CubicBezier.EaseIn">
    <img src="product.jpg" />
</AddToCart>
```

### `OnBeforeAnimation`

**Type**: `EventCallback`  
**Default**: `null`

Callback invoked before the animation starts. Use this to prepare data, update UI state, perform validation, or execute any logic that should happen before the animation begins. This callback fires once per click, even when `Count > 1`.

```razor
<AddToCart Destination="#cart" OnBeforeAnimation="PrepareAnimation" OnAnimationComplete="HandleAddToCart">
    <img src="product.jpg" />
</AddToCart>

@code {
    private async Task PrepareAnimation()
    {
        // Prepare data, update UI, or perform validation before animation starts
        await ValidateItemAsync();
        StateHasChanged();
    }
}
```

### `OnAnimationComplete`

**Type**: `EventCallback`  
**Default**: `null`

Callback invoked when the animation completes. Use this to update cart counts, make API calls, or perform other actions. When using `Count > 1`, this callback fires only once after all animations complete.

```razor
<AddToCart Destination="#cart" OnAnimationComplete="HandleAddToCart">
    <img src="product.jpg" />
</AddToCart>

@code {
    private async Task HandleAddToCart()
    {
        cartCount++;
        await AddItemToCartAsync(productId);
        StateHasChanged();
    }
}
```

### `Count`

**Type**: `int`  
**Default**: `1`

Number of items to animate. When set to a value greater than 1, multiple animations will be triggered with staggered timing. All animations complete before `OnAnimationComplete` fires once.

```razor
<!-- Add 10 items with staggered animations -->
<AddToCart Destination="#cart" Count="10" OnAnimationComplete="HandleBulkAdd">
    <button>Add 10 Items</button>
</AddToCart>

@code {
    private void HandleBulkAdd()
    {
        // This fires once after all 10 animations complete
        cartCount += 10;
    }
}
```

### `Trigger`

**Type**: `string?`  
**Default**: `null`

CSS selector for the specific element that should trigger the animation. When provided, only clicks on the matching element will trigger the animation. Useful when you want to animate a specific part of your content (like a button) rather than the entire wrapped content.

```razor
<AddToCart Destination="#cart" Trigger=".add-to-cart-btn">
    <div class="product-card">
        <img src="product.jpg" />
        <h3>Product Name</h3>
        <!-- Only clicking this button triggers animation -->
        <button class="add-to-cart-btn">Add to Cart</button>
    </div>
</AddToCart>
```

The selector can be:
- A class selector: `".add-to-cart-btn"`
- An ID selector: `"#product-button"`
- Any valid CSS selector: `"button[type='submit']"`

If `null`, the entire wrapped content acts as the trigger.

### `OnAnimationProgress`

**Type**: `EventCallback<double>`  
**Default**: `null`

Callback invoked during animation to report progress. Progress ranges from `0.0` (start) to `1.0` (complete). Updates are throttled to reduce callback frequency. When using `Count > 1`, progress represents the overall progress across all animations.

```razor
<AddToCart Destination="#cart" 
           Count="5"
           OnAnimationProgress="HandleProgress"
           OnAnimationComplete="HandleComplete">
    <button>Add Items</button>
</AddToCart>

@code {
    private double progress = 0.0;

    private void HandleProgress(double progressValue)
    {
        progress = progressValue; // 0.0 to 1.0
        StateHasChanged();
    }

    private void HandleComplete()
    {
        progress = 0.0; // Reset for next animation
    }
}
```

### `ChildContent`

**Type**: `RenderFragment`  
**Default**: `null`

The content to wrap and animate. Can be any HTML element, image, button, or complex markup.

```razor
<AddToCart Destination="#cart">
    <!-- Any content here -->
    <div class="product-card">
        <img src="product.jpg" />
        <h3>Product Name</h3>
        <button>Add to Cart</button>
    </div>
</AddToCart>
```

## 🎨 Easing Functions

The component includes a comprehensive set of predefined easing functions via the `CubicBezier` struct. The predefined `CubicBezier` values are allocation-free; `ToCssString()` allocates the returned string and is meant for display/debugging.

### Standard Easing Functions

```csharp
CubicBezier.Linear      // Linear interpolation (no easing)
CubicBezier.Ease        // Default easing (slow start, fast middle, slow end)
CubicBezier.EaseIn      // Slow start
CubicBezier.EaseOut     // Slow end
CubicBezier.EaseInOut   // Slow start and end
```

### Quadratic Easing

```csharp
CubicBezier.EaseInQuad
CubicBezier.EaseOutQuad
CubicBezier.EaseInOutQuad
```

### Cubic Easing

```csharp
CubicBezier.EaseInCubic
CubicBezier.EaseOutCubic
CubicBezier.EaseInOutCubic
```

### Quartic Easing

```csharp
CubicBezier.EaseInQuart
CubicBezier.EaseOutQuart
CubicBezier.EaseInOutQuart
```

### Quintic Easing

```csharp
CubicBezier.EaseInQuint
CubicBezier.EaseOutQuint
CubicBezier.EaseInOutQuint
```

### Bouncy/Elastic Easing

```csharp
CubicBezier.EaseInBack   // Bounces backward at start
CubicBezier.EaseOutBack  // Bounces forward at end
CubicBezier.EaseInOutBack // Bounces at both ends
```

### Custom Cart Easing (Default)

These are optimized specifically for shopping cart animations:

```csharp
CubicBezier.CartX      // Default X-axis easing (slight overshoot)
CubicBezier.CartY      // Default Y-axis easing (bouncy arc)
CubicBezier.CartScale  // Default scale easing (smooth shrink)
```

### Creating Custom Easing Functions

You can create custom easing functions by instantiating `CubicBezier` with your own control points:

```razor
@code {
    // Custom easing: fast start, slow end with overshoot
    private CubicBezier customEasing = new CubicBezier(0.68f, -0.55f, 0.265f, 1.55f);
}

<AddToCart Destination="#cart" EasingX="@customEasing">
    <img src="product.jpg" />
</AddToCart>
```

The `CubicBezier` constructor takes four float parameters: `(x1, y1, x2, y2)` representing the control points of the cubic bezier curve. Values typically range from 0 to 1, but can exceed 1 for overshoot effects.

## 💡 Usage Examples

### Example 1: Simple Product Card

```razor
<div class="product-grid">
    @foreach (var product in products)
    {
        <div class="product-card">
            <AddToCart Destination="#cart" OnAnimationComplete="() => AddToCart(product.Id)">
                <div class="product-image">
                    <img src="@product.ImageUrl" alt="@product.Name" />
                </div>
                <div class="product-info">
                    <h3>@product.Name</h3>
                    <p class="price">$@product.Price</p>
                    <button class="btn-add-to-cart">Add to Cart</button>
                </div>
            </AddToCart>
        </div>
    }
</div>

@code {
    private List<Product> products = new();
    private int cartCount = 0;

    private void AddToCart(int productId)
    {
        cartCount++;
        // Add product to cart via API, etc.
    }
}
```

### Example 2: Custom Speed and Easing

```razor
<AddToCart 
    Destination="#cart" 
    Speed="0.8"
    EasingX="@CubicBezier.EaseOutBack"
    EasingY="@CubicBezier.EaseInOut"
    EasingScale="@CubicBezier.EaseIn"
    OnAnimationComplete="HandleAddToCart">
    <img src="product.jpg" alt="Product" />
</AddToCart>
```

### Example 3: Dynamic Speed Based on Distance

```razor
@code {
    private double CalculateSpeed(Product product)
    {
        // Calculate speed based on product position or other factors
        var baseSpeed = 0.6;
        var distanceFactor = CalculateDistanceToCart(product);
        return baseSpeed + (distanceFactor * 0.1);
    }
}

<AddToCart Destination="#cart" Speed="@CalculateSpeed(product)">
    <img src="@product.ImageUrl" />
</AddToCart>
```

### Example 4: Multiple Destinations

```razor
<!-- Wishlist -->
<div id="wishlist">❤️</div>

<!-- Cart -->
<div id="cart">🛒</div>

<!-- Product with conditional destination -->
<AddToCart Destination="@(isWishlist ? "#wishlist" : "#cart")" 
           OnAnimationComplete="HandleAction">
    <img src="product.jpg" />
</AddToCart>

@code {
    private bool isWishlist = false;

    private void HandleAction()
    {
        if (isWishlist)
            AddToWishlist();
        else
            AddToCart();
    }
}
```

### Example 5: Async Operations

```razor
<AddToCart Destination="#cart" OnAnimationComplete="HandleAddToCartAsync">
    <button class="btn-primary">Add to Cart</button>
</AddToCart>

@code {
    private async Task HandleAddToCartAsync()
    {
        try
        {
            await cartService.AddItemAsync(productId);
            cartCount = await cartService.GetItemCountAsync();
            StateHasChanged();
            
            // Show success notification
            toastService.ShowSuccess("Item added to cart!");
        }
        catch (Exception ex)
        {
            toastService.ShowError("Failed to add item to cart.");
        }
    }
}
```

### Example 6: Image-Only Animation

```razor
<!-- Simple image animation -->
<AddToCart Destination="#cart">
    <img src="product.jpg" alt="Product" class="product-thumbnail" />
</AddToCart>
```

### Example 7: Complex Nested Content

```razor
<AddToCart Destination="#cart" OnAnimationComplete="UpdateCart">
    <div class="product-card">
        <div class="product-badge">New</div>
        <img src="product.jpg" alt="Product" />
        <div class="product-overlay">
            <h3>Product Name</h3>
            <p>$99.99</p>
        </div>
    </div>
</AddToCart>
```

### Example 8: Conditional Rendering

```razor
@if (product.InStock)
{
    <AddToCart Destination="#cart" OnAnimationComplete="AddToCart">
        <button class="btn-add-to-cart">Add to Cart</button>
    </AddToCart>
}
else
{
    <button class="btn-disabled" disabled>Out of Stock</button>
}
```

### Example 9: Using with Forms

```razor
<EditForm Model="@product" OnValidSubmit="HandleSubmit">
    <DataAnnotationsValidator />
    
    <InputNumber @bind-Value="product.Quantity" />
    
    <AddToCart Destination="#cart" OnAnimationComplete="SubmitForm">
        <button type="submit" class="btn-primary">Add to Cart</button>
    </AddToCart>
</EditForm>

@code {
    private Product product = new();
    
    private void SubmitForm()
    {
        // Form validation happens before animation
        // This callback fires after animation completes
    }
}
```

### Example 10: Creative Non-Ecommerce Uses

```razor
<!-- Star Collector Game -->
<AddToCart Destination="#star-collection" OnAnimationComplete="CollectStar">
    <div class="star">⭐</div>
</AddToCart>

<!-- Message Sender -->
<AddToCart Destination="#inbox" OnAnimationComplete="SendMessage">
    <div class="message-bubble">Hello!</div>
</AddToCart>

<!-- Energy Transfer -->
<AddToCart Destination="#battery" OnAnimationComplete="TransferEnergy">
    <div class="energy-source">⚡</div>
</AddToCart>
```

### Example 11: Multiple Items with Count

```razor
<AddToCart Destination="#cart" Count="10" OnAnimationComplete="HandleBulkAdd">
    <button class="btn-primary">Add 10 Items</button>
</AddToCart>

@code {
    private void HandleBulkAdd()
    {
        // Fires once after all 10 animations complete
        cartCount += 10;
        StateHasChanged();
    }
}
```

### Example 12: Custom Trigger Element

```razor
<AddToCart Destination="#cart" Trigger=".add-to-cart-btn">
    <div class="product-card">
        <img src="product.jpg" />
        <h3>Product Name</h3>
        <p>$99.99</p>
        <!-- Only this button triggers the animation -->
        <button class="add-to-cart-btn">Add to Cart</button>
    </div>
</AddToCart>
```

### Example 13: Progress Tracking

```razor
<AddToCart Destination="#cart" 
           Count="5"
           OnAnimationProgress="UpdateProgress"
           OnAnimationComplete="HandleComplete">
    <button>Add 5 Items</button>
</AddToCart>

<div class="progress-bar">
    <div class="progress-fill" style="width: @($"{progress * 100}%")"></div>
</div>

@code {
    private double progress = 0.0;

    private void UpdateProgress(double progressValue)
    {
        progress = progressValue; // 0.0 to 1.0
        StateHasChanged();
    }

    private void HandleComplete()
    {
        progress = 0.0;
        StateHasChanged();
    }
}
```

### Example 14: Combining All Features

```razor
<AddToCart Destination="#cart" 
           Count="@quantity"
           Trigger=".add-to-cart-btn"
           Speed="0.8"
           OnAnimationProgress="HandleProgress"
           OnAnimationComplete="HandleComplete">
    <div class="product-card">
        <img src="@product.ImageUrl" />
        <h3>@product.Name</h3>
        <p>$@product.Price</p>
        <button class="add-to-cart-btn">Add @quantity to Cart</button>
    </div>
</AddToCart>

@code {
    private int quantity = 5;
    private double progress = 0.0;

    private void HandleProgress(double p) => progress = p;
    
    private async Task HandleComplete()
    {
        await cartService.AddItemsAsync(productId, quantity);
        progress = 0.0;
        StateHasChanged();
    }
}
```

## 🎯 Advanced Usage

### Handling Multiple Rapid Clicks

The component supports concurrent animations, so users can rapidly click multiple items without issues:

```razor
<!-- All items can animate simultaneously -->
@foreach (var product in products)
{
    <AddToCart Destination="#cart" OnAnimationComplete="() => AddToCart(product.Id)">
        <img src="@product.ImageUrl" />
    </AddToCart>
}
```

### Performance Optimization

For large product lists, consider using virtualization:

```razor
<Virtualize Items="@products" Context="product">
    <AddToCart Destination="#cart" OnAnimationComplete="() => AddToCart(product.Id)">
        <div class="product-card">
            <img src="@product.ImageUrl" />
        </div>
    </AddToCart>
</Virtualize>
```

### CSS Styling

The component uses `display: contents` by default, so it doesn't add extra DOM elements. Style your content directly:

```css
/* Style the content inside AddToCart */
.product-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    transition: transform 0.2s;
}

.product-card:hover {
    transform: scale(1.05);
}

.product-card img {
    width: 100%;
    height: auto;
    border-radius: 4px;
}
```

## ♿ Accessibility

The component automatically respects user preferences:

- **Reduced Motion**: If `prefers-reduced-motion: reduce` is detected, animations are skipped and a visual feedback (ping effect) is shown instead
- **High Contrast**: Supports high contrast mode with appropriate outlines
- **Dark Mode**: Optimized for dark color schemes
- **Print Styles**: Animations are hidden when printing

No additional configuration needed - these features work automatically!

## 🔧 Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- All modern browsers with CSS transform and requestAnimationFrame support

## ⚡ Performance Considerations

- **Low Allocation**: Easing control points are passed to JS (avoids per-click easing-string formatting in .NET and regex parsing in JS). `CubicBezier.ToCssString()` is intended for display/debugging and allocates the returned string.
- **Concurrent Animations**: Multiple animations can run simultaneously without performance degradation
- **GPU Acceleration**: Uses CSS transforms for hardware-accelerated animations
- **AOT Compatible**: Fully compatible with .NET AOT compilation
- **Trimming-Friendly**: No reflection or dynamic code generation

## 🧪 Testing

The solution includes bUnit tests covering:

- Component rendering
- Event callbacks
- JS interop initialization / invocations

Run tests locally:

```bash
dotnet test
```

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md).

## 📖 API Reference

### `AddToCart` Component

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `Destination` | `string` | Yes | - | CSS selector for animation destination |
| `Speed` | `double` | No | `0.6` | Animation duration in seconds |
| `EasingX` | `CubicBezier` | No | `CubicBezier.CartX` | Horizontal movement easing |
| `EasingY` | `CubicBezier` | No | `CubicBezier.CartY` | Vertical movement easing |
| `EasingScale` | `CubicBezier` | No | `CubicBezier.CartScale` | Scale transformation easing |
| `OnBeforeAnimation` | `EventCallback` | No | `null` | Callback before animation starts (fires once per click) |
| `OnAnimationComplete` | `EventCallback` | No | `null` | Callback when animation completes (fires once for multiple animations) |
| `Count` | `int` | No | `1` | Number of items to animate with staggered timing |
| `Trigger` | `string?` | No | `null` | CSS selector for specific trigger element |
| `OnAnimationProgress` | `EventCallback<double>` | No | `null` | Callback for progress updates (0.0 to 1.0) |
| `ChildContent` | `RenderFragment` | No | `null` | Content to animate |

### `CubicBezier` Struct

Represents a cubic bezier easing function with compile-time constants.

**Constructor:**
```csharp
public CubicBezier(float x1, float y1, float x2, float y2)
```

**Methods:**
```csharp
string ToCssString() // Converts to CSS cubic-bezier() string
```

**Static Properties:** See [Easing Functions](#-easing-functions) section above.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Inspired by modern e-commerce animations and optimized for Blazor applications.
