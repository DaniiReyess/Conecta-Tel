import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "./firebase";
import FormularioEncuesta from "./FormularioEncuesta";
import "./Encuestas.css";

function Encuestas({
  egresado,
  onVolver,
  onLogout,
}) {

  /*
   * =====================================================
   * ESTADOS
   * =====================================================
   */

  const [encuestas, setEncuestas] = useState([]);

  const [respuestas, setRespuestas] = useState([]);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");

  const [
    encuestaSeleccionada,
    setEncuestaSeleccionada
  ] = useState(null);


  /*
   * =====================================================
   * CARGAR ENCUESTAS
   * =====================================================
   */

  useEffect(() => {

    cargarEncuestas();

  }, [egresado?.id]);


  /*
   * =====================================================
   * CONSULTAR FIRESTORE
   * =====================================================
   */

  const cargarEncuestas = async () => {

    if (!egresado?.id) {

      setError(
        "No se encontró la información del egresado."
      );

      setCargando(false);

      return;
    }


    try {

      setCargando(true);

      setError("");


      /*
       * =================================================
       * ENCUESTAS ACTIVAS
       * =================================================
       */

      const encuestasRef =
        collection(db, "encuestas");


      const consultaEncuestas =
        query(
          encuestasRef,
          where("estado", "==", "ACTIVA")
        );


      const snapshotEncuestas =
        await getDocs(
          consultaEncuestas
        );


      const encuestasData =
        snapshotEncuestas.docs
          .map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }))
          .sort((a, b) =>
            a.id.localeCompare(b.id)
          );


      setEncuestas(encuestasData);


      /*
       * =================================================
       * RESPUESTAS DEL EGRESADO
       * =================================================
       */

      const respuestasRef =
        collection(
          db,
          "respuestasEncuestas"
        );


      const consultaRespuestas =
        query(
          respuestasRef,
          where(
            "egresadoId",
            "==",
            egresado.id
          )
        );


      const snapshotRespuestas =
        await getDocs(
          consultaRespuestas
        );


      const respuestasData =
        snapshotRespuestas.docs.map(
          (documento) => ({
            id: documento.id,
            ...documento.data(),
          })
        );


      setRespuestas(
        respuestasData
      );


    } catch (error) {

      console.error(
        "Error cargando encuestas:",
        error
      );


      setError(
        "No fue posible cargar las encuestas. Intenta nuevamente."
      );


    } finally {

      setCargando(false);

    }

  };


  /*
   * =====================================================
   * VALIDAR SI YA RESPONDIÓ
   * =====================================================
   */

  const encuestaRespondida = (
    encuestaId
  ) => {

    return respuestas.some(
      (respuesta) =>
        respuesta.encuestaId === encuestaId
    );

  };


  /*
   * =====================================================
   * ABRIR ENCUESTA
   * =====================================================
   */

  const abrirEncuesta = (
    encuesta
  ) => {

    setEncuestaSeleccionada(
      encuesta
    );

  };


  /*
   * =====================================================
   * CERRAR ENCUESTA
   * =====================================================
   */

  const cerrarEncuesta = () => {

    setEncuestaSeleccionada(null);

  };


  /*
   * =====================================================
   * ENCUESTA RESPONDIDA
   * =====================================================
   */

  const encuestaRespondidaCorrectamente = () => {

    cerrarEncuesta();

    cargarEncuestas();

  };


  /*
   * =====================================================
   * FORMULARIO DE ENCUESTA
   * =====================================================
   */

  if (encuestaSeleccionada) {

    return (

      <FormularioEncuesta
        egresado={egresado}
        encuesta={encuestaSeleccionada}
        onCancel={cerrarEncuesta}
        onSaved={
          encuestaRespondidaCorrectamente
        }
      />

    );

  }


  /*
   * =====================================================
   * CARGANDO
   * =====================================================
   */

  if (cargando) {

    return (

      <div className="encuestas-page">

        <header className="encuestas-header">

          <button
            type="button"
            className="encuestas-back"
            onClick={onVolver}
          >
            ← Volver
          </button>


          <img
            src="/logo-conecta-tel.png"
            alt="CONECTA-TEL"
            className="encuestas-logo"
          />


          <button
            type="button"
            className="encuestas-logout"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>

        </header>


        <main className="encuestas-content">

          <div className="encuestas-loading">

            <div className="encuestas-loading-line"></div>

            <span>
              CARGANDO ENCUESTAS
            </span>

            <p>
              Consultando las encuestas disponibles...
            </p>

          </div>

        </main>

      </div>

    );

  }


  /*
   * =====================================================
   * ERROR
   * =====================================================
   */

  if (error) {

    return (

      <div className="encuestas-page">

        <header className="encuestas-header">

          <button
            type="button"
            className="encuestas-back"
            onClick={onVolver}
          >
            ← Volver
          </button>


          <img
            src="/logo-conecta-tel.png"
            alt="CONECTA-TEL"
            className="encuestas-logo"
          />


          <button
            type="button"
            className="encuestas-logout"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>

        </header>


        <main className="encuestas-content">

          <div className="encuestas-error">

            <span>
              NO FUE POSIBLE CARGAR LA INFORMACIÓN
            </span>

            <h2>
              No pudimos cargar tus encuestas.
            </h2>

            <p>
              {error}
            </p>


            <button
              type="button"
              className="encuestas-retry-btn"
              onClick={cargarEncuestas}
            >
              Intentar nuevamente
              <span>→</span>
            </button>

          </div>

        </main>

      </div>

    );

  }


  /*
   * =====================================================
   * VISTA PRINCIPAL
   * =====================================================
   */

  return (

    <div className="encuestas-page">


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="encuestas-header">


        <button
          type="button"
          className="encuestas-back"
          onClick={onVolver}
        >
          ← Volver
        </button>


        <img
          src="/logo-conecta-tel.png"
          alt="CONECTA-TEL"
          className="encuestas-logo"
        />


        <button
          type="button"
          className="encuestas-logout"
          onClick={onLogout}
        >
          Cerrar sesión
        </button>


      </header>


      {/* =================================================
          CONTENIDO
          ================================================= */}

      <main className="encuestas-content">


        {/* =================================================
            ENCABEZADO
            ================================================= */}

        <section className="encuestas-title">

          <span>
            ENCUESTAS
          </span>


          <h1>
            Tu experiencia,
            <br />
            <strong>
              también cuenta.
            </strong>
          </h1>


          <p>
            Participa en nuestras encuestas y contribuye
            a fortalecer el seguimiento y caracterización
            de los egresados de Ingeniería de Telecomunicaciones.
          </p>

        </section>


        {/* =================================================
            ENCUESTAS DISPONIBLES
            ================================================= */}

        <section className="encuestas-section">


          <div className="encuestas-section-heading">

            <span>
              ENCUESTAS DISPONIBLES
            </span>

            <p>
              Participa en los procesos de caracterización
              profesional.
            </p>

          </div>


          {/* =================================================
              LISTADO
              ================================================= */}

          {encuestas.length > 0 && (

            <div className="encuestas-list">

              {encuestas.map(
                (encuesta, index) => {

                  const respondida =
                    encuestaRespondida(
                      encuesta.id
                    );


                  const cantidadPreguntas =
                    encuesta.id === "encuesta02"
                      ? 8
                      : 10;


                  return (

                    <article
                      className={
                        `encuesta-card ${
                          respondida
                            ? "encuesta-card-respondida"
                            : ""
                        }`
                      }
                      key={encuesta.id}
                    >


                      {/* NÚMERO */}

                      <div className="encuesta-number">

                        {String(
                          index + 1
                        ).padStart(2, "0")}

                      </div>


                      {/* INFORMACIÓN */}

                      <div className="encuesta-info">

                        <div className="encuesta-top">

                          <span>
                            ENCUESTA
                          </span>


                          {respondida ? (

                            <span className="encuesta-status respondida">
                              ✓ RESPONDIDA
                            </span>

                          ) : (

                            <span className="encuesta-status disponible">
                              DISPONIBLE
                            </span>

                          )}

                        </div>


                        <h2>
                          {encuesta.titulo}
                        </h2>


                        <p>
                          {encuesta.descripcion}
                        </p>


                        <div className="encuesta-meta">

                          <span>
                            {cantidadPreguntas} preguntas
                          </span>

                          <span>
                            2–3 min
                          </span>

                        </div>

                      </div>


                      {/* ACCIÓN */}

                      <div className="encuesta-action">

                        {respondida ? (

                          <div className="encuesta-completed">

                            <span>
                              ✓
                            </span>

                            <small>
                              COMPLETADA
                            </small>

                          </div>

                        ) : (

                          <button
                            type="button"
                            className="encuesta-answer-btn"
                            onClick={() =>
                              abrirEncuesta(
                                encuesta
                              )
                            }
                          >
                            Responder

                            <span>
                              →
                            </span>

                          </button>

                        )}

                      </div>


                    </article>

                  );

                }
              )}

            </div>

          )}


          {/* =================================================
              SIN ENCUESTAS
              ================================================= */}

          {encuestas.length === 0 && (

            <div className="encuestas-empty">

              <div className="encuestas-empty-line"></div>

              <span>
                SIN ENCUESTAS DISPONIBLES
              </span>


              <h2>
                Actualmente no hay encuestas activas.
              </h2>


              <p>
                Cuando exista una encuesta disponible,
                aparecerá en este espacio.
              </p>

            </div>

          )}

        </section>


      </main>

    </div>

  );

}


export default Encuestas;