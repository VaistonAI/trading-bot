# Script para arreglar los exports de todas las páginas

$files = @(
    @{Path="src/pages/results/ResultsMeanReversion2024.tsx"; Export="ResultsMeanReversion2024"; Year="2024"},
    @{Path="src/pages/results/ResultsMeanReversion2023.tsx"; Export="ResultsMeanReversion2023"; Year="2023"},
    @{Path="src/pages/results/ResultsBreakout2025.tsx"; Export="ResultsBreakout2025"; Year="2025"},
    @{Path="src/pages/results/ResultsBreakout2024.tsx"; Export="ResultsBreakout2024"; Year="2024"},
    @{Path="src/pages/results/ResultsBreakout2023.tsx"; Export="ResultsBreakout2023"; Year="2023"},
    @{Path="src/pages/results/ResultsRSI2025.tsx"; Export="ResultsRSI2025"; Year="2025"},
    @{Path="src/pages/results/ResultsRSI2024.tsx"; Export="ResultsRSI2024"; Year="2024"},
    @{Path="src/pages/results/ResultsRSI2023.tsx"; Export="ResultsRSI2023"; Year="2023"},
    @{Path="src/pages/results/ResultsMACD2025.tsx"; Export="ResultsMACD2025"; Year="2025"},
    @{Path="src/pages/results/ResultsMACD2024.tsx"; Export="ResultsMACD2024"; Year="2024"},
    @{Path="src/pages/results/ResultsMACD2023.tsx"; Export="ResultsMACD2023"; Year="2023"},
    @{Path="src/pages/results/ResultsVolumeWeighted2025.tsx"; Export="ResultsVolumeWeighted2025"; Year="2025"},
    @{Path="src/pages/results/ResultsVolumeWeighted2024.tsx"; Export="ResultsVolumeWeighted2024"; Year="2024"},
    @{Path="src/pages/results/ResultsVolumeWeighted2023.tsx"; Export="ResultsVolumeWeighted2023"; Year="2023"},
    @{Path="src/pages/results/ResultsPairs2025.tsx"; Export="ResultsPairs2025"; Year="2025"},
    @{Path="src/pages/results/ResultsPairs2024.tsx"; Export="ResultsPairs2024"; Year="2024"},
    @{Path="src/pages/results/ResultsPairs2023.tsx"; Export="ResultsPairs2023"; Year="2023"}
)

foreach ($file in $files) {
    $content = Get-Content $file.Path -Raw
    # Fix export name (line 25)
    $content = $content -replace "export const Results\w+2025", "export const $($file.Export)"
    Set-Content -Path $file.Path -Value $content -Encoding UTF8
    Write-Host "Fixed $($file.Path)"
}

Write-Host "`nCompleted! Fixed 17 files."
