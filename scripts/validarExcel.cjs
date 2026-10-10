const XLSX = require("xlsx");
const path = require("path");

const archivoExcel = path.join(
  __dirname,
  "..",
  "conecta-tel-graduados.xlsx"
);

try {
  console.log("\n========================================");
  console.log("   VALIDACIÓN DE CALIDAD - CONECTA-TEL");
  console.log("========================================\n");

  const libro = XLSX.readFile(archivoExcel);
  const nombreHoja = libro.SheetNames[0];
  const hoja = libro.Sheets[nombreHoja];

  const registros = XLSX.utils.sheet_to_json(hoja, {
    defval: "",
  });

  console.log(`Registros analizados: ${registros.length}`);

  // --------------------------------------------------
  // 1. CORREOS
  // --------------------------------------------------

  console.log("\n----------------------------------------");
  console.log("CORREOS");
  console.log("----------------------------------------");

  const correosInvalidos = [];

  registros.forEach((registro, index) => {
    const correo = String(registro.correo || "").trim();

    if (
      correo !== "" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      correosInvalidos.push({
        fila: index + 2,
        nombre: `${registro.nombres} ${registro.apellidos}`,
        correo,
      });
    }
  });

  if (correosInvalidos.length === 0) {
    console.log("✓ No se encontraron correos con formato inválido.");
  } else {
    console.log(`⚠ Correos inválidos: ${correosInvalidos.length}`);

    correosInvalidos.forEach((registro) => {
      console.log(
        `Fila ${registro.fila} | ${registro.nombre} | ${registro.correo}`
      );
    });
  }

  // --------------------------------------------------
  // 2. TELÉFONOS
  // --------------------------------------------------

  console.log("\n----------------------------------------");
  console.log("TELÉFONOS");
  console.log("----------------------------------------");

  const telefonosSospechosos = [];

  registros.forEach((registro, index) => {
    const celular = String(registro.celular || "")
      .trim()
      .replace(/\s/g, "");

    if (celular !== "" && !/^\d+$/.test(celular)) {
      telefonosSospechosos.push({
        fila: index + 2,
        nombre: `${registro.nombres} ${registro.apellidos}`,
        celular,
      });
    }
  });

  if (telefonosSospechosos.length === 0) {
    console.log("✓ No se encontraron teléfonos con caracteres extraños.");
  } else {
    console.log(
      `⚠ Teléfonos que requieren revisión: ${telefonosSospechosos.length}`
    );

    telefonosSospechosos.forEach((registro) => {
      console.log(
        `Fila ${registro.fila} | ${registro.nombre} | ${registro.celular}`
      );
    });
  }

  // --------------------------------------------------
  // 3. FECHAS DE GRADO
  // --------------------------------------------------

  console.log("\n----------------------------------------");
  console.log("FECHAS DE GRADO");
  console.log("----------------------------------------");

  const fechasVacias = [];
  const fechasSospechosas = [];

  registros.forEach((registro, index) => {
    const fecha = registro.fechaGrado;

    if (fecha === "" || fecha === null || fecha === undefined) {
      fechasVacias.push({
        fila: index + 2,
        nombre: `${registro.nombres} ${registro.apellidos}`,
      });
    }
  });

  console.log(`Fechas de grado vacías: ${fechasVacias.length}`);

  if (fechasVacias.length > 0) {
    fechasVacias.forEach((registro) => {
      console.log(
        `Fila ${registro.fila} | ${registro.nombre}`
      );
    });
  }

  // --------------------------------------------------
  // 4. NOMBRES DUPLICADOS
  // --------------------------------------------------

  console.log("\n----------------------------------------");
  console.log("POSIBLES DUPLICADOS POR NOMBRE");
  console.log("----------------------------------------");

  const nombresMap = new Map();

  registros.forEach((registro, index) => {
    const nombreCompleto = `${registro.nombres} ${registro.apellidos}`
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");

    if (!nombresMap.has(nombreCompleto)) {
      nombresMap.set(nombreCompleto, []);
    }

    nombresMap.get(nombreCompleto).push(index + 2);
  });

  const duplicadosNombre = [...nombresMap.entries()].filter(
    ([, filas]) => filas.length > 1
  );

  if (duplicadosNombre.length === 0) {
    console.log("✓ No hay nombres completos repetidos.");
  } else {
    console.log(
      `⚠ Se encontraron ${duplicadosNombre.length} posibles duplicados:`
    );

    duplicadosNombre.forEach(([nombre, filas]) => {
      console.log(`- ${nombre} → filas ${filas.join(", ")}`);
    });
  }

  // --------------------------------------------------
  // 5. RESUMEN
  // --------------------------------------------------

  console.log("\n========================================");
  console.log("RESUMEN DE VALIDACIÓN");
  console.log("========================================");

  console.log(`Total de egresados: ${registros.length}`);
  console.log(`Correos inválidos: ${correosInvalidos.length}`);
  console.log(`Teléfonos sospechosos: ${telefonosSospechosos.length}`);
  console.log(`Fechas de grado vacías: ${fechasVacias.length}`);
  console.log(`Posibles duplicados por nombre: ${duplicadosNombre.length}`);

  console.log("\n✓ VALIDACIÓN FINALIZADA");
  console.log("========================================\n");

} catch (error) {
  console.error("\n✗ ERROR:");
  console.error(error.message);
}