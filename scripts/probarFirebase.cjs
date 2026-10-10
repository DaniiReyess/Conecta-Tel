const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");

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

async function probarConexion() {
  try {
    console.log("\n========================================");
    console.log("   PRUEBA DE CONEXIÓN CON FIRESTORE");
    console.log("========================================\n");

    const snapshot = await db
      .collection("egresados")
      .limit(1)
      .get();

    console.log("✓ Conexión con Firebase correcta.");
    console.log("✓ Firestore respondió correctamente.");
    console.log(
      `✓ Documentos encontrados actualmente: ${snapshot.size}`
    );

    console.log("\n========================================");
    console.log("   PRUEBA COMPLETADA");
    console.log("========================================\n");

  } catch (error) {
    console.error("\n✗ ERROR DE CONEXIÓN:");
    console.error(error.message);
  }
}

probarConexion();