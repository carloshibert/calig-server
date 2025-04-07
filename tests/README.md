# Documentación del Sistema de Pruebas

## Introducción

Este documento describe el sistema de pruebas automatizadas implementado para el backend de la plataforma administrativa del Cluster Alimentos Guanajuato. El sistema utiliza Jest como framework de testing y Supertest para las pruebas de API.

## Estructura de Pruebas

Las pruebas están organizadas siguiendo esta estructura:

```
tests/
├── unit/             # Pruebas unitarias
│   ├── services/     # Pruebas de servicios
│   ├── utils/        # Pruebas de utilidades
│   ├── middleware/   # Pruebas de middleware
│   └── validators/   # Pruebas de validadores
├── integration/      # Pruebas de integración
│   ├── auth/         # Pruebas de autenticación
│   ├── companies/    # Pruebas de empresas
│   ├── memberships/  # Pruebas de membresías
│   └── admin/        # Pruebas de administración
├── helpers/          # Utilidades para pruebas
├── fixtures/         # Datos de prueba
└── setup.ts          # Configuración global para pruebas
```

## Cómo Ejecutar las Pruebas

### Ejecutar todas las pruebas

```bash
npm test
```

### Ejecutar pruebas en modo watch (desarrollo)

```bash
npm run test:watch
```

### Generar informe de cobertura

```bash
npm run test:coverage
```

El informe de cobertura se generará en el directorio `coverage/`.

## Configuración

### Base de Datos en Memoria

Las pruebas utilizan MongoDB Memory Server para crear una base de datos MongoDB en memoria. Esto garantiza que las pruebas sean independientes y no afecten a la base de datos de desarrollo o producción.

La configuración se encuentra en `tests/setup.ts`.

### Variables de Entorno

Las pruebas utilizan un archivo `.env.test` con variables de entorno específicas para el entorno de pruebas.

## Utilidades y Helpers

En el directorio `tests/helpers/` se encuentran funciones auxiliares para facilitar la creación de pruebas:

- `test-utils.ts`: Contiene funciones para crear usuarios, empresas y membresías de prueba, generar tokens JWT, y simular objetos Request y Response de Express.

### Ejemplos de uso

```typescript
// Crear un usuario de prueba
const user = await createTestUser();

// Crear un usuario con datos específicos
const admin = await createTestUser({ role: 'admin', email: 'admin@test.com' });

// Generar un token JWT para un usuario
const token = generateTestToken(user._id.toString());

// Crear una empresa de prueba
const company = await createTestCompany({}, user._id.toString());

// Crear una membresía de prueba
const membership = await createTestMembership({}, company._id.toString());
```

## Mocks

Las pruebas utilizan mocks para simular dependencias externas:

- **Servicio de Email**: Se mockea para evitar el envío real de emails durante las pruebas.
- **Logger**: Se mockea para evitar la generación de logs durante las pruebas.

## Cómo Añadir Nuevas Pruebas

### Pruebas Unitarias

1. Identifica el componente que deseas probar (servicio, utilidad, middleware, etc.)
2. Crea un archivo con el nombre `[nombre-componente].test.ts` en el directorio correspondiente dentro de `tests/unit/`
3. Importa el componente y las dependencias necesarias
4. Escribe las pruebas utilizando la sintaxis de Jest

Ejemplo:

```typescript
import { miFuncion } from '../../../src/utils/miFuncion';

describe('Mi Función', () => {
  it('debería hacer algo específico', () => {
    const resultado = miFuncion(parametros);
    expect(resultado).toBe(valorEsperado);
  });
});
```

### Pruebas de Integración

1. Identifica el endpoint o funcionalidad que deseas probar
2. Crea un archivo con el nombre `[nombre-funcionalidad].test.ts` en el directorio correspondiente dentro de `tests/integration/`
3. Configura la aplicación Express y las rutas necesarias
4. Utiliza Supertest para realizar peticiones HTTP
5. Verifica las respuestas y el estado de la base de datos

Ejemplo:

```typescript
import request from 'supertest';
import express from 'express';
import miRuta from '../../../src/routes/miRuta';

const app = express();
app.use(express.json());
app.use('/api/mi-ruta', miRuta);

describe('API Mi Ruta', () => {
  it('debería devolver datos correctos', async () => {
    const response = await request(app)
      .get('/api/mi-ruta')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('propiedad');
  });
});
```

## Convenciones de Nomenclatura

- **Archivos de prueba**: `[nombre-componente].test.ts` o `[nombre-componente].spec.ts`
- **Bloques describe**: Deben describir el componente o funcionalidad que se está probando
- **Bloques it**: Deben describir el comportamiento específico que se está probando

Ejemplo:

```typescript
describe('Servicio de Email', () => {
  describe('sendEmail', () => {
    it('debería enviar un email correctamente', () => {
      // Prueba
    });

    it('debería manejar errores al enviar email', () => {
      // Prueba
    });
  });
});
```

## Buenas Prácticas

1. **Aislamiento**: Cada prueba debe ser independiente y no depender del estado dejado por otras pruebas.
2. **Descripción clara**: Usa descripciones significativas para tus bloques `describe` e `it`.
3. **Atomicidad**: Cada prueba debe verificar una sola funcionalidad o comportamiento.
4. **Limpieza**: Utiliza `beforeEach` y `afterEach` para configurar y limpiar el entorno de prueba.
5. **Cobertura**: Intenta cubrir tanto los casos positivos como los negativos (errores).
6. **Mocks**: Utiliza mocks para dependencias externas y servicios.
7. **Datos de prueba**: Utiliza datos de prueba consistentes y significativos.

## Solución de Problemas

### Pruebas que fallan aleatoriamente

Si tienes pruebas que fallan de manera inconsistente, puede deberse a:

- **Dependencias entre pruebas**: Asegúrate de que cada prueba sea independiente.
- **Operaciones asíncronas**: Verifica que todas las promesas se resuelvan correctamente.
- **Timeouts**: Aumenta el timeout para pruebas que requieren más tiempo.

### Errores de conexión a MongoDB

Si tienes errores relacionados con la conexión a MongoDB:

- Verifica que MongoDB Memory Server se inicie correctamente en `beforeAll`.
- Asegúrate de cerrar correctamente la conexión en `afterAll`.

## Integración con CI/CD

El sistema de pruebas está configurado para ejecutarse automáticamente en el pipeline CI/CD. Las pruebas se ejecutan en cada push y pull request, y el build fallará si las pruebas no pasan o si la cobertura es inferior al umbral establecido.