const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");

// ======================================================
// CONEXIÓN CON FIREBASE
// ======================================================

const serviceAccountPath = path.join(
  __dirname,
  "..",
  "serviceAccountKey.json"
);

const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// ======================================================
// DATOS DE LAS ENCUESTAS
// ======================================================

const encuestas = {
  encuesta01: {
    preguntas: [
      {
        numero: 1,
        texto: "¿Cuál es tu situación laboral actual?",
        tipo: "opcion_unica",
        opciones: [
          "Trabajo actualmente",
          "Estoy emprendiendo",
          "Estoy estudiando",
          "Actualmente no estoy trabajando",
        ],
        obligatoria: true,
      },
      {
        numero: 2,
        texto:
          "¿Tu actividad actual está relacionada con Ingeniería de Telecomunicaciones?",
        tipo: "opcion_unica",
        opciones: ["Sí", "Parcialmente", "No"],
        obligatoria: true,
      },
      {
        numero: 3,
        texto: "¿En qué área principal te desempeñas actualmente?",
        tipo: "opcion_unica",
        opciones: [
          "Telecomunicaciones",
          "Redes y conectividad",
          "Tecnología / TI",
          "Seguridad informática",
          "Electrónica",
          "Gestión / administración",
          "Otra",
        ],
        obligatoria: true,
      },
      {
        numero: 4,
        texto: "¿En qué sector desarrollas principalmente tu actividad?",
        tipo: "opcion_unica",
        opciones: [
          "Privado",
          "Público",
          "Independiente",
          "Académico",
          "Otro",
        ],
        obligatoria: true,
      },
      {
        numero: 5,
        texto:
          "¿En qué ciudad desarrollas principalmente tu actividad profesional?",
        tipo: "texto",
        opciones: [],
        obligatoria: true,
      },
      {
        numero: 6,
        texto: "¿Cuál es tu modalidad de trabajo?",
        tipo: "opcion_unica",
        opciones: [
          "Presencial",
          "Remoto",
          "Híbrido",
          "No aplica",
        ],
        obligatoria: true,
      },
      {
        numero: 7,
        texto:
          "¿Has realizado estudios o certificaciones después de graduarte?",
        tipo: "opcion_unica",
        opciones: ["Sí", "No"],
        obligatoria: true,
      },
      {
        numero: 8,
        texto: "¿Qué tipo de formación has realizado?",
        tipo: "opcion_unica",
        opciones: [
          "Especialización",
          "Maestría",
          "Doctorado",
          "Cursos / certificaciones",
          "Otra",
        ],
        obligatoria: false,
        condicion: {
          preguntaNumero: 7,
          operador: "igual",
          valor: "Sí",
        },
      },
      {
        numero: 9,
        texto:
          "¿Qué competencias consideras más importantes en tu actividad actual?",
        tipo: "texto",
        opciones: [],
        obligatoria: true,
      },
      {
        numero: 10,
        texto:
          "¿Qué tecnologías o herramientas utilizas actualmente?",
        tipo: "texto",
        opciones: [],
        obligatoria: true,
      },
    ],
  },

  encuesta02: {
    preguntas: [
      {
        numero: 1,
        texto:
          "¿Cuánto tiempo tardaste en conseguir tu primer empleo después de graduarte?",
        tipo: "opcion_unica",
        opciones: [
          "Menos de 3 meses",
          "3–6 meses",
          "6–12 meses",
          "Más de 1 año",
          "Ya trabajaba antes de graduarme",
        ],
        obligatoria: true,
      },
      {
        numero: 2,
        texto: "¿Has cambiado de empresa desde que te graduaste?",
        tipo: "opcion_unica",
        opciones: ["Sí", "No"],
        obligatoria: true,
      },
      {
        numero: 3,
        texto:
          "¿Has tenido crecimiento o cambio de cargo durante tu trayectoria profesional?",
        tipo: "opcion_unica",
        opciones: ["Sí", "No"],
        obligatoria: true,
      },
      {
        numero: 4,
        texto:
          "¿Consideras que tu experiencia profesional está relacionada con tu formación en Ingeniería de Telecomunicaciones?",
        tipo: "opcion_unica",
        opciones: ["Sí", "Parcialmente", "No"],
        obligatoria: true,
      },
      {
        numero: 5,
        texto:
          "¿Cuál ha sido tu principal dificultad para desarrollarte profesionalmente?",
        tipo: "opcion_unica",
        opciones: [
          "Falta de oportunidades",
          "Falta de experiencia",
          "Falta de formación especializada",
          "Condiciones laborales",
          "Ubicación geográfica",
          "Otra",
        ],
        obligatoria: true,
      },
      {
        numero: 6,
        texto:
          "¿Qué aspecto ha contribuido más a tu crecimiento profesional?",
        tipo: "opcion_unica",
        opciones: [
          "Experiencia laboral",
          "Formación académica",
          "Certificaciones",
          "Contactos profesionales",
          "Emprendimiento",
          "Otro",
        ],
        obligatoria: true,
      },
      {
        numero: 7,
        texto:
          "¿Actualmente buscas nuevas oportunidades laborales o profesionales?",
        tipo: "opcion_unica",
        opciones: ["Sí", "No"],
        obligatoria: true,
      },
      {
        numero: 8,
        texto:
          "¿En qué área te gustaría continuar desarrollándote?",
        tipo: "texto",
        opciones: [],
        obligatoria: true,
      },
    ],
  },

  encuesta03: {
    preguntas: [
      {
        numero: 1,
        texto:
          "¿Consideras que la formación recibida en Ingeniería de Telecomunicaciones ha sido útil para tu vida profesional?",
        tipo: "opcion_unica",
        opciones: ["Sí", "Parcialmente", "No"],
        obligatoria: true,
      },
      {
        numero: 2,
        texto:
          "¿Qué conocimientos adquiridos durante la carrera utilizas actualmente?",
        tipo: "texto",
        opciones: [],
        obligatoria: true,
      },
      {
        numero: 3,
        texto:
          "¿Qué competencia consideras que debería fortalecerse durante la carrera?",
        tipo: "texto",
        opciones: [],
        obligatoria: true,
      },
      {
        numero: 4,
        texto:
          "¿Has necesitado adquirir conocimientos adicionales para desempeñarte profesionalmente?",
        tipo: "opcion_unica",
        opciones: ["Sí", "No"],
        obligatoria: true,
      },
      {
        numero: 5,
        texto:
          "¿En qué área te gustaría recibir formación adicional?",
        tipo: "opcion_unica",
        opciones: [
          "Telecomunicaciones",
          "Redes",
          "Ciberseguridad",
          "Inteligencia artificial",
          "Cloud / Computación en la nube",
          "IoT",
          "Gestión y administración",
          "Otra",
        ],
        obligatoria: true,
      },
      {
        numero: 6,
        texto: "¿Qué modalidad de formación prefieres?",
        tipo: "opcion_unica",
        opciones: [
          "Presencial",
          "Virtual",
          "Híbrida",
        ],
        obligatoria: true,
      },
      {
        numero: 7,
        texto:
          "¿Te interesaría participar en actividades de actualización ofrecidas por la Universidad?",
        tipo: "opcion_unica",
        opciones: ["Sí", "No"],
        obligatoria: true,
      },
      {
        numero: 8,
        texto:
          "¿Qué tipo de actividades te interesarían?",
        tipo: "opcion_unica",
        opciones: [
          "Cursos",
          "Certificaciones",
          "Conferencias",
          "Talleres",
          "Eventos de networking",
          "Otra",
        ],
        obligatoria: true,
      },
      {
        numero: 9,
        texto:
          "¿Te gustaría mantener contacto con otros egresados de Ingeniería de Telecomunicaciones?",
        tipo: "opcion_unica",
        opciones: ["Sí", "No"],
        obligatoria: true,
      },
      {
        numero: 10,
        texto:
          "¿Qué sugerencia darías para fortalecer la relación entre los egresados y la Universidad?",
        tipo: "texto",
        opciones: [],
        obligatoria: true,
      },
    ],
  },
};

// ======================================================
// CARGAR PREGUNTAS
// ======================================================

async function cargarEncuestas() {
  try {
    console.log("\n========================================");
    console.log("   CARGANDO ENCUESTAS - CONECTA-TEL");
    console.log("========================================\n");

    let totalPreguntas = 0;

    for (const [encuestaId, encuesta] of Object.entries(encuestas)) {
      console.log(`Procesando ${encuestaId}...`);

      const encuestaRef = db
        .collection("encuestas")
        .doc(encuestaId);

      const preguntasRef = encuestaRef.collection("preguntas");

      for (const pregunta of encuesta.preguntas) {
        const preguntaId = `pregunta${String(
          pregunta.numero
        ).padStart(2, "0")}`;

        const datosPregunta = {
          numero: pregunta.numero,
          texto: pregunta.texto,
          tipo: pregunta.tipo,
          opciones: pregunta.opciones,
          obligatoria: pregunta.obligatoria,
        };

        if (pregunta.condicion) {
          datosPregunta.condicion = pregunta.condicion;
        }

        await preguntasRef
          .doc(preguntaId)
          .set(datosPregunta);

        console.log(
          `  ✓ ${preguntaId} creada/actualizada`
        );

        totalPreguntas++;
      }

      console.log(
        `✓ ${encuestaId} completada\n`
      );
    }

    console.log("========================================");
    console.log("   PROCESO COMPLETADO");
    console.log("========================================");
    console.log(`✓ Encuestas procesadas: 3`);
    console.log(`✓ Preguntas procesadas: ${totalPreguntas}`);
    console.log("✓ Firestore actualizado correctamente.\n");

  } catch (error) {
    console.error("\n========================================");
    console.error("   ERROR AL CARGAR ENCUESTAS");
    console.error("========================================\n");

    console.error(error.message);
  }
}

cargarEncuestas();