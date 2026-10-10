import { useEffect, useMemo, useState } from "react";

import {
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

import "./FormularioEncuesta.css";


function FormularioEncuesta({
  egresado,
  encuesta,
  onCancel,
  onSaved,
  onLogout,
}) {

  /* =====================================================
     ESTADOS
     ===================================================== */

  const [preguntas, setPreguntas] = useState([]);

  const [respuestas, setRespuestas] = useState({});

  const [errores, setErrores] = useState({});

  const [cargando, setCargando] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");


  /* =====================================================
     CONTROL DEL SCROLL
     ===================================================== */

  useEffect(() => {

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {

      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";

    };

  }, []);


  /* =====================================================
     CARGAR PREGUNTAS
     ===================================================== */

  useEffect(() => {

    cargarPreguntas();

  }, [encuesta?.id]);


  const cargarPreguntas = async () => {

    if (!encuesta?.id) {

      setError(
        "No se encontró la encuesta seleccionada."
      );

      setCargando(false);

      return;

    }


    try {

      setCargando(true);

      setError("");


      /*
       * IMPORTANTE:
       *
       * NO utilizamos orderBy() aquí.
       *
       * Así evitamos que Firestore descarte documentos
       * que no tengan exactamente el campo "orden".
       */

      const preguntasRef = collection(
        db,
        "encuestas",
        encuesta.id,
        "preguntas"
      );


      const snapshot = await getDocs(
        preguntasRef
      );


      const preguntasData = snapshot.docs.map(
        (documento) => {

          const datos = documento.data();


          return {

            id: documento.id,

            ...datos,

          };

        }
      );


      /*
       * Ordenamos las preguntas en React.
       *
       * Aceptamos varios posibles nombres de campo
       * para que el componente sea más robusto.
       */

      preguntasData.sort(
        (a, b) => {

          const ordenA =
            Number(
              a.orden ??
              a.numero ??
              a.numeroPregunta ??
              a.id?.replace(/\D/g, "") ??
              999
            );


          const ordenB =
            Number(
              b.orden ??
              b.numero ??
              b.numeroPregunta ??
              b.id?.replace(/\D/g, "") ??
              999
            );


          return ordenA - ordenB;

        }
      );


      console.log(
        "Encuesta cargada:",
        encuesta.id
      );


      console.log(
        "Preguntas encontradas:",
        preguntasData
      );


      setPreguntas(
        preguntasData
      );


    } catch (error) {

      console.error(
        "Error cargando preguntas:",
        error
      );


      setError(
        "No fue posible cargar las preguntas de la encuesta."
      );


    } finally {

      setCargando(false);

    }

  };


  /* =====================================================
     PREGUNTAS VISIBLES
     ===================================================== */

  const preguntasVisibles = useMemo(() => {

    return preguntas.filter(
      (pregunta) => {

        /*
         * ENCUESTA 01
         *
         * La pregunta 8 solo aparece si
         * la pregunta 7 tiene como respuesta "Sí".
         */

        const numero =
          String(
            pregunta.orden ??
            pregunta.numero ??
            pregunta.numeroPregunta ??
            pregunta.id?.replace(/\D/g, "")
          );


        if (
          encuesta?.id === "encuesta01" &&
          numero === "8"
        ) {

          return (
            respuestas["7"] === "Sí"
          );

        }


        return true;

      }
    );

  }, [
    preguntas,
    respuestas,
    encuesta?.id,
  ]);


  /* =====================================================
     PROGRESO
     ===================================================== */

  const porcentaje = useMemo(() => {

    if (
      preguntasVisibles.length === 0
    ) {

      return 0;

    }


    const respondidas =
      preguntasVisibles.filter(
        (pregunta) => {

          const numero =
            String(
              pregunta.orden ??
              pregunta.numero ??
              pregunta.numeroPregunta ??
              pregunta.id?.replace(/\D/g, "")
            );


          const respuesta =
            respuestas[numero];


          return (
            respuesta !== undefined &&
            respuesta !== null &&
            String(respuesta).trim() !== ""
          );

        }
      ).length;


    return Math.round(
      (
        respondidas /
        preguntasVisibles.length
      ) * 100
    );

  }, [
    preguntasVisibles,
    respuestas,
  ]);


  /* =====================================================
     CAMBIAR RESPUESTA
     ===================================================== */

  const cambiarRespuesta = (
    pregunta,
    valor
  ) => {

    const numero =
      String(
        pregunta.orden ??
        pregunta.numero ??
        pregunta.numeroPregunta ??
        pregunta.id?.replace(/\D/g, "")
      );


    setRespuestas(
      (prev) => ({
        ...prev,
        [numero]: valor,
      })
    );


    if (errores[numero]) {

      setErrores(
        (prev) => {

          const nuevosErrores = {
            ...prev,
          };


          delete nuevosErrores[numero];


          return nuevosErrores;

        }
      );

    }


    /*
     * Si en la pregunta 7 se selecciona "No",
     * eliminamos cualquier respuesta anterior
     * de la pregunta 8.
     */

    if (
      encuesta?.id === "encuesta01" &&
      numero === "7" &&
      valor !== "Sí"
    ) {

      setRespuestas(
        (prev) => {

          const nuevasRespuestas = {
            ...prev,
          };


          delete nuevasRespuestas["8"];


          return nuevasRespuestas;

        }
      );

    }

  };


  /* =====================================================
     VALIDAR FORMULARIO
     ===================================================== */

  const validarFormulario = () => {

    const nuevosErrores = {};


    preguntasVisibles.forEach(
      (pregunta) => {

        const numero =
          String(
            pregunta.orden ??
            pregunta.numero ??
            pregunta.numeroPregunta ??
            pregunta.id?.replace(/\D/g, "")
          );


        const valor =
          respuestas[numero];


        const requerida =
          pregunta.requerida !== false;


        if (
          requerida &&
          (
            valor === undefined ||
            valor === null ||
            String(valor).trim() === ""
          )
        ) {

          nuevosErrores[numero] =
            "Esta pregunta es obligatoria.";

        }

      }
    );


    setErrores(
      nuevosErrores
    );


    return (
      Object.keys(
        nuevosErrores
      ).length === 0
    );

  };


  /* =====================================================
     GUARDAR ENCUESTA
     ===================================================== */

  const guardarEncuesta = async (
    evento
  ) => {

    evento.preventDefault();


    if (guardando) {

      return;

    }


    const formularioValido =
      validarFormulario();


    if (!formularioValido) {

      setTimeout(() => {

        const primerError =
          document.querySelector(
            ".pregunta-error"
          );


        if (primerError) {

          primerError.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

        }

      }, 50);


      return;

    }


    if (!egresado?.id) {

      setError(
        "No fue posible identificar al egresado."
      );

      return;

    }


    try {

      setGuardando(true);

      setError("");


      /*
       * ID único por encuesta y egresado.
       *
       * Ejemplo:
       *
       * encuesta01_ID_EGRESADO
       *
       * Esto impide enviar dos veces
       * la misma encuesta.
       */

      const respuestaId =
        `${encuesta.id}_${egresado.id}`;


      const respuestaRef =
        doc(
          db,
          "respuestasEncuestas",
          respuestaId
        );


      await setDoc(
        respuestaRef,
        {

          encuestaId:
            encuesta.id,

          egresadoId:
            egresado.id,

          fechaRespuesta:
            serverTimestamp(),

          respuestas:
            respuestas,

        }
      );


      console.log(
        "Encuesta guardada:",
        encuesta.id
      );


      if (onSaved) {

        onSaved();

      }


    } catch (error) {

      console.error(
        "Error guardando encuesta:",
        error
      );


      if (
        error?.code ===
        "permission-denied"
      ) {

        setError(
          "No fue posible guardar la respuesta. Verifica que la encuesta siga activa y que no haya sido respondida anteriormente."
        );

      } else {

        setError(
          "No fue posible guardar la encuesta. Intenta nuevamente."
        );

      }

    } finally {

      setGuardando(false);

    }

  };


  /* =====================================================
     CARGANDO
     ===================================================== */

  if (cargando) {

    return (

      <div className="formulario-encuesta-page">

        <header className="formulario-encuesta-header">

          <button
            type="button"
            className="formulario-encuesta-back"
            onClick={onCancel}
          >
            ← Volver
          </button>


          <img
            src="/logo-conecta-tel.png"
            alt="CONECTA-TEL"
            className="formulario-encuesta-logo"
          />


          <button
            type="button"
            className="formulario-encuesta-logout"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>

        </header>


        <main className="formulario-encuesta-content">

          <div className="formulario-encuesta-loading">

            <div></div>

            <span>
              CARGANDO ENCUESTA
            </span>

            <p>
              Preparando las preguntas...
            </p>

          </div>

        </main>

      </div>

    );

  }


  /* =====================================================
     ERROR
     ===================================================== */

  if (
    error &&
    preguntas.length === 0
  ) {

    return (

      <div className="formulario-encuesta-page">

        <header className="formulario-encuesta-header">

          <button
            type="button"
            className="formulario-encuesta-back"
            onClick={onCancel}
          >
            ← Volver
          </button>


          <img
            src="/logo-conecta-tel.png"
            alt="CONECTA-TEL"
            className="formulario-encuesta-logo"
          />


          <button
            type="button"
            className="formulario-encuesta-logout"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>

        </header>


        <main className="formulario-encuesta-content">

          <div className="formulario-encuesta-error">

            <span>
              NO FUE POSIBLE CARGAR LA ENCUESTA
            </span>


            <h2>
              Algo salió mal.
            </h2>


            <p>
              {error}
            </p>


            <button
              type="button"
              onClick={cargarPreguntas}
            >
              Intentar nuevamente

              <span>
                →
              </span>

            </button>

          </div>

        </main>

      </div>

    );

  }


  /* =====================================================
     ENCUESTA
     ===================================================== */

  return (

    <div className="formulario-encuesta-page">


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="formulario-encuesta-header">

        <button
          type="button"
          className="formulario-encuesta-back"
          onClick={onCancel}
        >
          ← Volver
        </button>


        <img
          src="/logo-conecta-tel.png"
          alt="CONECTA-TEL"
          className="formulario-encuesta-logo"
        />


        <button
          type="button"
          className="formulario-encuesta-logout"
          onClick={onLogout}
        >
          Cerrar sesión
        </button>

      </header>


      {/* =================================================
          CONTENIDO
          ================================================= */}

      <main className="formulario-encuesta-content">


        {/* =================================================
            TÍTULO
            ================================================= */}

        <section className="formulario-encuesta-title">

          <span>
            ENCUESTA
          </span>


          <h1>
            {encuesta.titulo}
          </h1>


          <p>
            {encuesta.descripcion}
          </p>

        </section>


        {/* =================================================
            PROGRESO
            ================================================= */}

        <div className="formulario-progress">

          <div className="formulario-progress-top">

            <span>
              PROGRESO
            </span>


            <strong>
              {porcentaje}%
            </strong>

          </div>


          <div className="formulario-progress-track">

            <div
              className="formulario-progress-value"
              style={{
                width: `${porcentaje}%`,
              }}
            />

          </div>

        </div>


        {/* =================================================
            PREGUNTAS
            ================================================= */}

        <form
          className="formulario-preguntas"
          onSubmit={guardarEncuesta}
        >

          {preguntasVisibles.map(
            (pregunta, index) => {

              const numero =
                String(
                  pregunta.orden ??
                  pregunta.numero ??
                  pregunta.numeroPregunta ??
                  pregunta.id?.replace(/\D/g, "")
                );


              const valor =
                respuestas[numero] || "";


              /*
               * Aceptamos "opciones" como arreglo.
               */

              const opciones =
                Array.isArray(
                  pregunta.opciones
                )
                  ? pregunta.opciones
                  : [];


              /*
               * El texto puede estar guardado
               * como texto, pregunta o titulo.
               */

              const textoPregunta =
                pregunta.texto ??
                pregunta.pregunta ??
                pregunta.titulo ??
                "Pregunta sin texto";


              return (

                <section
                  className={
                    `pregunta-card ${
                      errores[numero]
                        ? "pregunta-card-error"
                        : ""
                    }`
                  }
                  key={pregunta.id}
                >


                  {/* NÚMERO */}

                  <div className="pregunta-number">

                    {String(
                      index + 1
                    ).padStart(2, "0")}

                  </div>


                  {/* CONTENIDO */}

                  <div className="pregunta-content">


                    <div className="pregunta-heading">

                      <span>
                        PREGUNTA {numero}
                      </span>


                      {pregunta.requerida !== false && (

                        <small>
                          OBLIGATORIA
                        </small>

                      )}

                    </div>


                    <h2>
                      {textoPregunta}
                    </h2>


                    {/* =================================================
                        OPCIONES
                        ================================================= */}

                    {opciones.length > 0 && (

                      <div className="pregunta-opciones">

                        {opciones.map(
                          (opcion) => {

                            const seleccionada =
                              valor === opcion;


                            return (

                              <label
                                className={
                                  `pregunta-opcion ${
                                    seleccionada
                                      ? "seleccionada"
                                      : ""
                                  }`
                                }
                                key={opcion}
                              >

                                <input
                                  type="radio"
                                  name={`pregunta-${numero}`}
                                  value={opcion}
                                  checked={
                                    seleccionada
                                  }
                                  onChange={() =>
                                    cambiarRespuesta(
                                      pregunta,
                                      opcion
                                    )
                                  }
                                />


                                <span className="opcion-indicador"></span>


                                <span className="opcion-texto">
                                  {opcion}
                                </span>

                              </label>

                            );

                          }
                        )}

                      </div>

                    )}


                    {/* =================================================
                        RESPUESTA ABIERTA
                        ================================================= */}

                    {opciones.length === 0 && (

                      <textarea
                        className="pregunta-textarea"
                        value={valor}
                        onChange={(e) =>
                          cambiarRespuesta(
                            pregunta,
                            e.target.value
                          )
                        }
                        placeholder="Escribe tu respuesta..."
                        rows="4"
                      />

                    )}


                    {/* ERROR */}

                    {errores[numero] && (

                      <div className="pregunta-error">

                        {errores[numero]}

                      </div>

                    )}

                  </div>

                </section>

              );

            }
          )}


          {/* =================================================
              SI REALMENTE NO HAY PREGUNTAS
              ================================================= */}

          {preguntas.length === 0 && (

            <div className="formulario-sin-preguntas">

              <span>
                ENCUESTA SIN PREGUNTAS
              </span>

              <h2>
                No se encontraron preguntas.
              </h2>

              <p>
                La encuesta existe, pero no se encontraron
                preguntas asociadas en Firestore.
              </p>

            </div>

          )}


          {/* =================================================
              ERROR DE GUARDADO
              ================================================= */}

          {error && preguntas.length > 0 && (

            <div className="formulario-submit-error">

              {error}

            </div>

          )}


          {/* =================================================
              BOTONES
              ================================================= */}

          <div className="formulario-actions">

            <button
              type="button"
              className="formulario-cancel"
              onClick={onCancel}
              disabled={guardando}
            >
              ← Volver
            </button>


            <button
              type="submit"
              className="formulario-submit"
              disabled={
                guardando ||
                preguntasVisibles.length === 0
              }
            >

              {guardando
                ? "Guardando..."
                : "Enviar encuesta"
              }


              {!guardando && (

                <span>
                  →
                </span>

              )}

            </button>

          </div>


        </form>


      </main>

    </div>

  );

}


export default FormularioEncuesta;