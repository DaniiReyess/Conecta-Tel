const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {GoogleGenAI, Type} = require("@google/genai");
const logger = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");

initializeApp();

const db = getFirestore();

setGlobalOptions({maxInstances: 10});


exports.testGeminiConnection = onRequest(
    {cors: true},
    async (req, res) => {
      try {
        const ai = new GoogleGenAI({
          vertexai: true,
          project: "conecta-tel",
          location: "global",
        });

        const perfilEgresado = req.body;

        if (
          !perfilEgresado ||
        Object.keys(perfilEgresado).length === 0
        ) {
          return res.status(400).json({
            success: false,
            message:
            "Debe enviar los datos del perfil del egresado.",
          });
        }

        const prompt = `
Eres el componente de inteligencia artificial
de CONECTA-TEL, una plataforma para el seguimiento
y caracterización de egresados de Ingeniería de
Telecomunicaciones.

Debes clasificar el perfil profesional utilizando
EXCLUSIVAMENTE la información proporcionada.

REGLAS:

- No inventes información.
- No supongas información que no esté presente.
- No infieras características personales.
- La clasificación debe estar basada únicamente
  en los datos recibidos.
- Si un dato no puede determinarse, utiliza una
  cadena vacía o un arreglo vacío.
- Devuelve únicamente el resultado estructurado.

PERFIL DEL EGRESADO:

${JSON.stringify(perfilEgresado, null, 2)}

Genera:

- areaProfesional
- especialidad
- cargoPrincipal
- sector
- tecnologias
- palabrasClave
- generadoPorIA
- datosUtilizados
`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                areaProfesional: {
                  type: "string",
                },
                especialidad: {
                  type: "string",
                },
                cargoPrincipal: {
                  type: "string",
                },
                sector: {
                  type: "string",
                },
                tecnologias: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                palabrasClave: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                generadoPorIA: {
                  type: "boolean",
                },
                datosUtilizados: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: [
                "areaProfesional",
                "especialidad",
                "cargoPrincipal",
                "sector",
                "tecnologias",
                "palabrasClave",
                "generadoPorIA",
                "datosUtilizados",
              ],
            },
          },
        });

        logger.info(
            "Clasificación de perfil generada correctamente.",
        );

        return res.status(200).json({
          success: true,
          message: "Clasificación generada correctamente.",
          clasificacion: JSON.parse(response.text),
        });
      } catch (error) {
        logger.error(
            "Error al generar la clasificación con Gemini:",
            error,
        );

        return res.status(500).json({
          success: false,
          message:
          "No fue posible generar la clasificación.",
          error: error.message,
        });
      }
    },
);


exports.testFirestoreRead = onRequest(
    async (req, res) => {
      try {
        const egresadoRef = db
            .collection("egresados")
            .doc("HwsjXNBTWbpS4ufoudhX");

        const egresadoSnapshot =
        await egresadoRef.get();

        if (!egresadoSnapshot.exists) {
          return res.status(404).json({
            success: false,
            message:
            "No se encontró el egresado de prueba.",
          });
        }

        const egresado = egresadoSnapshot.data();

        const trayectoriaSnapshot =
        await egresadoRef
            .collection("trayectoriaLaboral")
            .get();

        const trayectoriaLaboral =
        trayectoriaSnapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...documento.data(),
            }),
        );

        return res.status(200).json({
          success: true,
          message: "Lectura de Firestore exitosa.",
          egresadoId: egresadoSnapshot.id,
          egresado,
          trayectoriaLaboral,
        });
      } catch (error) {
        logger.error(
            "Error al leer Firestore:",
            error,
        );

        return res.status(500).json({
          success: false,
          message:
          "No fue posible leer Firestore.",
          error: error.message,
        });
      }
    },
);


exports.testFirestoreGemini = onRequest(
    {cors: true},
    async (req, res) => {
    // --------------------------------------------------
    // 1. CONFIGURACIÓN CORS
    // --------------------------------------------------
      const origin = req.headers.origin;

      if (origin === "http://localhost:5173") {
        res.set("Access-Control-Allow-Origin", origin);
      }

      res.set("Vary", "Origin");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
      );
      res.set("Access-Control-Max-Age", "3600");

      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          message: "Método no permitido. Utiliza POST.",
        });
      }

      try {
      // --------------------------------------------------
      // 2. VERIFICAR AUTENTICACIÓN CON FIREBASE
      // --------------------------------------------------
        const authorization = req.get("Authorization") || "";
        const tokenMatch = authorization.match(/^Bearer (.+)$/);

        if (!tokenMatch) {
          return res.status(401).json({
            success: false,
            message: "Debes iniciar sesión para realizar esta operación.",
          });
        }

        let decodedToken;

        try {
          decodedToken = await getAuth().verifyIdToken(tokenMatch[1]);
        } catch (error) {
          logger.warn("Token de autenticación inválido o vencido.");

          return res.status(401).json({
            success: false,
            message: "La sesión no es válida. Inicia sesión nuevamente.",
          });
        }

        // --------------------------------------------------
        // 3. VERIFICAR QUE EL USUARIO SEA ADMINISTRADOR
        // --------------------------------------------------
        const adminRef = db
            .collection("administradores")
            .doc(decodedToken.uid);

        const adminSnapshot = await adminRef.get();

        if (!adminSnapshot.exists) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para ejecutar esta operación.",
          });
        }

        const adminData = adminSnapshot.data();

        // Un administrador marcado explícitamente como inactivo
        // no puede ejecutar la clasificación.
        if (adminData.activo === false) {
          return res.status(403).json({
            success: false,
            message: "La cuenta de administrador está inactiva.",
          });
        }

        // Si el documento contiene un rol, validar su valor.
        // Confirma los valores reales de tu colección antes de desplegar.
        if (
          adminData.rol &&
        !["admin", "administrador"].includes(
            String(adminData.rol).toLowerCase(),
        )
        ) {
          return res.status(403).json({
            success: false,
            message: "Tu rol no tiene permisos para esta operación.",
          });
        }

        // --------------------------------------------------
        // 4. VALIDAR EL ID DEL EGRESADO
        // --------------------------------------------------
        const egresadoId = req.body && req.body.egresadoId;

        if (
          typeof egresadoId !== "string" ||
        !egresadoId.trim()
        ) {
          return res.status(400).json({
            success: false,
            message: "Debes proporcionar un ID de egresado válido.",
          });
        }

        // --------------------------------------------------
        // 5. CONSULTAR EL PERFIL DEL EGRESADO
        // --------------------------------------------------
        const egresadoRef = db
            .collection("egresados")
            .doc(egresadoId);

        const egresadoSnapshot = await egresadoRef.get();

        if (!egresadoSnapshot.exists) {
          return res.status(404).json({
            success: false,
            message: "No se encontró el egresado solicitado.",
          });
        }

        const egresado = egresadoSnapshot.data();

        // --------------------------------------------------
        // 6. CONSULTAR SU TRAYECTORIA LABORAL
        // --------------------------------------------------
        const trayectoriaSnapshot = await egresadoRef
            .collection("trayectoriaLaboral")
            .get();

        const trayectoriaLaboral = trayectoriaSnapshot.docs.map(
            (doc) => {
              const experiencia = doc.data();

              return {
                cargo: experiencia.cargo || "",
                empresa: experiencia.empresa || "",
                sectorLaboral: experiencia.sectorLaboral || "",
                tecnologias: experiencia.tecnologias || [],
                competencias: experiencia.competencias || [],
                descripcion: experiencia.descripcion || "",
                ciudad: experiencia.ciudad || "",
                departamento: experiencia.departamento || "",
                pais: experiencia.pais || "",
                esActual: Boolean(experiencia.esActual),
              };
            },
        );

        // --------------------------------------------------
        // 7. PREPARAR LA INFORMACIÓN PARA LA IA
        // --------------------------------------------------
        const perfilParaIA = {
          nivelFormacion: egresado.nivelFormacion || "",
          empresaActual: egresado.empresaActual || "",
          cargoActual: egresado.cargoActual || "",
          ciudadTrabajo: egresado.ciudadTrabajo || "",
          descripcionProfesional:
          egresado.descripcionProfesional || "",
          trayectoriaLaboral,
        };

        // --------------------------------------------------
        // 8. CONFIGURAR GEMINI
        // --------------------------------------------------
        const ai = new GoogleGenAI({
          vertexai: true,
          project: "conecta-tel",
          location: "global",
        });

        const prompt = `
Eres un asistente de análisis profesional para CONECTA-TEL,
una plataforma de caracterización y seguimiento de egresados
de Ingeniería de Telecomunicaciones.

Analiza exclusivamente la información proporcionada del egresado.

Tu tarea es identificar:
- areaProfesional: área profesional principal.
- especialidad: especialidad técnica o profesional.
- cargoPrincipal: cargo más representativo.
- sector: sector económico o industrial.
- tecnologias: tecnologías identificadas en la información.
- palabrasClave: términos útiles para búsquedas y análisis.
- datosUtilizados: campos o datos concretos del perfil utilizados
  para generar la clasificación.

Reglas:
1. No inventes experiencia, tecnologías, cargos ni certificaciones.
2. No supongas información que no esté presente.
3. Si no hay evidencia suficiente para un campo de texto,
   devuelve una cadena vacía.
4. Si no hay evidencia suficiente para una lista,
   devuelve una lista vacía.
5. Utiliza términos claros, breves y profesionales en español.
6. Devuelve únicamente los campos solicitados en el formato JSON.

Información del egresado:
${JSON.stringify(perfilParaIA, null, 2)}
`;

        // --------------------------------------------------
        // 9. GENERAR LA CLASIFICACIÓN
        // --------------------------------------------------
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                areaProfesional: {
                  type: Type.STRING,
                },
                especialidad: {
                  type: Type.STRING,
                },
                cargoPrincipal: {
                  type: Type.STRING,
                },
                sector: {
                  type: Type.STRING,
                },
                tecnologias: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
                palabrasClave: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
                datosUtilizados: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
              },
              required: [
                "areaProfesional",
                "especialidad",
                "cargoPrincipal",
                "sector",
                "tecnologias",
                "palabrasClave",
                "datosUtilizados",
              ],
            },
          },
        });

        if (!response.text) {
          throw new Error("Gemini no devolvió una clasificación.");
        }

        const clasificacion = JSON.parse(response.text);

        // --------------------------------------------------
        // 10. CONSERVAR EL ESTADO DE REVISIÓN ANTERIOR
        // --------------------------------------------------
        const clasificacionRef = db
            .collection("clasificacionesIA")
            .doc(egresadoId);

        const clasificacionAnteriorSnapshot =
        await clasificacionRef.get();

        const datosAnteriores =
        clasificacionAnteriorSnapshot.exists ?
          clasificacionAnteriorSnapshot.data() :
          {};

        const fechaClasificacion = new Date();

        // --------------------------------------------------
        // 11. PREPARAR Y GUARDAR LOS RESULTADOS
        // --------------------------------------------------
        const clasificacionData = {
          egresadoId,

          areaProfesional:
          clasificacion.areaProfesional || "",

          especialidad:
          clasificacion.especialidad || "",

          cargoPrincipal:
          clasificacion.cargoPrincipal || "",

          sector:
          clasificacion.sector || "",

          tecnologias: Array.isArray(clasificacion.tecnologias) ?
          clasificacion.tecnologias :
          [],

          palabrasClave: Array.isArray(clasificacion.palabrasClave) ?
          clasificacion.palabrasClave :
          [],

          generadoPorIA: true,

          datosUtilizados: Array.isArray(clasificacion.datosUtilizados) ?
          clasificacion.datosUtilizados :
          [],

          modeloIA: "gemini-2.5-flash",
          fechaClasificacion,

          // Si ya existía una revisión, conservarla.
          // Si es la primera clasificación, queda pendiente.
          estadoRevision:
          datosAnteriores.estadoRevision || "pendiente",

          revisadoPor:
          datosAnteriores.revisadoPor !== undefined ?
            datosAnteriores.revisadoPor :
            null,

          fechaRevision:
          datosAnteriores.fechaRevision !== undefined ?
            datosAnteriores.fechaRevision :
            null,

          observacionRevision:
          datosAnteriores.observacionRevision || "",
        };

        await clasificacionRef.set(clasificacionData);

        logger.info("Clasificación de egresado completada.", {
          egresadoId,
          adminUid: decodedToken.uid,
          estadoRevision: clasificacionData.estadoRevision,
        });

        // --------------------------------------------------
        // 12. RESPONDER AL FRONTEND
        // --------------------------------------------------
        return res.status(200).json({
          success: true,
          message: "La clasificación con IA se generó correctamente.",
          egresadoId,
          clasificacion: clasificacionData,
        });
      } catch (error) {
        logger.error(
            "Error al ejecutar la clasificación con Gemini.",
            error,
        );

        return res.status(500).json({
          success: false,
          message: "No fue posible completar la clasificación con IA.",
        });
      }
    },
);
