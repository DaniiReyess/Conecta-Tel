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

async function crearEgresadoPrueba() {
  try {
    console.log("\n========================================");
    console.log("   CREANDO EGRESADO DE PRUEBA");
    console.log("========================================\n");

    const egresadoPrueba = {
      cedula: "PRUEBA-001",

      nombres: "Daniela",

      apellidos: "Reyes Prueba",

      fechaGrado: "2025-06-06",

      sexoBiologico: "femenino",

      nivelFormacion: "Pregrado",

      telefonos: [
        "3000000000"
      ],

      correos: [
        "egresado.prueba@conecta-tel.test"
      ],

      linkedinUrl:
        "https://www.linkedin.com/in/egresado-prueba",

      direccionResidencia:
        "Bucaramanga, Santander",

      empresaActual:
        "Empresa Tecnológica de Prueba",

      ciudadTrabajo:
        "Bucaramanga",

      cargoActual:
        "Ingeniera de Telecomunicaciones",

      tipoEmpresa:
        "Privada",

      descripcionProfesional:
        "Ingeniera de Telecomunicaciones con experiencia en redes, infraestructura tecnológica, administración de servidores y servicios de conectividad.",

      facebookUrl: "",

      fechaActualizacion: null,

      esPrueba: true,

      estado: "activo",

      fechaRegistro: new Date().toISOString(),
    };

    const referencia = await db
      .collection("egresados")
      .add(egresadoPrueba);

    console.log("✓ Egresado de prueba creado correctamente.");
    console.log(`✓ ID de Firestore: ${referencia.id}`);

    console.log("\nDatos creados:");
    console.log(`Nombre: ${egresadoPrueba.nombres} ${egresadoPrueba.apellidos}`);
    console.log(`Empresa: ${egresadoPrueba.empresaActual}`);
    console.log(`Ciudad: ${egresadoPrueba.ciudadTrabajo}`);
    console.log(`Es prueba: ${egresadoPrueba.esPrueba}`);

    console.log("\n========================================");
    console.log("   CREACIÓN COMPLETADA");
    console.log("========================================\n");

  } catch (error) {
    console.error("\n✗ ERROR:");
    console.error(error.message);
  }
}

crearEgresadoPrueba();