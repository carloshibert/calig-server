# API del Cluster Alimentos Guanajuato

Documentación completa para la API RESTful del Cluster Alimentos Guanajuato.

## Índice

- [Introducción](#introducción)
- [Requisitos](#requisitos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
  - [Autenticación](#endpoints-de-autenticación)
  - [Empresas](#endpoints-de-empresas)
  - [Membresías](#endpoints-de-membresías)
  - [Administración](#endpoints-de-administración)
- [Modelos de Datos](#modelos-de-datos)
- [Códigos de Estado](#códigos-de-estado)
- [Pruebas con Postman](#pruebas-con-postman)

## Introducción

La API del Cluster Alimentos Guanajuato proporciona un conjunto de endpoints para gestionar usuarios, empresas y membresías dentro del ecosistema del Cluster. Esta API está construida con Node.js, Express y MongoDB, siguiendo los principios RESTful.

## Requisitos

- Node.js (v14 o superior)
- MongoDB (v4.4 o superior)
- npm o yarn

## Instalación y Configuración

1. Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd calig/server
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar variables de entorno:

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cluster-alimentos
JWT_SECRET=tu-clave-secreta-jwt
JWT_EXPIRES_IN=30d
EMAIL_USER=tu-email@example.com
EMAIL_PASS=tu-contraseña
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_FROM=noreply@example.com
```

4. Iniciar el servidor:

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm run build
npm start
```

## Autenticación

La API utiliza autenticación basada en tokens JWT (JSON Web Tokens). Para acceder a los endpoints protegidos, debes incluir el token en el encabezado de la solicitud:

```
Authorization: Bearer <tu-token-jwt>
```

Para obtener un token, debes registrarte o iniciar sesión utilizando los endpoints de autenticación.

## Endpoints

### Endpoints de Autenticación

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/api/auth/register` | Registrar un nuevo usuario | Público |
| POST | `/api/auth/login` | Iniciar sesión | Público |
| POST | `/api/auth/forgot-password` | Solicitar restablecimiento de contraseña | Público |
| POST | `/api/auth/reset-password` | Restablecer contraseña | Público |
| GET | `/api/auth/me` | Obtener perfil del usuario actual | Privado |

#### Ejemplo de Registro

```json
// POST /api/auth/register
// Request
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "password": "Password123!",
  "role": "member"
}

// Response (201 Created)
{
  "_id": "60d21b4667d0d8992e610c85",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "role": "member",
  "isActive": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Ejemplo de Inicio de Sesión

```json
// POST /api/auth/login
// Request
{
  "email": "juan@example.com",
  "password": "Password123!"
}

// Response (200 OK)
{
  "_id": "60d21b4667d0d8992e610c85",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "role": "member",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Endpoints de Empresas

### Documentación de Endpoints de Company

#### Crear perfil de empresa
- **Método:** POST
- **Ruta:** `/api/companies`
- **Descripción:** Crea un nuevo perfil de empresa.
- **Acceso:** Privado
- **Cuerpo de solicitud:**
  ```json
  {
    "companyName": "Nombre de la Empresa",
    "sector": "Sector",
    "description": "Descripción",
    "contactInfo": {
      "address": "Dirección",
      "phone": "Teléfono",
      "email": "Email",
      "website": "Sitio Web"
    },
    "socialMedia": {
      "facebook": "Facebook",
      "instagram": "Instagram",
      "linkedin": "LinkedIn",
      "twitter": "Twitter"
    }
  }
  ```
- **Códigos de estado:**
  - 201: Creado
  - 400: Error de validación
  - 500: Error interno

#### Obtener todas las empresas
- **Método:** GET
- **Ruta:** `/api/companies`
- **Descripción:** Obtiene una lista de todas las empresas.
- **Acceso:** Privado
- **Parámetros de consulta:**
  - `sector`: Filtrar por sector
- **Códigos de estado:**
  - 200: Éxito
  - 500: Error interno

#### Obtener empresa por ID
- **Método:** GET
- **Ruta:** `/api/companies/:id`
- **Descripción:** Obtiene los detalles de una empresa específica.
- **Acceso:** Privado
- **Códigos de estado:**
  - 200: Éxito
  - 403: No autorizado
  - 404: No encontrado
  - 500: Error interno

#### Actualizar empresa
- **Método:** PUT
- **Ruta:** `/api/companies/:id`
- **Descripción:** Actualiza el perfil de una empresa.
- **Acceso:** Privado (Propietario)
- **Códigos de estado:**
  - 200: Éxito
  - 400: Error de validación
  - 404: No encontrado
  - 500: Error interno

#### Cambiar estado de publicación
- **Método:** PUT
- **Ruta:** `/api/companies/:id/publish`
- **Descripción:** Cambia el estado de publicación de una empresa.
- **Acceso:** Privado (Propietario)
- **Códigos de estado:**
  - 200: Éxito
  - 404: No encontrado
  - 500: Error interno

#### Eliminar empresa
- **Método:** DELETE
- **Ruta:** `/api/companies/:id`
- **Descripción:** Elimina el perfil de una empresa.
- **Acceso:** Privado (Admin)
- **Códigos de estado:**
  - 200: Éxito
  - 404: No encontrado
  - 500: Error interno

#### Ejemplo de Creación de Empresa

```json
// POST /api/companies
// Request
{
  "companyName": "Alimentos del Bajío",
  "sector": "Procesados",
  "description": "Empresa dedicada a la producción de alimentos procesados",
  "contactInfo": {
    "address": "Av. Principal 123, Guanajuato",
    "phone": "4771234567",
    "email": "contacto@alimentosdelbajio.com",
    "website": "https://alimentosdelbajio.com"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/alimentosdelbajio",
    "instagram": "https://instagram.com/alimentosdelbajio",
    "linkedin": "https://linkedin.com/company/alimentosdelbajio",
    "twitter": ""
  }
}

// Response (201 Created)
{
  "_id": "60d21b4667d0d8992e610c86",
  "userId": "60d21b4667d0d8992e610c85",
  "companyName": "Alimentos del Bajío",
  "sector": "Procesados",
  "description": "Empresa dedicada a la producción de alimentos procesados",
  "contactInfo": {
    "address": "Av. Principal 123, Guanajuato",
    "phone": "4771234567",
    "email": "contacto@alimentosdelbajio.com",
    "website": "https://alimentosdelbajio.com"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/alimentosdelbajio",
    "instagram": "https://instagram.com/alimentosdelbajio",
    "linkedin": "https://linkedin.com/company/alimentosdelbajio",
    "twitter": ""
  },
  "isPublished": false,
  "createdAt": "2023-06-22T15:30:45.123Z",
  "updatedAt": "2023-06-22T15:30:45.123Z"
}
```

### Endpoints de Membresías

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/api/memberships/apply` | Solicitar membresía | Privado |
| GET | `/api/memberships/me` | Obtener membresía actual | Privado |
| GET | `/api/memberships` | Obtener todas las membresías | Privado (Admin) |
| PUT | `/api/memberships/:id/approve` | Aprobar membresía | Privado (Admin) |
| PUT | `/api/memberships/:id/reject` | Rechazar membresía | Privado (Admin) |
| PUT | `/api/memberships/:id/renew` | Renovar membresía | Privado (Admin) |
| PUT | `/api/memberships/:id/status` | Actualizar estado de membresía | Privado (Admin) |
| PUT | `/api/memberships/:id/payment-status` | Actualizar estado de pago | Privado (Admin) |
| POST | `/api/memberships/:id/payment` | Registrar pago | Privado (Admin) |
| GET | `/api/memberships/pending` | Obtener membresías pendientes | Privado (Admin) |
| POST | `/api/memberships/send-renewal-reminders` | Enviar recordatorios de renovación | Privado (Admin) |

#### Ejemplo de Solicitud de Membresía

```json
// POST /api/memberships/apply
// Request
{
  "membershipLevel": "Estándar",
  "startDate": "2023-07-01T00:00:00.000Z"
}

// Response (201 Created)
{
  "_id": "60d21b4667d0d8992e610c87",
  "userId": "60d21b4667d0d8992e610c85",
  "companyId": "60d21b4667d0d8992e610c86",
  "membershipLevel": "Estándar",
  "startDate": "2023-07-01T00:00:00.000Z",
  "renewalDate": "2024-07-01T00:00:00.000Z",
  "status": "pending",
  "paymentStatus": "pending",
  "paymentHistory": [],
  "createdAt": "2023-06-22T15:35:12.456Z",
  "updatedAt": "2023-06-22T15:35:12.456Z"
}
```

### Endpoints de Administración

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/api/admin/stats` | Obtener estadísticas del sistema | Privado (Admin) |
| GET | `/api/admin/users` | Obtener todos los usuarios | Privado (Admin) |
| PUT | `/api/admin/users/:id/status` | Activar/desactivar usuario | Privado (Admin) |

#### Ejemplo de Estadísticas del Sistema

```json
// GET /api/admin/stats
// Response (200 OK)
{
  "users": {
    "total": 50,
    "admin": 5,
    "member": 45
  },
  "companies": {
    "total": 40,
    "published": 35,
    "unpublished": 5,
    "sectorDistribution": [
      { "_id": "Procesados", "count": 15 },
      { "_id": "Frescos", "count": 10 },
      { "_id": "Cárnicos", "count": 8 },
      { "_id": "Lácteos", "count": 7 }
    ]
  },
  "memberships": {
    "total": 40,
    "active": 35,
    "pending": 3,
    "expired": 2,
    "paid": 35,
    "pendingPayment": 3,
    "overdue": 2,
    "upcomingRenewals": 5
  }
}
```

## Modelos de Datos

### Usuario (User)

```typescript
{
  email: string;            // Email único del usuario
  password: string;         // Contraseña encriptada
  firstName: string;        // Nombre
  lastName: string;         // Apellido
  role: string;             // Rol: 'admin' o 'member'
  isActive: boolean;        // Estado de la cuenta
  resetPasswordToken?: string;  // Token para restablecer contraseña
  resetPasswordExpire?: Date;   // Fecha de expiración del token
}
```

### Empresa (Company)

```typescript
{
  userId: ObjectId;         // ID del usuario propietario
  companyName: string;       // Nombre de la empresa
  logo: string;              // URL del logo
  sector: string;            // Sector industrial
  description: string;       // Descripción de la empresa
  contactInfo: {             // Información de contacto
    address: string;         // Dirección
    phone: string;           // Teléfono
    email: string;           // Email de contacto
    website: string;         // Sitio web
  };
  socialMedia: {             // Redes sociales
    facebook: string;        // URL de Facebook
    instagram: string;       // URL de Instagram
    linkedin: string;        // URL de LinkedIn
    twitter: string;         // URL de Twitter
  };
  isPublished: boolean;      // Estado de publicación
}
```

### Membresía (Membership)

```typescript
{
  userId: ObjectId;          // ID del usuario
  companyId: ObjectId;        // ID de la empresa
  startDate: Date;            // Fecha de inicio
  renewalDate: Date;          // Fecha de renovación
  status: string;             // Estado: 'active', 'pending', 'expired'
  paymentStatus: string;      // Estado de pago: 'paid', 'pending', 'overdue'
  membershipLevel: string;    // Nivel de membresía
  paymentHistory: [{          // Historial de pagos
    date: Date;               // Fecha del pago
    amount: number;           // Monto
    description: string;      // Descripción
  }];
}
```

## Códigos de Estado

La API utiliza los siguientes códigos de estado HTTP:

- `200 OK`: La solicitud se ha completado correctamente
- `201 Created`: El recurso se ha creado correctamente
- `400 Bad Request`: La solicitud contiene datos inválidos o faltantes
- `401 Unauthorized`: No estás autorizado para acceder a este recurso
- `403 Forbidden`: No tienes permisos para realizar esta acción
- `404 Not Found`: El recurso solicitado no existe
- `500 Internal Server Error`: Error interno del servidor

## Pruebas con Postman

Para facilitar las pruebas de la API, se incluye una colección de Postman con todos los endpoints configurados.

1. Importa los archivos `postman_collection.json` y `postman_environment.json` en Postman.
2. Configura las variables de entorno según tu configuración local.
3. Ejecuta las solicitudes en el orden recomendado:
   - Primero, registra un usuario o inicia sesión para obtener un token JWT.
   - El token se guardará automáticamente en las variables de entorno.
   - Luego, puedes probar los demás endpoints que requieren autenticación.

### Notas importantes

- Los endpoints marcados con "(Admin)" requieren permisos de administrador.
- Para probar estos endpoints, necesitarás registrar un usuario con rol de administrador o modificar un usuario existente en la base de datos.
- Algunos endpoints requieren IDs válidos en la URL. Asegúrate de reemplazar los valores de ejemplo con IDs reales obtenidos de respuestas anteriores.