using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace BlazorFastAddToCart;

/// <summary>
/// High-performance
/// </summary>
public partial class AddToCart : ComponentBase, IAsyncDisposable
{
  private ElementReference _triggerRef;
  private DotNetObjectReference<AddToCart>? _dotNetRef;
  private IJSObjectReference? _module;
  private bool _isInitialized;

  [Inject]
  private IJSRuntime JS { get; set; } = default!;

  [Parameter, EditorRequired]
  public string Destination { get; set; }

  [Parameter]
  public double Speed { get; set; } = 60.0; // Duration in seconds (matching demo)

  [Parameter]
  public CubicBezier EasingX { get; set; } = CubicBezier.CartX;

  [Parameter]
  public CubicBezier EasingY { get; set; } = CubicBezier.CartY;

  [Parameter]
  public CubicBezier EasingScale { get; set; } = CubicBezier.CartScale;

  [Parameter]
  public RenderFragment? ChildContent { get; set; }

  [Parameter]
  public EventCallback OnAnimationComplete { get; set; }

  protected override async Task OnAfterRenderAsync(bool firstRender)
  {
    if (firstRender)
    {
      _dotNetRef = DotNetObjectReference.Create(this);

      _module = await JS.InvokeAsync<IJSObjectReference>(
          "import",
          "./_content/BlazorFastAddToCart/Components/AddToCart.razor.js"
        )
        .ConfigureAwait(false);

      await _module.InvokeVoidAsync("initialize", _triggerRef, Destination, _dotNetRef);

      _isInitialized = true;
    }
  }

  private async Task OnClickAsync()
  {
    if (!_isInitialized || _module is null)
      return;

    await _module.InvokeVoidAsync(
      "animateToCart",
      _triggerRef,
      Destination,
      Speed,
      EasingX.ToCssString(),
      EasingY.ToCssString(),
      EasingScale.ToCssString(),
      _dotNetRef
    );
  }

  [JSInvokable]
  public async Task OnAnimationCompleted()
  {
    // This is called from JavaScript when animation completes
    if (OnAnimationComplete.HasDelegate)
    {
      await OnAnimationComplete.InvokeAsync();
    }
  }

  public async ValueTask DisposeAsync()
  {
    if (_module is not null)
    {
      await _module.InvokeVoidAsync("cleanup", _triggerRef);
      await _module.DisposeAsync();
    }

    _dotNetRef?.Dispose();
  }
}
