namespace BlazorFastAddToCart.Demo.Components.Pages;

public partial class Home
{
    private int cartCount = 0;
    private double customSpeed = 0.8;

    private void HandleAddToCart()
    {
        cartCount++;
    }
}
