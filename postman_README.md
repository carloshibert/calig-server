# Documentación de Postman para API del Cluster Alimentos Guanajuato

Este directorio contiene los archivos necesarios para probar la API del Cluster Alimentos Guanajuato utilizando Postman.

## Archivos incluidos

- `postman_collection.json`: Colección de Postman con todos los endpoints de la API organizados por categorías.
- `postman_environment.json`: Variables de entorno para configurar diferentes ambientes (desarrollo, pruebas, producción).

## Cómo importar la colección y el entorno

1. Abre Postman
2. Haz clic en el botón "Import" en la parte superior izquierda
3. Arrastra los archivos `postman_collection.json` y `postman_environment.json` o haz clic en "Upload Files" para seleccionarlos
4. Confirma la importación

## Configuración del entorno

1. En la parte superior derecha de Postman, selecciona el entorno "Cluster Alimentos Guanajuato - Desarrollo" del menú desplegable
2. Si necesitas cambiar la URL base, haz clic en el icono de ojo junto al selector de entorno y modifica el valor de `baseUrl`

## Autenticación

La mayoría de los endpoints requieren autenticación mediante token JWT. Para obtener un token:

1. Ejecuta la solicitud "Registro de Usuario" o "Inicio de Sesión" en la carpeta "Autenticación"
2. El token se devolverá en la respuesta
3. Copia el token y establécelo como valor de la variable de entorno `token`

## Estructura de la colección

La colección está organizada en las siguientes carpetas:

- **Autenticación**: Endpoints para registro, inicio de sesión y gestión de usuarios
- **Empresas**: Endpoints para gestión de empresas
- **Membresías**: Endpoints para gestión de membresías
- **Administración**: Endpoints para administradores del sistema

## Flujo de trabajo recomendado para pruebas

1. Registra un usuario utilizando el endpoint "Registro de Usuario"
2. Inicia sesión con el usuario registrado utilizando "Inicio de Sesión"
3. Guarda el token JWT devuelto en la variable de entorno `token`
4. Crea una empresa utilizando "Crear Empresa"
5. Solicita una membresía utilizando "Solicitar Membresía"
6. Prueba los demás endpoints según sea necesario

## Notas adicionales

- Los endpoints marcados con "(Admin)" requieren permisos de administrador
- Para probar estos endpoints, necesitarás registrar un usuario con rol de administrador o modificar un usuario existente en la base de datos
- Algunos endpoints requieren IDs válidos en la URL. Asegúrate de reemplazar los valores de ejemplo (como "id-de-la-empresa") con IDs reales obtenidos de respuestas anteriores

## Solución de problemas

- Si recibes errores 401, verifica que el token JWT sea válido y esté correctamente configurado en la variable de entorno
- Si recibes errores 403, verifica que el usuario tenga los permisos necesarios para acceder al recurso
- Si recibes errores 404, verifica que las URLs y los IDs sean correctos