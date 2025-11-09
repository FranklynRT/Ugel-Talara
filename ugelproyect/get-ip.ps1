# Script para obtener la IP local del dispositivo
Write-Host "`n📱 Información de conexión:`n"

# Obtener IP local
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.InterfaceAlias -notlike "*Virtual*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.IPAddress -notlike "127.*"
} | Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "✅ IP Local: $ipAddress" -ForegroundColor Green
    Write-Host "🌐 URL para acceder desde otros dispositivos en la misma red:" -ForegroundColor Cyan
    Write-Host "   http://$ipAddress:5173" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Asegúrate de:" -ForegroundColor Magenta
    Write-Host "   1. Que el servidor esté corriendo (npm run dev)" -ForegroundColor White
    Write-Host "   2. Que ambos dispositivos estén en la misma red WiFi" -ForegroundColor White
    Write-Host "   3. Que el firewall permita conexiones en el puerto 5173" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  No se pudo obtener la IP local" -ForegroundColor Red
}

Write-Host "📡 Para acceso desde internet, usa ngrok:" -ForegroundColor Cyan
Write-Host "   npm run tunnel" -ForegroundColor Yellow
Write-Host ""

