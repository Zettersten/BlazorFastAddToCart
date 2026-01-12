namespace BlazorFastAddToCart.Demo.Components.Pages;

public partial class CreativeDemos : IDisposable
{
    private static readonly Random Random = Random.Shared;

    private int starCount = 0;
    private int messageCount = 0;
    private int batteryLevel = 0;
    private int particleCount = 0;
    private int coinCount = 0;
    private int heartCount = 0;
    private int totalScore = 0;
    private int comboMultiplier = 1;
    private DateTime? lastStarCollectionTime;
    private System.Threading.Timer? comboResetTimer;

    private readonly List<StarInfo> stars = new();
    private readonly List<MessageInfo> messages = new();
    private readonly List<EnergySource> energySources = new();
    private readonly List<ParticleInfo> particles = new();
    private readonly List<CoinInfo> coins = new();
    private readonly List<HeartInfo> hearts = new();

    protected override void OnInitialized()
    {
        // Initialize stars
        for (var i = 0; i < 25; i++)
        {
            stars.Add(new StarInfo { Id = i, Visible = true, Delay = i * 0.1 });
        }

        // Initialize messages
        var messageData = new[]
        {
            ("💌", "Hello!", 0),
            ("🎉", "Congratulations!", 20),
            ("❤️", "Love this!", 40),
            ("🚀", "Amazing!", 60),
            ("⭐", "Great job!", 80),
            ("🎁", "Surprise!", 100),
            ("🔥", "Hot stuff!", 120),
            ("💎", "Precious!", 140),
            ("🎨", "Creative!", 160),
            ("🌟", "Stellar!", 180),
        };

        for (var i = 0; i < messageData.Length; i++)
        {
            messages.Add(new MessageInfo
            {
                Id = i,
                Icon = messageData[i].Item1,
                Text = messageData[i].Item2,
                Visible = true,
                Hue = messageData[i].Item3,
            });
        }

        // Initialize energy sources
        for (var i = 0; i < 12; i++)
        {
            energySources.Add(new EnergySource { Id = i, Energy = 100 });
        }

        // Initialize particles
        for (var i = 0; i < 40; i++)
        {
            particles.Add(new ParticleInfo
            {
                Id = i,
                Visible = true,
                Delay = i * 0.05,
                Hue = Random.Next(0, 360),
            });
        }

        // Initialize coins
        for (var i = 0; i < 30; i++)
        {
            coins.Add(new CoinInfo { Id = i, Visible = true, Rotation = i * 12 });
        }

        // Initialize hearts
        for (var i = 0; i < 20; i++)
        {
            hearts.Add(new HeartInfo { Id = i, Visible = true, Delay = i * 0.1 });
        }
    }

    private void RemoveStar(int id)
    {
        var star = stars.Find(s => s.Id == id);
        if (star is null)
            return;

        star.Visible = false;
        StateHasChanged();
    }

    private void CollectStar(int id)
    {
        starCount++;

        // Combo system: if collected within 1 second of last collection, increase combo
        var now = DateTime.UtcNow;
        if (lastStarCollectionTime.HasValue && (now - lastStarCollectionTime.Value).TotalSeconds < 1.0)
        {
            comboMultiplier = Math.Min(comboMultiplier + 1, 10);
        }
        else
        {
            comboMultiplier = 1;
        }

        totalScore += 10 * comboMultiplier;
        lastStarCollectionTime = now;

        // Reset combo after 1.5 seconds of inactivity
        comboResetTimer?.Dispose();
        comboResetTimer = new System.Threading.Timer(_ =>
        {
            comboMultiplier = 1;
            _ = InvokeAsync(StateHasChanged);
        }, null, 1500, Timeout.Infinite);

        // Respawn after delay
        var star = stars.Find(s => s.Id == id);
        if (star is not null)
        {
            _ = RespawnAsync(
                delayMs: 2000,
                onRespawn: () =>
                {
                    star.Visible = true;
                }
            );
        }

        StateHasChanged();
    }

    private void RemoveMessage(int id)
    {
        var msg = messages.Find(m => m.Id == id);
        if (msg is null)
            return;

        msg.Visible = false;
        StateHasChanged();
    }

    private void SendMessage(int id)
    {
        messageCount++;

        var msg = messages.Find(m => m.Id == id);
        if (msg is not null)
        {
            _ = RespawnAsync(
                delayMs: 3000,
                onRespawn: () =>
                {
                    msg.Visible = true;
                }
            );
        }

        StateHasChanged();
    }

    private void RemoveEnergySource(int id)
    {
        var source = energySources.Find(s => s.Id == id);
        if (source is null || source.Energy <= 0)
            return;

        // Hide immediately, will be shown again after recharge
        source.Energy = 0;
        StateHasChanged();
    }

    private void TransferEnergy(int id)
    {
        var source = energySources.Find(s => s.Id == id);
        if (source is not null)
        {
            // Calculate transfer amount based on what was stored
            const int transferAmount = 15; // Each source gives 15%
            batteryLevel = Math.Min(batteryLevel + transferAmount, 100);

            // Recharge source after delay
            _ = RespawnAsync(
                delayMs: 5000,
                onRespawn: () =>
                {
                    source.Energy = 100;
                }
            );
        }

        StateHasChanged();
    }

    private void RemoveParticle(int id)
    {
        var particle = particles.Find(p => p.Id == id);
        if (particle is null)
            return;

        particle.Visible = false;
        StateHasChanged();
    }

    private void CollectParticle(int id)
    {
        particleCount++;

        var particle = particles.Find(p => p.Id == id);
        if (particle is not null)
        {
            // Respawn with new hue
            _ = RespawnAsync(
                delayMs: 1500,
                onRespawn: () =>
                {
                    particle.Visible = true;
                    particle.Hue = Random.Next(0, 360);
                }
            );
        }

        StateHasChanged();
    }

    private void RemoveCoin(int id)
    {
        var coin = coins.Find(c => c.Id == id);
        if (coin is null)
            return;

        coin.Visible = false;
        StateHasChanged();
    }

    private void CollectCoin(int id)
    {
        coinCount++;

        var coin = coins.Find(c => c.Id == id);
        if (coin is not null)
        {
            // Respawn after delay
            _ = RespawnAsync(
                delayMs: 2500,
                onRespawn: () =>
                {
                    coin.Visible = true;
                    coin.Rotation = Random.Next(0, 360);
                }
            );
        }

        StateHasChanged();
    }

    private void RemoveHeart(int id)
    {
        var heart = hearts.Find(h => h.Id == id);
        if (heart is null)
            return;

        heart.Visible = false;
        StateHasChanged();
    }

    private void CollectHeart(int id)
    {
        if (heartCount < 10)
        {
            heartCount++;
        }

        var heart = hearts.Find(h => h.Id == id);
        if (heart is not null)
        {
            _ = RespawnAsync(
                delayMs: 2000,
                onRespawn: () =>
                {
                    heart.Visible = true;
                }
            );
        }

        StateHasChanged();
    }

    private async Task RespawnAsync(int delayMs, Action onRespawn)
    {
        await Task.Delay(delayMs).ConfigureAwait(false);
        onRespawn();
        await InvokeAsync(StateHasChanged);
    }

    private class StarInfo
    {
        public int Id { get; set; }
        public bool Visible { get; set; }
        public double Delay { get; set; }
    }

    private class MessageInfo
    {
        public int Id { get; set; }
        public string Icon { get; set; } = default!;
        public string Text { get; set; } = default!;
        public bool Visible { get; set; }
        public int Hue { get; set; }
    }

    private class EnergySource
    {
        public int Id { get; set; }
        public int Energy { get; set; }
    }

    private class ParticleInfo
    {
        public int Id { get; set; }
        public bool Visible { get; set; }
        public double Delay { get; set; }
        public int Hue { get; set; }
    }

    private class CoinInfo
    {
        public int Id { get; set; }
        public bool Visible { get; set; }
        public int Rotation { get; set; }
    }

    private class HeartInfo
    {
        public int Id { get; set; }
        public bool Visible { get; set; }
        public double Delay { get; set; }
    }

    public void Dispose() => comboResetTimer?.Dispose();
}

