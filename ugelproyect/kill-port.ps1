# Script para matar procesos usando el puerto 5173
Write-Host "Buscando procesos en el puerto 5173..."

# Obtener procesos que usan el puerto 5173
$connections = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($connections) {
    foreach ($connection in $connections) {
        $processId = $connection.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        if ($process) {
            Write-Host "Deteniendo proceso: $($process.ProcessName) (PID: $processId)"
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "✅ Procesos detenidos"
} else {
    Write-Host "ℹ️  No hay procesos usando el puerto 5173"
}

# También matar procesos de Node.js relacionados con vite
Write-Host "`nBuscando procesos de Node.js relacionados con Vite..."
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*ugelproyect*" -or 
    $_.CommandLine -like "*vite*"
}

if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Write-Host "Deteniendo proceso Node.js (PID: $($proc.Id))"
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Procesos de Node.js detenidos"
} else {
    Write-Host "ℹ️  No hay procesos de Node.js relacionados con Vite"
}

Write-Host "`n✅ Limpieza completada. Puedes iniciar el servidor nuevamente."

