import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "./firebase";

import "./PanelAdministrador.css";

import EgresadosAdmin from "./EgresadosAdmin";

import GeolocalizacionAdmin from "./GeolocalizacionAdmin";

import DashboardAdmin from "./DashboardAdmin";

import MetricasIndicadoresAdmin from "./MetricasIndicadoresAdmin";
import EncuestasAdmin from "./EncuestasAdmin";

import { APIProvider } from "@vis.gl/react-google-maps";


/*
 * =========================================================
 * PANEL ADMINISTRADOR
 * =========================================================
 *
 * Este componente contiene:
 *
 * 01. Dashboard
 * 02. Egresados
 * 03. Geolocalización
 * 04. Métricas e indicadores
 * 05. Encuestas
 *
 * Google Maps se inicializa UNA SOLA VEZ mediante
 * APIProvider.
 *
 * IMPORTANTE:
 * NO colocar otro APIProvider dentro de
 * GeolocalizacionAdmin.
 *
 * =========================================================
 */


function PanelAdministrador({
  administrador,
  onLogout,
}) {


  /*
   * =====================================================
   * ESTADOS
   * =====================================================
   */

  const [vista, setVista] =
    useState("inicio");


  const [estadisticas, setEstadisticas] =
    useState({

      egresados: 0,

      trayectorias: 0,

      respuestas: 0,

      ubicaciones: 0,

    });


  const [
    cargandoEstadisticas,
    setCargandoEstadisticas,
  ] = useState(true);


  const [
    errorEstadisticas,
    setErrorEstadisticas,
  ] = useState("");


  /*
   * =====================================================
   * BLOQUEAR SCROLL DE LA PÁGINA PRINCIPAL
   * =====================================================
   *
   * El panel administra sus propios espacios de
   * desplazamiento.
   *
   * =====================================================
   */

  useEffect(() => {

    const scrollAnterior =
      document.body.style.overflow;


    document.body.style.overflow =
      "hidden";


    return () => {

      document.body.style.overflow =
        scrollAnterior;

    };

  }, []);


  /*
   * =====================================================
   * CARGAR ESTADÍSTICAS
   * =====================================================
   */

  useEffect(() => {

    const cargarEstadisticas =
      async () => {

        try {

          setCargandoEstadisticas(
            true
          );

          setErrorEstadisticas("");


          console.log(
            "================================="
          );

          console.log(
            "CARGANDO ESTADÍSTICAS ADMINISTRATIVAS"
          );

          console.log(
            "================================="
          );


          /*
           * =================================================
           * 1. EGRESADOS
           * =================================================
           */

          const egresadosRef =
            collection(
              db,
              "egresados"
            );


          const egresadosSnapshot =
            await getDocs(
              egresadosRef
            );


          const totalEgresados =
            egresadosSnapshot.size;


          console.log(
            "Total egresados:",
            totalEgresados
          );


          /*
           * =================================================
           * 2. CIUDADES ÚNICAS
           * =================================================
           */

          const ciudades =
            new Set();


          egresadosSnapshot.forEach(
            (documento) => {

              const datos =
                documento.data();


              const ciudad =
                datos.ciudadTrabajo;


              if (
                typeof ciudad === "string" &&
                ciudad.trim() !== ""
              ) {

                ciudades.add(
                  ciudad
                    .trim()
                    .toLowerCase()
                );

              }

            }
          );


          const totalUbicaciones =
            ciudades.size;


          console.log(
            "Total ciudades:",
            totalUbicaciones
          );


          /*
           * =================================================
           * 3. TRAYECTORIAS LABORALES
           * =================================================
           */

          let totalTrayectorias = 0;


          for (
            const documento
            of egresadosSnapshot.docs
          ) {

            const trayectoriaRef =
              collection(
                db,
                "egresados",
                documento.id,
                "trayectoriaLaboral"
              );


            const trayectoriaSnapshot =
              await getDocs(
                trayectoriaRef
              );


            totalTrayectorias +=
              trayectoriaSnapshot.size;


            console.log(
              "Egresado:",
              documento.id,
              "→ experiencias:",
              trayectoriaSnapshot.size
            );

          }


          console.log(
            "Total trayectorias:",
            totalTrayectorias
          );


          /*
           * =================================================
           * 4. RESPUESTAS DE ENCUESTAS
           * =================================================
           */

          const respuestasRef =
            collection(
              db,
              "respuestasEncuestas"
            );


          const respuestasSnapshot =
            await getDocs(
              respuestasRef
            );


          const totalRespuestas =
            respuestasSnapshot.size;


          console.log(
            "Total respuestas:",
            totalRespuestas
          );


          /*
           * =================================================
           * 5. GUARDAR ESTADÍSTICAS
           * =================================================
           */

          setEstadisticas({

            egresados:
              totalEgresados,

            trayectorias:
              totalTrayectorias,

            respuestas:
              totalRespuestas,

            ubicaciones:
              totalUbicaciones,

          });


          console.log(
            "================================="
          );

          console.log(
            "ESTADÍSTICAS CARGADAS CORRECTAMENTE"
          );

          console.log(
            "================================="
          );


        } catch (error) {

          console.error(
            "================================="
          );

          console.error(
            "ERROR CARGANDO ESTADÍSTICAS"
          );

          console.error(
            error
          );

          console.error(
            "================================="
          );


          setErrorEstadisticas(
            "No fue posible cargar las estadísticas."
          );


        } finally {

          setCargandoEstadisticas(
            false
          );

        }

      };


    cargarEstadisticas();

  }, []);


  /*
   * =====================================================
   * MOSTRAR ESTADÍSTICA
   * =====================================================
   */

  const mostrarEstadistica =
    (valor) => {

      if (
        cargandoEstadisticas
      ) {

        return "...";

      }


      return valor;

    };


  /*
   * =====================================================
   * VISTA PRINCIPAL
   * =====================================================
   *
   * IMPORTANTE:
   *
   * APIProvider está AQUÍ.
   *
   * No está dentro del módulo de geolocalización.
   * No está dentro de GeolocalizacionAdmin.
   *
   * Así Google Maps se carga una sola vez.
   *
   * =====================================================
   */

  return (

    <APIProvider
      apiKey={
        import.meta.env
          .VITE_GOOGLE_MAPS_API_KEY
      }
      region="CO"
    >

      <div className="panel-admin">


        {/* =================================================
            HEADER
            ================================================= */}

        <header className="admin-header">


          <div className="admin-brand">

            <img
              src="/logo-conecta-tel.png"
              alt="CONECTA-TEL"
            />

          </div>


          <div className="admin-header-right">


            <div className="admin-user">

              <span
                className="admin-status-dot"
              ></span>


              <div
                className="admin-user-info"
              >

                <strong>

                  {
                    administrador?.nombre ||
                    "Administrador"
                  }

                </strong>


                <span>
                  Administrador
                </span>

              </div>

            </div>


            <button
              type="button"
              className="admin-logout"
              onClick={onLogout}
            >

              Cerrar sesión

            </button>


          </div>


        </header>


        {/* =================================================
            CONTENIDO
            ================================================= */}

        <main className="admin-content">


          {/* =================================================
              BIENVENIDA
              ================================================= */}

          <section
            className="admin-welcome"
          >


            <div
              className="admin-welcome-label"
            >

              <span></span>

              PANEL ADMINISTRATIVO

            </div>


            <h1>

              Hola,{" "}

              <strong>
                Administrador
              </strong>

            </h1>


            <p>

              Gestiona, analiza y visualiza
              la información de los egresados
              de Ingeniería de
              Telecomunicaciones.

            </p>


          </section>


          {/* =================================================
              RESUMEN
              ================================================= */}

          <section
            className="admin-summary"
          >


            <div
              className="admin-summary-heading"
            >

              <span>
                INFORMACIÓN INSTITUCIONAL
              </span>


              <h2>
                Resumen de CONECTA-TEL
              </h2>

            </div>


            {/* ERROR */}

            {errorEstadisticas && (

              <div
                className="admin-stat-error"
              >

                {errorEstadisticas}

              </div>

            )}


            <div
              className="admin-summary-grid"
            >


              {/* =================================================
                  EGRESADOS
                  ================================================= */}

              <div
                className="admin-summary-item"
              >

                <span>
                  EGRESADOS
                </span>


                <strong>

                  {
                    mostrarEstadistica(
                      estadisticas.egresados
                    )
                  }

                </strong>


                <small>
                  Registrados en la plataforma
                </small>

              </div>


              {/* =================================================
                  TRAYECTORIAS
                  ================================================= */}

              <div
                className="admin-summary-item"
              >

                <span>
                  TRAYECTORIAS
                </span>


                <strong>

                  {
                    mostrarEstadistica(
                      estadisticas.trayectorias
                    )
                  }

                </strong>


                <small>
                  Registros profesionales
                </small>

              </div>


              {/* =================================================
                  RESPUESTAS
                  ================================================= */}

              <div
                className="admin-summary-item"
              >

                <span>
                  RESPUESTAS
                </span>


                <strong>

                  {
                    mostrarEstadistica(
                      estadisticas.respuestas
                    )
                  }

                </strong>


                <small>
                  Respuestas de encuestas
                </small>

              </div>


              {/* =================================================
                  UBICACIONES
                  ================================================= */}

              <div
                className="admin-summary-item"
              >

                <span>
                  UBICACIONES
                </span>


                <strong>

                  {
                    mostrarEstadistica(
                      estadisticas.ubicaciones
                    )
                  }

                </strong>


                <small>
                  Ciudades registradas
                </small>

              </div>


            </div>


          </section>


          {/* =================================================
              MÓDULOS ADMINISTRATIVOS
              ================================================= */}

          <section
            className="admin-modules"
          >


            <div
              className="admin-modules-heading"
            >

              <span>
                GESTIÓN Y ANÁLISIS
              </span>


              <p>
                Accede a las herramientas
                administrativas de
                CONECTA-TEL.
              </p>

            </div>


            <div
              className="admin-module-list"
            >


              {/* =================================================
                  DASHBOARD
                  ================================================= */}

              <button
                type="button"
                className={
                  `admin-module-item ${
                    vista === "dashboard"
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setVista(
                    "dashboard"
                  )
                }
              >

                <div
                  className="admin-module-number"
                >
                  01
                </div>


                <div
                  className="admin-module-info"
                >

                  <h3>
                    Dashboard
                  </h3>

                  <p>
                    Consulta los principales
                    indicadores y resultados
                    generales de los egresados.
                  </p>

                </div>


                <div
                  className="admin-module-arrow"
                >
                  →
                </div>

              </button>


              {/* =================================================
                  EGRESADOS
                  ================================================= */}

              <button
                type="button"
                className={
                  `admin-module-item ${
                    vista === "egresados"
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setVista(
                    "egresados"
                  )
                }
              >

                <div
                  className="admin-module-number"
                >
                  02
                </div>


                <div
                  className="admin-module-info"
                >

                  <h3>
                    Egresados
                  </h3>

                  <p>
                    Consulta y gestiona la
                    información de los
                    egresados registrados.
                  </p>

                </div>


                <div
                  className="admin-module-arrow"
                >
                  →
                </div>

              </button>


              {/* =================================================
                  GEOLOCALIZACIÓN
                  ================================================= */}

              <button
                type="button"
                className={
                  `admin-module-item ${
                    vista === "mapa"
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setVista(
                    "mapa"
                  )
                }
              >

                <div
                  className="admin-module-number"
                >
                  03
                </div>


                <div
                  className="admin-module-info"
                >

                  <h3>
                    Geolocalización
                  </h3>

                  <p>
                    Visualiza la distribución
                    geográfica de los
                    egresados.
                  </p>

                </div>


                <div
                  className="admin-module-arrow"
                >
                  →
                </div>

              </button>


              {/* =================================================
                  MÉTRICAS
                  ================================================= */}

              <button
                type="button"
                className={
                  `admin-module-item ${
                    vista === "metricas"
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setVista(
                    "metricas"
                  )
                }
              >

                <div
                  className="admin-module-number"
                >
                  04
                </div>


                <div
                  className="admin-module-info"
                >

                  <h3>
                    Métricas e indicadores
                  </h3>

                  <p>
                    Analiza situación laboral,
                    formación, sectores y áreas
                    profesionales.
                  </p>

                </div>


                <div
                  className="admin-module-arrow"
                >
                  →
                </div>

              </button>


              {/* =================================================
                  ENCUESTAS
                  ================================================= */}

              <button
                type="button"
                className={
                  `admin-module-item ${
                    vista === "encuestas"
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setVista(
                    "encuestas"
                  )
                }
              >

                <div
                  className="admin-module-number"
                >
                  05
                </div>


                <div
                  className="admin-module-info"
                >

                  <h3>
                    Encuestas
                  </h3>

                  <p>
                    Gestiona encuestas,
                    preguntas y resultados
                    de caracterización.
                  </p>

                </div>


                <div
                  className="admin-module-arrow"
                >
                  →
                </div>

              </button>


            </div>


          </section>

          {/* =========================================================
              MODAL DASHBOARD
              ========================================================= */}

          {vista === "dashboard" && (

            <div
              className="admin-modal-overlay dashboard-modal-overlay"
              onClick={() =>
                setVista("inicio")
              }
            >

              <div
                className="
                  admin-modal-window
                  dashboard-modal-window
                "
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() =>
                    setVista("inicio")
                  }
                  aria-label="Cerrar Dashboard"
                >
                  ×
                </button>

                <DashboardAdmin />

              </div>

            </div>

          )}

          {/* =================================================
              CONTENIDO DEL MÓDULO EGRESADOS
              ================================================= */}

          {vista === "egresados" && (

            <div
              className="admin-modal-overlay"
              onClick={() =>
                setVista(
                  "inicio"
                )
              }
            >

              <div
                className="admin-modal-window"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() =>
                    setVista(
                      "inicio"
                    )
                  }
                  aria-label="Cerrar"
                >
                  ×
                </button>


                <EgresadosAdmin />


              </div>

            </div>

          )}


          {/* =========================================================
              MODAL GEOLOCALIZACIÓN
              =========================================================
              
              IMPORTANTE:
              
              NO hay APIProvider aquí.
              
              El APIProvider único está arriba,
              envolviendo todo el PanelAdministrador.
              
              ========================================================= */}

          {vista === "mapa" && (

            <div
              className="admin-modal-overlay"
              onClick={() =>
                setVista(
                  "inicio"
                )
              }
            >

              <div
                className="
                  admin-modal-window
                  geolocalizacion-modal
                "
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() =>
                    setVista(
                      "inicio"
                    )
                  }
                  aria-label="Cerrar geolocalización"
                >
                  ×
                </button>


                <GeolocalizacionAdmin />


              </div>

            </div>

          )}


          {/* =================================================
              MODAL MÉTRICAS E INDICADORES
              ================================================= */}

          {vista === "metricas" && (

            <div
              className="admin-modal-overlay"
              onClick={() =>
                setVista("inicio")
              }
            >

              <div
                className="
                  admin-modal-window
                  metricas-modal-window
                "
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() =>
                    setVista("inicio")
                  }
                  aria-label="Cerrar métricas e indicadores"
                >
                  ×
                </button>

                <MetricasIndicadoresAdmin />

              </div>

            </div>

          )}


          {vista === "encuestas" && (
            <div
              className="admin-modal-overlay"
              onClick={() => setVista("inicio")}
            >
              <div
                className="admin-modal-window encuestas-modal-window"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setVista("inicio")}
                  aria-label="Cerrar encuestas"
                >
                  ×
                </button>
                <EncuestasAdmin />
              </div>
            </div>
          )}

          {/* =================================================
              ESTADO DEL SISTEMA
              ================================================= */}

          <section
            className="admin-system"
          >


            <div>

              <span
                className="admin-system-label"
              >
                ESTADO DEL SISTEMA
              </span>


              <h2>
                Plataforma operativa
              </h2>

            </div>


            <div
              className="admin-system-status"
            >

              <span></span>

              Sesión administrativa activa

            </div>


          </section>


          {/* =================================================
              FOOTER
              ================================================= */}

          <footer
            className="admin-footer"
          >


            <div>

              <strong>
                CONECTA-TEL
              </strong>


              <span>
                Ingeniería de Telecomunicaciones
              </span>

            </div>


            <span>
              Plataforma inteligente para el
              seguimiento y caracterización
              de egresados
            </span>


          </footer>


        </main>


      </div>

    </APIProvider>

  );

}


export default PanelAdministrador;