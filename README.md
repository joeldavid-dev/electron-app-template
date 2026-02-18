# Electron App Template
Template of an application made in Electron, with extra features focused on security and stability.

## Screenshots
<img width="400" height="360" alt="Captura de pantalla 2026-02-17 174435" src="https://github.com/user-attachments/assets/62e7de19-dba9-4c0b-bd39-f04e2645a460" />
<img width="400" height="360" alt="Captura de pantalla 2026-02-17 181201" src="https://github.com/user-attachments/assets/a3149d19-afd9-46cd-b0d4-0dbb6b67ee86" />

## Features
- HTML configuration to prevent XSS attacks.
- Configuration storage.
- Event logging to a log file.
- Multi-language support.
- Configured to package with a single command.
- Configured to publish a version with a single command.
- Automatic updates.

## Project Structure
```
├── src/
│   ├── main.js                         # Main Electron app code (Main Process)
│   ├── preload.js                      # Code executed before loading the window (Preload Script)
│   ├── assets/ ...                     # Static assets like images, icons, videos, and fonts
│   ├── config/                         # Constant values used by the application
│   │   ├── constants.json
│   │   ├── defaultSettings.json
│   │   ├── globalConfig.json
│   ├── locales/ ...                    # Language/Localization files
│   ├── renderer/
│   │   ├── homeRenderer.js             # Renderer process for the main view
│   │   ├── utils/ ...                  # Utilities for renderer processes
│   ├── styles/
│   │   ├── styles.css                  # General styles for the entire application
│   ├── utils/
│   │   ├── settings.js                 # Settings storage
│   ├── views/
│   │   ├── home.html                   # Main view
├── package.json
```

## Prerequisites
Before running this template, make sure you have:
- **Node.js**
- A code editor (VS Code recommended)

## Running the project
Clone the code:
```
git clone https://github.com/joeldavid-dev/electron-app-template.git
```

Install Node dependencies:
```
cd electron-app-template
npm install
```

Run in debug mode:
```
npm start
```

Build the installer:
```
npm run build
```

## Supported Languages
English, Spanish, Korean.
