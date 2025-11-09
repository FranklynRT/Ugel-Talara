# Script PowerShell para iniciar ngrok fácilmente
Write-Host "🚀 Iniciando túnel ngrok..." -ForegroundColor Cyan
Write-Host ""

# Verificar que el servidor esté corriendo
Write-Host "🔍 Verificando que el servidor esté corriendo en el puerto 5173..." -ForegroundColor Yellow
$serverRunning = netstat -ano | findstr ":5173" | findstr "LISTENING"

if (-not $serverRunning) {
    Write-Host "❌ El servidor no está corriendo en el puerto 5173" -ForegroundColor Red
    Write-Host "💡 Solución: Inicia el servidor primero con:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "   Luego en otra terminal ejecuta:" -ForegroundColor Yellow
    Write-Host "   npm run tunnel" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Servidor detectado en el puerto 5173" -ForegroundColor Green
Write-Host ""

# Iniciar ngrok
npm run tunnel

