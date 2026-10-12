
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

const serviceAccount = require(
  path.join(__dirname, "..", "serviceAccountKey.json")
);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function extraerValores(datos, campos) {
  return campos
    .flatMap(campo => {
      const valor = datos?.[campo];
      return Array.isArray(valor) ? valor : [valor];
    })
    .filter(valor => valor !== null && valor !== undefined)
    .map(normalizar)
    .filter(Boolean);
}

async function auditar() {
  try {
    const archivo = path.join(
      __dirname,
      "..",
      "egresados-piloto-10-preview.json"
    );

    const piloto = JSON.parse(fs.readFileSync(archivo, "utf8"));

    if (!Array.isArray(piloto) || piloto.length !== 14) {
      throw new Error(
        `Se esperaban 14 registros. Encontrados: ${
          Array.isArray(piloto) ? piloto.length : "formato inválido"
        }.`
      );
    }

    const snapshot = await db.collection("egresados").get();
    const existentes = snapshot.docs.map(doc => doc.data());

    let conCoincidencias = 0;
    let sinCoincidencias = 0;

    console.log("\n=== AUDITORÍA DE SOLO LECTURA ===");
    console.log(`Registros del piloto: ${piloto.length}`);
    console.log(`Documentos existentes consultados: ${existentes.length}`);

    piloto.forEach((persona, indice) => {
      const cedula = normalizar(persona.cedula);
      const correos = extraerValores(persona, [
        "correo",
        "correos",
        "email"
      ]);

      const nombre = normalizar(
        `${persona.nombres ?? ""} ${persona.apellidos ?? ""}`
      );

      const coincidencias = [];

      if (cedula && existentes.some(doc =>
        extraerValores(doc, ["cedula", "documento"]).includes(cedula)
      )) {
        coincidencias.push("CÉDULA");
      }

      if (correos.length && existentes.some(doc =>
        extraerValores(doc, ["correo", "correos", "email"])
          .some(correo => correos.includes(correo))
      )) {
        coincidencias.push("CORREO");
      }

      if (nombre && existentes.some(doc =>
        normalizar(`${doc.nombres ?? ""} ${doc.apellidos ?? ""}`) === nombre
      )) {
        coincidencias.push("NOMBRE");
      }

      if (coincidencias.length) {
        conCoincidencias++;
        console.log(
          `Registro ${indice + 1}: REVISAR (${coincidencias.join(", ")})`
        );
      } else {
        sinCoincidencias++;
        console.log(`Registro ${indice + 1}: SIN COINCIDENCIAS`);
      }
    });

    console.log("\n=== RESUMEN ===");
    console.log(`Con posibles coincidencias: ${conCoincidencias}`);
    console.log(`Sin coincidencias detectadas: ${sinCoincidencias}`);
    console.log("No se modificó ningún documento ni usuario.");
  } catch (error) {
    console.error("\nAuditoría detenida:", error.message);
    process.exitCode = 1;
  }
}

auditar();
