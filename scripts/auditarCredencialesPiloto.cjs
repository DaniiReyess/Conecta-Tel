
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

async function auditar() {
  try {
    const pilotoSnap = await db
      .collection("egresados")
      .where("esPiloto", "==", true)
      .get();

    const contadorSnap = await db
      .collection("configuracion")
      .doc("contadorCredenciales")
      .get();

    const contador = contadorSnap.exists
      ? Number(contadorSnap.data().ultimoNumero || 0)
      : 0;

    const usuarios = [];
    let token = undefined;

    do {
      const pagina = await auth.listUsers(1000, token);
      usuarios.push(...pagina.users);
      token = pagina.pageToken;
    } while (token);

    const codigosExistentes = new Set();
    const codigosDuplicados = [];

    const egresadosSnap = await db.collection("egresados").get();

    for (const doc of egresadosSnap.docs) {
      const codigo = doc.data().codigoAcceso;
      if (!codigo) continue;

      const normalizado = String(codigo).toUpperCase();

      if (codigosExistentes.has(normalizado)) {
        codigosDuplicados.push(normalizado);
      }

      codigosExistentes.add(normalizado);
    }

    const codigosPropuestos = Array.from(
      { length: pilotoSnap.size },
      (_, i) => `E-${contador + i + 1}`
    );

    const correosPropuestos = new Set(
      codigosPropuestos.map(
        codigo =>
          `ct-${codigo.toLowerCase().replace(/[^a-z0-9]/g, "")}@conecta-tel.firebaseapp.com`
      )
    );

    const cuentasCoincidentes = usuarios.filter(
      usuario =>
        usuario.email &&
        correosPropuestos.has(usuario.email.toLowerCase())
    );

    const documentosConUid = pilotoSnap.docs.filter(
      doc => Boolean(doc.data().uid)
    ).length;

    console.log("\n=== AUDITORÍA DE SOLO LECTURA ===");
    console.log("Registros piloto:", pilotoSnap.size);
    console.log("Registros piloto con UID:", documentosConUid);
    console.log("Contador actual:", contador);
    console.log("Códigos propuestos:", codigosPropuestos.length);
    console.log("Códigos ya presentes en egresados:", 
      codigosPropuestos.filter(c => codigosExistentes.has(c)).length);
    console.log("Códigos duplicados en egresados:", codigosDuplicados.length);
    console.log("Cuentas de Authentication coincidentes:", cuentasCoincidentes.length);

    if (cuentasCoincidentes.length) {
      console.log(
        "Hay cuentas coincidentes. No se muestran correos ni datos personales."
      );
    }

    console.log("\nNo se modificaron datos ni cuentas.");
  } catch (error) {
    console.error("Error en la auditoría:", error.message);
    process.exitCode = 1;
  }
}

auditar();
