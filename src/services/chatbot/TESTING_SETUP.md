# Configuración de Testing - Chatbot Worship

## Descripción General

Este documento describe la configuración del framework de testing para el módulo Chatbot Worship. La configuración incluye Vitest, Testing Library, y fast-check para property-based testing.

## Dependencias Instaladas

### Dependencias de Testing

```json
{
  "@testing-library/react": "^16.3.2",
  "@testing-library/user-event": "^14.6.1",
  "@vitest/coverage-v8": "^1.0.0",
  "fast-check": "^4.6.0",
  "jsdom": "^23.0.0",
  "vitest": "^1.0.0"
}
```

### Descripción de Dependencias

- **vitest**: Framework de testing moderno y rápido basado en Vite
- **@testing-library/react**: Utilidades para testing de componentes React
- **@testing-library/user-event**: Simulación de eventos de usuario
- **fast-check**: Librería para property-based testing
- **jsdom**: Implementación de DOM para testing en Node.js
- **@vitest/coverage-v8**: Proveedor de cobertura de código

## Configuración de Vitest

### Archivo: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/iglesia-worship/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/', 'dist/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    testTimeout: 10000,
  },
})
```

### Configuración Explicada

- **globals: true**: Permite usar `describe`, `it`, `expect` sin importar
- **environment: 'jsdom'**: Simula un navegador para testing de componentes
- **include**: Patrón para encontrar archivos de test
- **coverage**: Configuración de cobertura de código con umbral de 80%
- **testTimeout**: Timeout de 10 segundos para tests (importante para property-based tests)

## Estructura de Directorios

```
src/services/chatbot/
├── __tests__/
│   ├── chatbotStore.test.ts
│   ├── IntentRecognizer.test.ts (próximo)
│   ├── EntityExtractor.test.ts (próximo)
│   ├── ContextManager.test.ts (próximo)
│   ├── ResponseBuilder.test.ts (próximo)
│   ├── PreferencesService.test.ts (próximo)
│   ├── ChatbotService.test.ts (próximo)
│   ├── ChatbotWidget.test.tsx (próximo)
│   ├── ChatInterface.test.tsx (próximo)
│   ├── QuickSuggestionsPanel.test.tsx (próximo)
│   └── Integration.test.ts (próximo)
├── components/
├── services/
├── store/
├── types/
├── utils/
└── knowledge-base/
```

## Scripts de Testing

### Disponibles en `package.json`

```bash
# Ejecutar tests en modo watch
npm run test

# Ejecutar tests una sola vez
npm run test:run

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar solo tests del chatbot
npm run test:chatbot
```

## Ejemplos de Tests

### Unit Test Básico

```typescript
import { describe, it, expect } from 'vitest';

describe('Mi Componente', () => {
  it('debe hacer algo', () => {
    const resultado = miComponente();
    expect(resultado).toBe(true);
  });
});
```

### Property-Based Test con fast-check

```typescript
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Mi Función', () => {
  it('debe mantener propiedad X para cualquier entrada', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const resultado = miFunction(input);
        expect(resultado).toBeDefined();
      })
    );
  });
});
```

### Test de Componente React

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MiComponente from './MiComponente';

describe('MiComponente', () => {
  it('debe renderizar correctamente', () => {
    render(<MiComponente />);
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('debe responder a clicks', async () => {
    const user = userEvent.setup();
    render(<MiComponente />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clickeado')).toBeInTheDocument();
  });
});
```

## Cobertura de Código

### Ejecutar con Cobertura

```bash
npm run test:coverage
```

### Requisitos de Cobertura

- **Líneas**: 80%
- **Funciones**: 80%
- **Ramas**: 80%
- **Sentencias**: 80%

### Reporte de Cobertura

El reporte se genera en `coverage/` con:
- `coverage/index.html`: Reporte visual interactivo
- `coverage/coverage-final.json`: Datos en JSON

## Mejores Prácticas

### 1. Estructura de Tests

```typescript
describe('Componente', () => {
  describe('Funcionalidad A', () => {
    it('debe hacer X', () => {
      // Arrange
      const input = ...;
      
      // Act
      const resultado = ...;
      
      // Assert
      expect(resultado).toBe(...);
    });
  });
});
```

### 2. Nombres Descriptivos

```typescript
// ✓ Bueno
it('debe agregar un mensaje al historial cuando se llama addMessage')

// ✗ Malo
it('test addMessage')
```

### 3. Evitar Mocks Innecesarios

```typescript
// ✓ Preferido: Test real
const store = useChatbotStore.getState();
store.addMessage(message);

// ✗ Evitar: Mock innecesario
const mockAddMessage = vi.fn();
```

### 4. Property-Based Tests para Propiedades Universales

```typescript
// ✓ Bueno: Propiedad universal
fc.assert(
  fc.property(fc.array(fc.string()), (messages) => {
    // Verificar que la propiedad se mantiene para CUALQUIER array
  })
);
```

### 5. Cleanup Automático

```typescript
describe('Tests', () => {
  beforeEach(() => {
    // Setup
    localStorage.clear();
  });

  afterEach(() => {
    // Cleanup
    localStorage.clear();
  });
});
```

## Troubleshooting

### Tests Lentos

- Aumentar `testTimeout` en `vitest.config.ts`
- Usar `--reporter=verbose` para ver qué test es lento
- Considerar usar `vi.mock()` para dependencias externas

### Errores de Módulos

- Asegurar que `jsdom` está instalado
- Verificar que los imports son correctos
- Usar `import type` para tipos TypeScript

### Problemas de Cobertura

- Ejecutar `npm run test:coverage` para ver reporte detallado
- Revisar `coverage/index.html` para ver qué líneas no están cubiertas
- Agregar tests para las líneas no cubiertas

## Próximos Pasos

1. Implementar tests para IntentRecognizer
2. Implementar tests para EntityExtractor
3. Implementar tests para ContextManager
4. Implementar tests para ResponseBuilder
5. Implementar tests para PreferencesService
6. Implementar tests para ChatbotService
7. Implementar tests para componentes UI
8. Implementar integration tests
9. Alcanzar cobertura de 80%+

## Referencias

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [fast-check Documentation](https://fast-check.dev/)
- [Zustand Testing Guide](https://github.com/pmndrs/zustand#testing)
