# 🚀 Guía Rápida: Docker con GitHub

## ✅ ¿Está listo para usar Docker con GitHub?

**¡Sí!** Tu proyecto ya está configurado para usar Docker con GitHub. Solo necesitas subir el código.

## 📋 Pasos Rápidos

### 1. Preparar el Repositorio

Si vas a subir **solo el frontend** (recomendado):

```bash
cd ugelproyect
git init
git add .
git commit -m "Initial commit with Docker"
```

Si vas a subir **todo el proyecto** (Frontend/ con Api/ y ugelproyect/):

```bash
cd ..
git init
git add .
git commit -m "Initial commit with Docker"
```

### 2. Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un nuevo repositorio
3. **NO inicialices con README** (si ya tienes código)

### 3. Subir el Código

```bash
# Reemplaza USERNAME y REPO_NAME con tus datos
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### 4. Verificar el Build

1. Ve a tu repositorio en GitHub
2. Haz clic en la pestaña **"Actions"**
3. Verás el workflow ejecutándose automáticamente
4. Cuando termine, ve a **"Packages"** para ver tu imagen

### 5. Usar la Imagen

```bash
# Descargar la imagen
docker pull ghcr.io/USERNAME/REPO_NAME:latest

# Ejecutar
docker run -d -p 3000:80 --name ugel-frontend ghcr.io/USERNAME/REPO_NAME:latest
```

## ⚙️ Configuración del Workflow

El workflow está configurado para construir desde la **raíz del repositorio**.

### Si subes SOLO el frontend (ugelproyect/):
✅ **Ya está configurado correctamente** - No necesitas cambiar nada

### Si subes TODO el proyecto (Frontend/):
Edita `.github/workflows/docker-build.yml` y cambia:

```yaml
context: ./ugelproyect
file: ./ugelproyect/Dockerfile
```

## 🎯 ¿Qué hace el Workflow?

1. **Se activa automáticamente** cuando:
   - Haces push a `main` o `master`
   - Creas un tag como `v1.0.0`
   - Abres un Pull Request

2. **Construye la imagen Docker** con:
   - Node.js 18
   - Build de producción
   - Nginx para servir los archivos estáticos

3. **Publica la imagen** en GitHub Container Registry (ghcr.io)

4. **Crea múltiples tags**:
   - `latest` (solo para la rama principal)
   - Nombre de la rama (`main`, `develop`, etc.)
   - Tags de Git (`v1.0.0`, `v2.1.0`, etc.)
   - SHA del commit

## 📦 Estructura de Archivos Necesarios

```
ugelproyect/
├── Dockerfile              ✅ Construcción de la imagen
├── Dockerfile.dev          ✅ Para desarrollo
├── docker-compose.yml      ✅ Orquestación
├── nginx.conf              ✅ Configuración de Nginx
├── .dockerignore           ✅ Archivos a excluir
├── .github/
│   └── workflows/
│       └── docker-build.yml ✅ Workflow de GitHub Actions
└── package.json            ✅ Dependencias y scripts
```

## 🔍 Verificar que Todo Esté Bien

### Antes de subir a GitHub:

1. **Probar construcción local**:
   ```bash
   cd ugelproyect
   docker build -t test-frontend .
   ```

2. **Probar ejecución**:
   ```bash
   docker run -d -p 3000:80 --name test test-frontend
   ```

3. **Verificar que funciona**:
   - Abre http://localhost:3000
   - Debería cargar tu aplicación

### Después de subir a GitHub:

1. **Revisar los logs de GitHub Actions**
2. **Verificar que la imagen se publicó** en Packages
3. **Descargar y probar**:
   ```bash
   docker pull ghcr.io/USERNAME/REPO_NAME:latest
   docker run -d -p 3000:80 ghcr.io/USERNAME/REPO_NAME:latest
   ```

## 🐛 Problemas Comunes

### El workflow falla:

1. **Revisa los logs** en la pestaña "Actions"
2. **Verifica que `package.json` tenga el script `build`**
3. **Asegúrate de que el Dockerfile esté en la ubicación correcta**

### No puedo descargar la imagen:

1. **Verifica los permisos** del package en GitHub
2. **Asegúrate de estar autenticado**:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

### La imagen es muy grande:

- ✅ Ya estás usando multi-stage build (optimizado)
- ✅ El `.dockerignore` excluye archivos innecesarios
- ✅ Solo se incluyen los archivos necesarios para producción

## 📚 Más Información

- Ver `GITHUB_DOCKER.md` para información detallada
- Ver `DOCKER.md` para uso local de Docker
- Ver la documentación de GitHub Actions

## ✅ Checklist Final

- [ ] Dockerfile está presente
- [ ] nginx.conf está presente
- [ ] .dockerignore está configurado
- [ ] .github/workflows/docker-build.yml está presente
- [ ] Probé la construcción localmente
- [ ] Subí el código a GitHub
- [ ] El workflow se ejecutó correctamente
- [ ] La imagen se publicó en Packages

¡Listo! 🎉 Tu frontend se construirá y publicará automáticamente.

