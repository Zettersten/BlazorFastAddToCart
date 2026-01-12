namespace BlazorFastAddToCart.Tests;

public sealed class AddToCartTests : IDisposable
{
  private const string ModulePath = "./_content/BlazorFastAddToCart/Components/AddToCart.razor.js";

  private readonly BunitContext _ctx = new();

  public AddToCartTests()
  {
    _ctx.JSInterop.Mode = JSRuntimeMode.Strict;
  }

  [Fact]
  public void RendersChildContent()
  {
    var module = _ctx.JSInterop.SetupModule(ModulePath);
    module.SetupVoid("initialize").SetVoidResult();

    var cut = _ctx.Render<BlazorFastAddToCart.AddToCart>(ps => ps
      .Add(p => p.Destination, "#cart")
      .Add(p => p.ChildContent, (RenderFragment)(b => b.AddMarkupContent(0, "<button class='btn'>Add</button>")))
    );

    cut.Markup.Should().Contain("Add");
  }

  [Fact]
  public void ImportsModuleAndInitializesOnFirstRender()
  {
    var module = _ctx.JSInterop.SetupModule(ModulePath);
    module.SetupVoid("initialize").SetVoidResult();

    _ = _ctx.Render<BlazorFastAddToCart.AddToCart>(ps => ps
      .Add(p => p.Destination, "#cart")
      .AddChildContent("<button>Add</button>")
    );

    module.VerifyInvoke("initialize");
  }

  [Fact]
  public async Task ClickInvokesOnBeforeAnimationAndAnimateToCart()
  {
    var module = _ctx.JSInterop.SetupModule(ModulePath);
    module.SetupVoid("initialize").SetVoidResult();

    var beforeCalled = false;

    module.SetupVoid("animateToCart", _ => true).SetVoidResult();

    var cut = _ctx.Render<BlazorFastAddToCart.AddToCart>(ps => ps
      .Add(p => p.Destination, "#cart")
      .Add(p => p.Count, 3)
      .Add(p => p.Trigger, ".btn")
      .Add(p => p.OnBeforeAnimation, EventCallback.Factory.Create(this, () => beforeCalled = true))
      .AddChildContent("<button class='btn'>Add</button>")
    );

    cut.WaitForAssertion(() => module.VerifyInvoke("initialize"));
    await cut.Find("div.add-to-cart-trigger").ClickAsync();

    cut.WaitForAssertion(() => beforeCalled.Should().BeTrue());
    cut.WaitForAssertion(() => module.VerifyInvoke("animateToCart"));
  }

  [Fact]
  public async Task OnAnimationCompletedFiresOnAnimationCompleteOncePerBatch()
  {
    var module = _ctx.JSInterop.SetupModule(ModulePath);
    module.SetupVoid("initialize").SetVoidResult();
    module.SetupVoid("animateToCart", _ => true).SetVoidResult();

    var completeCount = 0;

    var cut = _ctx.Render<BlazorFastAddToCart.AddToCart>(ps => ps
      .Add(p => p.Destination, "#cart")
      .Add(p => p.Count, 2)
      .Add(p => p.OnAnimationComplete, EventCallback.Factory.Create(this, () => completeCount++))
      .AddChildContent("<button>Add</button>")
    );

    cut.WaitForAssertion(() => module.VerifyInvoke("initialize"));
    await cut.Find("div.add-to-cart-trigger").ClickAsync();
    cut.WaitForAssertion(() => module.VerifyInvoke("animateToCart"));

    // First click uses batchId=1 (internal counter starts at 0).
    await cut.Instance.OnAnimationCompleted(batchId: 1);
    completeCount.Should().Be(0);

    await cut.Instance.OnAnimationCompleted(batchId: 1);
    completeCount.Should().Be(1);
  }

  [Fact]
  public async Task OnAnimationProgressUpdateInvokesCallback()
  {
    var module = _ctx.JSInterop.SetupModule(ModulePath);
    module.SetupVoid("initialize").SetVoidResult();

    var lastProgress = -1d;

    var cut = _ctx.Render<BlazorFastAddToCart.AddToCart>(ps => ps
      .Add(p => p.Destination, "#cart")
      .Add(p => p.OnAnimationProgress, EventCallback.Factory.Create<double>(this, p => lastProgress = p))
      .AddChildContent("<button>Add</button>")
    );

    await cut.Instance.OnAnimationProgressUpdate(0.42);
    lastProgress.Should().Be(0.42);
  }

  public void Dispose() => _ctx.Dispose();
}

