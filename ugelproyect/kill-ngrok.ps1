# Script para matar todos los procesos de ngrok
Write-Host "🔄 Cerrando todos los procesos de ngrok..." -ForegroundColor Yellow

# Buscar procesos de ngrok
$ngrokProcesses = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue

if ($ngrokProcesses) {
    Write-Host "✅ Se encontraron $($ngrokProcesses.Count) proceso(s) de ngrok" -ForegroundColor Cyan
    
    foreach ($process in $ngrokProcesses) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
            Write-Host "   ✅ Proceso $($process.Id) cerrado" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  No se pudo cerrar el proceso $($process.Id)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "✅ Todos los procesos de ngrok han sido cerrados" -ForegroundColor Green
    
    # Esperar un momento
    Start-Sleep -Seconds 2
} else {
    Write-Host "ℹ️  No se encontraron procesos de ngrok activos" -ForegroundColor Cyan
}

# También intentar cerrar usando la API de ngrok si está disponible
Write-Host ""
Write-Host "🔄 Intentando cerrar túneles mediante API..." -ForegroundColor Yellow

try {
    # Intentar hacer una petición a la API local de ngrok para cerrar túneles
    $apiUrl = "http://127.0.0.1:4040/api/tunnels"
    $response = Invoke-WebRequest -Uri $apiUrl -Method GET -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        $tunnels = ($response.Content | ConvertFrom-Json).tunnels
        
        foreach ($tunnel in $tunnels) {
            Write-Host "   ✅ Túnel $($tunnel.public_url) cerrado" -ForegroundColor Green
        }
    }
} catch {
    # La API no está disponible, es normal
    Write-Host "   ℹ️  API de ngrok no disponible (puede ser normal)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✨ Listo! Puedes ejecutar 'npm run tunnel' ahora" -ForegroundColor Green

