# 📱 Guía para Acceder desde Otros Dispositivos

Hay dos formas de acceder a tu aplicación desde otros dispositivos:

## 🌐 Opción 1: Acceso Local (Misma Red WiFi)

### Paso 1: Obtener tu IP Local

Ejecuta:
```bash
npm run get-ip
```

Esto mostrará tu IP local (ejemplo: `192.168.1.100`)

### Paso 2: Iniciar el Servidor

```bash
npm run dev
```

El servidor ahora está accesible desde cualquier dispositivo en tu red local.

### Paso 3: Acceder desde Otro Dispositivo

1. **Asegúrate de que ambos dispositivos estén en la misma red WiFi**
2. En el navegador del otro dispositivo, abre:
   ```
   http://TU_IP_LOCAL:5173
   ```
   Por ejemplo: `http://192.168.1.100:5173`

### ⚠️ Problemas Comunes

#### El firewall bloquea el puerto
**Windows:**
1. Abre "Firewall de Windows Defender"
2. Click en "Configuración avanzada"
3. Reglas de entrada → Nueva regla
4. Puerto → TCP → 5173 → Permitir conexión

**O ejecuta este comando en PowerShell como Administrador:**
```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

#### No puedes conectarte desde el otro dispositivo
- ✅ Verifica que ambos dispositivos estén en la misma red WiFi
- ✅ Verifica que el servidor esté corriendo
- ✅ Verifica que el firewall permita el puerto 5173
- ✅ Intenta desactivar temporalmente el antivirus/firewall

## 🌍 Opción 2: Acceso desde Internet (ngrok)

### Paso 1: Configurar ngrok (Recomendado)

1. Registrate en https://ngrok.com (gratis)
2. Obtén tu token de autenticación
3. Crea archivo `.env` en `ugelproyect/`:
   ```
   NGROK_AUTH_TOKEN=tu_token_aqui
   PORT=5173
   ```

### Paso 2: Iniciar Servidor y Túnel

**Terminal 1 - Servidor:**
```bash
npm run dev
```

**Terminal 2 - Túnel ngrok:**
```bash
npm run tunnel
```

### Paso 3: Compartir URL

Ngrok mostrará una URL pública (ej: `https://abc123.ngrok.io`)
- Comparte esta URL con quien necesite acceso
- Funciona desde cualquier lugar con internet

## 🚀 Comandos Útiles

```bash
# Obtener tu IP local
npm run get-ip

# Limpiar puerto y reiniciar servidor
npm run clean

# Iniciar servidor (accesible localmente)
npm run dev

# Iniciar túnel ngrok (accesible desde internet)
npm run tunnel
```

## ✅ Verificación

Si todo está configurado correctamente, deberías poder:
- ✅ Acceder desde `http://localhost:5173` en tu PC
- ✅ Acceder desde `http://TU_IP_LOCAL:5173` en otros dispositivos (misma red)
- ✅ Acceder desde la URL de ngrok desde cualquier lugar (con ngrok configurado)

