-- Script para aumentar el tamaño máximo del paquete en MySQL
-- Esto permite subir archivos grandes (hasta 500MB) a la base de datos

-- Para la sesión actual (efecto inmediato, pero temporal)
SET SESSION max_allowed_packet = 524288000; -- 500MB

-- Para todas las conexiones nuevas (requiere reiniciar el servidor MySQL)
SET GLOBAL max_allowed_packet = 524288000; -- 500MB

-- Verificar el valor actual
SHOW VARIABLES LIKE 'max_allowed_packet';

-- NOTA: Para hacer este cambio permanente, también debes agregar esta línea en tu archivo my.ini (Windows) o my.cnf (Linux/Mac):
-- [mysqld]
-- max_allowed_packet=524288000
--
-- Y luego reiniciar el servidor MySQL.

        