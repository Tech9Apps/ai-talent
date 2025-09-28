# 📁 AI Talent Shared Library

## 🎯 **Propósito**
Librería shared que contiene tipos, constantes y utilidades comunes utilizadas tanto por el cliente React como por las Firebase Functions, eliminando duplicación de código y manteniendo consistencia.

## 📊 **Estructura**

```
ai-talent-shared/
├── index.ts                    # Punto de entrada principal
├── constants/
│   └── fileConstants.ts        # Constantes de validación de archivos
├── types/
│   └── fileTypes.ts           # Interfaces y tipos TypeScript
└── utils/
    └── validation.ts          # Funciones de validación comunes
```

## 📋 **Contenido Detallado**

### **🔢 Constants (`fileConstants.ts`)**
- `SUPPORTED_FILE_TYPES`: Extensiones soportadas por tipo de upload
- `FILE_VALIDATION_CONFIG`: Configuración de validación (tamaño máximo, MIME types)

### **📝 Types (`fileTypes.ts`)**
- `UploadType`: Enum para tipos de upload ('cv' | 'jobDescription')
- `FileUploadConfig`: Configuración de upload (server-side)
- `FileMetadata`: Metadatos de archivo en Storage
- `FileUploadRequestData`: Request data (client → Functions)
- `FileUploadResponse`: Response data (Functions → client)
- `GetFilesRequestData`: Request para obtener archivos
- `GetFilesResponse`: Response con lista de archivos
- `FileInfo`: Información de archivo para el cliente

### **✅ Utils (`validation.ts`)**
- `ValidationError`: Clase de error personalizada
- `validateFileExtension()`: Valida extensión de archivo
- `validateFileSize()`: Valida tamaño desde base64
- `validateMimeType()`: Valida tipo MIME
- `validateFile()`: Validación completa (server-side)
- `validateBrowserFile()`: Validación para File object (client-side)

## 🔗 **Uso en los Proyectos**

### **📱 Cliente React (`src/utils/functions.ts`)**
```typescript
import { 
  validateBrowserFile,
  ValidationError
} from "../../../ai-talent-shared";
import type { 
  FileUploadRequestData,
  FileUploadResponse,
  GetFilesRequestData,
  GetFilesResponse
} from "../../../ai-talent-shared";
```

### **🔥 Firebase Functions (`functions/src/utils/storage.ts`)**
```typescript
import { 
  FileUploadConfig, 
  FileMetadata,
  validateFile 
} from "../../../../ai-talent-shared";
```

### **🚀 Functions Handler (`functions/src/functions/file/uploadFile.ts`)**
```typescript
import {
  FileUploadConfig,
  FileMetadata,
  FileUploadRequestData,
  FileUploadResponse
} from "../../../../../ai-talent-shared";
```

## ✅ **Beneficios Logrados**

### **🎯 Eliminación de Duplicación**
- ❌ **ANTES**: Tipos duplicados en cliente y functions
- ✅ **AHORA**: Tipos centralizados en shared

### **🔧 Consistencia de Validación**
- ❌ **ANTES**: Lógica de validación diferente en cada proyecto
- ✅ **AHORA**: Misma lógica compartida con adaptadores específicos

### **🛡️ Type Safety**
- ❌ **ANTES**: Posibilidad de inconsistencias entre cliente y server
- ✅ **AHORA**: TypeScript garantiza compatibilidad

### **🔄 Mantenimiento**
- ❌ **ANTES**: Cambios requieren actualizar múltiples archivos
- ✅ **AHORA**: Cambios centralizados en shared

## 🎉 **Resultado Final**

La estructura shared es **simple, funcional y mantenible**:

- ✅ **No requiere package.json** (simplicidad máxima)
- ✅ **Import paths relativos** fáciles de entender
- ✅ **TypeScript compilación exitosa** en ambos proyectos
- ✅ **Validación unificada** con adaptadores específicos
- ✅ **Fácil de extender** para nuevas funcionalidades

**La función `validateFile` ahora está perfectamente centralizada y es reutilizada por ambos proyectos sin duplicación de código.** 🚀