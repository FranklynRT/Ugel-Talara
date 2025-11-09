# Docker para API y Frontend - UGEL Talara

Este documento explica cómo usar Docker para ejecutar tanto la API como el Frontend de UGEL Talara.

## Estructura del Proyecto

```
.
├── Api/                 # Backend API
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── docker-compose.yml
│   └── src/
├── ugelproyect/        # Frontend
│   ├── Dockerfile
│   └── Dockerfile.dev
└── docker-compose.yml  # Compose principal (API + Frontend)
```

## Requisitos Previos

- Docker instalado
- Docker Compose instalado
- Archivo `.env` configurado en `Api/.env`

## Configuración Rápida

### 1. Configurar Variables de Entorno

Crea un archivo `Api/.env` basado en `Api/.env.example`:

```bash
cp Api/.env.example Api/.env
# Edita Api/.env con tus credenciales
```

### 2. Ejecutar Todo con Docker Compose

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down
```

## Servicios Disponibles

### API Backend
- **Puerto**: 9000
- **Health Check**: http://localhost:9000/api/health
- **URL Base**: http://localhost:9000/ugel-talara

### Frontend
- **Puerto**: 80
- **URL**: http://localhost

### Frontend Development (opcional)
- **Puerto**: 5173
- **URL**: http://localhost:5173

## Comandos Útiles

### Construir Imágenes

```bash
# Construir todas las imágenes
docker-compose build

# Reconstruir sin cache
docker-compose build --no-cache

# Construir solo la API
docker-compose build api

# Construir solo el Frontend
docker-compose build frontend
```

### Ejecutar Servicios

```bash
# Ejecutar todo
docker-compose up -d

# Ejecutar solo la API
docker-compose up -d api

# Ejecutar solo el Frontend
docker-compose up -d frontend

# Ejecutar en modo desarrollo
docker-compose --profile dev up -d
```

### Ver Logs

```bash
# Logs de todos los servicios
docker-compose logs -f

# Logs de la API
docker-compose logs -f api

# Logs del Frontend
docker-compose logs -f frontend

# Últimas 100 líneas
docker-compose logs --tail=100 api
```

### Detener y Limpiar

```bash
# Detener servicios
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Detener, eliminar contenedores y volúmenes
docker-compose down -v

# Eliminar imágenes también
docker-compose down --rmi all
```

### Verificar Estado

```bash
# Ver estado de los servicios
docker-compose ps

# Verificar health checks
docker-compose ps | grep healthy

# Inspeccionar un servicio
docker-compose inspect api
```

## Desarrollo

### Modo Desarrollo con Hot Reload

#### API en Modo Desarrollo

```bash
# Usar Dockerfile.dev para la API
cd Api
docker-compose -f docker-compose.yml --profile dev up -d api-dev
```

#### Frontend en Modo Desarrollo

```bash
# Desde la raíz
docker-compose --profile dev up -d frontend-dev
```

### Montar Volúmenes para Desarrollo

Los servicios de desarrollo ya tienen configurados volúmenes para:
- **API**: `./Api/src` → `/app/src` (hot reload)
- **Frontend**: `./ugelproyect/src` → `/app/src` (hot reload)

## Base de Datos

### Conectar a Base de Datos Externa

Si tu base de datos MySQL está en el host (no en Docker):

1. **En Windows/Mac con Docker Desktop**: Usa `host.docker.internal`
   ```env
   DB_HOST=host.docker.internal
   ```

2. **En Linux**: Usa la IP del host o configura el network mode
   ```env
   DB_HOST=172.17.0.1
   ```

### Conectar a Base de Datos en Docker

Si quieres incluir MySQL en Docker Compose, agrega este servicio:

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: ugel-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: ugel_talara
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - ugel-network

  api:
    # ...
    environment:
      DB_HOST: mysql  # Usar el nombre del servicio
```

## Persistencia de Datos

### Uploads

Los archivos subidos se persisten en:
- `./Api/uploads` → `/app/uploads` en el contenedor

Asegúrate de que el directorio tenga los permisos correctos:

```bash
chmod -R 755 Api/uploads
```

## Solución de Problemas

### API no se conecta a la base de datos

1. Verifica que la base de datos esté accesible desde el contenedor
2. Verifica las variables de entorno en `Api/.env`
3. Revisa los logs: `docker-compose logs api`

### Frontend no se conecta a la API

1. Verifica que la API esté corriendo: `docker-compose ps`
2. Verifica el health check: `curl http://localhost:9000/api/health`
3. Verifica la variable `VITE_API_BASE_URL` en el frontend

### Error de permisos en uploads

```bash
# Dar permisos al directorio
sudo chmod -R 755 Api/uploads

# O cambiar el owner
sudo chown -R $USER:$USER Api/uploads
```

### Reconstruir después de cambios

```bash
# Reconstruir y reiniciar
docker-compose up -d --build

# Forzar recreación
docker-compose up -d --force-recreate
```

## Producción

### Optimizaciones

1. **Variables de entorno**: Usa variables de entorno del sistema en lugar de archivos `.env`
2. **Límites de recursos**: Configura límites de CPU y memoria
3. **Reverse Proxy**: Usa nginx como reverse proxy delante de los servicios
4. **Logs**: Configura logging centralizado
5. **Backups**: Implementa backups regulares de la base de datos

### Ejemplo de docker-compose para producción

```yaml
services:
  api:
    # ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## GitHub Actions

Para automatizar el build y push de imágenes Docker, consulta:
- `.github/workflows/docker-build.yml`

## Referencias

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [API README_DOCKER.md](./Api/README_DOCKER.md)
- [Frontend DOCKER.md](./ugelproyect/DOCKER.md)

