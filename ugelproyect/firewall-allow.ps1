# Script para permitir el puerto 5173 en el Firewall de Windows
Write-Host "🔓 Configurando firewall para permitir puerto 5173...`n"

# Verificar si ya existe la regla
$existingRule = Get-NetFirewallRule -DisplayName "Vite Dev Server Port 5173" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "✅ La regla del firewall ya existe" -ForegroundColor Green
} else {
    try {
        # Crear nueva regla de firewall
        New-NetFirewallRule `
            -DisplayName "Vite Dev Server Port 5173" `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort 5173 `
            -Action Allow `
            -Profile Domain,Private,Public | Out-Null
        
        Write-Host "✅ Regla de firewall creada exitosamente" -ForegroundColor Green
        Write-Host "✅ El puerto 5173 ahora está permitido" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al crear la regla de firewall" -ForegroundColor Red
        Write-Host "💡 Intenta ejecutar este script como Administrador" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Comando manual:" -ForegroundColor Cyan
        Write-Host "New-NetFirewallRule -DisplayName 'Vite Dev Server Port 5173' -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow" -ForegroundColor White
        exit 1
    }
}

Write-Host "`n✅ Configuración completada!" -ForegroundColor Green
Write-Host "🌐 Ahora puedes acceder desde otros dispositivos en tu red local`n" -ForegroundColor Cyan

