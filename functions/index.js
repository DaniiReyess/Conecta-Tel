
const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {GoogleGenAI, Type} = require("@google/genai");
const logger = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");
const crypto = require("crypto");
const {defineSecret} = require("firebase-functions/params");

const credencialesEncryptionKey = defineSecret(
    "CREDENCIALES_ENCRYPTION_KEY",
);


/**
 * Cifra una credencial usando AES-256-GCM.
 * @param {string} texto Texto que se va a cifrar.
 * @return {{iv: string, tag: string, valor: string}} Datos cifrados.
 */
function cifrarCredencial(texto) {
  const clave = Buffer.from(
      credencialesEncryptionKey.value(),
      "hex",
  );

  if (clave.length !== 32) {
    throw new Error("La clave de cifrado debe tener 32 bytes.");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      clave,
      iv,
  );

  const cifrado = Buffer.concat([
    cipher.update(texto, "utf8"),
    cipher.final(),
  ]);

  return {
    iv: iv.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
    valor: cifrado.toString("hex"),
  };
}

/**
 * Descifra una credencial previamente cifrada.
 * @param {{iv: string, tag: string, valor: string}} datos Datos cifrados.
 * @return {string} Texto original.
 */
function descifrarCredencial(datos) {
  const clave = Buffer.from(
      credencialesEncryptionKey.value(),
      "hex",
  );

  if (clave.length !== 32) {
    throw new Error("La clave de cifrado debe tener 32 bytes.");
  }

  const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      clave,
      Buffer.from(datos.iv, "hex"),
  );

  decipher.setAuthTag(Buffer.from(datos.tag, "hex"));

  const texto = Buffer.concat([
    decipher.update(Buffer.from(datos.valor, "hex")),
    decipher.final(),
  ]);

  return texto.toString("utf8");
}


/**
 * Construye el correo interno de Firebase a partir del código de acceso.
 * @param {string} codigo Código de acceso del egresado.
 * @return {string} Correo interno asociado al código.
 */
function correoInternoPorCodigo(codigo) {
  const normalizado = String(codigo || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  if (!normalizado) {
    throw new Error("Código de acceso inválido.");
  }

  return `ct-${normalizado}@conecta-tel.firebaseapp.com`;
}


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

/**
 * CONECTA-TEL: generación de credenciales de egresados.
 * Las credenciales temporales se devuelven una sola vez
 * y nunca se guardan en Firestore en texto plano.
 */


exports.generarCredencialesEgresados = onRequest(
    {
      cors: true,
      secrets: [credencialesEncryptionKey],
    },
    async (req, res) => {
      try {
        if (req.method !== "POST") {
          return res.status(405).json({
            success: false,
            message: "Utiliza el método POST.",
          });
        }

        const authorization = req.get("Authorization") || "";
        const match = authorization.match(/^Bearer (.+)$/);

        if (!match) {
          return res.status(401).json({
            success: false,
            message: "Debes iniciar sesión.",
          });
        }

        const token = await getAuth().verifyIdToken(match[1], true);
        const adminSnap = await db
            .collection("administradores")
            .doc(token.uid)
            .get();

        if (!adminSnap.exists) {
          return res.status(403).json({
            success: false,
            message: "Operación exclusiva de administradores.",
          });
        }

        const ids = req.body && req.body.egresadoIds;

        if (
          !Array.isArray(ids) ||
          ids.length < 1 ||
          ids.length > 20 ||
          ids.some((id) => typeof id !== "string" || !id.trim())
        ) {
          return res.status(400).json({
            success: false,
            message: "Envía entre 1 y 20 IDs válidos.",
          });
        }

        const resultados = [];
        const auth = getAuth();

        for (const id of [...new Set(ids)]) {
          try {
            const egresadoRef = db.collection("egresados").doc(id);
            const egresadoSnap = await egresadoRef.get();

            if (!egresadoSnap.exists) {
              resultados.push({
                egresadoId: id,
                success: false,
                message: "Egresado no encontrado.",
              });
              continue;
            }

            const datos = egresadoSnap.data();

            // Recuperar la cuenta existente sin crear otro usuario.
            if (datos.uid) {
              const accesoRef = db
                  .collection("credencialesAcceso")
                  .doc(datos.uid);
              const accesoSnap = await accesoRef.get();
              const acceso = accesoSnap.exists ?
                accesoSnap.data() :
                {};

              // Si ya hay credenciales pendientes, mostrar las mismas.
              if (
                acceso.passwordTemporalCifrada &&
                acceso.estado === "pendienteCambioPassword" &&
                !acceso.cambioCompletadoEn
              ) {
                const codigoGuardado =
                    acceso.codigoAcceso || datos.codigoAcceso;

                if (!codigoGuardado) {
                  throw new Error("El egresado no tiene código de acceso.");
                }

                const usuarioExistente = await auth.getUser(datos.uid);
                const correoCorrecto = correoInternoPorCodigo(codigoGuardado);

                if (usuarioExistente.email !== correoCorrecto) {
                  await auth.updateUser(datos.uid, {
                    email: correoCorrecto,
                  });
                }

                if (!codigoGuardado) {
                  throw new Error("El egresado no tiene código de acceso.");
                }

                resultados.push({
                  egresadoId: id,
                  success: true,
                  yaExiste: true,
                  codigoAcceso: codigoGuardado,
                  contrasenaTemporal: descifrarCredencial(
                      acceso.passwordTemporalCifrada,
                  ),
                });

                continue;
              }

              // Nunca recuperar ni regenerar una contraseña ya utilizada.
              if (acceso.cambioCompletadoEn) {
                resultados.push({
                  egresadoId: id,
                  success: false,
                  yaExiste: true,
                  message:
                    "El egresado ya cambió su contraseña. " +
                    "No se mostrarán credenciales temporales.",
                });
                continue;
              }

              // Recuperación inicial: solo si no hay contraseña cifrada.
              let codigo = datos.codigoAcceso || acceso.codigoAcceso;

              if (!codigo) {
                const contadorRef = db
                    .collection("configuracion")
                    .doc("contadorCredenciales");

                codigo = await db.runTransaction(async (tx) => {
                  const contadorSnap = await tx.get(contadorRef);
                  const egresadoActual = await tx.get(egresadoRef);

                  if (!egresadoActual.exists) {
                    throw new Error("Egresado no encontrado.");
                  }

                  const codigoActual =
                    egresadoActual.data().codigoAcceso;

                  if (codigoActual) {
                    return codigoActual;
                  }

                  const siguiente = contadorSnap.exists ?
                    Number(contadorSnap.data().ultimoNumero || 0) + 1 :
                    1;

                  const nuevoCodigo = `E-${siguiente}`;

                  tx.set(contadorRef, {
                    ultimoNumero: siguiente,
                    actualizadoEn: new Date().toISOString(),
                  });

                  tx.update(egresadoRef, {
                    codigoAcceso: nuevoCodigo,
                  });

                  return nuevoCodigo;
                });
              }

              const usuarioExistente = await auth.getUser(datos.uid);

              if (
                !usuarioExistente.customClaims ||
                usuarioExistente.customClaims.conectaTelRole !== "egresado"
              ) {
                resultados.push({
                  egresadoId: id,
                  success: false,
                  message:
                    "No se pudo verificar que la cuenta sea de un egresado.",
                });
                continue;
              }

              // Crear la contraseña de recuperación una sola vez.
              const temporal =
                `${crypto.randomBytes(18).toString("hex")}Aa1!`;
              const passwordTemporalCifrada =
                cifrarCredencial(temporal);

              // Guardar primero la credencial cifrada.
              await accesoRef.set({
                egresadoId: id,
                codigoAcceso: codigo,
                passwordTemporalCifrada,
                estado: "pendienteCambioPassword",
                actualizadoPor: token.uid,
                creadoEn: new Date().toISOString(),
              });

              // Actualizar la cuenta existente; no crear otra.
              await auth.updateUser(datos.uid, {
                password: temporal,
              });

              await auth.setCustomUserClaims(datos.uid, {
                ...(usuarioExistente.customClaims || {}),
                conectaTelRole: "egresado",
                mustChangePassword: true,
              });

              await egresadoRef.update({
                codigoAcceso: codigo,
              });

              resultados.push({
                egresadoId: id,
                success: true,
                yaExiste: true,
                codigoAcceso: codigo,
                contrasenaTemporal: temporal,
              });

              continue;
            }


            // Reutilizar un código reservado si hubo un intento anterior.
            let codigo = datos.codigoAcceso;

            if (!codigo) {
              const contadorRef = db
                  .collection("configuracion")
                  .doc("contadorCredenciales");

              codigo = await db.runTransaction(async (tx) => {
                const actual = await tx.get(contadorRef);
                const egresadoActual = await tx.get(egresadoRef);

                if (!egresadoActual.exists) {
                  throw new Error("Egresado no encontrado.");
                }

                const codigoExistente =
                  egresadoActual.data().codigoAcceso;

                if (codigoExistente) {
                  return codigoExistente;
                }

                const siguiente = actual.exists ?
                  Number(actual.data().ultimoNumero || 0) + 1 :
                  1;

                const nuevoCodigo = `E-${siguiente}`;

                tx.set(contadorRef, {
                  ultimoNumero: siguiente,
                  actualizadoEn: new Date().toISOString(),
                });

                tx.update(egresadoRef, {
                  codigoAcceso: nuevoCodigo,
                });

                return nuevoCodigo;
              });
            }

            const correoInterno = correoInternoPorCodigo(codigo);

            const temporal =
              `${crypto.randomBytes(18).toString("hex")}Aa1!`;

            // Si el usuario se creó en un intento previo, reutilizarlo.
            let usuario;

            try {
              usuario = await auth.getUserByEmail(correoInterno);
              usuario = await auth.updateUser(usuario.uid, {
                password: temporal,
                emailVerified: false,
              });
            } catch (error) {
              if (error.code !== "auth/user-not-found") {
                throw error;
              }

              usuario = await auth.createUser({
                email: correoInterno,
                password: temporal,
                emailVerified: false,
              });
            }

            const usuarioActualizado = await auth.getUser(usuario.uid);

            await auth.setCustomUserClaims(usuario.uid, {
              ...(usuarioActualizado.customClaims || {}),
              conectaTelRole: "egresado",
              mustChangePassword: true,
            });

            const passwordTemporalCifrada =
              cifrarCredencial(temporal);

            await db.collection("credencialesAcceso")
                .doc(usuario.uid)
                .set({
                  egresadoId: id,
                  codigoAcceso: codigo,
                  passwordTemporalCifrada,
                  estado: "pendienteCambioPassword",
                  actualizadoPor: token.uid,
                  creadoEn: new Date().toISOString(),
                });

            await egresadoRef.update({
              uid: usuario.uid,
              codigoAcceso: codigo,
            });

            resultados.push({
              egresadoId: id,
              success: true,
              codigoAcceso: codigo,
              contrasenaTemporal: temporal,
            });
          } catch (error) {
            logger.error("Error al generar credencial.", {
              egresadoId: id,
              code: error.code || "unknown",
            });

            resultados.push({
              egresadoId: id,
              success: false,
              message:
                "No fue posible completar la operación. " +
                "Verifica el estado de la cuenta antes de reintentar.",
            });
          }
        }

        return res.status(200).json({
          success: true,
          resultados,
          advertencia:
            "La contraseña temporal solo se recupera mientras " +
            "el egresado no haya completado el cambio obligatorio.",
        });
      } catch (error) {
        logger.error("Error en generación de credenciales.", {
          code: error.code || "unknown",
        });

        return res.status(500).json({
          success: false,
          message: "No fue posible generar las credenciales.",
        });
      }
    },
);


/**
 * Confirma que la contraseña temporal fue cambiada.
 * El frontend debe actualizar primero la contraseña en Firebase Auth.
 */

exports.completarCambioPassword = onRequest(
    {cors: true},
    async (req, res) => {
      try {
        if (req.method !== "POST") {
          return res.status(405).json({
            success: false,
            message: "Utiliza el método POST.",
          });
        }

        const authorization = req.get("Authorization") || "";
        const match = authorization.match(/^Bearer (.+)$/);

        if (!match) {
          return res.status(401).json({
            success: false,
            message: "Debes iniciar sesión.",
          });
        }

        const token = await getAuth().verifyIdToken(match[1], true);

        if (token.mustChangePassword !== true) {
          return res.status(400).json({
            success: false,
            message: "No hay un cambio obligatorio pendiente.",
          });
        }

        const nuevaPassword = req.body && req.body.nuevaPassword;

        if (
          typeof nuevaPassword !== "string" ||
          nuevaPassword.length < 8 ||
          nuevaPassword.length > 128
        ) {
          return res.status(400).json({
            success: false,
            message: "La contraseña debe tener entre 8 y 128 caracteres.",
          });
        }

        const auth = getAuth();
        const usuario = await auth.getUser(token.uid);

        const accesoRef = db
            .collection("credencialesAcceso")
            .doc(token.uid);

        const accesoSnap = await accesoRef.get();

        if (!accesoSnap.exists) {
          return res.status(403).json({
            success: false,
            message: "No se encontró el registro de acceso.",
          });
        }

        // Cambiar la contraseña directamente en Firebase Auth.
        await auth.updateUser(token.uid, {
          password: nuevaPassword,
        });

        // Retirar la marca que obliga al cambio de contraseña.
        const claims = {...(usuario.customClaims || {})};
        delete claims.mustChangePassword;

        await auth.setCustomUserClaims(token.uid, claims);

        await accesoRef.update({
          cambioCompletadoEn: new Date().toISOString(),
        });

        logger.info("Cambio de contraseña completado.", {
          uid: token.uid,
        });

        return res.status(200).json({
          success: true,
          message: "Contraseña actualizada correctamente.",
        });
      } catch (error) {
        logger.error("Error al completar cambio de contraseña.", {
          code: error.code || "unknown",
        });

        if (
          error.code === "auth/invalid-password" ||
          error.code === "auth/weak-password"
        ) {
          return res.status(400).json({
            success: false,
            message: "La contraseña no cumple los requisitos de Firebase.",
          });
        }

        return res.status(500).json({
          success: false,
          message: "No fue posible completar el cambio de contraseña.",
        });
      }
    },
);
