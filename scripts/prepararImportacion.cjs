const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const archivoExcel = path.join(
  __dirname,
  "..",
  "conecta-tel-graduados.xlsx"
);

const archivoSalida = path.join(
  __dirname,
  "..",
  "egresados-importacion.json"
);

// --------------------------------------------------
// FUNCIONES DE NORMALIZACIÓN
// --------------------------------------------------

function texto(valor) {
  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor).trim();
}

function separarCorreos(valor) {
  const contenido = texto(valor);

  if (!contenido) {
    return [];
  }

  return contenido
    .split(/[\n;,]+|\s+(?=[^\s@]+@[^\s@]+\.[^\s@]+)/)
    .map((correo) => correo.trim())
    .filter(Boolean);
}

function separarTelefonos(valor) {
  const contenido = texto(valor);

  if (!contenido) {
    return [];
  }

  // Separamos únicamente cuando claramente hay dos números
  // unidos por un guion.
  const partes = contenido.split(/\s*-\s*/);

  return partes
    .map((telefono) => telefono.trim())
    .filter(Boolean);
}

function normalizarFecha(valor) {
  if (!valor) {
    return null;
  }

  // Si Excel entrega un objeto Date
  if (valor instanceof Date && !isNaN(valor)) {
    return valor.toISOString().split("T")[0];
  }

  const fecha = texto(valor);

  // Formato DD/MM/YYYY
  const coincidencia = fecha.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (coincidencia) {
    const [, dia, mes, anio] = coincidencia;

    return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(
      2,
      "0"
    )}`;
  }

  return fecha;
}

// --------------------------------------------------
// LECTURA DEL EXCEL
// --------------------------------------------------

try {
  console.log("\n========================================");
  console.log(" PREPARACIÓN DE IMPORTACIÓN - CONECTA-TEL");
  console.log("========================================\n");

  const libro = XLSX.readFile(archivoExcel);
  const nombreHoja = libro.SheetNames[0];
  const hoja = libro.Sheets[nombreHoja];

  const registros = XLSX.utils.sheet_to_json(hoja, {
    defval: "",
  });

  console.log(`Registros originales: ${registros.length}`);

  // --------------------------------------------------
  // TRANSFORMACIÓN
  // --------------------------------------------------

  const egresados = registros.map((registro) => {
    return {
      cedula: texto(registro.cedula),

      nombres: texto(registro.nombres),

      apellidos: texto(registro.apellidos),

      fechaGrado: normalizarFecha(registro.fechaGrado),

      sexoBiologico: texto(registro.sexoBiologico),

      nivelFormacion: texto(registro.nivelFormacion),

      telefonos: separarTelefonos(registro.celular),

      correos: separarCorreos(registro.correo),

      linkedinUrl: texto(registro.linkedinUrl),

      direccionResidencia: texto(
        registro.direccionResidencia
      ),

      empresaActual: texto(registro.empresaActual),

      ciudadTrabajo: texto(registro.ciudadTrabajo),

      cargoActual: texto(registro.cargoActual),

      tipoEmpresa: texto(registro.tipoEmpresa),

      descripcionProfesional: texto(
        registro.descripcionProfesional
      ),

      facebookUrl: texto(registro.facebookUrl),

      fechaActualizacion: null,
    };
  });

  // --------------------------------------------------
  // ESTADÍSTICAS
  // --------------------------------------------------

  const totalTelefonos = egresados.reduce(
    (total, egresado) => total + egresado.telefonos.length,
    0
  );

  const totalCorreos = egresados.reduce(
    (total, egresado) => total + egresado.correos.length,
    0
  );

  const fechasGrado = egresados.filter(
    (egresado) => egresado.fechaGrado !== null
  ).length;

  // --------------------------------------------------
  // GUARDAR JSON
  // --------------------------------------------------

  fs.writeFileSync(
    archivoSalida,
    JSON.stringify(egresados, null, 2),
    "utf-8"
  );

  // --------------------------------------------------
  // RESULTADO
  // --------------------------------------------------

  console.log("\n----------------------------------------");
  console.log("RESULTADO");
  console.log("----------------------------------------");

  console.log(`Egresados procesados: ${egresados.length}`);
  console.log(`Teléfonos registrados: ${totalTelefonos}`);
  console.log(`Correos registrados: ${totalCorreos}`);
  console.log(`Fechas de grado disponibles: ${fechasGrado}`);
  console.log(
    `Fechas de grado vacías: ${
      egresados.length - fechasGrado
    }`
  );

  console.log("\n✓ Archivo generado:");

  console.log(
    "egresados-importacion.json"
  );

  console.log("\n========================================");
  console.log(" PREPARACIÓN COMPLETADA");
  console.log("========================================\n");

} catch (error) {
  console.error("\n✗ ERROR:");
  console.error(error.message);
}