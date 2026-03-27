# Remove duplicate Navbar imports and JSX from all page files
# Navbar is now rendered in layout.tsx only

$files = Get-ChildItem -Path "app" -Recurse -Filter "*.tsx" | Where-Object {
    $_.FullName -notlike "*layout.tsx" -and $_.FullName -notlike "*components*"
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if (-not $content) { continue }
    $original = $content
    
    # Remove Navbar import lines (various path formats)
    $content = $content -replace "import Navbar from `"[^`"]+`";\r?\n", ""
    
    # Remove <Navbar /> and <Navbar/> JSX (with optional whitespace)
    $content = $content -replace "\s*<Navbar\s*/>\r?\n?", ""
    
    if ($content -ne $original) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Output ("Fixed: " + $file.FullName)
    }
}

# Update openai imports to ai imports
$aiFiles = @(
    "app\components\GeminiMetaWriter.tsx",
    "app\components\GeminiToolChat.tsx", 
    "app\components\GeminiXRChat.tsx",
    "app\learn\roadmap\page.tsx",
    "app\learn\tools\page.tsx"
)

foreach ($f in $aiFiles) {
    $path = Join-Path (Get-Location) $f
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        $content = $content -replace '@/lib/openai', '@/lib/ai'
        Set-Content $path -Value $content -NoNewline
        Write-Output ("Updated AI import: " + $path)
    }
}

Write-Output "Done!"
