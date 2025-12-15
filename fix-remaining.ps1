# Fix exports for 2024 and 2023 files
$files = @(
    @{File="src/pages/results/ResultsBreakout2024.tsx"; Find="Resultsbreakout2024"; Replace="ResultsBreakout2024"},
    @{File="src/pages/results/ResultsBreakout2023.tsx"; Find="Resultsbreakout2023"; Replace="ResultsBreakout2023"},
    @{File="src/pages/results/ResultsRSI2025.tsx"; Find="Resultsrsi2025"; Replace="ResultsRSI2025"},
    @{File="src/pages/results/ResultsRSI2024.tsx"; Find="Resultsrsi2024"; Replace="ResultsRSI2024"},
    @{File="src/pages/results/ResultsRSI2023.tsx"; Find="Resultsrsi2023"; Replace="ResultsRSI2023"},
    @{File="src/pages/results/ResultsMACD2025.tsx"; Find="Resultsmacd2025"; Replace="ResultsMACD2025"},
    @{File="src/pages/results/ResultsMACD2024.tsx"; Find="Resultsmacd2024"; Replace="ResultsMACD2024"},
    @{File="src/pages/results/ResultsMACD2023.tsx"; Find="Resultsmacd2023"; Replace="ResultsMACD2023"},
    @{File="src/pages/results/ResultsVolumeWeighted2024.tsx"; Find="Resultsvolumeweighted2024"; Replace="ResultsVolumeWeighted2024"},
    @{File="src/pages/results/ResultsVolumeWeighted2023.tsx"; Find="Resultsvolumeweighted2023"; Replace="ResultsVolumeWeighted2023"},
    @{File="src/pages/results/ResultsPairs2024.tsx"; Find="Resultspairs2024"; Replace="ResultsPairs2024"},
    @{File="src/pages/results/ResultsPairs2023.tsx"; Find="Resultspairs2023"; Replace="ResultsPairs2023"}
)

foreach ($item in $files) {
    $content = Get-Content $item.File -Raw -Encoding UTF8
    $newContent = $content -replace "export const $($item.Find)", "export const $($item.Replace)"
    Set-Content -Path $item.File -Value $newContent -Encoding UTF8 -NoNewline
    Write-Host "Fixed: $($item.File)"
}

Write-Host "`nDone! Fixed 12 files."
