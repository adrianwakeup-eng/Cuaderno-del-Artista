# Cuaderno del Artista — Compilación para Windows (.exe)

Este proyecto incluye toda la configuración necesaria para empaquetarse como programa ejecutable nativo de escritorio para Windows (`.exe`) con almacenamiento local sin conexión.

## Pasos para generar el `.exe` en Windows 10 / 11

1. Instala **Node.js 20 o superior** desde https://nodejs.org
2. Abre una terminal (PowerShell o CMD) en la carpeta raíz del proyecto.
3. Instala las dependencias y herramientas de empaquetado de escritorio:
   ```bash
   npm install
   npm install -D electron electron-builder
   ```
4. Compila la aplicación web y genera el ejecutable para Windows:
   ```bash
   npm run build
   npx electron-builder --win --config electron-builder.json
   ```
5. Encontrarás tanto el **instalador (.exe)** como la **versión portable (.exe)** dentro de la carpeta `release/`.
