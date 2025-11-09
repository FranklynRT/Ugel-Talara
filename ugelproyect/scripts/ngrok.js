import ngrok from 'ngrok';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Cargar variables de entorno desde .env si existe
function loadEnv() {
  const envPath = join(projectRoot, '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    const envLines = envContent.split('\n');
    envLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnv();

const PORT = parseInt(process.env.PORT || '5173');
const NGROK_AUTH_TOKEN = process.env.NGROK_AUTH_TOKEN || '';

// Verificar que el servidor esté corriendo
async function checkServerRunning(port, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}`, { timeout: 3000 }, (res) => {
          resolve(true);
        });
        
        req.on('error', () => {
          resolve(false);
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
      });
      
      if (result) return true;
      
      // Esperar antes de reintentar
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      if (i === maxRetries - 1) return false;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function startTunnel() {
  try {
    console.log('🚀 Iniciando túnel ngrok...');
    console.log(`📍 Puerto local: ${PORT}`);
    
    // Verificar que el servidor esté corriendo
    console.log('🔍 Verificando que el servidor esté corriendo...');
    const serverRunning = await checkServerRunning(PORT);
    
    if (!serverRunning) {
      console.error(`\n❌ El servidor no está corriendo en el puerto ${PORT}`);
      console.error('💡 Solución: Inicia el servidor primero con:');
      console.error('   npm run dev');
      console.error('\n   Luego en otra terminal ejecuta:');
      console.error('   npm run tunnel\n');
      process.exit(1);
    }
    
    console.log('✅ Servidor detectado en el puerto', PORT);
    
    // Cerrar cualquier túnel ngrok existente de manera más agresiva
    console.log('🔄 Cerrando túneles ngrok anteriores...');
    try {
      // Intentar cerrar todos los túneles
      await ngrok.kill();
      // Esperar un momento para que se cierren completamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Túneles anteriores cerrados');
    } catch (e) {
      // Intentar múltiples veces si hay túneles activos
      for (let i = 0; i < 3; i++) {
        try {
          await ngrok.kill();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log(`✅ Intento ${i + 1}: Túneles cerrados`);
          break;
        } catch (retryError) {
          if (i === 2) {
            console.warn('⚠️  No se pudieron cerrar algunos túneles, intentando continuar...');
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    const config = {
      addr: PORT,
      inspect: false, // Deshabilitar interfaz web de ngrok
      log: false, // Reducir logs de ngrok
    };

    // Si hay token de autenticación, usarlo
    if (NGROK_AUTH_TOKEN && NGROK_AUTH_TOKEN.trim() !== '') {
      config.authtoken = NGROK_AUTH_TOKEN.trim();
      console.log('✅ Token de autenticación configurado');
    } else {
      console.warn('⚠️  No hay token de autenticación configurado (NGROK_AUTH_TOKEN)');
      console.warn('⚠️  El túnel expirará después de 2 horas. Registrate en https://ngrok.com para obtener un token gratuito.');
      console.warn('💡 Alternativa: Usa acceso local con "npm run get-ip" si solo necesitas acceso en tu red local.\n');
    }

    console.log('🔗 Conectando con ngrok...\n');
    
    // Intentar conectar con un timeout más largo y mejor manejo de errores
    let url;
    try {
      url = await Promise.race([
        ngrok.connect(config),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: ngrok tardó demasiado en responder (más de 30 segundos)')), 45000)
        )
      ]);
    } catch (connectError) {
      // Manejar error específico de endpoint ya en uso
      if (connectError.message.includes('ERR_NGROK_334') || 
          connectError.message.includes('already online') ||
          connectError.message.includes('endpoint') && connectError.message.includes('already')) {
        console.error('\n❌ Error: Ya hay un túnel ngrok activo con esta configuración');
        console.error('💡 Soluciones:');
        console.error('   1. Espera unos segundos y vuelve a intentar (el túnel anterior se cerrará automáticamente)');
        console.error('   2. Cierra manualmente el proceso ngrok anterior');
        console.error('   3. Espera 30 segundos y ejecuta: npm run tunnel');
        console.error('\n🔄 Intentando cerrar túneles activos y reintentar...\n');
        
        // Intentar cerrar y esperar más tiempo
        try {
          await ngrok.kill();
          console.log('✅ Túneles cerrados, esperando 5 segundos...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Reintentar la conexión
          console.log('🔄 Reintentando conexión...');
          url = await Promise.race([
            ngrok.connect(config),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout en reintento')), 45000)
            )
          ]);
          console.log('✅ Túnel iniciado exitosamente después del reintento');
        } catch (retryError) {
          console.error('\n❌ No se pudo iniciar el túnel después del reintento');
          console.error('💡 Por favor, cierra manualmente cualquier proceso ngrok y vuelve a intentar');
          throw retryError;
        }
      } else if (connectError.message.includes('tunnel session failed')) {
        console.error('❌ Error: No se pudo establecer conexión con los servidores de ngrok');
        console.error('💡 Verifica tu conexión a internet');
        throw connectError;
      } else if (connectError.message.includes('authtoken')) {
        console.error('❌ Error: Token de autenticación inválido');
        console.error('💡 Verifica que el token en .env sea correcto');
        throw connectError;
      } else {
        throw connectError;
      }
    }
    
    console.log('\n✨ ========================================');
    console.log('✅ Túnel ngrok iniciado exitosamente!');
    console.log(`🌐 URL pública: ${url}`);
    console.log(`🔗 Comparte esta URL para acceder a tu aplicación`);
    console.log('✨ ========================================\n');
    
    // Información adicional
    console.log(`📍 URL local: http://localhost:${PORT}`);
    console.log(`🌐 URL pública: ${url}`);
    console.log('💡 Presiona Ctrl+C para detener el túnel\n');

    // Manejar cierre limpio
    process.on('SIGINT', async () => {
      console.log('\n🛑 Cerrando túnel ngrok...');
      try {
        await ngrok.kill();
        console.log('✅ Túnel cerrado correctamente');
      } catch (e) {
        // Ignorar errores al cerrar
      }
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      try {
        await ngrok.kill();
      } catch (e) {
        // Ignorar errores
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Error al iniciar ngrok:', error.message);
    console.error('\n💡 Soluciones posibles:');
    console.error('   1. ✅ Asegúrate de que el servidor esté corriendo: npm run dev');
    console.error('   2. 📝 Crea un archivo .env en ugelproyect/ con tu token:');
    console.error('      NGROK_AUTH_TOKEN=tu_token_aqui');
    console.error('      PORT=5173');
    console.error('   3. 🌐 Registrate en https://ngrok.com para obtener un token gratuito');
    console.error('   4. 🔄 Reinstala ngrok: npm uninstall ngrok && npm install ngrok --save-dev');
    console.error('   5. 🌐 Verifica tu conexión a internet');
    console.error('\n💡 Alternativa: Si solo necesitas acceso en tu red local:');
    console.error('   • Ejecuta: npm run get-ip');
    console.error('   • Usa esa IP en tu otro dispositivo: http://TU_IP:5173\n');
    process.exit(1);
  }
}

startTunnel();

