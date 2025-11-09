# Docker para API de UGEL Talara

Este documento explica cómo usar Docker para ejecutar la API de UGEL Talara.

## Requisitos Previos

- Docker instalado
- Docker Compose instalado
- Archivo `.env` configurado en la carpeta `Api/`

## Configuración

### 1. Crear archivo `.env`

Crea un archivo `.env` en la carpeta `Api/` con las siguientes variables:

```env
# Puerto del servidor
PORT=9000

# Base de datos MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=ugel_talara
DB_PORT=3306

# JWT Secret
JWT_SECRET=tu_jwt_secret_muy_seguro

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion

# OpenAI API Key
OPENAI_API_KEY=tu_openai_api_key

# Otros
NODE_ENV=production
```

### 2. Construir la imagen

```bash
# Desde la carpeta Api/
docker build -t ugel-api .

# O desde la raíz del proyecto
docker build -t ugel-api -f Api/Dockerfile ./Api
```

### 3. Ejecutar el contenedor

```bash
# Ejecutar directamente
docker run -d \
  --name ugel-api \
  -p 9000:9000 \
  --env-file ./Api/.env \
  -v $(pwd)/Api/uploads:/app/uploads \
  ugel-api

# O usar docker-compose (recomendado)
docker-compose up -d api
```

## Uso con Docker Compose

### Ejecutar solo la API

```bash
docker-compose up -d api
```

### Ejecutar API y Frontend juntos

```bash
docker-compose up -d
```

### Ver logs

```bash
# Logs de la API
docker-compose logs -f api

# Logs de todos los servicios
docker-compose logs -f
```

### Detener servicios

```bash
# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

## Desarrollo

### Modo Desarrollo con Hot Reload

```bash
# Usar Dockerfile.dev para desarrollo
docker build -t ugel-api-dev -f Api/Dockerfile.dev ./Api

docker run -d \
  --name ugel-api-dev \
  -p 9000:9000 \
  --env-file ./Api/.env \
  -v $(pwd)/Api/src:/app/src \
  -v $(pwd)/Api/uploads:/app/uploads \
  ugel-api-dev
```

O con docker-compose:

```bash
# Modificar docker-compose.yml para usar Dockerfile.dev
docker-compose -f docker-compose.dev.yml up -d api
```

## Estructura de Carpetas

```
Api/
├── Dockerfile           # Imagen de producción
├── Dockerfile.dev       # Imagen de desarrollo
├── .dockerignore        # Archivos a ignorar en la build
├── .env                 # Variables de entorno (no se incluye en Docker)
├── package.json
├── src/
│   └── index.js        # Punto de entrada
└── uploads/            # Archivos subidos (se monta como volumen)
```

## Volúmenes

Los siguientes directorios se montan como volúmenes para persistencia:

- `./Api/uploads` → `/app/uploads` - Archivos subidos (anexos, perfiles, etc.)

## Puertos

- `9000` - Puerto de la API

## Health Check

El contenedor incluye un health check que verifica que la API esté respondiendo:

```bash
# Verificar estado del contenedor
docker ps

# Verificar health check
docker inspect ugel-api | grep -A 10 Health
```

## Solución de Problemas

### Error de conexión a la base de datos

Si la base de datos está en otro contenedor o en el host:

1. **Base de datos en otro contenedor**: Usar el nombre del servicio como `DB_HOST`
   ```env
   DB_HOST=mysql
   ```

2. **Base de datos en el host**: Usar `host.docker.internal` (Docker Desktop) o la IP del host
   ```env
   DB_HOST=host.docker.internal
   ```

### Error de permisos en uploads

```bash
# Dar permisos al directorio uploads
chmod -R 755 Api/uploads
```

### Rebuild de la imagen

```bash
# Reconstruir sin cache
docker build --no-cache -t ugel-api -f Api/Dockerfile ./Api
```

## Producción

### Optimizaciones para Producción

1. Usar variables de entorno en lugar de archivo `.env`
2. Configurar límites de recursos
3. Usar un reverse proxy (nginx) delante de la API
4. Configurar logs centralizados
5. Implementar backups de la base de datos

### Ejemplo de docker-compose para producción

```yaml
services:
  api:
    build:
      context: ./Api
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=9000
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart: always
```

## GitHub Actions

Para automatizar el build y push de la imagen Docker, consulta el archivo `.github/workflows/docker-build.yml` en el proyecto.

