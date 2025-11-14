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
  private int _activeAnimations;
  private int _completedAnimations;
  private long _batchId;

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

  [Parameter]
  public int Count { get; set; } = 1;

  [Parameter]
  public string? Trigger { get; set; }

  [Parameter]
  public EventCallback<double> OnAnimationProgress { get; set; }

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

      var triggerSelector = Trigger ?? null;
      await _module.InvokeVoidAsync("initialize", _triggerRef, Destination, _dotNetRef, triggerSelector);

      _isInitialized = true;
    }
  }

  private async Task OnClickAsync()
  {
    if (!_isInitialized || _module is null || Count < 1)
      return;

    // Start new animation batch with unique ID
    _batchId++;
    var currentBatchId = _batchId;
    _activeAnimations = Count;
    _completedAnimations = 0;

    var triggerSelector = Trigger ?? null;
    
    await _module.InvokeVoidAsync(
      "animateToCart",
      _triggerRef,
      Destination,
      Speed,
      EasingX.ToCssString(),
      EasingY.ToCssString(),
      EasingScale.ToCssString(),
      _dotNetRef,
      Count,
      triggerSelector,
      currentBatchId
    );
  }

  [JSInvokable]
  public async Task OnAnimationCompleted(long batchId)
  {
    // Only process completions for the current batch (ignore stale batches from rapid clicks)
    if (batchId != _batchId)
      return;
    
    // Track completion for multiple animations
    _completedAnimations++;
    
    // Only fire callback when all animations complete
    if (_completedAnimations >= _activeAnimations)
    {
      _completedAnimations = 0;
      _activeAnimations = 0;
      
      if (OnAnimationComplete.HasDelegate)
      {
        await OnAnimationComplete.InvokeAsync();
      }
    }
  }

  [JSInvokable]
  public async Task OnAnimationProgressUpdate(double progress)
  {
    // Progress is 0.0 to 1.0 representing overall progress across all animations
    if (OnAnimationProgress.HasDelegate)
    {
      await OnAnimationProgress.InvokeAsync(progress);
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
