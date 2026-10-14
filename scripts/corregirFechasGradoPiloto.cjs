// Reparación controlada de fechaGrado para documentos del piloto CONECTA-TEL.
// Por defecto SOLO SIMULA. Escribe en Firestore únicamente con --confirm.
// Requiere serviceAccountKey.json en la raíz y firebase-admin instalado.

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "..", "serviceAccountKey.json"));

if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const CONFIRMAR = process.argv.includes("--confirm");

function convertirSerialExcel(valor) {
  const serial = Number(String(valor ?? "").trim());

  // Solo repara valores que son claramente números de serie de Excel.
  if (!Number.isFinite(serial) || serial < 20000 || serial > 90000) return null;

  // Excel para Windows usa 1899-12-30 como origen de seriales.
  const milisegundos = Date.UTC(1899, 11, 30) + Math.round(serial * 86400000);
  const fecha = new Date(milisegundos);

  if (Number.isNaN(fecha.getTime())) return null;

  // Protección contra fechas fuera de un rango plausible para este conjunto.
  const anio = fecha.getUTCFullYear();
  if (anio < 1954 || anio > 2146) return null;

  return fecha;
}

async function ejecutar() {
  const snapshot = await db.collection("egresados")
    .where("esPiloto", "==", true)
    .get();

  if (snapshot.empty) throw new Error("No se encontraron documentos con esPiloto == true.");
  if (snapshot.size !== 14) {
    throw new Error(`Se esperaban 14 documentos del piloto, pero se encontraron ${snapshot.size}. No se modificó nada.`);
  }

  const cambios = [];
  const omitidos = [];

  for (const doc of snapshot.docs) {
    const valor = doc.get("fechaGrado");

    if (typeof valor !== "string" || !/^\d{4,6}(?:\.0+)?$/.test(valor.trim())) {
      omitidos.push({ id: doc.id, motivo: "No es un serial de Excel guardado como texto" });
      continue;
    }

    const fecha = convertirSerialExcel(valor);
    if (!fecha) {
      omitidos.push({ id: doc.id, motivo: "Serial fuera del rango permitido o inválido" });
      continue;
    }

    cambios.push({
      ref: doc.ref,
      id: doc.id,
      serial: valor,
      fecha,
      fechaISO: fecha.toISOString().slice(0, 10),
    });
  }

  console.log("\n=== REVISIÓN DE FECHAS DE GRADO DEL PILOTO ===");
  console.log("Modo:", CONFIRMAR ? "CONFIRMACIÓN" : "SIMULACIÓN (sin escrituras)");
  console.log("Documentos piloto:", snapshot.size);
  console.log("Fechas seriales que se convertirían:", cambios.length);
  console.log("Documentos omitidos sin cambios:", omitidos.length);

  for (const c of cambios) {
    console.log(`${c.id}: serial ${c.serial} -> ${c.fechaISO}`);
  }
  for (const o of omitidos) {
    console.log(`${o.id}: OMITIDO (${o.motivo})`);
  }

  if (!CONFIRMAR) {
    console.log("\nSIMULACIÓN terminada. No se modificó Firestore.");
    console.log("Revisa las fechas y, solo si corresponden al Excel original, ejecuta con --confirm.");
    return;
  }

  if (!cambios.length) {
    console.log("No hay cambios que aplicar.");
    return;
  }

  const batch = db.batch();
  for (const c of cambios) {
    // Actualiza únicamente fechaGrado; conserva todos los demás campos.
    batch.update(c.ref, { fechaGrado: Timestamp.fromDate(c.fecha) });
  }

  await batch.commit();
  console.log(`\nCorrección completada: ${cambios.length} campos fechaGrado actualizados a Timestamp.`);
  console.log("No se modificaron cuentas de Authentication, credenciales ni otros campos.");
}

ejecutar().catch(error => {
  console.error("Proceso detenido:", error.message);
  process.exitCode = 1;
});
