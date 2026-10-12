
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const archivoExcel = path.join(
  __dirname,
  "..",
  "egresados-piloto-10.xlsx"
);

const archivoSalida = path.join(
  __dirname,
  "..",
  "egresados-piloto-10-preview.json"
);

function texto(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

function normalizarCorreo(valor) {
  return texto(valor).toLowerCase();
}

function separarCorreos(valor) {
  return texto(valor)
    .split(/[\n;,]+|\s+(?=[^\s@]+@[^\s@]+\.[^\s@]+)/)
    .map(normalizarCorreo)
    .filter(Boolean);
}

function separarTelefonos(valor) {
  return texto(valor)
    .split(/\s*-\s*/)
    .map(texto)
    .filter(Boolean);
}

function normalizarFecha(valor) {
  if (!valor) return null;

  if (valor instanceof Date && !isNaN(valor)) {
    return valor.toISOString().slice(0, 10);
  }

  const fecha = texto(valor);
  const coincidencia = fecha.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (coincidencia) {
    const [, dia, mes, anio] = coincidencia;
    return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  return fecha;
}

try {
  if (!fs.existsSync(archivoExcel)) {
    throw new Error(
      "No existe egresados-piloto-10.xlsx en la carpeta raíz."
    );
  }

  const libro = XLSX.readFile(archivoExcel);
  const hoja = libro.Sheets[libro.SheetNames[0]];

  const registros = XLSX.utils.sheet_to_json(hoja, {
    defval: "",
  });

  if (registros.length !== 14) {
    throw new Error(
      `Se esperaban exactamente 14 registros; se encontraron ${registros.length}.`
    );
  }

  const egresados = registros.map((registro, indice) => ({
    cedula: texto(registro.cedula),
    nombres: texto(registro.nombres),
    apellidos: texto(registro.apellidos),
    fechaGrado: normalizarFecha(registro.fechaGrado),
    sexoBiologico: texto(registro.sexoBiologico),
    nivelFormacion: texto(registro.nivelFormacion),
    telefonos: separarTelefonos(registro.celular),
    correos: separarCorreos(registro.correo),
    linkedinUrl: texto(registro.linkedinUrl),
    direccionResidencia: texto(registro.direccionResidencia),
    empresaActual: texto(registro.empresaActual),
    ciudadTrabajo: texto(registro.ciudadTrabajo),
    cargoActual: texto(registro.cargoActual),
    tipoEmpresa: texto(registro.tipoEmpresa),
    descripcionProfesional: texto(registro.descripcionProfesional),
    facebookUrl: texto(registro.facebookUrl),
    fechaActualizacion: null,
    esPiloto: true,
  }));


const errores = [];
const cedulasVistas = new Set();
const correosVistos = new Set();

egresados.forEach((egresado, indice) => {
  const fila = indice + 2;

  // Los nombres son necesarios para identificar al participante.
  if (!egresado.nombres || !egresado.apellidos) {
    errores.push(`Fila ${fila}: faltan nombres o apellidos.`);
  }

  // La cédula puede estar vacía; si existe, no debe repetirse.
  const cedula = texto(egresado.cedula);

  if (cedula) {
    if (cedulasVistas.has(cedula)) {
      errores.push(`Fila ${fila}: cédula duplicada dentro del piloto.`);
    } else {
      cedulasVistas.add(cedula);
    }
  }

  // El correo puede estar vacío; si existe, comprobamos duplicados.
  for (const correo of egresado.correos) {
    const correoNormalizado = normalizarCorreo(correo);

    if (correosVistos.has(correoNormalizado)) {
      errores.push(`Fila ${fila}: correo duplicado dentro del piloto.`);
    } else {
      correosVistos.add(correoNormalizado);
    }
  }
});

if (errores.length > 0) {
  console.error("REVISAR LOS REGISTROS:");
  errores.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  fs.writeFileSync(
    archivoSalida,
    JSON.stringify(egresados, null, 2),
    "utf8"
  );

  console.log("Vista previa generada correctamente.");
  console.log(`Registros preparados: ${egresados.length}`);
  console.log(`Archivo: ${archivoSalida}`);
  console.log("Los campos vacíos se conservarán para completar durante el piloto.");
  console.log("No se ha escrito nada en Firestore ni en Authentication.");
}

} catch (error) {
  console.error("No se pudo preparar el piloto:", error.message);
  process.exitCode = 1;
}
