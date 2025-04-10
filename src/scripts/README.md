# Script de Seeding para Cluster Alimentos Guanajuato

Este script permite poblar la base de datos con información consistente para realizar pruebas y desarrollo en la plataforma del Cluster Alimentos Guanajuato.

## Datos generados

El script genera los siguientes datos:

### Usuarios

- 1 usuario administrador
- 4 usuarios miembros asociados a empresas

### Empresas

- 4 empresas de diferentes sectores (Bebidas, Lácteos, Cárnicos, Procesados)
- Cada empresa está asociada a un usuario miembro
- Información completa de contacto y redes sociales

### Membresías

- 4 membresías (2 Premium y 2 Estándar)
- Cada membresía está correctamente vinculada a una empresa y su usuario
- Historial de pagos incluido

## Cómo ejecutar el script

Para ejecutar el script de seeding, sigue estos pasos:

1. Asegúrate de tener una instancia de MongoDB en ejecución
2. Configura las variables de entorno en el archivo `.env` (especialmente `MONGODB_URI`)
3. Ejecuta el siguiente comando desde la raíz del proyecto:

```bash
npm run seed
```

## Notas importantes

- El script limpia la base de datos antes de insertar los nuevos datos
- Los IDs generados son reales y permiten una navegación consistente por la plataforma
- Las contraseñas de los usuarios son hasheadas automáticamente por el modelo
- Las relaciones entre entidades son coherentes (usuarios -> empresas -> membresías)

## Personalización

Si necesitas modificar los datos de seeding, puedes editar los arreglos de datos en el archivo `seed.ts`:

- `users`: Para modificar los datos de los usuarios
- `createCompanies()`: Para modificar los datos de las empresas
- `createMemberships()`: Para modificar los datos de las membresías