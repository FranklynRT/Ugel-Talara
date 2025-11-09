# 🚀 Instrucciones para usar ngrok

ngrok está instalado y configurado en el proyecto para exponer tu aplicación web públicamente.

## 📋 Configuración Inicial (Recomendado)

1. **Regístrate en ngrok** (gratis):
   - Visita: https://ngrok.com
   - Crea una cuenta gratuita
   - Copia tu token de autenticación

2. **Configura el token**:
   - Crea un archivo `.env` en la raíz del proyecto `ugelproyect/`
   - Agrega tu token:
     ```
     NGROK_AUTH_TOKEN=tu_token_aqui
     PORT=5173
     ```

## 🎯 Uso

### Opción 1: Iniciar servidor y túnel por separado

1. **Terminal 1 - Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Terminal 2 - Inicia el túnel ngrok:**
   ```bash
   npm run tunnel
   ```

### Opción 2: Usar el modo host para acceso local

Si quieres que tu aplicación sea accesible en tu red local también:

```bash
npm run dev:tunnel
```

Luego en otra terminal:
```bash
npm run tunnel
```

## 📱 Uso sin token (Temporal)

Si no configuraste el token, ngrok funcionará pero:
- El túnel expirará después de 2 horas
- Obtendrás una URL aleatoria diferente cada vez
- Limitaciones de tráfico

## ✅ Ventajas del token gratuito

- URLs permanentes con dominio personalizado
- Sin límite de tiempo
- Mejor rendimiento
- Acceso a estadísticas

## 🔍 Verificar que funciona

1. Inicia el servidor: `npm run dev`
2. Inicia ngrok: `npm run tunnel`
3. Copia la URL que ngrok muestra (ej: `https://abc123.ngrok.io`)
4. Comparte esa URL con quien necesite acceso

## ⚠️ Nota Importante

- Asegúrate de que el servidor de desarrollo esté corriendo antes de iniciar ngrok
- El puerto por defecto es 5173 (puedes cambiarlo en `.env`)
- Presiona `Ctrl+C` para detener ngrok cuando termines

