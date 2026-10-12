
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");

const serviceAccount = require(
  path.join(__dirname, "..", "serviceAccountKey.json")
);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const auth = getAuth();

async function verificar() {
  try {
    const piloto = await db.collection("egresados")
      .where("esPiloto", "==", true)
      .get();

    let conUid = 0;
    let conCuentaAuth = 0;
    let conCredencial = 0;
    let pendienteCambio = 0;
    let cambioCompletado = 0;
    let sinDocumentoCredencial = 0;
    let errores = 0;

    for (const documento of piloto.docs) {
      const datos = documento.data();

      if (!datos.uid) {
        errores++;
        continue;
      }

      conUid++;

      try {
        const usuario = await auth.getUser(datos.uid);
        conCuentaAuth++;

        const accesoSnap = await db.collection("credencialesAcceso")
          .doc(datos.uid)
          .get();

        if (!accesoSnap.exists) {
          sinDocumentoCredencial++;
          continue;
        }

        conCredencial++;
        const acceso = accesoSnap.data();

        if (
          acceso.estado === "pendienteCambioPassword" &&
          acceso.passwordTemporalCifrada
        ) {
          pendienteCambio++;
        }

        if (acceso.cambioCompletadoEn) {
          cambioCompletado++;
        }

        if (
          !usuario.customClaims ||
          usuario.customClaims.conectaTelRole !== "egresado"
        ) {
          errores++;
        }
      } catch {
        errores++;
      }
    }

    console.log("\n=== ESTADO DE CREDENCIALES DEL PILOTO ===");
    console.log("Registros piloto:", piloto.size);
    console.log("Documentos con UID:", conUid);
    console.log("Cuentas Auth encontradas:", conCuentaAuth);
    console.log("Documentos de credenciales encontrados:", conCredencial);
    console.log("Pendientes de cambio con contraseña cifrada:", pendienteCambio);
    console.log("Cambios de contraseña registrados:", cambioCompletado);
    console.log("Sin documento de credenciales:", sinDocumentoCredencial);
    console.log("Inconsistencias detectadas:", errores);
    console.log("Auditoría de solo lectura; no se modificó nada.");
  } catch (error) {
    console.error("Error en la verificación:", error.message);
    process.exitCode = 1;
  }
}

verificar();
