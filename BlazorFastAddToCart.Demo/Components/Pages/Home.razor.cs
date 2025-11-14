namespace BlazorFastAddToCart.Demo.Components.Pages;

public partial class Home
{
    private int cartCount = 0;
    private double customSpeed = 0.8;
    private int itemCount = 1;
    private double animationProgress = 0.0;
    private string progressStatus = "Ready";

    private void HandleAddToCart()
    {
        cartCount++;
    }

    private void HandleProgressUpdate(double progress)
    {
        animationProgress = progress;
        progressStatus = progress < 1.0 ? $"Animating... {progress * 100:F1}%" : "Complete!";
        StateHasChanged();
    }

    private void HandleProgressComplete()
    {
        animationProgress = 0.0;
        progressStatus = "Ready";
        StateHasChanged();
    }
}
