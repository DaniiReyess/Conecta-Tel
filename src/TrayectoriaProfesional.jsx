import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "./firebase";

import NuevaExperiencia from "./NuevaExperiencia";

import "./TrayectoriaProfesional.css";


function TrayectoriaProfesional({
  egresado,
  onBack,
  onLogout,
}) {


  /*
   * =====================================================
   * ESTADOS
   * =====================================================
   */

  const [
    mostrarFormulario,
    setMostrarFormulario
  ] = useState(false);


  const [
    experiencias,
    setExperiencias
  ] = useState([]);


  const [
    cargandoExperiencias,
    setCargandoExperiencias
  ] = useState(true);


  const [
    errorExperiencias,
    setErrorExperiencias
  ] = useState("");


  /*
   * =====================================================
   * EXPERIENCIA QUE SE ESTÁ EDITANDO
   * =====================================================
   */

  const [
    experienciaEditar,
    setExperienciaEditar
  ] = useState(null);


  /*
   * =====================================================
   * EXPERIENCIA QUE SE QUIERE ELIMINAR
   * =====================================================
   */

  const [
    experienciaEliminar,
    setExperienciaEliminar
  ] = useState(null);


  /*
   * =====================================================
   * ESTADO DE ELIMINACIÓN
   * =====================================================
   */

  const [
    eliminandoExperiencia,
    setEliminandoExperiencia
  ] = useState(false);


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
   * CARGAR EXPERIENCIAS DESDE FIRESTORE
   * =====================================================
   */

  const cargarExperiencias = async () => {


    /*
     * El ID REAL del documento de Firestore
     */

    const idEgresado =
      egresado?.id;


    if (!idEgresado) {

      console.error(
        "No se encontró el ID del documento del egresado."
      );

      setExperiencias([]);

      setErrorExperiencias(
        "No fue posible identificar el perfil del egresado."
      );

      setCargandoExperiencias(false);

      return;

    }


    try {

      setCargandoExperiencias(true);

      setErrorExperiencias("");


      console.log(
        "Cargando trayectoria del egresado:",
        idEgresado
      );


      /*
       * =================================================
       * REFERENCIA A LA SUBCOLECCIÓN
       * =================================================
       */

      const trayectoriaRef =
        collection(
          db,
          "egresados",
          idEgresado,
          "trayectoriaLaboral"
        );


      /*
       * =================================================
       * OBTENER EXPERIENCIAS
       * =================================================
       */

      const snapshot =
        await getDocs(
          trayectoriaRef
        );


      /*
       * =================================================
       * CONVERTIR DOCUMENTOS A OBJETOS
       * =================================================
       */

      const experienciasFirestore =
        snapshot.docs.map(
          (doc) => ({

            id: doc.id,

            ...doc.data(),

          })
        );


      /*
       * =================================================
       * ORDENAR EXPERIENCIAS
       * =================================================
       */

      experienciasFirestore.sort(
        (a, b) => {

          const fechaA =
            a.fechaInicio || "";

          const fechaB =
            b.fechaInicio || "";


          return fechaB.localeCompare(
            fechaA
          );

        }
      );


      /*
       * =================================================
       * GUARDAR EN EL ESTADO
       * =================================================
       */

      setExperiencias(
        experienciasFirestore
      );


      console.log(
        "Experiencias cargadas:",
        experienciasFirestore
      );


    } catch (error) {

      console.error(
        "Error al cargar las experiencias:",
        error
      );


      setExperiencias([]);


      setErrorExperiencias(
        "No fue posible cargar tu trayectoria profesional."
      );


    } finally {

      setCargandoExperiencias(false);

    }

  };


  /*
   * =====================================================
   * CARGAR AL ENTRAR AL MÓDULO
   * =====================================================
   */

  useEffect(() => {

    cargarExperiencias();

  }, [egresado?.id]);


  /*
   * =====================================================
   * ABRIR NUEVA EXPERIENCIA
   * =====================================================
   */

  const abrirNuevaExperiencia = () => {

    /*
     * Nos aseguramos de que no haya
     * ninguna experiencia seleccionada.
     */

    setExperienciaEditar(null);

    setMostrarFormulario(true);

  };


  /*
   * =====================================================
   * ABRIR EDICIÓN
   * =====================================================
   */

  const abrirEditarExperiencia = (experiencia) => {

    console.log(
      "Editando experiencia:",
      experiencia
    );


    /*
     * Guardamos la experiencia completa.
     */

    setExperienciaEditar(
      experiencia
    );


    /*
     * Abrimos el formulario.
     */

    setMostrarFormulario(true);

  };


  /*
   * =====================================================
   * CERRAR FORMULARIO
   * =====================================================
   */

  const cerrarFormulario = () => {

    setMostrarFormulario(false);

    setExperienciaEditar(null);

  };


  /*
   * =====================================================
   * SELECCIONAR EXPERIENCIA PARA ELIMINAR
   * =====================================================
   */

  const confirmarEliminarExperiencia = (
    experiencia
  ) => {

    console.log(
      "Experiencia seleccionada para eliminar:",
      experiencia
    );


    setExperienciaEliminar(
      experiencia
    );

  };


  /*
   * =====================================================
   * CANCELAR ELIMINACIÓN
   * =====================================================
   */

  const cancelarEliminacion = () => {

    if (eliminandoExperiencia) {
      return;
    }


    setExperienciaEliminar(null);

  };


  /*
   * =====================================================
   * ELIMINAR EXPERIENCIA DE FIRESTORE
   * =====================================================
   */

  const eliminarExperiencia = async () => {


    /*
     * =================================================
     * VALIDAR EXPERIENCIA
     * =================================================
     */

    if (!experienciaEliminar?.id) {

      console.error(
        "No se encontró el ID de la experiencia a eliminar."
      );

      return;

    }


    /*
     * =================================================
     * OBTENER ID DEL EGRESADO
     * =================================================
     */

    const idEgresado =
      egresado?.id;


    if (!idEgresado) {

      console.error(
        "No se encontró el ID del documento del egresado."
      );

      setErrorExperiencias(
        "No fue posible identificar el perfil del egresado."
      );

      return;

    }


    try {

      setEliminandoExperiencia(true);


      console.log(
        "Eliminando experiencia:",
        experienciaEliminar.id
      );


      /*
       * =================================================
       * REFERENCIA EXACTA AL DOCUMENTO
       * =================================================
       */

      const experienciaRef =
        doc(
          db,
          "egresados",
          idEgresado,
          "trayectoriaLaboral",
          experienciaEliminar.id
        );


      /*
       * =================================================
       * ELIMINAR DOCUMENTO
       * =================================================
       */

      await deleteDoc(
        experienciaRef
      );


      console.log(
        "Experiencia eliminada correctamente."
      );


      /*
       * =================================================
       * ACTUALIZAR LA INTERFAZ
       * =================================================
       */

      setExperiencias(
        (experienciasActuales) =>
          experienciasActuales.filter(
            (experiencia) =>
              experiencia.id !==
              experienciaEliminar.id
          )
      );


      /*
       * =================================================
       * CERRAR CONFIRMACIÓN
       * =================================================
       */

      setExperienciaEliminar(null);


    } catch (error) {

      console.error(
        "Error al eliminar la experiencia:",
        error
      );


      /*
       * Si las Rules de Firebase rechazan
       * la operación, mostramos un mensaje.
       */

      setErrorExperiencias(
        "No fue posible eliminar la experiencia."
      );


    } finally {

      setEliminandoExperiencia(false);

    }

  };


  /*
   * =====================================================
   * FORMULARIO
   * =====================================================
   */

  if (mostrarFormulario) {

    return (

      <NuevaExperiencia

        egresado={egresado}

        experiencia={experienciaEditar}

        onCancel={cerrarFormulario}

        onSaved={async (experienciaGuardada) => {

          console.log(
            "Experiencia guardada y recibida:",
            experienciaGuardada
          );


          /*
           * Volvemos a consultar Firestore
           * para obtener los datos actualizados.
           */

          await cargarExperiencias();


          /*
           * Cerramos el formulario.
           */

          cerrarFormulario();

        }}

      />

    );

  }


  /*
   * =====================================================
   * VISTA DE TRAYECTORIA
   * =====================================================
   */

  return (

    <div className="trayectoria-page">


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="trayectoria-header">


        <button
          type="button"
          className="trayectoria-back"
          onClick={onBack}
        >
          ← Volver
        </button>


        <img
          src="/logo-conecta-tel.png"
          alt="CONECTA-TEL"
          className="trayectoria-logo"
        />


        <button
          type="button"
          className="trayectoria-logout"
          onClick={onLogout}
        >
          Cerrar sesión
        </button>


      </header>


      {/* =================================================
          CONTENIDO
          ================================================= */}

      <main className="trayectoria-content">


        {/* =================================================
            ENCABEZADO
            ================================================= */}

        <section className="trayectoria-title">


          <span>
            TRAYECTORIA PROFESIONAL
          </span>


          <h1>
            Tu experiencia,
            <br />
            <strong>
              conectada.
            </strong>
          </h1>


          <p>
            Registra y consulta las experiencias que forman
            parte de tu trayectoria profesional.
          </p>


          <button
            type="button"
            className="trayectoria-add-btn"
            onClick={abrirNuevaExperiencia}
          >
            Nueva experiencia

            <span>
              →
            </span>

          </button>


        </section>


        {/* =================================================
            EXPERIENCIAS LABORALES
            ================================================= */}

        <section className="trayectoria-section">


          <div className="trayectoria-section-heading">

            <span>
              EXPERIENCIAS LABORALES
            </span>


            <p>
              Historial profesional registrado
            </p>

          </div>


          {/* =================================================
              CARGANDO
              ================================================= */}

          {cargandoExperiencias && (

            <div className="trayectoria-loading">

              <div className="trayectoria-loading-line"></div>


              <span>
                CARGANDO TRAYECTORIA
              </span>


              <p>
                Consultando tus experiencias profesionales...
              </p>

            </div>

          )}


          {/* =================================================
              ERROR
              ================================================= */}

          {!cargandoExperiencias &&
            errorExperiencias && (

              <div className="trayectoria-error">

                <span>
                  NO FUE POSIBLE CARGAR LA INFORMACIÓN
                </span>


                <p>
                  {errorExperiencias}
                </p>


                <button
                  type="button"
                  className="trayectoria-empty-btn"
                  onClick={cargarExperiencias}
                >

                  Intentar nuevamente

                  <span>
                    →
                  </span>

                </button>

              </div>

            )}


          {/* =================================================
              SIN EXPERIENCIAS
              ================================================= */}

          {!cargandoExperiencias &&
            !errorExperiencias &&
            experiencias.length === 0 && (

              <div className="trayectoria-empty">


                <div className="trayectoria-empty-line"></div>


                <span className="trayectoria-empty-label">
                  SIN EXPERIENCIAS REGISTRADAS
                </span>


                <h2>
                  Comienza a construir tu trayectoria.
                </h2>


                <p>
                  Agrega tu primera experiencia laboral para
                  comenzar a visualizar tu recorrido profesional.
                </p>


                <button
                  type="button"
                  className="trayectoria-empty-btn"
                  onClick={abrirNuevaExperiencia}
                >

                  Agregar experiencia

                  <span>
                    →
                  </span>

                </button>


              </div>

            )}


          {/* =================================================
              LISTADO DE EXPERIENCIAS
              ================================================= */}

          {!cargandoExperiencias &&
            !errorExperiencias &&
            experiencias.length > 0 && (

              <div className="trayectoria-list">


                {experiencias.map(
                  (experiencia, index) => (

                    <article
                      className="trayectoria-experience"
                      key={experiencia.id}
                    >


                      {/* ===================================
                          CABECERA DE EXPERIENCIA
                          =================================== */}

                      <div className="trayectoria-experience-top">


                        <div className="trayectoria-experience-number">

                          {String(
                            index + 1
                          ).padStart(2, "0")}

                        </div>


                        <div className="trayectoria-experience-heading">


                          <span>
                            EXPERIENCIA PROFESIONAL
                          </span>


                          <h2>
                            {experiencia.empresa ||
                              "Empresa no registrada"}
                          </h2>


                          <h3>
                            {experiencia.cargo ||
                              "Cargo no registrado"}
                          </h3>


                        </div>


                        {/* =================================
                            ACCIONES
                            ================================= */}

                        <div className="trayectoria-experience-actions">


                          {experiencia.esActual && (

                            <span className="trayectoria-current">
                              ACTUAL
                            </span>

                          )}


                          {/* =================================
                              BOTÓN EDITAR
                              ================================= */}

                          <button
                            type="button"
                            className="trayectoria-edit-btn"
                            onClick={() =>
                              abrirEditarExperiencia(
                                experiencia
                              )
                            }
                          >
                            Editar
                          </button>


                          {/* =================================
                              BOTÓN ELIMINAR
                              ================================= */}

                          <button
                            type="button"
                            className="trayectoria-delete-btn"
                            onClick={() =>
                              confirmarEliminarExperiencia(
                                experiencia
                              )
                            }
                            disabled={
                              eliminandoExperiencia
                            }
                          >
                            Eliminar
                          </button>


                        </div>


                      </div>


                      {/* ===================================
                          INFORMACIÓN PRINCIPAL
                          =================================== */}

                      <div className="trayectoria-experience-meta">


                        <div>

                          <span>
                            UBICACIÓN
                          </span>


                          <strong>

                            {experiencia.ciudad ||
                              "No registrada"}

                            {experiencia.departamento
                              ? ` · ${experiencia.departamento}`
                              : ""}

                            {experiencia.pais
                              ? ` · ${experiencia.pais}`
                              : ""}

                          </strong>

                        </div>


                        <div>

                          <span>
                            PERÍODO
                          </span>


                          <strong>

                            {experiencia.fechaInicio ||
                              "Fecha no registrada"}

                            {" — "}

                            {experiencia.esActual
                              ? "ACTUALIDAD"
                              : experiencia.fechaFin ||
                                "Fecha no registrada"}

                          </strong>

                        </div>


                        {experiencia.tipoEmpresa && (

                          <div>

                            <span>
                              TIPO DE EMPRESA
                            </span>


                            <strong>
                              {experiencia.tipoEmpresa}
                            </strong>

                          </div>

                        )}


                        {experiencia.sectorLaboral && (

                          <div>

                            <span>
                              SECTOR LABORAL
                            </span>


                            <strong>
                              {experiencia.sectorLaboral}
                            </strong>

                          </div>

                        )}


                      </div>


                      {/* ===================================
                          DESCRIPCIÓN
                          =================================== */}

                      {experiencia.descripcion && (

                        <div className="trayectoria-experience-block">

                          <span>
                            DESCRIPCIÓN
                          </span>


                          <p>
                            {experiencia.descripcion}
                          </p>

                        </div>

                      )}


                      {/* ===================================
                          COMPETENCIAS
                          =================================== */}

                      {experiencia.competencias && (

                        <div className="trayectoria-experience-block">

                          <span>
                            COMPETENCIAS
                          </span>


                          <p>
                            {experiencia.competencias}
                          </p>

                        </div>

                      )}


                      {/* ===================================
                          TECNOLOGÍAS
                          =================================== */}

                      {experiencia.tecnologias && (

                        <div className="trayectoria-experience-block">

                          <span>
                            TECNOLOGÍAS
                          </span>


                          <p>
                            {experiencia.tecnologias}
                          </p>

                        </div>

                      )}


                    </article>

                  )
                )}


              </div>

            )}


        </section>


      </main>


      {/* =================================================
          MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
          ================================================= */}

      {experienciaEliminar && (

        <div
          className="trayectoria-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-confirmacion-eliminar"
        >

          <div className="trayectoria-confirm-card">


            <span className="trayectoria-confirm-label">
              ELIMINAR EXPERIENCIA
            </span>


            <h2 id="titulo-confirmacion-eliminar">
              ¿Quieres eliminar esta experiencia?
            </h2>


            <p>
              Esta acción eliminará permanentemente la
              experiencia registrada en:
            </p>


            <strong>
              {experienciaEliminar.empresa ||
                "Empresa no registrada"}
            </strong>


            <span className="trayectoria-confirm-cargo">

              {experienciaEliminar.cargo ||
                "Cargo no registrado"}

            </span>


            <div className="trayectoria-confirm-actions">


              <button
                type="button"
                className="trayectoria-confirm-cancel"
                onClick={cancelarEliminacion}
                disabled={eliminandoExperiencia}
              >
                Cancelar
              </button>


              <button
                type="button"
                className="trayectoria-confirm-delete"
                onClick={eliminarExperiencia}
                disabled={eliminandoExperiencia}
              >

                {eliminandoExperiencia
                  ? "Eliminando..."
                  : "Eliminar experiencia"}

              </button>


            </div>


          </div>

        </div>

      )}


    </div>

  );

}


export default TrayectoriaProfesional;