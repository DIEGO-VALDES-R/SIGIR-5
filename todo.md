# CorpInventario V2 - TODO

## Fase 1: Base de Datos y Esquema
- [x] Diseñar esquema completo de base de datos
- [x] Crear tablas: productos, categorías, transacciones, usuarios, proveedores, órdenes de compra, bodegas, ubicaciones
- [x] Implementar migraciones con Drizzle ORM
- [x] Crear índices para optimización

## Fase 2: Autenticación y Usuarios
- [x] Implementar sistema de roles (admin/usuario)
- [x] Crear procedimientos protegidos por rol
- [x] Desarrollar gestión de usuarios (CRUD)
- [x] Implementar permisos diferenciados

## Fase 3: Dashboard
- [x] Crear dashboard principal con KPIs
- [x] Implementar gráficos de stock por categoría
- [x] Mostrar alertas activas (stock bajo, vencimientos)
- [x] Calcular valor total de inventario en tiempo real

## Fase 4: Gestión de Productos
- [x] Crear CRUD de productos
- [x] Implementar búsqueda avanzada y filtros
- [x] Agregar validación de códigos únicos
- [x] Implementar sistema de alertas automáticas
- [ ] Crear modal de edición/visualización

## Fase 5: Escaneo QR/Códigos de Barras
- [ ] Integrar librería de escaneo QR (html5-qrcode)
- [ ] Crear interfaz de escaneo
- [ ] Implementar registro automático de entradas/salidas
- [ ] Validar códigos escaneados

## Fase 6: Gestión de Proveedores y Órdenes
- [ ] Crear CRUD de proveedores
- [ ] Implementar sistema de órdenes de compra
- [ ] Crear órdenes automáticas cuando stock es bajo
- [ ] Implementar seguimiento de recepción

## Fase 7: Kardex y Historial
- [ ] Crear tabla de transacciones detallada
- [ ] Implementar Kardex con saldos
- [ ] Registrar todos los movimientos (entrada, salida, ajuste)
- [ ] Mostrar historial filtrable

## Fase 8: Reportes PDF
- [ ] Generar reporte de inventario general
- [ ] Generar reporte de historial de transacciones
- [ ] Generar reporte de órdenes de reposición
- [ ] Generar reporte de Kardex

## Fase 9: Gestión Multibodega
- [ ] Crear tabla de bodegas
- [ ] Crear tabla de ubicaciones (estantes, pasillos)
- [ ] Asignar productos a ubicaciones
- [ ] Implementar búsqueda por ubicación

## Fase 10: Notificaciones por Correo
- [ ] Configurar servicio de correo
- [ ] Crear plantillas de email
- [ ] Implementar alertas de stock bajo
- [ ] Implementar alertas de vencimiento próximo

## Fase 11: Análisis Predictivo con LLM
- [ ] Analizar historial de consumo
- [ ] Usar LLM para predicción de demanda
- [ ] Sugerir cantidades óptimas de compra
- [ ] Mostrar recomendaciones en dashboard

## Fase 12: Pruebas y Entrega
- [ ] Escribir tests unitarios (Vitest)
- [ ] Realizar pruebas de integración
- [ ] Optimizar rendimiento
- [ ] Documentación final
- [ ] Crear checkpoint final
