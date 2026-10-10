import { useEffect, useState } from "react";
import PerfilEgresado from "./PerfilEgresado";
import "./PanelEgresado.css";
import TrayectoriaProfesional from "./TrayectoriaProfesional";
import Encuestas from "./Encuestas";

function PanelEgresado({ egresado, onLogout }) {

  const [vista, setVista] = useState("panel");

  const [datosEgresado, setDatosEgresado] = useState(egresado);


  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);


  /*
   * =====================================================
   * PERFIL DEL EGRESADO
   * =====================================================
   */

  if (vista === "perfil") {
    return (
      <PerfilEgresado
        egresado={datosEgresado}
        onLogout={onLogout}
        onBack={() => setVista("panel")}
        onUpdated={(datosActualizados) => {
          setDatosEgresado(datosActualizados);
        }}
      />
    );
  }

  /*
 * =====================================================
 * TRAYECTORIA PROFESIONAL
 * =====================================================
 */

  if (vista === "trayectoria") {
    return (
      <TrayectoriaProfesional
        egresado={datosEgresado}
        onLogout={onLogout}
        onBack={() => setVista("panel")}
      />
    );
  }
  /*
 * =====================================================
 * ENCUESTAS
 * =====================================================
 */
  if (vista === "encuestas") {
    return (
      <Encuestas
        egresado={datosEgresado}
        onVolver={() => setVista("panel")}
        onLogout={onLogout}
      />
    );
  }

  /*
   * =====================================================
   * PANEL PRINCIPAL
   * =====================================================
   */

  return (
    <div className="panel-egresado">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="panel-header">

        <div className="panel-brand">

          <img
            src="/logo-conecta-tel.png"
            alt="CONECTA-TEL"
          />

        </div>


        <div className="panel-header-right">

          <span className="panel-status">

            <span className="status-dot"></span>

            Sesión activa

          </span>


          <button
            type="button"
            className="panel-logout"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>

        </div>

      </header>


      {/* =================================================
          CONTENIDO
          ================================================= */}

      <main className="panel-content">


        {/* =================================================
            BIENVENIDA
            ================================================= */}

        <section className="panel-welcome">

          <div className="welcome-label">

            <span></span>

            PLATAFORMA DEL EGRESADO

          </div>


          <h1>
            Hola, <strong>{datosEgresado.nombres}</strong>
          </h1>


          <p>
            Tu trayectoria profesional, conectada.
          </p>

        </section>


        {/* =================================================
            RESUMEN PROFESIONAL
            ================================================= */}

        <section className="professional-summary">

          <div className="summary-heading">

            <div>

              <span>
                INFORMACIÓN ACTUAL
              </span>

              <h2>
                Tu perfil profesional
              </h2>

            </div>

          </div>


          <div className="summary-grid">

            <div className="summary-item">

              <span className="summary-label">
                EMPRESA ACTUAL
              </span>

              <strong>
                {datosEgresado.empresaActual || "No registrada"}
              </strong>

            </div>


            <div className="summary-item">

              <span className="summary-label">
                CARGO ACTUAL
              </span>

              <strong>
                {datosEgresado.cargoActual || "No registrado"}
              </strong>

            </div>


            <div className="summary-item">

              <span className="summary-label">
                CIUDAD DE TRABAJO
              </span>

              <strong>
                {datosEgresado.ciudadTrabajo || "No registrada"}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            MÓDULOS
            ================================================= */}

        <section className="panel-modules">

          <div className="modules-heading">

            <span>
              TU ESPACIO
            </span>

            <p>
              Gestiona la información que forma parte de tu trayectoria.
            </p>

          </div>


          <div className="module-list">


            {/* =============================================
                MI PERFIL
                ============================================= */}

            <button
              type="button"
              className="module-item"
              onClick={() => setVista("perfil")}
            >

              <div className="module-number">
                01
              </div>


              <div className="module-info">

                <h3>
                  Mi perfil
                </h3>

                <p>
                  Consulta y actualiza tu información académica y profesional.
                </p>

              </div>


              <div className="module-arrow">
                →
              </div>

            </button>


            {/* =============================================
                TRAYECTORIA PROFESIONAL
                ============================================= */}

            <button
              type="button"
              className="module-item"
              onClick={() => setVista("trayectoria")}
            >

              <div className="module-number">
                02
              </div>


              <div className="module-info">

                <h3>
                  Trayectoria profesional
                </h3>

                <p>
                  Registra y consulta tu historial laboral y ubicación geográfica.
                </p>

              </div>


              <div className="module-arrow">
                →
              </div>

            </button>


            {/* =============================================
                ENCUESTAS
                ============================================= */}

            <button
              type="button"
              className="module-item"
              onClick={() => setVista("encuestas")}
            >

              <div className="module-number">
                03
              </div>


              <div className="module-info">

                <h3>
                  Encuestas
                </h3>

                <p>
                  Actualiza tu información y participa en los procesos de caracterización.
                </p>

              </div>


              <div className="module-arrow">
                →
              </div>

            </button>

          </div>

        </section>


        {/* =================================================
            FOOTER
            ================================================= */}

        <footer className="panel-footer">

          <div>

            <strong>
              CONECTA-TEL
            </strong>

            <span>
              Ingeniería de Telecomunicaciones
            </span>

          </div>


          <span>
            Plataforma de seguimiento y caracterización de egresados
          </span>

        </footer>

      </main>

    </div>
  );
}

export default PanelEgresado;