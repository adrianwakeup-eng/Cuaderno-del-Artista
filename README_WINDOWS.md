# Cuaderno del Artista — Aplicación de Windows

**Cuaderno del Artista · Estudio de Crochet** está preparado para funcionar como aplicación de escritorio de Windows 10 y Windows 11 de **dos formas**, ambas con funcionamiento **sin conexión** y almacenamiento local privado:

---

## Opción 1: Instalación Instantánea en Windows (1 clic, sin compilar)

1. Abre la aplicación en **Microsoft Edge** o **Google Chrome** en tu PC con Windows.
2. Pulsa el botón dorado **«Instalar App Windows»** en la barra superior de la portada (o el icono de instalación en la barra de direcciones del navegador).
3. Windows creará un **acceso directo en el Escritorio y en el Menú Inicio**, y la aplicación se abrirá en su propia ventana independiente sin barra del navegador, con soporte offline completo.

---

## Opción 2: Generar el Ejecutable Nativo de Windows (`.exe`)

El proyecto incluye el motor nativo de escritorio (`electron/main.cjs`, `electron/preload.cjs`, icono multi-resolución `electron/icon.ico`, `electron-builder.json` y el script `construir-windows.bat`).

### Con doble clic (recomendado)
1. Instala **Node.js 20 LTS o superior** desde https://nodejs.org
2. Haz doble clic en **`construir-windows.bat`** en la carpeta raíz del proyecto.
3. Al terminar, se abrirá automáticamente la carpeta **`release/`** con:
   - **`Cuaderno-del-Artista-Instalador-*.exe`** — Instalador clásico en español con icono en Escritorio y Menú Inicio.
   - **`Cuaderno-del-Artista-Portable-*.exe`** — Ejecutable portable listo para llevar en USB sin instalar.

### Desde PowerShell o CMD
```powershell
npm install
npm install --no-save electron electron-builder
npm run build:win
```

### Compilación automática en la nube (GitHub Actions)
Al subir el repositorio a GitHub, el flujo `.github/workflows/windows-exe.yml` compila automáticamente los ejecutables `.exe` en un servidor Windows y los deja listos para descargar en la pestaña **Actions → Artifacts**.
