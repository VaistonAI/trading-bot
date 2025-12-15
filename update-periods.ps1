# Script para actualizar todas las páginas de estrategias al periodo 2023-2025

$updates = @(
    @{File="src/pages/results/ResultsMomentum2025.tsx"; Strategy="Momentum"; Collection="momentum"},
    @{File="src/pages/results/ResultsGrowth2025.tsx"; Strategy="Growth"; Collection="growth"},
    @{File="src/pages/results/ResultsMeanReversion2025.tsx"; Strategy="Mean Reversion"; Collection="meanreversion"},
    @{File="src/pages/results/ResultsBreakout2025.tsx"; Strategy="Breakout"; Collection="breakout"},
    @{File="src/pages/results/ResultsRSI2025.tsx"; Strategy="RSI"; Collection="rsi"},
    @{File="src/pages/results/ResultsMACD2025.tsx"; Strategy="MACD"; Collection="macd"},
    @{File="src/pages/results/ResultsVolumeWeighted2025.tsx"; Strategy="Volume Weighted"; Collection="volumeweighted"},
    @{File="src/pages/results/ResultsPairs2025.tsx"; Strategy="Pairs Trading"; Collection="pairs"}
)

foreach ($item in $updates) {
    $content = Get-Content $item.File -Raw -Encoding UTF8
    
    # Update title
    $content = $content -replace "R $($item.Strategy) 2025", "R $($item.Strategy) (2023-2025)"
    
    # Update description
    $content = $content -replace "Simulación histórica de la estrategia $($item.Strategy) en 2025 \(YTD: Ene 1 - Dic 14\)", "Backtesting institucional: 01 Enero 2023 - 11 Diciembre 2025"
    
    # Update empty state message
    $content = $content -replace "Ejecuta la simulación para ver el rendimiento de la estrategia $($item.Strategy) en 2025", "Ejecuta la simulación para ver el rendimiento profesional de la estrategia $($item.Strategy) (2023-2025)"
    
    Set-Content -Path $item.File -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Updated: $($item.File)"
}

Write-Host "`nDone! Updated 8 strategy pages."
