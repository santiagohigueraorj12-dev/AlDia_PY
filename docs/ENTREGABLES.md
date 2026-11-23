# AlDía – Entregables del proyecto

Proyecto formativo ADSO, ficha 3407177 · Simon Higuera y Santiago Higuera · Instructor: Uldarico Andrade.
Sustentación: 26 de noviembre de 2026.

| # | Entregable | Archivos | Código del documento |
|---|---|---|---|
| 1 | Despliegue de la aplicación | En internet: https://aldia-ru4q.onrender.com (Render + Aiven) · en red local: `desplegar.bat` · [Manual de instalación y despliegue](manuales/AlDia_Manual_de_Instalacion_y_Despliegue.pdf), secciones 5 y 6 | ALD-MI-01 |
| 2 | Documentación de requisitos corregida | [Especificación de requisitos v2.2](requisitos/AlDia_Especificacion_de_Requisitos.pdf) (control de cambios y matriz de trazabilidad) · resumen en [ALCANCE.md](ALCANCE.md) | ALD-ERS-02 |
| 3 | Plan de pruebas | [Documentación de pruebas](pruebas/AlDia_Documentacion_de_Pruebas.pdf) según ISO/IEC/IEEE 29119-3 · [Especificación de casos (Excel)](pruebas/AlDia_Especificacion_Casos_de_Prueba.xlsx) · 172 pruebas automáticas | — |
| 4 | Plan de respaldo | [Plan de respaldo](respaldo/AlDia_Plan_de_Respaldo.pdf) · `respaldar.bat` y `restaurar.bat` | ALD-PR-01 |
| 5 | Manual de usuario | [Manual de usuario](manuales/AlDia_Manual_de_Usuario.pdf) (con capturas de la app) | ALD-MU-01 |
| 6 | Manual de instalación | [Manual de instalación y despliegue](manuales/AlDia_Manual_de_Instalacion_y_Despliegue.pdf) | ALD-MI-01 |
| 7 | Otros | [Manual técnico](manuales/AlDia_Manual_Tecnico.pdf) (ALD-MT-01) · [Documento de análisis](AlDia_Documento_de_analisis.pdf) · [Arquitectura](ARQUITECTURA.md) · código fuente en GitHub | — |

Todos los documentos están en Word (.docx) y PDF en la misma carpeta.

## Cómo verificar cada entregable

| Entregable | Prueba rápida |
|---|---|
| Despliegue | En internet: abrir https://aldia-ru4q.onrender.com, crear una cuenta o entrar con una cuenta de administrador · en red local: doble clic en `desplegar.bat` → http://localhost:4000 con `demo@aldia.co` / `Demo123*` |
| Pruebas | `cd backend && npm test` (146) y `cd app && npm test` (26): todas deben pasar |
| Respaldo | Doble clic en `respaldar.bat` → aparece una carpeta nueva en `respaldos/` con `aldia.sql` y `uploads/` |
