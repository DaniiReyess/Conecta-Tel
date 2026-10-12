
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const serviceAccount = require(
  path.join(__dirname, "..", "serviceAccountKey.json")
);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const archivo = path.join(
  __dirname,
  "..",
  "egresados-piloto-10-preview.json"
);

function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function valores(datos, campos) {
  return campos.flatMap(campo => {
    const valor = datos?.[campo];
    return Array.isArray(valor) ? valor : [valor];
  }).filter(v => v !== null && v !== undefined)
    .map(normalizar)
    .filter(Boolean);
}

async function ejecutar() {
  const confirmar = process.argv.includes("--confirm");

  try {
    if (!fs.existsSync(archivo)) {
      throw new Error("No se encontró el archivo de vista previa del piloto.");
    }

    const piloto = JSON.parse(fs.readFileSync(archivo, "utf8"));

    if (!Array.isArray(piloto) || piloto.length !== 14) {
      throw new Error("El archivo debe contener exactamente 14 registros.");
    }

    for (let i = 0; i < piloto.length; i++) {
      const p = piloto[i];
      if (!normalizar(p.nombres) || !normalizar(p.apellidos)) {
        throw new Error(`El registro ${i + 1} no tiene nombres y apellidos.`);
      }
      if (!Array.isArray(p.correos) || !Array.isArray(p.telefonos)) {
        throw new Error(`El registro ${i + 1} tiene un formato inesperado.`);
      }
    }

    const snapshot = await db.collection("egresados").get();
    const existentes = snapshot.docs.map(doc => doc.data());
    const conflictos = [];

    piloto.forEach((p, i) => {
      const cedula = normalizar(p.cedula);
      const correos = valores(p, ["correos"]);
      const nombre = normalizar(`${p.nombres} ${p.apellidos}`);

      existentes.forEach(e => {
        const mismoNombre = nombre === normalizar(
          `${e.nombres ?? ""} ${e.apellidos ?? ""}`
        );
        const mismaCedula = cedula &&
          valores(e, ["cedula"]).includes(cedula);
        const mismosCorreos = correos.length > 0 &&
          valores(e, ["correos", "correo", "email"])
            .some(c => correos.includes(c));

        if (mismoNombre || mismaCedula || mismosCorreos) {
          const motivos = [];
          if (mismoNombre) motivos.push("nombre");
          if (mismaCedula) motivos.push("cédula");
          if (mismosCorreos) motivos.push("correo");
          conflictos.push({
            registro: i + 1,
            motivos: motivos.join(", ")
          });
        }
      });
    });

    console.log("\n=== IMPORTACIÓN DE PILOTO ===");
    console.log("Modo:", confirmar ? "CONFIRMACIÓN" : "SIMULACIÓN");
    console.log("Registros preparados:", piloto.length);
    console.log("Documentos existentes consultados:", existentes.length);
    console.log("Posibles conflictos:", conflictos.length);

    if (conflictos.length) {
      conflictos.forEach(c =>
        console.log(`Registro ${c.registro}: revisar coincidencia por ${c.motivos}`)
      );
      throw new Error(
        "Importación detenida para revisar coincidencias. No se escribieron documentos."
      );
    }

    if (!confirmar) {
      console.log("\nSIMULACIÓN CORRECTA. No se modificó Firestore.");
      console.log("Si el resultado es correcto, el siguiente comando permitirá importar.");
      return;
    }

    const coleccion = db.collection("egresados");
    const lote = db.batch();
    const fechaRegistro = new Date().toISOString();

    piloto.forEach(p => {

        const identidad = [
        normalizar(p.cedula),
        normalizar(p.nombres),
        normalizar(p.apellidos),
        normalizar(p.fechaGrado)
        ].join("|");

        const idPiloto = "piloto_" + crypto
        .createHash("sha256")
        .update(identidad)
        .digest("hex")
        .slice(0, 24);

        const ref = coleccion.doc(idPiloto);

      lote.create(ref, {
        cedula: String(p.cedula ?? "").trim(),
        nombres: String(p.nombres ?? "").trim(),
        apellidos: String(p.apellidos ?? "").trim(),
        fechaGrado: p.fechaGrado || null,
        sexoBiologico: p.sexoBiologico || "",
        nivelFormacion: p.nivelFormacion || "",
        telefonos: p.telefonos || [],
        correos: p.correos || [],
        linkedinUrl: p.linkedinUrl || "",
        direccionResidencia: p.direccionResidencia || "",
        empresaActual: p.empresaActual || "",
        ciudadTrabajo: p.ciudadTrabajo || "",
        cargoActual: p.cargoActual || "",
        tipoEmpresa: p.tipoEmpresa || "",
        descripcionProfesional: p.descripcionProfesional || "",
        facebookUrl: p.facebookUrl || "",
        fechaActualizacion: null,
        fechaRegistro,
        esPiloto: true,
        estado: "pendiente"
      });
    });

    await lote.commit();

    console.log("Importación completada: 14 documentos creados.");
    console.log("No se crearon cuentas de Authentication ni contraseñas.");
  } catch (error) {
    console.error("\nProceso detenido:", error.message);
    process.exitCode = 1;
  }
}

ejecutar();
