import { useEffect, useMemo, useState } from "react";

import {
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
  Polyline,
  useAdvancedMarkerRef,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "./firebase";

import "./GeolocalizacionAdmin.css";


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const MAP_ID =
  import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

const DEFAULT_CENTER = {
  lat: 6.2442,
  lng: -75.5812,
};

const COLORES = [
  "#38BDF8",
  "#8B5CF6",
  "#22C55E",
  "#F59E0B",
  "#F43F5E",
  "#A855F7",
  "#06B6D4",
  "#F97316",
];


/* =========================================================
   UTILIDADES
   ========================================================= */

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase();
}


function obtenerNombre(datos) {
  return (
    `${datos?.nombres || ""} ${datos?.apellidos || ""}`
      .trim() ||
    "Egresado sin nombre"
  );
}


/* =========================================================
   MARCADOR + INFOWINDOW
   Patrón oficial de @vis.gl/react-google-maps:
   useAdvancedMarkerRef + AdvancedMarker + InfoWindow.
   ========================================================= */

function MarcadorConInfo({ ubicacion, color }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowShown, setInfoWindowShown] = useState(false);

  /*
   * Usamos el patrón oficial de @vis.gl:
   * useAdvancedMarkerRef + AdvancedMarker + InfoWindow.
   *
   * Además, el contenido visible del marcador es un BUTTON real.
   * Esto da una segunda vía de interacción: el clic React del botón
   * no depende de que el evento gmp-click sea reenviado por el mapa.
   */
  useEffect(() => {
    if (!marker) return;

    marker.gmpClickable = true;

    const handleNativeMarkerClick = () => {
      setInfoWindowShown(true);
    };

    marker.addEventListener("gmp-click", handleNativeMarkerClick);

    return () => {
      marker.removeEventListener("gmp-click", handleNativeMarkerClick);
    };
  }, [marker]);

  function abrirInfo(event) {
    event.preventDefault();
    event.stopPropagation();
    setInfoWindowShown(true);
  }

  function cerrarInfo() {
    setInfoWindowShown(false);
  }

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{
          lat: ubicacion.lat,
          lng: ubicacion.lng,
        }}
        clickable={true}
        title={ubicacion.nombre || ubicacion.ciudad || "Egresado"}
      >
        <button
          type="button"
          aria-label={`Ver información de ${ubicacion.nombre || ubicacion.ciudad || "egresado"}`}
          onClick={abrirInfo}
          style={{
            width: "42px",
            height: "48px",
            padding: 0,
            margin: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            pointerEvents: "auto",
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            outline: "none",
          }}
        >
          <span
            style={{
              width: "30px",
              height: "30px",
              marginTop: "2px",
              background: color,
              border: "3px solid #ffffff",
              borderRadius: "50% 50% 50% 0",
              transform: "rotate(-45deg)",
              boxShadow: "0 3px 9px rgba(0,0,0,.35)",
              display: "block",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#ffffff",
                left: "8px",
                top: "8px",
              }}
            />
          </span>
        </button>
      </AdvancedMarker>

      {infoWindowShown && marker && (
        <InfoWindow
          anchor={marker}
          onClose={cerrarInfo}
          disableAutoPan={false}
        >
          <div
            style={{
              width: "280px",
              maxWidth: "280px",
              padding: "4px 2px 2px",
              color: "#10202c",
              fontFamily:
                "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  minWidth: "38px",
                  borderRadius: "50%",
                  background: color,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "16px",
                }}
              >
                {(ubicacion.nombre || "E").charAt(0).toUpperCase()}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    lineHeight: 1.2,
                    marginBottom: "3px",
                  }}
                >
                  {ubicacion.nombre || "Egresado sin nombre"}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#607080",
                  }}
                >
                  {ubicacion.ciudad || "Ubicación no disponible"}
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid #e5e9ed",
                paddingTop: "10px",
              }}
            >
              <p style={{ margin: "0 0 7px", fontSize: "12px" }}>
                <strong>Empresa:</strong>{" "}
                {ubicacion.empresa || "No registrada"}
              </p>

              <p style={{ margin: "0 0 7px", fontSize: "12px" }}>
                <strong>Cargo:</strong>{" "}
                {ubicacion.cargo || "No registrado"}
              </p>

              <p style={{ margin: "0 0 7px", fontSize: "12px" }}>
                <strong>Ciudad:</strong>{" "}
                {ubicacion.ciudad || "No registrada"}
              </p>

              {ubicacion.fechaInicio && (
                <p style={{ margin: "0 0 7px", fontSize: "12px" }}>
                  <strong>Período:</strong>{" "}
                  {ubicacion.fechaInicio}
                  {" — "}
                  {ubicacion.fechaFin || "Actual"}
                </p>
              )}

              {ubicacion.sector && (
                <p style={{ margin: "0", fontSize: "12px" }}>
                  <strong>Sector:</strong>{" "}
                  {ubicacion.sector}
                </p>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

/* =========================================================
   COMPONENTE
   ========================================================= */

function GeolocalizacionAdmin() {

  /*
   * IMPORTANTE:
   *
   * NO colocamos APIProvider aquí.
   *
   * PanelAdministrador será el único lugar
   * donde se inicializa Google Maps.
   */

  const geocoding =
    useMapsLibrary("geocoding");


  /* =======================================================
     ESTADOS
     ======================================================= */

  const [registros, setRegistros] =
    useState([]);

  const [ubicaciones, setUbicaciones] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [geocodificando, setGeocodificando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroCiudad, setFiltroCiudad] =
    useState("");

  const [filtroEmpresa, setFiltroEmpresa] =
    useState("");

  const [modo, setModo] =
    useState("trayectorias");

  const [tipoMapa, setTipoMapa] =
    useState("roadmap");


  /* =======================================================
     1. CARGAR EGRESADOS + TRAYECTORIAS
     ======================================================= */

  useEffect(() => {

    let cancelado = false;


    async function cargarDatos() {

      try {

        setCargando(true);
        setError("");


        const egresadosSnapshot =
          await getDocs(
            collection(db, "egresados")
          );


        const resultados = [];


        for (
          const egresadoDoc
          of egresadosSnapshot.docs
        ) {

          const datos =
            egresadoDoc.data();


          /*
           * Obtener trayectoria laboral
           */

          const trayectoriaSnapshot =
            await getDocs(
              collection(
                db,
                "egresados",
                egresadoDoc.id,
                "trayectoriaLaboral"
              )
            );


          /*
           * -------------------------------------------------
           * SI TIENE TRAYECTORIA
           * -------------------------------------------------
           */

          if (!trayectoriaSnapshot.empty) {

            trayectoriaSnapshot.forEach(
              (trayectoriaDoc) => {

                const trayectoria =
                  trayectoriaDoc.data();


                resultados.push({

                  id:
                    `${egresadoDoc.id}_${trayectoriaDoc.id}`,

                  egresadoId:
                    egresadoDoc.id,

                  nombre:
                    obtenerNombre(datos),

                  ciudad:
                    trayectoria.ciudad ||
                    datos.ciudadTrabajo ||
                    "",

                  departamento:
                    trayectoria.departamento ||
                    "",

                  pais:
                    trayectoria.pais ||
                    "Colombia",

                  empresa:
                    trayectoria.empresa ||
                    datos.empresaActual ||
                    "",

                  cargo:
                    trayectoria.cargo ||
                    datos.cargoActual ||
                    "",

                  sector:
                    trayectoria.sectorLaboral ||
                    "",

                  tipoEmpresa:
                    trayectoria.tipoEmpresa ||
                    datos.tipoEmpresa ||
                    "",

                  tecnologias:
                    trayectoria.tecnologias ||
                    "",

                  descripcion:
                    trayectoria.descripcion ||
                    "",

                  fechaInicio:
                    trayectoria.fechaInicio ||
                    "",

                  fechaFin:
                    trayectoria.fechaFin ||
                    "",

                  esActual:
                    Boolean(
                      trayectoria.esActual
                    ),

                  latitud:
                    typeof trayectoria.latitud === "number"
                      ? trayectoria.latitud
                      : null,

                  longitud:
                    typeof trayectoria.longitud === "number"
                      ? trayectoria.longitud
                      : null,

                });

              }
            );

          }


          /*
           * -------------------------------------------------
           * SI NO TIENE TRAYECTORIA
           * USAMOS CIUDAD ACTUAL
           * -------------------------------------------------
           */

          else if (
            datos.ciudadTrabajo
          ) {

            resultados.push({

              id:
                `${egresadoDoc.id}_actual`,

              egresadoId:
                egresadoDoc.id,

              nombre:
                obtenerNombre(datos),

              ciudad:
                datos.ciudadTrabajo,

              departamento:
                "",

              pais:
                "Colombia",

              empresa:
                datos.empresaActual ||
                "",

              cargo:
                datos.cargoActual ||
                "",

              sector:
                datos.sectorLaboral ||
                "",

              tipoEmpresa:
                datos.tipoEmpresa ||
                "",

              tecnologias:
                "",

              descripcion:
                "",

              fechaInicio:
                "",

              fechaFin:
                "",

              esActual:
                true,

              latitud:
                typeof datos.latitud === "number"
                  ? datos.latitud
                  : null,

              longitud:
                typeof datos.longitud === "number"
                  ? datos.longitud
                  : null,

            });

          }

        }


        if (!cancelado) {

          console.log(
            "GEOLOCALIZACIÓN:",
            resultados.length,
            "registros"
          );

          setRegistros(resultados);

        }

      } catch (err) {

        console.error(
          "Error cargando datos geográficos:",
          err
        );


        if (!cancelado) {

          setError(
            "No fue posible cargar la información geográfica."
          );

        }

      } finally {

        if (!cancelado) {

          setCargando(false);

        }

      }

    }


    cargarDatos();


    return () => {

      cancelado = true;

    };

  }, []);


  /* =======================================================
     2. GEOCODIFICACIÓN
     ======================================================= */

  useEffect(() => {

    if (
      !geocoding ||
      registros.length === 0
    ) {

      return;

    }


    let cancelado = false;


    async function procesarGeocodificacion() {

      setGeocodificando(true);


      const geocoder =
        new geocoding.Geocoder();


      const resultados = [];


      for (
        const registro
        of registros
      ) {

        if (cancelado) {
          return;
        }


        /*
         * -----------------------------------------------
         * SI YA EXISTEN COORDENADAS
         * -----------------------------------------------
         */

        if (
          Number.isFinite(
            registro.latitud
          ) &&
          Number.isFinite(
            registro.longitud
          )
        ) {

          resultados.push({

            ...registro,

            lat:
              registro.latitud,

            lng:
              registro.longitud,

          });

          continue;

        }


        /*
         * -----------------------------------------------
         * CONSTRUIR DIRECCIÓN
         * -----------------------------------------------
         */

        const direccion = [
          registro.ciudad,
          registro.departamento,
          registro.pais || "Colombia",
        ]
          .filter(Boolean)
          .join(", ");


        if (!direccion) {
          continue;
        }


        try {

          const respuesta =
            await geocoder.geocode({
              address: direccion,
            });


          const resultado =
            respuesta.results?.[0];


          const posicion =
            resultado?.geometry?.location;


          if (!posicion) {
            continue;
          }


          resultados.push({

            ...registro,

            lat:
              posicion.lat(),

            lng:
              posicion.lng(),

          });


        } catch (err) {

          console.warn(
            "No se pudo geocodificar:",
            direccion,
            err
          );

        }

      }


      if (!cancelado) {

        console.log(
          "UBICACIONES GEOCODIFICADAS:",
          resultados.length
        );


        setUbicaciones(
          resultados
        );

        setGeocodificando(false);

      }

    }


    procesarGeocodificacion();


    return () => {

      cancelado = true;

    };

  }, [
    geocoding,
    registros,
  ]);


  /* =======================================================
     3. CIUDADES
     ======================================================= */

  const ciudades =
    useMemo(() => {

      return [
        ...new Set(
          registros
            .map(
              (registro) =>
                registro.ciudad
            )
            .filter(Boolean)
        ),
      ].sort(
        (a, b) =>
          a.localeCompare(b)
      );

    }, [registros]);


  /* =======================================================
     4. EMPRESAS
     ======================================================= */

  const empresas =
    useMemo(() => {

      return [
        ...new Set(
          registros
            .map(
              (registro) =>
                registro.empresa
            )
            .filter(Boolean)
        ),
      ].sort(
        (a, b) =>
          a.localeCompare(b)
      );

    }, [registros]);


  /* =======================================================
     5. FILTRAR REGISTROS
     ======================================================= */

  const registrosFiltrados =
    useMemo(() => {

      const texto =
        normalizarTexto(
          busqueda
        );


      return registros.filter(
        (registro) => {

          const contenido =
            normalizarTexto(
              [
                registro.nombre,
                registro.ciudad,
                registro.empresa,
                registro.cargo,
                registro.sector,
              ].join(" ")
            );


          const coincideBusqueda =
            !texto ||
            contenido.includes(texto);


          const coincideCiudad =
            !filtroCiudad ||
            registro.ciudad ===
              filtroCiudad;


          const coincideEmpresa =
            !filtroEmpresa ||
            registro.empresa ===
              filtroEmpresa;


          return (
            coincideBusqueda &&
            coincideCiudad &&
            coincideEmpresa
          );

        }
      );

    }, [
      registros,
      busqueda,
      filtroCiudad,
      filtroEmpresa,
    ]);


  /* =======================================================
     6. UBICACIONES FILTRADAS
     ======================================================= */

  const ubicacionesFiltradas =
    useMemo(() => {

      const ids =
        new Set(
          registrosFiltrados.map(
            (registro) =>
              registro.id
          )
        );


      return ubicaciones.filter(
        (ubicacion) =>
          ids.has(
            ubicacion.id
          )
      );

    }, [
      ubicaciones,
      registrosFiltrados,
    ]);


  /* =======================================================
     7. COLOR POR EGRESADO
     ======================================================= */

  const coloresEgresados =
    useMemo(() => {

      const mapa =
        new globalThis.Map();


      const ids = [
        ...new Set(
          registros.map(
            (registro) =>
              registro.egresadoId
          )
        ),
      ];


      ids.forEach(
        (id, index) => {

          mapa.set(
            id,
            COLORES[
              index %
              COLORES.length
            ]
          );

        }
      );


      return mapa;

    }, [registros]);


  /* =======================================================
     8. AGRUPAR TRAYECTORIAS
     ======================================================= */

  const trayectorias =
    useMemo(() => {

      const grupos =
        new globalThis.Map();


      ubicacionesFiltradas.forEach(
        (ubicacion) => {

          if (
            !grupos.has(
              ubicacion.egresadoId
            )
          ) {

            grupos.set(
              ubicacion.egresadoId,
              []
            );

          }


          grupos
            .get(
              ubicacion.egresadoId
            )
            .push(ubicacion);

        }
      );


      /*
       * Orden cronológico.
       */

      grupos.forEach(
        (puntos) => {

          puntos.sort(
            (a, b) => {

              const fechaA =
                a.fechaInicio || "";

              const fechaB =
                b.fechaInicio || "";

              return fechaA.localeCompare(
                fechaB
              );

            }
          );

        }
      );


      return grupos;

    }, [
      ubicacionesFiltradas,
    ]);


  /* =======================================================
     9. ESTADÍSTICAS
     ======================================================= */

  const totalEgresados =
    new Set(
      registrosFiltrados.map(
        (registro) =>
          registro.egresadoId
      )
    ).size;


  const totalCiudades =
    new Set(
      registrosFiltrados
        .map(
          (registro) =>
            registro.ciudad
        )
        .filter(Boolean)
    ).size;


  const totalTrayectorias =
    registrosFiltrados.length;


  const ciudadPrincipal =
    useMemo(() => {

      const conteo =
        new globalThis.Map();


      registrosFiltrados.forEach(
        (registro) => {

          if (!registro.ciudad) {
            return;
          }


          const ciudad =
            registro.ciudad.trim();


          conteo.set(
            ciudad,
            (conteo.get(ciudad) || 0) + 1
          );

        }
      );


      let mayor = 0;
      let ciudadMayor = "—";


      conteo.forEach(
        (cantidad, ciudad) => {

          if (
            cantidad > mayor
          ) {

            mayor = cantidad;
            ciudadMayor = ciudad;

          }

        }
      );


      return ciudadMayor;

    }, [
      registrosFiltrados,
    ]);


  /* =======================================================
     10. CENTRO DEL MAPA
     ======================================================= */

  const centroMapa =
    useMemo(() => {

      if (
        ubicacionesFiltradas.length === 0
      ) {

        return DEFAULT_CENTER;

      }


      const suma =
        ubicacionesFiltradas.reduce(
          (acumulado, ubicacion) => {

            return {

              lat:
                acumulado.lat +
                ubicacion.lat,

              lng:
                acumulado.lng +
                ubicacion.lng,

            };

          },
          {
            lat: 0,
            lng: 0,
          }
        );


      return {

        lat:
          suma.lat /
          ubicacionesFiltradas.length,

        lng:
          suma.lng /
          ubicacionesFiltradas.length,

      };

    }, [
      ubicacionesFiltradas,
    ]);


  /* =======================================================
     11. MARCADORES POR MODO
     ======================================================= */

  const marcadores =
    useMemo(() => {

      /*
       * MODO TODOS
       * -----------------------------------------------
       * Todas las ubicaciones.
       */

      if (modo === "todos") {

        return ubicacionesFiltradas;

      }


      /*
       * MODO TRAYECTORIAS
       * -----------------------------------------------
       * Todas las ubicaciones.
       */

      if (
        modo === "trayectorias"
      ) {

        return ubicacionesFiltradas;

      }


      /*
       * MODO CIUDADES
       * -----------------------------------------------
       * Un marcador por ciudad.
       */

      const ciudadesMapa =
        new globalThis.Map();


      ubicacionesFiltradas.forEach(
        (ubicacion) => {

          if (
            !ciudadesMapa.has(
              ubicacion.ciudad
            )
          ) {

            ciudadesMapa.set(
              ubicacion.ciudad,
              {

                ...ubicacion,

                registrosCiudad:
                  1,

              }
            );

          } else {

            const actual =
              ciudadesMapa.get(
                ubicacion.ciudad
              );


            actual.registrosCiudad += 1;

          }

        }
      );


      return [
        ...ciudadesMapa.values(),
      ];

    }, [
      modo,
      ubicacionesFiltradas,
    ]);


  /* =======================================================
     12. LIMPIAR FILTROS
     ======================================================= */

  function limpiarFiltros() {

    setBusqueda("");
    setFiltroCiudad("");
    setFiltroEmpresa("");

  }


  /* =======================================================
     13. RENDER
     ======================================================= */

  return (

    <section className="geo-page">


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="geo-header">

        <div>

          <span className="geo-eyebrow">
            ANÁLISIS GEOGRÁFICO
          </span>


          <h1>
            Geolocalización
            <span>
              {" "}de egresados
            </span>
          </h1>


          <p>
            Distribución geográfica y
            trayectoria profesional de
            los egresados.
          </p>

        </div>


        <div className="geo-status">

          <span className="geo-status-dot"></span>

          DATOS EN TIEMPO REAL

        </div>

      </header>


      {/* =================================================
          ESTADÍSTICAS
          ================================================= */}

      <div className="geo-stats">


        <article className="geo-stat-card">

          <div className="geo-stat-icon">
            ◉
          </div>

          <div>

            <small>
              EGRESADOS
            </small>

            <strong>
              {totalEgresados}
            </strong>

            <span>
              Representados
            </span>

          </div>

        </article>


        <article className="geo-stat-card">

          <div className="geo-stat-icon">
            ◇
          </div>

          <div>

            <small>
              CIUDADES
            </small>

            <strong>
              {totalCiudades}
            </strong>

            <span>
              Ubicaciones
            </span>

          </div>

        </article>


        <article className="geo-stat-card">

          <div className="geo-stat-icon">
            ↗
          </div>

          <div>

            <small>
              TRAYECTORIAS
            </small>

            <strong>
              {totalTrayectorias}
            </strong>

            <span>
              Registros laborales
            </span>

          </div>

        </article>


        <article className="geo-stat-card geo-stat-highlight">

          <div className="geo-stat-icon">
            ★
          </div>

          <div>

            <small>
              MAYOR CONCENTRACIÓN
            </small>

            <strong className="geo-stat-city">
              {ciudadPrincipal}
            </strong>

            <span>
              Ciudad
            </span>

          </div>

        </article>

      </div>


      {/* =================================================
          FILTROS
          ================================================= */}

      <div className="geo-filters">


        <div className="geo-search">

          <span>
            ⌕
          </span>

          <input
            type="text"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            placeholder="Buscar egresado, empresa o ciudad..."
          />

        </div>


        <select
          value={filtroCiudad}
          onChange={(e) =>
            setFiltroCiudad(
              e.target.value
            )
          }
        >

          <option value="">
            Todas las ciudades
          </option>

          {ciudades.map(
            (ciudad) => (

              <option
                key={ciudad}
                value={ciudad}
              >
                {ciudad}
              </option>

            )
          )}

        </select>


        <select
          value={filtroEmpresa}
          onChange={(e) =>
            setFiltroEmpresa(
              e.target.value
            )
          }
        >

          <option value="">
            Todas las empresas
          </option>

          {empresas.map(
            (empresa) => (

              <option
                key={empresa}
                value={empresa}
              >
                {empresa}
              </option>

            )
          )}

        </select>


        <button
          type="button"
          className="geo-clear-button"
          onClick={limpiarFiltros}
        >
          Limpiar
        </button>

      </div>


      {/* =================================================
          TOOLBAR
          ================================================= */}

      <div className="geo-toolbar">


        <div className="geo-modes">

          <span>
            VISUALIZACIÓN
          </span>


          <button
            type="button"
            className={
              modo === "todos"
                ? "active"
                : ""
            }
            onClick={() =>
              setModo("todos")
            }
          >
            Todos
          </button>


          <button
            type="button"
            className={
              modo === "ciudades"
                ? "active"
                : ""
            }
            onClick={() =>
              setModo("ciudades")
            }
          >
            Ciudades
          </button>


          <button
            type="button"
            className={
              modo === "trayectorias"
                ? "active"
                : ""
            }
            onClick={() =>
              setModo("trayectorias")
            }
          >
            Trayectorias
          </button>

        </div>


        <div className="geo-map-type">

          <button
            type="button"
            className={
              tipoMapa === "roadmap"
                ? "active"
                : ""
            }
            onClick={() =>
              setTipoMapa("roadmap")
            }
          >
            Mapa
          </button>


          <button
            type="button"
            className={
              tipoMapa === "satellite"
                ? "active"
                : ""
            }
            onClick={() =>
              setTipoMapa("satellite")
            }
          >
            Satélite
          </button>

        </div>

      </div>


      {/* =================================================
          MAPA
          ================================================= */}

      <div className="geolocalizacion-map">


        {cargando && (

          <div className="geo-loading">

            <div className="geo-spinner"></div>

            <span>
              Cargando egresados...
            </span>

          </div>

        )}


        {!cargando && error && (

          <div className="geolocalizacion-error">

            {error}

          </div>

        )}


        {!cargando &&
          !error &&
          geocodificando && (

            <div className="geo-loading">

              <div className="geo-spinner"></div>

              <span>
                Ubicando egresados en el mapa...
              </span>

            </div>

          )}


        {!cargando &&
          !error &&
          !geocodificando && (

            <Map
              mapId={MAP_ID}
              defaultCenter={centroMapa}
              defaultZoom={5}
              mapTypeId={tipoMapa}
              gestureHandling="greedy"
              fullscreenControl
              streetViewControl={false}
              mapTypeControl={false}
              style={{
                width: "100%",
                height: "100%",
              }}
            >


              {/* ==========================================
                  MARCADORES
                  ========================================== */}

              {marcadores.map((ubicacion) => {
                const color =
                  coloresEgresados.get(
                    ubicacion.egresadoId
                  ) || "#38BDF8";

                return (
                  <MarcadorConInfo
                    key={
                      modo === "ciudades"
                        ? `ciudad-${ubicacion.ciudad}`
                        : ubicacion.id
                    }
                    ubicacion={ubicacion}
                    color={color}
                  />
                );
              })}

              {/* ==========================================
                  LÍNEAS DE TRAYECTORIA
                  ========================================== */}

              {modo === "trayectorias" &&

                [
                  ...trayectorias.entries(),
                ].map(
                  ([
                    egresadoId,
                    puntos,
                  ]) => {

                    if (
                      puntos.length < 2
                    ) {

                      return null;

                    }


                    const color =
                      coloresEgresados.get(
                        egresadoId
                      ) ||
                      "#38BDF8";


                    return (

                      <Polyline
                        key={
                          `linea-${egresadoId}`
                        }
                        path={
                          puntos.map(
                            (punto) => ({
                              lat:
                                punto.lat,
                              lng:
                                punto.lng,
                            })
                          )
                        }
                        options={{
                          strokeColor:
                            color,

                          strokeOpacity:
                            0.85,

                          strokeWeight:
                            3,

                          geodesic:
                            true,

                        }}
                      />

                    );

                  }
                )
              }


            </Map>



          )}





        {/* ================================================
            INFORMACIÓN SUPERIOR DEL MAPA
            ================================================ */}

        {!cargando &&
          !error &&
          !geocodificando && (

            <div className="geo-map-overlay">

              <strong>
                {registrosFiltrados.length}
              </strong>

              <span>
                registros mostrados
              </span>

            </div>

          )
        }

      </div>


      {/* =================================================
          PIE DEL MAPA
          ================================================= */}

      <div className="geo-map-footer">

        <div className="geo-result-count">

          <strong>
            {ubicacionesFiltradas.length}
          </strong>

          <span>
            ubicaciones georreferenciadas
          </span>

        </div>


        <div className="geo-legend">

          <span>
            ●
          </span>

          <span>
            Cada color identifica a un egresado
          </span>

        </div>

      </div>

    </section>

  );

}


export default GeolocalizacionAdmin;