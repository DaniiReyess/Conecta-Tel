import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import { db } from "./firebase";
import "./MetricasIndicadoresAdmin.css";

const COLORS = [
  "#168dff",
  "#36a9e1",
  "#65d4ff",
  "#28c7a0",
  "#7a8cff",
  "#5cc8ff",
];

const normalize = (value) =>
  typeof value === "string" ? value.trim() : "";

const getYear = (value) => {
  if (!value) return "";

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime())
      ? ""
      : String(date.getFullYear());
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ""
      : String(value.getFullYear());
  }

  if (typeof value === "string") {
    const match = value.match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : "";
  }

  if (typeof value === "number") {
    return String(value).slice(0, 4);
  }

  return "";
};

const toList = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => toList(item))
      .filter(Boolean);
  }

  if (typeof value !== "string") return [];

  return value
    .split(/[,;\n|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const countBy = (items, getValue) => {
  const map = {};

  items.forEach((item) => {
    const value = normalize(getValue(item));

    if (!value) return;

    map[value] = (map[value] || 0) + 1;
  });

  return Object.entries(map)
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
};

const countListBy = (items, getValue) => {
  const map = {};

  items.forEach((item) => {
    toList(getValue(item)).forEach((value) => {
      map[value] = (map[value] || 0) + 1;
    });
  });

  return Object.entries(map)
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
};

function MetricTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="metric-tooltip">
      <strong>{label || payload[0].name}</strong>
      <span>{payload[0].value}</span>
      <small>registros</small>
    </div>
  );
}

function EmptyChart({ text = "No hay información suficiente." }) {
  return (
    <div className="metric-empty">
      <div className="metric-empty-icon">0</div>
      <strong>{text}</strong>
      <span>El indicador se actualizará automáticamente.</span>
    </div>
  );
}

function MetricasIndicadoresAdmin() {
  const [datos, setDatos] = useState({
    egresados: [],
    trayectorias: [],
    respuestas: [],
    encuestas: [],
    preguntas: {},
    clasificacionesIA: [],
  });

  const [filtros, setFiltros] = useState({
    ciudad: "",
    empresa: "",
    cargo: "",
    sector: "",
    formacion: "",
    tipoEmpresa: "",
    anio: "",
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError("");

        const egresadosSnapshot = await getDocs(
          collection(db, "egresados")
        );

        const egresados = egresadosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const trayectorias = [];

        for (const egresado of egresados) {
          const snapshot = await getDocs(
            collection(
              db,
              "egresados",
              egresado.id,
              "trayectoriaLaboral"
            )
          );

          snapshot.forEach((doc) => {
            trayectorias.push({
              id: doc.id,
              egresadoId: egresado.id,
              egresadoNombre:
                `${egresado.nombres || ""} ${
                  egresado.apellidos || ""
                }`.trim(),
              ...doc.data(),
            });
          });
        }

        const clasificacionesIASnapshot = await getDocs(
          collection(db, "clasificacionesIA")
        );

        const clasificacionesIA = clasificacionesIASnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const respuestasSnapshot = await getDocs(
          collection(db, "respuestasEncuestas")
        );

        const respuestas = respuestasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const encuestasSnapshot = await getDocs(
          collection(db, "encuestas")
        );

        const encuestas = [];
        const preguntas = {};

        for (const encuestaDoc of encuestasSnapshot.docs) {
          encuestas.push({
            id: encuestaDoc.id,
            ...encuestaDoc.data(),
          });

          const preguntasSnapshot = await getDocs(
            collection(
              db,
              "encuestas",
              encuestaDoc.id,
              "preguntas"
            )
          );

          preguntas[encuestaDoc.id] =
            preguntasSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
        }

        setDatos({
          egresados,
          trayectorias,
          respuestas,
          encuestas,
          preguntas,
          clasificacionesIA,
        });
      } catch (err) {
        console.error(
          "Error cargando métricas administrativas:",
          err
        );

        setError(
          "No fue posible cargar las métricas e indicadores."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const opcionesFiltros = useMemo(() => {
    const ciudades = countBy(
      datos.egresados,
      (item) => item.ciudadTrabajo
    );

    const empresas = countBy(
      datos.egresados,
      (item) => item.empresaActual
    );

    const cargos = countBy(
      datos.egresados,
      (item) => item.cargoActual
    );

    const formaciones = countBy(
      datos.egresados,
      (item) => item.nivelFormacion
    );

    const tipos = countBy(
      datos.egresados,
      (item) => item.tipoEmpresa
    );

    const sectores = countBy(
      datos.trayectorias,
      (item) => item.sectorLaboral
    );

    const anios = countBy(
      datos.egresados,
      (item) => getYear(item.fechaGrado)
    )
      .filter((item) => item.nombre)
      .sort(
        (a, b) =>
          Number(a.nombre) - Number(b.nombre)
      );

    return {
      ciudades,
      empresas,
      cargos,
      formaciones,
      tipos,
      sectores,
      anios,
    };
  }, [datos]);

  const egresadosFiltrados = useMemo(() => {
    return datos.egresados.filter((egresado) => {
      const ciudad = normalize(egresado.ciudadTrabajo);
      const empresa = normalize(egresado.empresaActual);
      const cargo = normalize(egresado.cargoActual);
      const formacion = normalize(egresado.nivelFormacion);
      const tipoEmpresa = normalize(egresado.tipoEmpresa);
      const anio = getYear(egresado.fechaGrado);

      const trayectoriaEgresado = datos.trayectorias.filter(
        (item) => item.egresadoId === egresado.id
      );

      const coincideSector =
        !filtros.sector ||
        trayectoriaEgresado.some(
          (item) =>
            normalize(item.sectorLaboral) === filtros.sector
        );

      return (
        (!filtros.ciudad || ciudad === filtros.ciudad) &&
        (!filtros.empresa || empresa === filtros.empresa) &&
        (!filtros.cargo || cargo === filtros.cargo) &&
        (!filtros.formacion || formacion === filtros.formacion) &&
        (!filtros.tipoEmpresa ||
          tipoEmpresa === filtros.tipoEmpresa) &&
        (!filtros.anio || anio === filtros.anio) &&
        coincideSector
      );
    });
  }, [datos, filtros]);

  const idsFiltrados = useMemo(
    () => new Set(egresadosFiltrados.map((item) => item.id)),
    [egresadosFiltrados]
  );

  const trayectoriasFiltradas = useMemo(
    () =>
      datos.trayectorias.filter((item) =>
        idsFiltrados.has(item.egresadoId)
      ),
    [datos.trayectorias, idsFiltrados]
  );

  const respuestasFiltradas = useMemo(
    () =>
      datos.respuestas.filter((respuesta) =>
        idsFiltrados.has(respuesta.egresadoId)
      ),
    [datos.respuestas, idsFiltrados]
  );

  // Las clasificaciones IA se relacionan con el egresado por su ID.
  // Se mantienen separadas de las tecnologías/competencias declaradas
  // en las trayectorias laborales para no mezclar fuentes de información.
  const clasificacionesFiltradas = useMemo(
    () =>
      datos.clasificacionesIA.filter((item) =>
        idsFiltrados.has(item.egresadoId || item.id)
      ),
    [datos.clasificacionesIA, idsFiltrados]
  );

  const indicadoresIA = useMemo(() => {
    const total = clasificacionesFiltradas.length;
    const aprobadas = clasificacionesFiltradas.filter(
      (item) => normalize(item.estadoRevision).toLowerCase() === "aprobada"
    ).length;
    const pendientes = clasificacionesFiltradas.filter(
      (item) => {
        const estado = normalize(item.estadoRevision).toLowerCase();
        return !estado || estado === "pendiente";
      }
    ).length;
    const rechazadas = clasificacionesFiltradas.filter(
      (item) => normalize(item.estadoRevision).toLowerCase() === "rechazada"
    ).length;
    const generadasPorIA = clasificacionesFiltradas.filter(
      (item) => item.generadoPorIA === true
    ).length;

    return { total, aprobadas, pendientes, rechazadas, generadasPorIA };
  }, [clasificacionesFiltradas]);

  const areasIAData = useMemo(
    () => countBy(clasificacionesFiltradas, (item) => item.areaProfesional).slice(0, 8),
    [clasificacionesFiltradas]
  );

  const especialidadesIAData = useMemo(
    () => countBy(clasificacionesFiltradas, (item) => item.especialidad).slice(0, 8),
    [clasificacionesFiltradas]
  );

  const sectoresIAData = useMemo(
    () => countBy(clasificacionesFiltradas, (item) => item.sector).slice(0, 8),
    [clasificacionesFiltradas]
  );

  const cargosIAData = useMemo(
    () => countBy(clasificacionesFiltradas, (item) => item.cargoPrincipal).slice(0, 8),
    [clasificacionesFiltradas]
  );

  const tecnologiasIAData = useMemo(
    () => countListBy(clasificacionesFiltradas, (item) => item.tecnologias).slice(0, 12),
    [clasificacionesFiltradas]
  );

  const palabrasClaveIAData = useMemo(
    () => countListBy(clasificacionesFiltradas, (item) => item.palabrasClave).slice(0, 16),
    [clasificacionesFiltradas]
  );

  const indicadores = useMemo(() => {
    const total = egresadosFiltrados.length;

    const conEmpresa = egresadosFiltrados.filter(
      (item) => normalize(item.empresaActual)
    ).length;

    const conCiudad = egresadosFiltrados.filter(
      (item) => normalize(item.ciudadTrabajo)
    ).length;

    const actualizados = egresadosFiltrados.filter(
      (item) => item.fechaActualizacion
    ).length;

    const conTrayectoria = new Set(
      trayectoriasFiltradas.map(
        (item) => item.egresadoId
      )
    ).size;

    const empresas = new Set(
      egresadosFiltrados
        .map((item) => normalize(item.empresaActual).toLowerCase())
        .filter(Boolean)
    );

    const ciudades = new Set(
      egresadosFiltrados
        .map((item) => normalize(item.ciudadTrabajo).toLowerCase())
        .filter(Boolean)
    );

    const promedioTrayectorias =
      total > 0
        ? (
            trayectoriasFiltradas.length / total
          ).toFixed(1)
        : "0.0";

    return {
      total,
      conEmpresa,
      conCiudad,
      actualizados,
      conTrayectoria,
      empresas: empresas.size,
      ciudades: ciudades.size,
      respuestas: respuestasFiltradas.length,
      promedioTrayectorias,
    };
  }, [
    egresadosFiltrados,
    trayectoriasFiltradas,
    respuestasFiltradas,
  ]);

  const formacionData = useMemo(
    () =>
      countBy(
        egresadosFiltrados,
        (item) => item.nivelFormacion
      ),
    [egresadosFiltrados]
  );

  const ciudadesData = useMemo(
    () =>
      countBy(
        egresadosFiltrados,
        (item) => item.ciudadTrabajo
      ).slice(0, 8),
    [egresadosFiltrados]
  );

  const sectoresData = useMemo(
    () =>
      countBy(
        trayectoriasFiltradas,
        (item) => item.sectorLaboral
      ).slice(0, 8),
    [trayectoriasFiltradas]
  );

  const empresasData = useMemo(
    () =>
      countBy(
        egresadosFiltrados,
        (item) => item.empresaActual
      ).slice(0, 8),
    [egresadosFiltrados]
  );

  const tecnologiasData = useMemo(
    () =>
      countListBy(
        trayectoriasFiltradas,
        (item) => item.tecnologias
      ).slice(0, 8),
    [trayectoriasFiltradas]
  );

  const competenciasData = useMemo(
    () =>
      countListBy(
        trayectoriasFiltradas,
        (item) => item.competencias
      ).slice(0, 8),
    [trayectoriasFiltradas]
  );

  const graduacionesData = useMemo(
    () =>
      countBy(
        egresadosFiltrados,
        (item) => getYear(item.fechaGrado)
      )
        .filter((item) => item.nombre)
        .sort(
          (a, b) =>
            Number(a.nombre) - Number(b.nombre)
        ),
    [egresadosFiltrados]
  );

  const situacionLaboral = useMemo(() => {
    const preguntas =
      datos.preguntas["encuesta01"] || [];

    const pregunta = preguntas.find(
      (item) => Number(item.numero) === 1
    );

    if (!pregunta) return [];

    const conteo = {};

    pregunta.opciones?.forEach((opcion) => {
      conteo[opcion] = 0;
    });

    respuestasFiltradas
      .filter(
        (respuesta) =>
          respuesta.encuestaId === "encuesta01"
      )
      .forEach((respuesta) => {
        const valor =
          respuesta.respuestas?.["1"];

        if (valor) {
          conteo[valor] =
            (conteo[valor] || 0) + 1;
        }
      });

    return Object.entries(conteo).map(
      ([nombre, cantidad]) => ({
        nombre,
        cantidad,
      })
    );
  }, [datos.preguntas, respuestasFiltradas]);

  const participacionEncuestas = useMemo(() => {
    const total = egresadosFiltrados.length || 1;

    return datos.encuestas.map((encuesta) => {
      const respuestas = respuestasFiltradas.filter(
        (item) => item.encuestaId === encuesta.id
      );

      const participantes = new Set(
        respuestas.map(
          (item) => item.egresadoId
        )
      ).size;

      return {
        nombre:
          encuesta.titulo ||
          encuesta.id,
        cantidad: participantes,
        porcentaje: Math.round(
          (participantes / total) * 100
        ),
      };
    });
  }, [
    datos.encuestas,
    egresadosFiltrados.length,
    respuestasFiltradas,
  ]);

  const completitudData = useMemo(() => {
    const campos = [
      ["Información básica", (e) =>
        normalize(e.nombres) &&
        normalize(e.apellidos)
      ],
      ["Fecha de grado", (e) =>
        Boolean(e.fechaGrado)
      ],
      ["Formación", (e) =>
        normalize(e.nivelFormacion)
      ],
      ["Empresa", (e) =>
        normalize(e.empresaActual)
      ],
      ["Cargo", (e) =>
        normalize(e.cargoActual)
      ],
      ["Ciudad", (e) =>
        normalize(e.ciudadTrabajo)
      ],
      ["Correo", (e) =>
        Array.isArray(e.correos)
          ? e.correos.length > 0
          : normalize(e.correo)
      ],
    ];

    return campos.map(([nombre, predicate]) => {
      const cantidad = egresadosFiltrados.filter(
        predicate
      ).length;

      return {
        nombre,
        cantidad,
        porcentaje:
          egresadosFiltrados.length > 0
            ? Math.round(
                (cantidad /
                  egresadosFiltrados.length) *
                  100
              )
            : 0,
      };
    });
  }, [egresadosFiltrados]);

  const limpiarFiltros = () => {
    setFiltros({
      ciudad: "",
      empresa: "",
      cargo: "",
      sector: "",
      formacion: "",
      tipoEmpresa: "",
      anio: "",
    });
  };

  const filtrosActivos = Object.values(filtros).filter(
    Boolean
  ).length;

  if (cargando) {
    return (
      <section className="metricas-admin metricas-loading">
        <div className="metric-loader"></div>
        <strong>Cargando métricas e indicadores...</strong>
        <span>
          Consultando información consolidada desde Firestore.
        </span>
      </section>
    );
  }

  if (error) {
    return (
      <section className="metricas-admin metricas-error">
        <strong>{error}</strong>
        <span>
          Revisa la consola para conocer el detalle técnico.
        </span>
      </section>
    );
  }

  return (
    <section className="metricas-admin">
      <header className="metricas-header">
        <div>
          <span className="metricas-eyebrow">
            ANÁLISIS PROFESIONAL
          </span>
          <h1>Métricas e indicadores</h1>
          <p>
            Análisis detallado de formación, trayectoria,
            empleo y caracterización de los egresados.
          </p>
        </div>

        <div className="metricas-header-badge">
          <img
            src="/logo-conecta-tel-icon.png"
            alt="CONECTA-TEL"
          />
          <div>
            <span>ANÁLISIS ADMINISTRATIVO</span>
            <strong>Datos consolidados</strong>
          </div>
        </div>
      </header>

      <section className="metricas-filters">
        <div className="metricas-filter-heading">
          <div>
            <span>FILTROS DE ANÁLISIS</span>
            <h2>Explorar información</h2>
          </div>

          <div className="metricas-filter-actions">
            {filtrosActivos > 0 && (
              <span>
                {filtrosActivos} filtro
                {filtrosActivos !== 1 ? "s" : ""} activo
                {filtrosActivos !== 1 ? "s" : ""}
              </span>
            )}

            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={!filtrosActivos}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="metricas-filter-grid">
          <label>
            <span>Ciudad</span>
            <select
              value={filtros.ciudad}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  ciudad: e.target.value,
                })
              }
            >
              <option value="">Todas</option>
              {opcionesFiltros.ciudades.map((item) => (
                <option
                  key={item.nombre}
                  value={item.nombre}
                >
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Empresa</span>
            <select
              value={filtros.empresa}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  empresa: e.target.value,
                })
              }
            >
              <option value="">Todas</option>
              {opcionesFiltros.empresas.map((item) => (
                <option
                  key={item.nombre}
                  value={item.nombre}
                >
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Cargo</span>
            <select
              value={filtros.cargo}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  cargo: e.target.value,
                })
              }
            >
              <option value="">Todos</option>
              {opcionesFiltros.cargos.map((item) => (
                <option
                  key={item.nombre}
                  value={item.nombre}
                >
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Sector</span>
            <select
              value={filtros.sector}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  sector: e.target.value,
                })
              }
            >
              <option value="">Todos</option>
              {opcionesFiltros.sectores.map((item) => (
                <option
                  key={item.nombre}
                  value={item.nombre}
                >
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Formación</span>
            <select
              value={filtros.formacion}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  formacion: e.target.value,
                })
              }
            >
              <option value="">Todas</option>
              {opcionesFiltros.formaciones.map((item) => (
                <option
                  key={item.nombre}
                  value={item.nombre}
                >
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Tipo de empresa</span>
            <select
              value={filtros.tipoEmpresa}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  tipoEmpresa: e.target.value,
                })
              }
            >
              <option value="">Todos</option>
              {opcionesFiltros.tipos.map((item) => (
                <option
                  key={item.nombre}
                  value={item.nombre}
                >
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Año de grado</span>
            <select
              value={filtros.anio}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  anio: e.target.value,
                })
              }
            >
              <option value="">Todos</option>
              {opcionesFiltros.anios.map((item) => (
                <option
                  key={item.nombre}
                  value={item.nombre}
                >
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="metricas-kpis">
        <div className="metric-kpi">
          <span>POBLACIÓN ANALIZADA</span>
          <strong>{indicadores.total}</strong>
          <small>Egresados según filtros</small>
        </div>

        <div className="metric-kpi">
          <span>CON EMPRESA</span>
          <strong>{indicadores.conEmpresa}</strong>
          <small>Con empresa actual registrada</small>
        </div>

        <div className="metric-kpi">
          <span>CON TRAYECTORIA</span>
          <strong>{indicadores.conTrayectoria}</strong>
          <small>Con al menos una experiencia</small>
        </div>

        <div className="metric-kpi">
          <span>ACTUALIZADOS</span>
          <strong>{indicadores.actualizados}</strong>
          <small>Con fecha de actualización</small>
        </div>

        <div className="metric-kpi">
          <span>RESPUESTAS</span>
          <strong>{indicadores.respuestas}</strong>
          <small>Respuestas del grupo filtrado</small>
        </div>

        <div className="metric-kpi">
          <span>PROMEDIO TRAYECTORIAS</span>
          <strong>{indicadores.promedioTrayectorias}</strong>
          <small>Experiencias por egresado</small>
        </div>
      </section>

      <div className="metricas-grid metricas-grid-two">
        <article className="metric-card">
          <div className="metric-card-heading">
            <div>
              <span>FORMACIÓN</span>
              <h2>Nivel de formación</h2>
            </div>
            <strong>{indicadores.total}</strong>
          </div>

          {formacionData.length === 0 ? (
            <EmptyChart text="No hay formación registrada." />
          ) : (
            <div className="metric-pie">
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie
                    data={formacionData}
                    dataKey="cantidad"
                    nameKey="nombre"
                    cx="50%"
                    cy="48%"
                    innerRadius="56%"
                    outerRadius="76%"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {formacionData.map((item, index) => (
                      <Cell
                        key={item.nombre}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<MetricTooltip />}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={35}
                    wrapperStyle={{
                      fontSize: 9,
                      color: "#7894a7",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="metric-card">
          <div className="metric-card-heading">
            <div>
              <span>SITUACIÓN LABORAL</span>
              <h2>Respuestas consolidadas</h2>
            </div>
            <strong>
              {situacionLaboral.reduce(
                (sum, item) => sum + item.cantidad,
                0
              )}
            </strong>
          </div>

          {situacionLaboral.length === 0 ? (
            <EmptyChart text="No hay respuestas de situación laboral." />
          ) : (
            <div className="metric-pie">
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie
                    data={situacionLaboral}
                    dataKey="cantidad"
                    nameKey="nombre"
                    cx="50%"
                    cy="48%"
                    innerRadius="56%"
                    outerRadius="76%"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {situacionLaboral.map((item, index) => (
                      <Cell
                        key={item.nombre}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<MetricTooltip />}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={35}
                    wrapperStyle={{
                      fontSize: 9,
                      color: "#7894a7",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </div>

      <div className="metricas-grid metricas-grid-two">
        <article className="metric-card metric-card-large">
          <div className="metric-card-heading">
            <div>
              <span>GEOGRAFÍA</span>
              <h2>Distribución por ciudad</h2>
            </div>
            <strong>{indicadores.ciudades}</strong>
          </div>

          {ciudadesData.length === 0 ? (
            <EmptyChart text="No hay ciudades registradas." />
          ) : (
            <div className="metric-chart">
              <ResponsiveContainer width="100%" height={285}>
                <BarChart
                  data={ciudadesData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 25,
                    left: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    stroke="rgba(80,157,204,0.08)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#58768a",
                      fontSize: 8,
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    width={100}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#8ca2b2",
                      fontSize: 8,
                    }}
                  />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar
                    dataKey="cantidad"
                    fill="#36a9e1"
                    radius={[0, 5, 5, 0]}
                    barSize={15}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="metric-card metric-card-large">
          <div className="metric-card-heading">
            <div>
              <span>SECTOR</span>
              <h2>Distribución por sector laboral</h2>
            </div>
            <strong>{sectoresData.length}</strong>
          </div>

          {sectoresData.length === 0 ? (
            <EmptyChart text="No hay sectores registrados." />
          ) : (
            <div className="metric-chart">
              <ResponsiveContainer width="100%" height={285}>
                <BarChart
                  data={sectoresData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 25,
                    left: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    stroke="rgba(80,157,204,0.08)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#58768a",
                      fontSize: 8,
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    width={105}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#8ca2b2",
                      fontSize: 8,
                    }}
                  />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar
                    dataKey="cantidad"
                    fill="#28c7a0"
                    radius={[0, 5, 5, 0]}
                    barSize={15}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </div>

      <div className="metricas-grid metricas-grid-two">
        <article className="metric-card">
          <div className="metric-card-heading">
            <div>
              <span>EMPRESAS</span>
              <h2>Principales empresas registradas</h2>
            </div>
            <strong>{indicadores.empresas}</strong>
          </div>

          {empresasData.length === 0 ? (
            <EmptyChart text="No hay empresas registradas." />
          ) : (
            <div className="metric-chart">
              <ResponsiveContainer width="100%" height={270}>
                <BarChart
                  data={empresasData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 20,
                    left: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    stroke="rgba(80,157,204,0.08)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#58768a",
                      fontSize: 8,
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    width={115}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#8ca2b2",
                      fontSize: 7.5,
                    }}
                  />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar
                    dataKey="cantidad"
                    fill="#168dff"
                    radius={[0, 5, 5, 0]}
                    barSize={13}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="metric-card">
          <div className="metric-card-heading">
            <div>
              <span>EVOLUCIÓN</span>
              <h2>Egresados por año de graduación</h2>
            </div>
            <strong>{graduacionesData.length}</strong>
          </div>

          {graduacionesData.length === 0 ? (
            <EmptyChart text="No hay fechas de grado registradas." />
          ) : (
            <div className="metric-chart">
              <ResponsiveContainer width="100%" height={270}>
                <LineChart
                  data={graduacionesData}
                  margin={{
                    top: 10,
                    right: 15,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    stroke="rgba(80,157,204,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="nombre"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#7891a5",
                      fontSize: 8,
                    }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    tick={{
                      fill: "#58768a",
                      fontSize: 8,
                    }}
                  />
                  <Tooltip content={<MetricTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cantidad"
                    stroke="#36c6f4"
                    strokeWidth={2.5}
                    dot={{
                      r: 3,
                      fill: "#168dff",
                      strokeWidth: 0,
                    }}
                    activeDot={{
                      r: 5,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </div>

      <div className="metricas-grid metricas-grid-two">
        <article className="metric-card">
          <div className="metric-card-heading">
            <div>
              <span>PARTICIPACIÓN</span>
              <h2>Participación por encuesta</h2>
            </div>
            <strong>{datos.encuestas.length}</strong>
          </div>

          <div className="metric-list">
            {participacionEncuestas.length === 0 ? (
              <EmptyChart text="No hay encuestas disponibles." />
            ) : (
              participacionEncuestas.map((item) => (
                <div
                  className="metric-list-row"
                  key={item.nombre}
                >
                  <div>
                    <span>{item.nombre}</span>
                    <small>
                      {item.cantidad} participante
                      {item.cantidad !== 1 ? "s" : ""}
                    </small>
                  </div>

                  <strong>{item.porcentaje}%</strong>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-card-heading">
            <div>
              <span>CALIDAD DE INFORMACIÓN</span>
              <h2>Completitud de datos</h2>
            </div>
            <strong>{indicadores.total}</strong>
          </div>

          <div className="metric-completeness">
            {completitudData.map((item) => (
              <div
                className="metric-completeness-row"
                key={item.nombre}
              >
                <div>
                  <span>{item.nombre}</span>
                  <strong>{item.porcentaje}%</strong>
                </div>

                <div className="metric-progress">
                  <span
                    style={{
                      width: `${item.porcentaje}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="metricas-grid metricas-grid-two">
        <article className="metric-card">
          <div className="metric-card-heading">
            <div>
              <span>TRAYECTORIA</span>
              <h2>Tecnologías registradas</h2>
            </div>
            <strong>{tecnologiasData.length}</strong>
          </div>

          {tecnologiasData.length === 0 ? (
            <EmptyChart text="No hay tecnologías registradas." />
          ) : (
            <div className="metric-tags">
              {tecnologiasData.map((item) => (
                <div
                  className="metric-tag"
                  key={item.nombre}
                >
                  <span>{item.nombre}</span>
                  <strong>{item.cantidad}</strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="metric-card">
          <div className="metric-card-heading">
            <div>
              <span>TRAYECTORIA</span>
              <h2>Competencias registradas</h2>
            </div>
            <strong>{competenciasData.length}</strong>
          </div>

          {competenciasData.length === 0 ? (
            <EmptyChart text="No hay competencias registradas." />
          ) : (
            <div className="metric-tags">
              {competenciasData.map((item) => (
                <div
                  className="metric-tag"
                  key={item.nombre}
                >
                  <span>{item.nombre}</span>
                  <strong>{item.cantidad}</strong>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <section className="metricas-ia-section">
        <div className="metricas-ia-heading">
          <div>
            <span className="metricas-eyebrow">INTELIGENCIA ARTIFICIAL</span>
            <h2>Análisis profesional con IA</h2>
            <p>
              Clasificaciones generadas a partir de los perfiles profesionales y
              relacionadas con los egresados incluidos en los filtros actuales.
            </p>
          </div>
          <div className="metricas-ia-model">
            <span>MODELO</span>
            <strong>Gemini 2.5 Flash</strong>
          </div>
        </div>

        <div className="metricas-ia-kpis">
          <div className="metric-kpi">
            <span>CLASIFICACIONES</span>
            <strong>{indicadoresIA.total}</strong>
            <small>Registros de IA en el grupo filtrado</small>
          </div>
          <div className="metric-kpi">
            <span>APROBADAS</span>
            <strong>{indicadoresIA.aprobadas}</strong>
            <small>Validadas por administración</small>
          </div>
          <div className="metric-kpi">
            <span>PENDIENTES</span>
            <strong>{indicadoresIA.pendientes}</strong>
            <small>Requieren revisión administrativa</small>
          </div>
          <div className="metric-kpi">
            <span>RECHAZADAS</span>
            <strong>{indicadoresIA.rechazadas}</strong>
            <small>Clasificaciones no aprobadas</small>
          </div>
          <div className="metric-kpi">
            <span>GENERADAS POR IA</span>
            <strong>{indicadoresIA.generadasPorIA}</strong>
            <small>Marcadas como generadas por IA</small>
          </div>
        </div>

        {indicadoresIA.total === 0 ? (
          <div className="metric-card metricas-ia-empty">
            <EmptyChart text="No hay clasificaciones de IA para los filtros seleccionados." />
            <p>
              Cuando se genere y guarde una clasificación en Firestore, sus
              resultados aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <>
            <div className="metricas-grid metricas-grid-two">
              <article className="metric-card">
                <div className="metric-card-heading">
                  <div>
                    <span>PERFIL PROFESIONAL</span>
                    <h2>Áreas profesionales identificadas</h2>
                  </div>
                  <strong>{areasIAData.length}</strong>
                </div>
                {areasIAData.length === 0 ? (
                  <EmptyChart text="No hay áreas profesionales clasificadas." />
                ) : (
                  <div className="metric-chart">
                    <ResponsiveContainer width="100%" height={285}>
                      <BarChart data={areasIAData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                        <CartesianGrid stroke="rgba(80,157,204,0.08)" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#58768a", fontSize: 8 }} />
                        <YAxis type="category" dataKey="nombre" width={120} axisLine={false} tickLine={false} tick={{ fill: "#8ca2b2", fontSize: 8 }} />
                        <Tooltip content={<MetricTooltip />} />
                        <Bar dataKey="cantidad" fill="#168dff" radius={[0, 5, 5, 0]} barSize={15} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="metric-card">
                <div className="metric-card-heading">
                  <div>
                    <span>ESPECIALIZACIÓN</span>
                    <h2>Especialidades identificadas</h2>
                  </div>
                  <strong>{especialidadesIAData.length}</strong>
                </div>
                {especialidadesIAData.length === 0 ? (
                  <EmptyChart text="No hay especialidades clasificadas." />
                ) : (
                  <div className="metric-chart">
                    <ResponsiveContainer width="100%" height={285}>
                      <BarChart data={especialidadesIAData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                        <CartesianGrid stroke="rgba(80,157,204,0.08)" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#58768a", fontSize: 8 }} />
                        <YAxis type="category" dataKey="nombre" width={145} axisLine={false} tickLine={false} tick={{ fill: "#8ca2b2", fontSize: 8 }} />
                        <Tooltip content={<MetricTooltip />} />
                        <Bar dataKey="cantidad" fill="#36a9e1" radius={[0, 5, 5, 0]} barSize={15} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>
            </div>

            <div className="metricas-grid metricas-grid-two">
              <article className="metric-card">
                <div className="metric-card-heading">
                  <div>
                    <span>SECTOR PROFESIONAL</span>
                    <h2>Sectores identificados por IA</h2>
                  </div>
                  <strong>{sectoresIAData.length}</strong>
                </div>
                {sectoresIAData.length === 0 ? (
                  <EmptyChart text="No hay sectores clasificados." />
                ) : (
                  <div className="metric-chart">
                    <ResponsiveContainer width="100%" height={285}>
                      <BarChart data={sectoresIAData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                        <CartesianGrid stroke="rgba(80,157,204,0.08)" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#58768a", fontSize: 8 }} />
                        <YAxis type="category" dataKey="nombre" width={130} axisLine={false} tickLine={false} tick={{ fill: "#8ca2b2", fontSize: 8 }} />
                        <Tooltip content={<MetricTooltip />} />
                        <Bar dataKey="cantidad" fill="#28c7a0" radius={[0, 5, 5, 0]} barSize={15} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="metric-card">
                <div className="metric-card-heading">
                  <div>
                    <span>ROLES PROFESIONALES</span>
                    <h2>Cargos principales identificados</h2>
                  </div>
                  <strong>{cargosIAData.length}</strong>
                </div>
                {cargosIAData.length === 0 ? (
                  <EmptyChart text="No hay cargos clasificados." />
                ) : (
                  <div className="metric-chart">
                    <ResponsiveContainer width="100%" height={285}>
                      <BarChart data={cargosIAData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                        <CartesianGrid stroke="rgba(80,157,204,0.08)" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#58768a", fontSize: 8 }} />
                        <YAxis type="category" dataKey="nombre" width={145} axisLine={false} tickLine={false} tick={{ fill: "#8ca2b2", fontSize: 8 }} />
                        <Tooltip content={<MetricTooltip />} />
                        <Bar dataKey="cantidad" fill="#7a8cff" radius={[0, 5, 5, 0]} barSize={15} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>
            </div>

            <div className="metricas-grid metricas-grid-two">
              <article className="metric-card">
                <div className="metric-card-heading">
                  <div>
                    <span>TECNOLOGÍAS</span>
                    <h2>Tecnologías identificadas por IA</h2>
                  </div>
                  <strong>{tecnologiasIAData.length}</strong>
                </div>
                {tecnologiasIAData.length === 0 ? (
                  <EmptyChart text="No hay tecnologías identificadas por IA." />
                ) : (
                  <div className="metric-tags">
                    {tecnologiasIAData.map((item) => (
                      <div className="metric-tag" key={item.nombre}>
                        <span>{item.nombre}</span>
                        <strong>{item.cantidad}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="metric-card">
                <div className="metric-card-heading">
                  <div>
                    <span>PALABRAS CLAVE</span>
                    <h2>Competencias y términos profesionales</h2>
                  </div>
                  <strong>{palabrasClaveIAData.length}</strong>
                </div>
                {palabrasClaveIAData.length === 0 ? (
                  <EmptyChart text="No hay palabras clave identificadas por IA." />
                ) : (
                  <div className="metric-tags">
                    {palabrasClaveIAData.map((item) => (
                      <div className="metric-tag" key={item.nombre}>
                        <span>{item.nombre}</span>
                        <strong>{item.cantidad}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </>
        )}
      </section>

      <footer className="metricas-footer">
        <span>
          CONECTA-TEL · Métricas e indicadores administrativos
        </span>
        <span>
          Información consultada dinámicamente desde Firestore
        </span>
      </footer>
    </section>
  );
}

export default MetricasIndicadoresAdmin;
