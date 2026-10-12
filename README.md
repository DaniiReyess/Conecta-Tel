# 💙 CONECTA-TEL
### Plataforma Inteligente para el Seguimiento y Caracterización de Egresados

<p align="center">
  <strong>Universidad Santo Tomás · Seccional Bucaramanga</strong>
</p>

<p align="center">
  <a href="https://conecta-tel.web.app">🌐 Visitar plataforma</a>
</p>

---

## 📌 Acerca del proyecto

**CONECTA-TEL** es una plataforma web desarrollada para fortalecer el seguimiento de los egresados de Ingeniería de Telecomunicaciones, facilitando la actualización de su información profesional y brindando herramientas para su caracterización y análisis.

El proyecto integra tecnologías web, servicios de Firebase e inteligencia artificial para apoyar la gestión de información y la toma de decisiones académicas.

## ✨ Funcionalidades principales

- 🔐 **Acceso seguro:** autenticación y gestión de usuarios por roles.
- 👤 **Perfil del egresado:** actualización de información personal y profesional.
- 📊 **Panel administrativo:** consulta, seguimiento y análisis de los registros.
- 🤖 **Inteligencia artificial:** clasificación de perfiles profesionales.
- 🗺️ **Geolocalización:** visualización de la distribución geográfica de los egresados.
- 📈 **Indicadores y visualizaciones:** apoyo al análisis de la trayectoria profesional.
- 📁 **Gestión de información:** consulta y exportación de datos para apoyar los procesos académicos.

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| React + Vite | Interfaz web |
| JavaScript | Lógica de la aplicación |
| Firebase Authentication | Autenticación de usuarios |
| Cloud Firestore | Gestión de datos |
| Firebase Hosting | Publicación de la plataforma |
| Cloud Functions | Procesos de backend |
| Google Maps API | Geolocalización |
| Gemini / IA | Clasificación de perfiles profesionales |

## 🚀 Acceso a la plataforma

**Plataforma en producción:** [https://conecta-tel.web.app](https://conecta-tel.web.app)

El acceso a las funcionalidades administrativas está restringido a usuarios autorizados. Los egresados ingresan mediante sus credenciales asignadas y deben cambiar su contraseña temporal en el primer acceso.

## 🧪 Prueba piloto

CONECTA-TEL cuenta con una prueba piloto realizada con **14 egresados** de Ingeniería de Telecomunicaciones. Esta etapa permite evaluar el acceso a la plataforma, la actualización de perfiles y el funcionamiento de las funcionalidades implementadas.

El proceso contempla la revisión de resultados y la identificación de oportunidades de mejora.

## 📂 Estructura del proyecto

```text
conecta-tel/
├── functions/    # Funciones de backend
├── public/       # Recursos estáticos
├── scripts/      # Herramientas de apoyo y auditoría
├── src/          # Componentes e interfaz React
├── firebase.json
├── package.json
└── vite.config.js
```

## 💻 Instalación y ejecución local

**Requisitos:** Node.js, npm y acceso autorizado a la configuración de Firebase.

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/DaniiReyess/Conecta-Tel.git
   cd Conecta-Tel
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Configurar las credenciales y variables de entorno necesarias sin incluir secretos en el repositorio.

4. Iniciar el entorno de desarrollo:

   ```bash
   npm run dev
   ```

5. Generar la compilación de producción:

   ```bash
   npm run build
   ```

## 🔒 Seguridad y privacidad

CONECTA-TEL gestiona información personal y profesional de sus egresados. Por ello, las credenciales deben mantenerse privadas, los accesos deben estar controlados por roles y los archivos con datos personales no deben publicarse en el repositorio.

Las claves privadas, contraseñas, archivos `.env` y credenciales de servicio deben mantenerse fuera del control de versiones.

## 🎯 Propósito

Contribuir al fortalecimiento de la relación entre la Universidad Santo Tomás y sus egresados mediante una herramienta tecnológica que facilite el seguimiento de sus trayectorias profesionales y apoye la toma de decisiones académicas.

---

<p align="center">
  <strong>CONECTA-TEL</strong><br>
  Conectando trayectorias, impulsando oportunidades. 💙
</p>
