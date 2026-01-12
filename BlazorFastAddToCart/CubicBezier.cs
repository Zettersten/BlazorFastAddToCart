namespace BlazorFastAddToCart;

/// <summary>
/// Represents a cubic bezier easing function with compile-time constants and zero allocations.
/// </summary>
public readonly record struct CubicBezier(float X1, float Y1, float X2, float Y2)
{
  // Predefined easing functions as static readonly properties
  public static readonly CubicBezier Linear = new(0f, 0f, 1f, 1f);
  public static readonly CubicBezier Ease = new(0.25f, 0.1f, 0.25f, 1f);
  public static readonly CubicBezier EaseIn = new(0.42f, 0f, 1f, 1f);
  public static readonly CubicBezier EaseOut = new(0f, 0f, 0.58f, 1f);
  public static readonly CubicBezier EaseInOut = new(0.42f, 0f, 0.58f, 1f);

  // Additional popular easings
  public static readonly CubicBezier EaseInQuad = new(0.55f, 0.085f, 0.68f, 0.53f);
  public static readonly CubicBezier EaseOutQuad = new(0.25f, 0.46f, 0.45f, 0.94f);
  public static readonly CubicBezier EaseInOutQuad = new(0.455f, 0.03f, 0.515f, 0.955f);

  public static readonly CubicBezier EaseInCubic = new(0.55f, 0.055f, 0.675f, 0.19f);
  public static readonly CubicBezier EaseOutCubic = new(0.215f, 0.61f, 0.355f, 1f);
  public static readonly CubicBezier EaseInOutCubic = new(0.645f, 0.045f, 0.355f, 1f);

  public static readonly CubicBezier EaseInQuart = new(0.895f, 0.03f, 0.685f, 0.22f);
  public static readonly CubicBezier EaseOutQuart = new(0.165f, 0.84f, 0.44f, 1f);
  public static readonly CubicBezier EaseInOutQuart = new(0.77f, 0f, 0.175f, 1f);

  public static readonly CubicBezier EaseInQuint = new(0.755f, 0.05f, 0.855f, 0.06f);
  public static readonly CubicBezier EaseOutQuint = new(0.23f, 1f, 0.32f, 1f);
  public static readonly CubicBezier EaseInOutQuint = new(0.86f, 0f, 0.07f, 1f);

  // Bouncy/elastic effects
  public static readonly CubicBezier EaseInBack = new(0.6f, -0.28f, 0.735f, 0.045f);
  public static readonly CubicBezier EaseOutBack = new(0.175f, 0.885f, 0.32f, 1.275f);
  public static readonly CubicBezier EaseInOutBack = new(0.68f, -0.55f, 0.265f, 1.55f);

  // Custom for shopping cart animations
  public static readonly CubicBezier CartX = new(0.59f, -0.75f, 0.91f, 0.5f);
  public static readonly CubicBezier CartY = new(0.15f, 0.57f, 0.9f, 1.05f);
  public static readonly CubicBezier CartScale = new(0.85f, 0.06f, 0.97f, 1.01f);

  /// <summary>
  /// Converts the cubic bezier to a CSS cubic-bezier() function string.
  /// Uses stack allocation to avoid heap allocations.
  /// </summary>
  [SkipLocalsInit]
  public string ToCssString()
  {
    Span<char> buffer = stackalloc char[64];

    if (TryFormat(buffer, out int charsWritten))
    {
      return new string(buffer[..charsWritten]);
    }

    // Fallback for edge cases (should rarely happen)
    return $"cubic-bezier({X1:F2},{Y1:F2},{X2:F2},{Y2:F2})";
  }

  /// <summary>
  /// Attempts to format the cubic bezier into a span with zero allocations.
  /// </summary>
  private bool TryFormat(Span<char> destination, out int charsWritten)
  {
    charsWritten = 0;

    ReadOnlySpan<char> prefix = "cubic-bezier(";
    if (!prefix.TryCopyTo(destination))
      return false;

    charsWritten += prefix.Length;

    // X1
    if (!X1.TryFormat(destination[charsWritten..], out int written, "F2"))
      return false;
    charsWritten += written;

    if (charsWritten >= destination.Length)
      return false;
    destination[charsWritten++] = ',';

    // Y1
    if (!Y1.TryFormat(destination[charsWritten..], out written, "F2"))
      return false;
    charsWritten += written;

    if (charsWritten >= destination.Length)
      return false;
    destination[charsWritten++] = ',';

    // X2
    if (!X2.TryFormat(destination[charsWritten..], out written, "F2"))
      return false;
    charsWritten += written;

    if (charsWritten >= destination.Length)
      return false;
    destination[charsWritten++] = ',';

    // Y2
    if (!Y2.TryFormat(destination[charsWritten..], out written, "F2"))
      return false;
    charsWritten += written;

    if (charsWritten >= destination.Length)
      return false;
    destination[charsWritten++] = ')';

    return true;
  }
}
