import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  Map,
  AdvancedMarker,
} from "@vis.gl/react-google-maps";

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
import "./DashboardAdmin.css";


/* =========================================================
   DASHBOARD ADMINISTRATIVO
   CONECTA-TEL
   ========================================================= */

function DashboardAdmin() {

  /* =======================================================
     ESTADOS
     ======================================================= */

  const [datos, setDatos] = useState({
    egresados: [],
    trayectorias: [],
    respuestas: [],
    encuestas: [],
    preguntas: {},
  });

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");

  /* =======================================================
     CARGAR INFORMACIÓN DE FIRESTORE
     ======================================================= */

  useEffect(() => {

    const cargarDashboard = async () => {

      try {

        setCargando(true);
        setError("");

        /* ---------------------------------------------------
           EGRESADOS
           --------------------------------------------------- */

        const egresadosSnapshot = await getDocs(
          collection(db, "egresados")
        );

        const egresados = egresadosSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );


        /* ---------------------------------------------------
           TRAYECTORIAS
           --------------------------------------------------- */

        const trayectorias = [];

        for (const egresado of egresados) {

          const trayectoriaSnapshot =
            await getDocs(
              collection(
                db,
                "egresados",
                egresado.id,
                "trayectoriaLaboral"
              )
            );

          trayectoriaSnapshot.forEach((doc) => {

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


        /* ---------------------------------------------------
           RESPUESTAS
           --------------------------------------------------- */

        const respuestasSnapshot = await getDocs(
          collection(db, "respuestasEncuestas")
        );

        const respuestas =
          respuestasSnapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          );


        /* ---------------------------------------------------
           ENCUESTAS
           --------------------------------------------------- */

        const encuestasSnapshot = await getDocs(
          collection(db, "encuestas")
        );

        const encuestas = [];

        const preguntas = {};

        for (const encuestaDoc of encuestasSnapshot.docs) {

          const encuesta = {
            id: encuestaDoc.id,
            ...encuestaDoc.data(),
          };

          encuestas.push(encuesta);


          const preguntasSnapshot =
            await getDocs(
              collection(
                db,
                "encuestas",
                encuestaDoc.id,
                "preguntas"
              )
            );


          preguntas[encuestaDoc.id] =
            preguntasSnapshot.docs.map(
              (preguntaDoc) => ({
                id: preguntaDoc.id,
                ...preguntaDoc.data(),
              })
            );

        }


        setDatos({
          egresados,
          trayectorias,
          respuestas,
          encuestas,
          preguntas,
        });

      } catch (err) {

        console.error(
          "Error cargando Dashboard:",
          err
        );

        setError(
          "No fue posible cargar la información del Dashboard."
        );

      } finally {

        setCargando(false);

      }

    };


    cargarDashboard();

  }, []);


  /* =======================================================
     INDICADORES
     ======================================================= */

  const indicadores = useMemo(() => {

    const egresados =
      datos.egresados || [];

    const trayectorias =
      datos.trayectorias || [];

    const respuestas =
      datos.respuestas || [];

    const ciudades = new Set();

    const empresas = new Set();


    egresados.forEach((egresado) => {

      if (
        typeof egresado.ciudadTrabajo === "string" &&
        egresado.ciudadTrabajo.trim()
      ) {

        ciudades.add(
          egresado.ciudadTrabajo
            .trim()
            .toLowerCase()
        );

      }


      if (
        typeof egresado.empresaActual === "string" &&
        egresado.empresaActual.trim()
      ) {

        empresas.add(
          egresado.empresaActual
            .trim()
            .toLowerCase()
        );

      }

    });


    const actualizados =
      egresados.filter(
        (egresado) =>
          egresado.fechaActualizacion
      ).length;


    const conEmpresa =
      egresados.filter(
        (egresado) =>
          typeof egresado.empresaActual === "string" &&
          egresado.empresaActual.trim() !== ""
      ).length;


    const conTrayectoria =
      new Set(
        trayectorias.map(
          (item) => item.egresadoId
        )
      ).size;


    return {

      totalEgresados:
        egresados.length,

      actualizados,

      trayectorias:
        trayectorias.length,

      conTrayectoria,

      respuestas:
        respuestas.length,

      ciudades:
        ciudades.size,

      empresas:
        empresas.size,

      conEmpresa,

    };

  }, [datos]);


  /* =======================================================
     SITUACIÓN LABORAL
     ======================================================= */

  const situacionLaboral =
    useMemo(() => {

      const encuesta =
        datos.encuestas.find(
          (item) =>
            item.id === "encuesta01"
        );

      if (!encuesta) {
        return [];
      }

      const preguntas =
        datos.preguntas["encuesta01"] || [];

      const pregunta =
        preguntas.find(
          (item) =>
            Number(item.numero) === 1
        );

      if (!pregunta) {
        return [];
      }

      const conteo = {};

      pregunta.opciones?.forEach(
        (opcion) => {
          conteo[opcion] = 0;
        }
      );


      datos.respuestas
        .filter(
          (respuesta) =>
            respuesta.encuestaId ===
            "encuesta01"
        )
        .forEach(
          (respuesta) => {

            const valor =
              respuesta.respuestas?.["1"];

            if (valor) {

              conteo[valor] =
                (conteo[valor] || 0) + 1;

            }

          }
        );


      return Object.entries(
        conteo
      ).map(
        ([nombre, cantidad]) => ({
          nombre,
          cantidad,
        })
      );

    }, [datos]);


  /* =======================================================
     NIVEL DE FORMACIÓN
     ======================================================= */

  const formacion =
    useMemo(() => {

      const conteo = {};

      datos.egresados.forEach(
        (egresado) => {

          const nivel =
            egresado.nivelFormacion;

          if (
            typeof nivel === "string" &&
            nivel.trim()
          ) {

            conteo[nivel] =
              (conteo[nivel] || 0) + 1;

          }

        }
      );


      return Object.entries(
        conteo
      )
        .map(
          ([nombre, cantidad]) => ({
            nombre,
            cantidad,
          })
        )
        .sort(
          (a, b) =>
            b.cantidad - a.cantidad
        );

    }, [datos]);


  /* =======================================================
     CIUDADES
     ======================================================= */

  const ciudades =
    useMemo(() => {

      const conteo = {};

      datos.egresados.forEach(
        (egresado) => {

          const ciudad =
            egresado.ciudadTrabajo;

          if (
            typeof ciudad === "string" &&
            ciudad.trim()
          ) {

            const nombre =
              ciudad.trim();

            conteo[nombre] =
              (conteo[nombre] || 0) + 1;

          }

        }
      );


      return Object.entries(
        conteo
      )
        .map(
          ([nombre, cantidad]) => ({
            nombre,
            cantidad,
          })
        )
        .sort(
          (a, b) =>
            b.cantidad - a.cantidad
        );

    }, [datos]);


  /* =======================================================
     DATOS PARA GRÁFICAS INTERACTIVAS
     ======================================================= */

  const graduaciones = useMemo(() => {
    const conteo = {};

    datos.egresados.forEach((egresado) => {
      const valor = egresado.fechaGrado;
      let anio = "";

      if (valor?.toDate instanceof Function) {
        anio = String(valor.toDate().getFullYear());
      } else if (typeof valor === "string") {
        const encontrado = valor.match(/(?:19|20)\\d{2}/);
        if (encontrado) anio = encontrado[0];
      } else if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
        anio = String(valor.getFullYear());
      }

      if (anio) {
        conteo[anio] = (conteo[anio] || 0) + 1;
      }
    });

    return Object.entries(conteo)
      .map(([anio, cantidad]) => ({
        anio,
        cantidad,
      }))
      .sort((a, b) => Number(a.anio) - Number(b.anio));
  }, [datos]);

  const totalSituacionLaboral = situacionLaboral.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  const totalFormacion = formacion.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  const CHART_COLORS = [
    "#168dff",
    "#36a9e1",
    "#65d4ff",
    "#28c7a0",
    "#7a8cff",
    "#5cc8ff",
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const item = payload[0];
    const valor = item.value;
    const total =
      item.payload?.total ??
      (label && totalSituacionLaboral > 0
        ? totalSituacionLaboral
        : totalFormacion > 0
          ? totalFormacion
          : 0);

    const porcentaje =
      total > 0
        ? Math.round((Number(valor) / total) * 100)
        : 0;

    return (
      <div className="dashboard-tooltip">
        <strong>{label || item.name}</strong>
        <span>{valor} egresado{Number(valor) === 1 ? "" : "s"}</span>
        {total > 0 && <small>{porcentaje}% del total</small>}
      </div>
    );
  };

  /* =======================================================
     CARGANDO
     ======================================================= */

  if (cargando) {

    return (
      <div className="dashboard-loading">

        <div className="dashboard-loader"></div>

        <span>
          Cargando información...
        </span>

      </div>
    );

  }


  /* =======================================================
     ERROR
     ======================================================= */

  if (error) {

    return (
      <div className="dashboard-error">

        <strong>
          No se pudo cargar el Dashboard
        </strong>

        <span>
          {error}
        </span>

      </div>
    );

  }


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <section className="dashboard-admin">

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="dashboard-top">

        <div>

          <span className="dashboard-eyebrow">
            ANÁLISIS INSTITUCIONAL
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Resumen general de seguimiento y
            caracterización de los egresados.
          </p>

        </div>


        <div className="dashboard-brand">
          <img
            src="/logo-conecta-tel-icon.png"
            alt="CONECTA-TEL"
          />
        </div>

      </div>


      {/* ===================================================
          INDICADORES
          =================================================== */}

      <div className="dashboard-kpis">

        <div className="dashboard-kpi">

          <span>
            EGRESADOS
          </span>

          <strong>
            {indicadores.totalEgresados}
          </strong>

          <small>
            Registrados en la plataforma
          </small>

        </div>


        <div className="dashboard-kpi">

          <span>
            ACTUALIZADOS
          </span>

          <strong>
            {indicadores.actualizados}
          </strong>

          <small>
            Con fecha de actualización
          </small>

        </div>


        <div className="dashboard-kpi">

          <span>
            TRAYECTORIAS
          </span>

          <strong>
            {indicadores.trayectorias}
          </strong>

          <small>
            Experiencias profesionales
          </small>

        </div>


        <div className="dashboard-kpi">

          <span>
            RESPUESTAS
          </span>

          <strong>
            {indicadores.respuestas}
          </strong>

          <small>
            Respuestas almacenadas
          </small>

        </div>


        <div className="dashboard-kpi">

          <span>
            CIUDADES
          </span>

          <strong>
            {indicadores.ciudades}
          </strong>

          <small>
            Ciudades de trabajo
          </small>

        </div>


        <div className="dashboard-kpi">

          <span>
            EMPRESAS
          </span>

          <strong>
            {indicadores.empresas}
          </strong>

          <small>
            Empresas registradas
          </small>

        </div>

      </div>


      {/* ===================================================
          GRÁFICAS INTERACTIVAS
          =================================================== */}

      <div className="dashboard-grid dashboard-grid-top">

        {/* -------------------------------------------------
           SITUACIÓN LABORAL · DONUT
           ------------------------------------------------- */}

        <div className="dashboard-card dashboard-chart-card">

          <div className="dashboard-card-header">
            <div>
              <span>SITUACIÓN LABORAL</span>
              <h2>Situación actual</h2>
            </div>

            <strong className="dashboard-total">
              {totalSituacionLaboral}
            </strong>
          </div>

          {situacionLaboral.length === 0 ? (
            <div className="dashboard-empty-chart">
              <div className="dashboard-empty-donut">
                <span>0</span>
              </div>
              <div>
                <strong>Sin respuestas</strong>
                <small>El gráfico se actualizará automáticamente.</small>
              </div>
            </div>
          ) : (
            <div className="dashboard-donut-layout">

              <div className="dashboard-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={situacionLaboral}
                      dataKey="cantidad"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="78%"
                      paddingAngle={3}
                      stroke="none"
                    >
                      {situacionLaboral.map((item, index) => (
                        <Cell
                          key={item.nombre}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={false}
                    />

                    <Legend
                      verticalAlign="bottom"
                      height={42}
                      iconType="circle"
                      formatter={(value) => (
                        <span className="dashboard-legend-text">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="dashboard-donut-center">
                  <strong>{totalSituacionLaboral}</strong>
                  <span>respuestas</span>
                </div>
              </div>

            </div>
          )}

        </div>


        {/* -------------------------------------------------
           FORMACIÓN · DONUT
           ------------------------------------------------- */}

        <div className="dashboard-card dashboard-chart-card">

          <div className="dashboard-card-header">
            <div>
              <span>FORMACIÓN</span>
              <h2>Nivel de formación</h2>
            </div>

            <strong className="dashboard-total">
              {totalFormacion}
            </strong>
          </div>

          {formacion.length === 0 ? (
            <div className="dashboard-empty-chart">
              <div className="dashboard-empty-donut">
                <span>0</span>
              </div>
              <div>
                <strong>Sin información</strong>
                <small>El gráfico se actualizará automáticamente.</small>
              </div>
            </div>
          ) : (
            <div className="dashboard-donut-layout">

              <div className="dashboard-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formacion}
                      dataKey="cantidad"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="78%"
                      paddingAngle={3}
                      stroke="none"
                    >
                      {formacion.map((item, index) => (
                        <Cell
                          key={item.nombre}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={false}
                    />

                    <Legend
                      verticalAlign="bottom"
                      height={42}
                      iconType="circle"
                      formatter={(value) => (
                        <span className="dashboard-legend-text">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="dashboard-donut-center">
                  <strong>{totalFormacion}</strong>
                  <span>egresados</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>


      {/* ===================================================
          SEGUNDA FILA
          =================================================== */}



      <div className="dashboard-grid dashboard-grid-bottom">


        {/* -------------------------------------------------
           CIUDADES
           ------------------------------------------------- */}

        <div className="dashboard-card dashboard-cities">

          <div className="dashboard-card-header">

            <div>

              <span>
                DISTRIBUCIÓN GEOGRÁFICA
              </span>

              <h2>
                Principales ciudades
              </h2>

            </div>

            <strong className="dashboard-total">
              {ciudades.length}
            </strong>

          </div>


          {ciudades.length === 0 ? (
            <div className="dashboard-empty-bar">
              <div className="empty-bar-row"><span></span></div>
              <div className="empty-bar-row"><span></span></div>
              <div className="empty-bar-row"><span></span></div>
              <small>No hay ciudades registradas todavía.</small>
            </div>
          ) : (
            <div className="dashboard-bar-chart">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={ciudades.slice(0, 8)}
                  layout="vertical"
                  margin={{
                    top: 4,
                    right: 15,
                    left: 5,
                    bottom: 4,
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
                    width={90}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#8ca2b2",
                      fontSize: 8,
                    }}
                  />

                  <Tooltip
                    cursor={{
                      fill: "rgba(54,169,225,0.05)",
                    }}
                    content={<CustomTooltip />}
                  />

                  <Bar
                    dataKey="cantidad"
                    name="Egresados"
                    fill="#36a9e1"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>


        {/* -------------------------------------------------
           RESUMEN
           ------------------------------------------------- */}

        <div className="dashboard-card dashboard-insight">

          <div className="dashboard-card-header">

            <div>

              <span>
                RESUMEN
              </span>

              <h2>
                Estado de la plataforma
              </h2>

            </div>

          </div>


          <div className="insight-list">

            <div>

              <span>
                Egresados con empresa
              </span>

              <strong>
                {indicadores.conEmpresa}
              </strong>

            </div>


            <div>

              <span>
                Egresados con trayectoria
              </span>

              <strong>
                {indicadores.conTrayectoria}
              </strong>

            </div>


            <div>

              <span>
                Encuestas disponibles
              </span>

              <strong>
                {datos.encuestas.length}
              </strong>

            </div>


            <div>

              <span>
                Respuestas registradas
              </span>

              <strong>
                {indicadores.respuestas}
              </strong>

            </div>

          </div>

        </div>

      </div>


      {/* ===================================================
          GRADUADOS POR AÑO
          =================================================== */}

      <div className="dashboard-card dashboard-graduation-card">

        <div className="dashboard-card-header">
          <div>
            <span>EVOLUCIÓN</span>
            <h2>Egresados por año de graduación</h2>
          </div>

          <strong className="dashboard-total">
            {graduaciones.length}
          </strong>
        </div>

        {graduaciones.length === 0 ? (
          <div className="dashboard-empty-line">
            <div className="empty-line-grid"></div>
            <div className="empty-line-message">
              <strong>Sin datos de graduación</strong>
              <span>El historial aparecerá aquí cuando se registren fechas de grado.</span>
            </div>
          </div>
        ) : (
          <div className="dashboard-line-chart">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={graduaciones}
                margin={{
                  top: 10,
                  right: 18,
                  left: 0,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  stroke="rgba(80,157,204,0.08)"
                  vertical={false}
                />

                <XAxis
                  dataKey="anio"
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
                  width={30}
                  tick={{
                    fill: "#58768a",
                    fontSize: 8,
                  }}
                />

                <Tooltip
                  cursor={{
                    stroke: "rgba(54,169,225,0.2)",
                  }}
                  content={<CustomTooltip />}
                />

                <Line
                  type="monotone"
                  dataKey="cantidad"
                  name="Egresados"
                  stroke="#36a9e1"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#36a9e1",
                    stroke: "#061621",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#65d4ff",
                    stroke: "#061621",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>


      {/* ===================================================
          MAPA
          =================================================== */}

      <div className="dashboard-map-card">

        <div className="dashboard-card-header">

          <div>

            <span>
              DISTRIBUCIÓN GEOGRÁFICA
            </span>

            <h2>
              Ubicación de los egresados
            </h2>

          </div>


          <div className="map-summary">

            <strong>
              {indicadores.ciudades}
            </strong>

            <span>
              ciudades
            </span>

          </div>

        </div>


        <div className="dashboard-map">

          <Map
            defaultCenter={{
              lat: 6.2442,
              lng: -75.5812,
            }}
            defaultZoom={5}
            gestureHandling="greedy"
            disableDefaultUI={true}
            mapId="DEMO_MAP_ID"
          >

            {ciudades.slice(0, 15).map(
              (ciudad, index) => {

                /*
                 * Coordenadas aproximadas iniciales
                 * para las ciudades colombianas más
                 * comunes del piloto.
                 *
                 * Posteriormente podemos conectar
                 * este mapa directamente con la
                 * geolocalización definitiva.
                 */

                const coordenadas = {

                  bogota: {
                    lat: 4.711,
                    lng: -74.0721,
                  },

                  medellin: {
                    lat: 6.2442,
                    lng: -75.5812,
                  },

                  bucaramanga: {
                    lat: 7.1193,
                    lng: -73.1227,
                  },

                  cali: {
                    lat: 3.4516,
                    lng: -76.532,
                  },

                  barranquilla: {
                    lat: 10.9685,
                    lng: -74.7813,
                  },

                  cartagena: {
                    lat: 10.391,
                    lng: -75.4794,
                  },

                  pereira: {
                    lat: 4.8143,
                    lng: -75.6946,
                  },

                  manizales: {
                    lat: 5.0703,
                    lng: -75.5138,
                  },

                  cucuta: {
                    lat: 7.8939,
                    lng: -72.5078,
                  },

                  ibague: {
                    lat: 4.4389,
                    lng: -75.2322,
                  },

                  santa_marta: {
                    lat: 11.2408,
                    lng: -74.199,
                  },

                };


                const clave =
                  ciudad.nombre
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(
                      /[\u0300-\u036f]/g,
                      ""
                    )
                    .replace(
                      /\s+/g,
                      "_"
                    );


                const posicion =
                  coordenadas[clave];


                if (!posicion) {
                  return null;
                }


                return (

                  <AdvancedMarker
                    key={`${ciudad.nombre}-${index}`}
                    position={posicion}
                  >

                    <div className="dashboard-map-marker">

                      <span></span>

                    </div>

                  </AdvancedMarker>

                );

              }

            )}

          </Map>

        </div>

      </div>


      {/* ===================================================
          PIE
          =================================================== */}

      <div className="dashboard-footer">

        <span>
          CONECTA-TEL · Dashboard administrativo
        </span>

        <span>
          Información consultada desde Firestore
        </span>

      </div>

    </section>

  );

}


export default DashboardAdmin;