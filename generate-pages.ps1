# Script para generar las 18 páginas de estrategias

$strategies = @(
    @{Name="MeanReversion"; Collection="meanreversion"; Title="Mean Reversion"},
    @{Name="Breakout"; Collection="breakout"; Title="Breakout"},
    @{Name="RSI"; Collection="rsi"; Title="RSI"},
    @{Name="MACD"; Collection="macd"; Title="MACD"},
    @{Name="VolumeWeighted"; Collection="volumeweighted"; Title="Volume Weighted"},
    @{Name="Pairs"; Collection="pairs"; Title="Pairs Trading"}
)

$years = @(2025, 2024, 2023)

$template = Get-Content "src/pages/results/ResultsMeanReversion2025.tsx" -Raw

foreach ($strategy in $strategies) {
    foreach ($year in $years) {
        if ($strategy.Name -eq "MeanReversion" -and $year -eq 2025) {
            continue  # Ya existe
        }
        
        $content = $template `
            -replace "MeanReversion", $strategy.Name `
            -replace "meanreversion", $strategy.Collection `
            -replace "Mean Reversion", $strategy.Title `
            -replace "2025", $year
        
        $filename = "src/pages/results/Results$($strategy.Name)$year.tsx"
        $content | Out-File -FilePath $filename -Encoding UTF8
        Write-Host "Created $filename"
    }
}

Write-Host "`nCompleted! Created 17 new pages."
