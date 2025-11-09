# 🐳 Docker con GitHub - Guía Completa

Esta guía explica cómo usar Docker con GitHub para construir y publicar automáticamente tu frontend.

## 📋 Opciones Disponibles

### Opción 1: GitHub Container Registry (ghcr.io) - Recomendado ✅

GitHub Container Registry es gratuito y está integrado directamente con GitHub.

#### Ventajas:
- ✅ Gratuito para repositorios públicos
- ✅ Integrado con GitHub
- ✅ Sin configuración adicional
- ✅ Acceso automático con `GITHUB_TOKEN`

#### Configuración:

1. **El workflow ya está configurado** en `.github/workflows/docker-build.yml`

2. **Cuando hagas push a `main` o `master`**, GitHub Actions automáticamente:
   - Construirá la imagen Docker
   - La subirá a `ghcr.io/TU_USUARIO/TU_REPO`

3. **Ver las imágenes construidas:**
   - Ve a tu repositorio en GitHub
   - Haz clic en "Packages" (paquetes) a la derecha
   - O visita: `https://github.com/TU_USUARIO?tab=packages`

4. **Hacer la imagen pública (si el repo es privado):**
   ```bash
   # En GitHub, ve a Packages > Tu imagen > Package settings
   # Cambia la visibilidad a "Public"
   ```

### Opción 2: Docker Hub

Si prefieres usar Docker Hub en lugar de GitHub Container Registry.

#### Configuración:

1. **Crear cuenta en Docker Hub**: https://hub.docker.com

2. **Crear un token de acceso**:
   - Ve a Docker Hub > Account Settings > Security
   - Crea un "New Access Token"

3. **Agregar secretos en GitHub**:
   - Ve a tu repo en GitHub > Settings > Secrets and variables > Actions
   - Agrega:
     - `DOCKER_USERNAME`: Tu usuario de Docker Hub
     - `DOCKER_TOKEN`: El token que creaste

4. **Modificar el workflow** (`.github/workflows/docker-build.yml`):
   ```yaml
   env:
     REGISTRY: docker.io
     IMAGE_NAME: TU_USUARIO/ugel-frontend
   
   # ... en el paso de login:
   - name: Log in to Docker Hub
     uses: docker/login-action@v3
     with:
       username: ${{ secrets.DOCKER_USERNAME }}
       password: ${{ secrets.DOCKER_TOKEN }}
   ```

## 🚀 Uso de la Imagen

### Descargar y ejecutar la imagen:

```bash
# Desde GitHub Container Registry
docker pull ghcr.io/TU_USUARIO/TU_REPO:latest

# Ejecutar
docker run -d -p 3000:80 --name ugel-frontend ghcr.io/TU_USUARIO/TU_REPO:latest
```

### Con Docker Compose:

Crea un archivo `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    image: ghcr.io/TU_USUARIO/TU_REPO:latest
    container_name: ugel-frontend
    ports:
      - "3000:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

Ejecutar:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📦 Estructura del Repositorio

### Si subes SOLO el frontend (ugelproyect/):

La configuración actual está lista. El workflow construye desde la raíz del repositorio.

### Si subes TODO el proyecto (Frontend/ con ugelproyect/ dentro):

Necesitas ajustar el workflow:

```yaml
# En docker-build.yml, cambia:
context: ./ugelproyect
file: ./ugelproyect/Dockerfile
```

## 🏷️ Tags y Versiones

El workflow crea automáticamente tags basados en:

- **Branch name**: `main`, `master`, `develop`, etc.
- **Tags de Git**: `v1.0.0`, `v2.1.3`, etc.
- **SHA del commit**: `sha-abc123...`
- **Latest**: Solo para la rama por defecto

Ejemplos:
- `ghcr.io/USER/REPO:main`
- `ghcr.io/USER/REPO:v1.0.0`
- `ghcr.io/USER/REPO:latest`
- `ghcr.io/USER/REPO:sha-abc123`

## 🔒 Permisos y Privacidad

### Repositorio Público:
- Las imágenes son públicas por defecto
- Cualquiera puede descargarlas

### Repositorio Privado:
- Las imágenes son privadas por defecto
- Solo tú y los colaboradores pueden acceder
- Puedes cambiar la visibilidad en Package settings

## 📝 Pasos para Publicar

1. **Asegúrate de tener los archivos necesarios**:
   - ✅ `Dockerfile`
   - ✅ `nginx.conf`
   - ✅ `.github/workflows/docker-build.yml`
   - ✅ `.dockerignore`

2. **Sube tu código a GitHub**:
   ```bash
   git add .
   git commit -m "Add Docker configuration"
   git push origin main
   ```

3. **GitHub Actions se ejecutará automáticamente**

4. **Verifica el build**:
   - Ve a la pestaña "Actions" en tu repositorio
   - Verás el workflow ejecutándose
   - Si hay errores, revisa los logs

5. **Descarga y prueba la imagen**:
   ```bash
   docker pull ghcr.io/TU_USUARIO/TU_REPO:latest
   docker run -d -p 3000:80 ghcr.io/TU_USUARIO/TU_REPO:latest
   ```

## 🐛 Troubleshooting

### El workflow falla al construir:

1. **Revisa los logs en GitHub Actions**
2. **Verifica que el Dockerfile esté en la ubicación correcta**
3. **Asegúrate de que `package.json` tenga el script `build`**

### No puedo descargar la imagen:

1. **Verifica los permisos del package**
2. **Asegúrate de estar autenticado**:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u TU_USUARIO --password-stdin
   ```

### La imagen es muy grande:

1. **Usa `.dockerignore` para excluir archivos innecesarios**
2. **Usa multi-stage builds** (ya está implementado)
3. **Optimiza las dependencias en `package.json`**

## 🎯 Mejores Prácticas

1. ✅ **Usa tags semánticos** (`v1.0.0`, `v1.1.0`)
2. ✅ **No subas `node_modules`** (inclúyelo en `.dockerignore`)
3. ✅ **Usa multi-stage builds** (ya implementado)
4. ✅ **Revisa los logs de GitHub Actions** después de cada push
5. ✅ **Prueba la imagen localmente** antes de usar en producción

## 📚 Recursos Adicionales

- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Hub](https://hub.docker.com/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## ✅ Checklist Antes de Publicar

- [ ] Dockerfile está en la raíz del proyecto (o en `ugelproyect/`)
- [ ] `.dockerignore` está configurado correctamente
- [ ] `nginx.conf` está presente
- [ ] Workflow de GitHub Actions está configurado
- [ ] `package.json` tiene el script `build`
- [ ] Probaste la construcción localmente: `docker build -t test .`
- [ ] Probaste ejecutar la imagen: `docker run -p 3000:80 test`

¡Listo! 🎉 Tu frontend se construirá y publicará automáticamente en cada push.

