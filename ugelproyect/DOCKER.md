# Docker Setup para Frontend UGEL Talara

Este documento explica cómo usar Docker para construir y ejecutar el frontend de UGEL Talara.

## 🐳 Requisitos Previos

- Docker instalado ([Descargar Docker](https://www.docker.com/get-started))
- Docker Compose instalado (viene con Docker Desktop)

## 📦 Construcción y Ejecución

### Opción 1: Producción (Build + Nginx)

#### Construir la imagen:
```bash
docker build -t ugel-frontend .
```

#### Ejecutar el contenedor:
```bash
docker run -d -p 3000:80 --name ugel-frontend ugel-frontend
```

O usar docker-compose:
```bash
docker-compose up -d
```

El frontend estará disponible en: `http://localhost:3000`

### Opción 2: Desarrollo (con hot-reload)

#### Ejecutar en modo desarrollo:
```bash
docker-compose --profile dev up frontend-dev
```

El servidor de desarrollo estará disponible en: `http://localhost:5173`

## 🔧 Configuración

### Variables de Entorno

Para desarrollo, puedes crear un archivo `.env`:

```env
VITE_API_URL=http://localhost:9000/api
```

### Puertos

- **Producción**: Puerto 3000 (mapeado al puerto 80 del contenedor)
- **Desarrollo**: Puerto 5173

Para cambiar los puertos, edita `docker-compose.yml`:

```yaml
ports:
  - "TU_PUERTO:80"  # Para producción
  - "TU_PUERTO:5173"  # Para desarrollo
```

## 🚀 Comandos Útiles

### Ver logs:
```bash
docker logs ugel-frontend
docker logs -f ugel-frontend  # Seguir logs en tiempo real
```

### Detener el contenedor:
```bash
docker stop ugel-frontend
```

### Eliminar el contenedor:
```bash
docker rm ugel-frontend
```

### Reconstruir la imagen:
```bash
docker build --no-cache -t ugel-frontend .
```

### Ejecutar comandos dentro del contenedor:
```bash
docker exec -it ugel-frontend sh
```

### Ver contenedores en ejecución:
```bash
docker ps
```

### Ver todas las imágenes:
```bash
docker images
```

## 📝 Despliegue en Producción

### 1. Construir la imagen:
```bash
docker build -t ugel-frontend:latest .
```

### 2. Etiquetar para registro (GitHub Container Registry, Docker Hub, etc.):
```bash
# Para GitHub Container Registry
docker tag ugel-frontend:latest ghcr.io/TU_USUARIO/ugel-frontend:latest

# Para Docker Hub
docker tag ugel-frontend:latest TU_USUARIO/ugel-frontend:latest
```

### 3. Subir a registro:
```bash
# GitHub Container Registry
docker push ghcr.io/TU_USUARIO/ugel-frontend:latest

# Docker Hub
docker push TU_USUARIO/ugel-frontend:latest
```

### 4. En el servidor, descargar y ejecutar:
```bash
docker pull ghcr.io/TU_USUARIO/ugel-frontend:latest
docker run -d -p 3000:80 --name ugel-frontend --restart unless-stopped ugel-frontend:latest
```

## 🔍 Troubleshooting

### El contenedor no inicia:
```bash
docker logs ugel-frontend
```

### Limpiar Docker:
```bash
# Eliminar contenedores parados
docker container prune

# Eliminar imágenes no usadas
docker image prune

# Limpiar todo (¡cuidado!)
docker system prune -a
```

### Problemas de permisos (Linux):
```bash
sudo docker run ...
```

### Verificar que el puerto está disponible:
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

## 📚 Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 🎯 Próximos Pasos

1. Configurar CI/CD con GitHub Actions para build automático
2. Configurar variables de entorno para diferentes ambientes
3. Agregar health checks más robustos
4. Configurar SSL/TLS con certificados

