import { useEffect, useState } from "react";
import EditarPerfil from "./EditarPerfil";
import "./PerfilEgresado.css";

function formatearFecha(fecha) {
  if (!fecha) return "No registrada";

  if (typeof fecha?.toDate === "function") {
    return fecha.toDate().toLocaleDateString("es-CO");
  }

  if (
    typeof fecha === "object" &&
    typeof fecha.seconds === "number"
  ) {
    return new Date(fecha.seconds * 1000).toLocaleDateString("es-CO");
  }

  if (typeof fecha === "string") {
    const fechaValida = new Date(fecha);

    if (!Number.isNaN(fechaValida.getTime())) {
      return fechaValida.toLocaleDateString("es-CO");
    }

    return fecha;
  }

  return "No registrada";
}

function PerfilEgresado({
  egresado,
  onLogout,
  onBack,
  onUpdated,
}) {

  const [modoEdicion, setModoEdicion] = useState(false);


  /*
   * =====================================================
   * CONTROL DEL SCROLL
   * =====================================================
   */

  useEffect(() => {

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {

      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";

    };

  }, []);


  /*
   * =====================================================
   * MODO EDICIÓN
   * =====================================================
   */

  if (modoEdicion) {

    return (
      <EditarPerfil

        egresado={egresado}

        onCancel={() => {
          setModoEdicion(false);
        }}

        onSaved={(datosActualizados) => {

          onUpdated(datosActualizados);

          setModoEdicion(false);

        }}

      />
    );

  }


  /*
   * =====================================================
   * PERFIL DEL EGRESADO
   * =====================================================
   */

  return (

    <div className="perfil-page">


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="perfil-header">


        <button
          type="button"
          className="perfil-back"
          onClick={onBack}
        >
          ← Volver
        </button>


        <img
          src="/logo-conecta-tel.png"
          alt="CONECTA-TEL"
          className="perfil-logo"
        />


        <button
          type="button"
          className="perfil-logout"
          onClick={onLogout}
        >
          Cerrar sesión
        </button>


      </header>


      {/* =================================================
          CONTENIDO
          ================================================= */}

      <main className="perfil-content">


        {/* =================================================
            ENCABEZADO DEL PERFIL
            ================================================= */}

        <div className="perfil-title">


          <span>
            PERFIL DEL EGRESADO
          </span>


          <h1>
            {egresado.nombres} {egresado.apellidos}
          </h1>


          <p>
            Información profesional registrada en CONECTA-TEL
          </p>


          {/* =================================================
              BOTÓN EDITAR
              ================================================= */}

          <button
            type="button"
            className="perfil-editar-btn"
            onClick={() => setModoEdicion(true)}
          >
            Editar información
            <span>→</span>
          </button>


        </div>


        {/* =================================================
            INFORMACIÓN
            ================================================= */}

        <section className="perfil-grid">


          {/* =================================================
              INFORMACIÓN ACADÉMICA
              ================================================= */}

          <article className="perfil-card">

            <span className="perfil-card-label">
              INFORMACIÓN ACADÉMICA
            </span>


            <div className="perfil-data">


              <div>

                <small>
                  Nivel de formación
                </small>

                <strong>
                  {egresado.nivelFormacion || "No registrado"}
                </strong>

              </div>


              <div>

                <small>
                  Fecha de grado
                </small>

                <strong>
                  {formatearFecha(egresado.fechaGrado)}
                </strong>

              </div>


              <div>

                <small>
                  Sexo biológico
                </small>

                <strong>
                  {egresado.sexoBiologico || "No registrado"}
                </strong>

              </div>


            </div>

          </article>


          {/* =================================================
              INFORMACIÓN PROFESIONAL
              ================================================= */}

          <article className="perfil-card">

            <span className="perfil-card-label">
              INFORMACIÓN PROFESIONAL
            </span>


            <div className="perfil-data">


              <div>

                <small>
                  Empresa actual
                </small>

                <strong>
                  {egresado.empresaActual || "No registrada"}
                </strong>

              </div>


              <div>

                <small>
                  Cargo actual
                </small>

                <strong>
                  {egresado.cargoActual || "No registrado"}
                </strong>

              </div>


              <div>

                <small>
                  Ciudad de trabajo
                </small>

                <strong>
                  {egresado.ciudadTrabajo || "No registrada"}
                </strong>

              </div>


            </div>

          </article>


          {/* =================================================
              DESCRIPCIÓN PROFESIONAL
              ================================================= */}

          <article className="perfil-card perfil-card-full">

            <span className="perfil-card-label">
              DESCRIPCIÓN PROFESIONAL
            </span>


            <p className="perfil-description">

              {egresado.descripcionProfesional ||
                "No hay una descripción profesional registrada."}

            </p>

          </article>


          {/* =================================================
              CONTACTO
              ================================================= */}

          <article className="perfil-card">

            <span className="perfil-card-label">
              CONTACTO
            </span>


            <div className="perfil-data">


              <div>

                <small>
                  Correo
                </small>

                <strong>
                  {egresado.correos?.[0] || "No registrado"}
                </strong>

              </div>


              <div>

                <small>
                  Teléfono
                </small>

                <strong>
                  {egresado.telefonos?.[0] || "No registrado"}
                </strong>

              </div>


            </div>

          </article>


          {/* =================================================
              REDES PROFESIONALES
              ================================================= */}

          <article className="perfil-card">

            <span className="perfil-card-label">
              REDES PROFESIONALES
            </span>


            <div className="perfil-links">


              {egresado.linkedinUrl && (

                <a
                  href={egresado.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn ↗
                </a>

              )}


              {egresado.facebookUrl && (

                <a
                  href={egresado.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook ↗
                </a>

              )}


              {!egresado.linkedinUrl &&
                !egresado.facebookUrl && (

                  <span>
                    No hay redes registradas.
                  </span>

                )}


            </div>

          </article>


        </section>


      </main>


    </div>

  );
}

export default PerfilEgresado;