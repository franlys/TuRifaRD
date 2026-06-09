# Guía de Desarrollo y Reglas (claude.md)

Este archivo contiene las directrices, estándares de codificación y reglas de comportamiento para el asistente de IA y los desarrolladores que colaboren en el proyecto **Rifas**.

## 1. Principios de Codificación

- **Simplicidad y Legibilidad**: El código debe ser limpio, autodocumentado y fácil de entender.
- **Sin Placeholder ni código incompleto**: Todo componente o función debe estar 100% operativo o simular fallos controlados con datos reales, nunca dejar comentarios como `// TODO: agregar lógica aquí`.
- **Especialidad en CSS**: Mantener una estética visual impecable (Premium UI). Utilizar variables CSS o clases utilitarias de forma coherente para mantener una paleta de colores uniforme.
- **Tipado Fuerte**: Si se usa TypeScript, definir interfaces claras para Boletos, Rifas, Usuarios, Premios y Transacciones.

## 2. Reglas del Proyecto

- **Idioma de desarrollo**: El código (variables, nombres de funciones, comentarios técnicos) se escribirá en **Inglés** por convención técnica, pero toda la interfaz del usuario final y administrador estará en **Español**.
- **Validación Estricta**: No se pueden dar por válidos los boletos hasta que el administrador verifique manualmente el depósito en la sección de "Pagos a comprobar".
- **Respeto a las reglas de subagentes**: Cada subagent asignado a una tarea específica debe cumplir únicamente con su rol definido.

## 3. Flujo de Trabajo

1. **Planificar**: Proponer cambios antes de editar archivos críticos.
2. **Desarrollar**: Implementar paso a paso y modularmente.
3. **Verificar**: Ejecutar pruebas manuales o automatizadas de las funcionalidades críticas (por ejemplo, generación aleatoria del boleto ganador en la ruleta).
4. **Registrar**: Cualquier error recurrente o lección aprendida debe ser documentado en `registro_errores.md`.
