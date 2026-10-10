import { useState } from "react";

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

import "./NuevaExperiencia.css";


function NuevaExperiencia({
  egresado,
  experiencia = null,
  onCancel,
  onSaved,
}) {


  /*
   * =====================================================
   * MODO DEL FORMULARIO
   * =====================================================
   *
   * Si existe "experiencia":
   *
   *      estamos editando
   *
   * Si no existe:
   *
   *      estamos creando
   *
   */

  const modoEdicion = Boolean(experiencia);


  /*
   * =====================================================
   * ESTADO DEL FORMULARIO
   * =====================================================
   */

  const [formulario, setFormulario] = useState({

    empresa:
      experiencia?.empresa || "",

    cargo:
      experiencia?.cargo || "",

    sectorLaboral:
      experiencia?.sectorLaboral || "",

    tipoEmpresa:
      experiencia?.tipoEmpresa || "",

    ciudad:
      experiencia?.ciudad || "",

    departamento:
      experiencia?.departamento || "",

    pais:
      experiencia?.pais || "Colombia",

    fechaInicio:
      experiencia?.fechaInicio || "",

    fechaFin:
      experiencia?.fechaFin || "",

    esActual:
      experiencia?.esActual || false,

    descripcion:
      experiencia?.descripcion || "",

    tecnologias:
      experiencia?.tecnologias || "",

    competencias:
      experiencia?.competencias || "",

  });


  /*
   * =====================================================
   * ERRORES
   * =====================================================
   */

  const [errores, setErrores] = useState({});


  /*
   * =====================================================
   * CAMBIAR CAMPOS
   * =====================================================
   */

  const handleChange = (e) => {

    const {
      name,
      value,
      type,
      checked,
    } = e.target;


    setFormulario((prev) => ({

      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,

    }));


    /*
     * Limpiar error del campo
     */

    if (errores[name]) {

      setErrores((prev) => ({

        ...prev,

        [name]: "",

      }));

    }

  };


  /*
   * =====================================================
   * VALIDACIÓN
   * =====================================================
   */

  const validarFormulario = () => {

    const nuevosErrores = {};


    /*
     * EMPRESA
     */

    if (!formulario.empresa.trim()) {

      nuevosErrores.empresa =
        "La empresa es obligatoria.";

    }


    /*
     * CARGO
     */

    if (!formulario.cargo.trim()) {

      nuevosErrores.cargo =
        "El cargo es obligatorio.";

    }


    /*
     * CIUDAD
     */

    if (!formulario.ciudad.trim()) {

      nuevosErrores.ciudad =
        "La ciudad es obligatoria.";

    }


    /*
     * PAÍS
     */

    if (!formulario.pais.trim()) {

      nuevosErrores.pais =
        "El país es obligatorio.";

    }


    /*
     * FECHA DE INICIO
     */

    if (!formulario.fechaInicio) {

      nuevosErrores.fechaInicio =
        "La fecha de inicio es obligatoria.";

    }


    /*
     * FECHA FINAL
     */

    if (
      !formulario.esActual &&
      !formulario.fechaFin
    ) {

      nuevosErrores.fechaFin =
        "La fecha de finalización es obligatoria.";

    }


    /*
     * ORDEN DE FECHAS
     */

    if (
      formulario.fechaInicio &&
      formulario.fechaFin &&
      formulario.fechaFin <
        formulario.fechaInicio
    ) {

      nuevosErrores.fechaFin =
        "La fecha de finalización no puede ser anterior a la fecha de inicio.";

    }


    /*
     * GUARDAR ERRORES
     */

    setErrores(nuevosErrores);


    return (
      Object.keys(nuevosErrores).length === 0
    );

  };


  /*
   * =====================================================
   * GUARDAR / ACTUALIZAR EXPERIENCIA
   * =====================================================
   */

  const handleSubmit = async (e) => {

    e.preventDefault();


    /*
     * =================================================
     * VALIDAR
     * =================================================
     */

    if (!validarFormulario()) {

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

      return;

    }


    /*
     * =================================================
     * DATOS DE LA EXPERIENCIA
     * =================================================
     */

    const datosExperiencia = {

      empresa:
        formulario.empresa.trim(),

      cargo:
        formulario.cargo.trim(),

      sectorLaboral:
        formulario.sectorLaboral.trim(),

      tipoEmpresa:
        formulario.tipoEmpresa,

      ciudad:
        formulario.ciudad.trim(),

      departamento:
        formulario.departamento.trim(),

      pais:
        formulario.pais.trim(),

      fechaInicio:
        formulario.fechaInicio,

      fechaFin:
        formulario.esActual
          ? null
          : formulario.fechaFin,

      esActual:
        formulario.esActual,

      descripcion:
        formulario.descripcion.trim(),

      tecnologias:
        formulario.tecnologias.trim(),

      competencias:
        formulario.competencias.trim(),

    };


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


    try {


      /*
       * =================================================
       * MODO EDICIÓN
       * =================================================
       */

      if (modoEdicion) {

        /*
         * Verificar que exista el ID
         * de la experiencia.
         */

        if (!experiencia?.id) {

          console.error(
            "No se encontró el ID de la experiencia."
          );

          return;

        }


        /*
         * Referencia exacta al documento:
         *
         * egresados
         *    └── ID EGRESADO
         *         └── trayectoriaLaboral
         *              └── ID EXPERIENCIA
         */

        const experienciaRef =
          doc(
            trayectoriaRef,
            experiencia.id
          );


        /*
         * Actualizar experiencia
         */

        await updateDoc(
          experienciaRef,
          {

            ...datosExperiencia,

            fechaActualizacion:
              serverTimestamp(),

          }
        );


        console.log(
          "Experiencia actualizada correctamente en Firestore:"
        );


        console.log(
          "ID de experiencia:",
          experiencia.id
        );


        console.log(
          "Experiencia:",
          datosExperiencia
        );


        /*
         * Avisar al componente padre
         */

        if (onSaved) {

          onSaved({

            id:
              experiencia.id,

            ...datosExperiencia,

          });

        }


        return;

      }


      /*
       * =================================================
       * MODO CREACIÓN
       * =================================================
       */

      const documentoCreado =
        await addDoc(
          trayectoriaRef,
          {

            ...datosExperiencia,

            fechaRegistro:
              serverTimestamp(),

          }
        );


      console.log(
        "Experiencia guardada correctamente en Firestore:"
      );


      console.log(
        "ID de experiencia:",
        documentoCreado.id
      );


      console.log(
        "Experiencia:",
        datosExperiencia
      );


      /*
       * Avisar al componente padre
       */

      if (onSaved) {

        onSaved({

          id:
            documentoCreado.id,

          ...datosExperiencia,

        });

      }


    } catch (error) {

      console.error(
        modoEdicion
          ? "Error al actualizar la experiencia:"
          : "Error al guardar la experiencia:",
        error
      );

    }

  };


  /*
   * =====================================================
   * VISTA
   * =====================================================
   */

  return (

    <div className="nueva-experiencia-page">


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="nueva-experiencia-header">


        <button
          type="button"
          className="nueva-experiencia-back"
          onClick={onCancel}
        >
          ← Volver
        </button>


        <img
          src="/logo-conecta-tel.png"
          alt="CONECTA-TEL"
          className="nueva-experiencia-logo"
        />


        <div></div>


      </header>


      {/* =================================================
          CONTENIDO
          ================================================= */}

      <main className="nueva-experiencia-content">


        {/* =================================================
            TÍTULO
            ================================================= */}

        <section className="nueva-experiencia-title">


          <span>

            {modoEdicion
              ? "EDITAR EXPERIENCIA"
              : "NUEVA EXPERIENCIA"}

          </span>


          <h1>

            {modoEdicion
              ? "Actualiza tu experiencia"
              : "Agrega una experiencia"}

            <br />

            <strong>
              profesional.
            </strong>

          </h1>


          <p>

            {modoEdicion
              ? "Modifica la información de tu experiencia laboral registrada."
              : "Registra la información de tu experiencia laboral para construir tu trayectoria profesional."}

          </p>


        </section>


        {/* =================================================
            FORMULARIO
            ================================================= */}

        <form
          className="experiencia-form"
          onSubmit={handleSubmit}
        >


          {/* =================================================
              INFORMACIÓN LABORAL
              ================================================= */}

          <section className="form-section">


            <div className="form-section-heading">

              <span>
                01
              </span>


              <div>

                <h2>
                  Información laboral
                </h2>

                <p>
                  Información principal de la experiencia.
                </p>

              </div>

            </div>


            <div className="form-grid">


              {/* EMPRESA */}

              <div className="form-field">

                <label htmlFor="empresa">

                  EMPRESA

                  <span>
                    *
                  </span>

                </label>


                <input
                  id="empresa"
                  name="empresa"
                  type="text"
                  value={formulario.empresa}
                  onChange={handleChange}
                  placeholder="Nombre de la empresa"
                />


                {errores.empresa && (

                  <small className="form-error">
                    {errores.empresa}
                  </small>

                )}

              </div>


              {/* CARGO */}

              <div className="form-field">

                <label htmlFor="cargo">

                  CARGO

                  <span>
                    *
                  </span>

                </label>


                <input
                  id="cargo"
                  name="cargo"
                  type="text"
                  value={formulario.cargo}
                  onChange={handleChange}
                  placeholder="Cargo desempeñado"
                />


                {errores.cargo && (

                  <small className="form-error">
                    {errores.cargo}
                  </small>

                )}

              </div>


              {/* SECTOR LABORAL */}

              <div className="form-field">

                <label htmlFor="sectorLaboral">

                  SECTOR LABORAL

                </label>


                <input
                  id="sectorLaboral"
                  name="sectorLaboral"
                  type="text"
                  value={formulario.sectorLaboral}
                  onChange={handleChange}
                  placeholder="Ej. Telecomunicaciones"
                />

              </div>


              {/* TIPO DE EMPRESA */}

              <div className="form-field">

                <label htmlFor="tipoEmpresa">

                  TIPO DE EMPRESA

                </label>


                <select
                  id="tipoEmpresa"
                  name="tipoEmpresa"
                  value={formulario.tipoEmpresa}
                  onChange={handleChange}
                >

                  <option value="">
                    Seleccionar
                  </option>

                  <option value="Privada">
                    Privada
                  </option>

                  <option value="Pública">
                    Pública
                  </option>

                  <option value="Mixta">
                    Mixta
                  </option>

                  <option value="Independiente">
                    Independiente
                  </option>

                  <option value="Otra">
                    Otra
                  </option>

                </select>

              </div>


            </div>

          </section>


          {/* =================================================
              UBICACIÓN
              ================================================= */}

          <section className="form-section">


            <div className="form-section-heading">

              <span>
                02
              </span>


              <div>

                <h2>
                  Ubicación
                </h2>

                <p>
                  Lugar donde desarrollaste la experiencia.
                </p>

              </div>

            </div>


            <div className="form-grid">


              {/* CIUDAD */}

              <div className="form-field">

                <label htmlFor="ciudad">

                  CIUDAD

                  <span>
                    *
                  </span>

                </label>


                <input
                  id="ciudad"
                  name="ciudad"
                  type="text"
                  value={formulario.ciudad}
                  onChange={handleChange}
                  placeholder="Ej. Bucaramanga"
                />


                {errores.ciudad && (

                  <small className="form-error">
                    {errores.ciudad}
                  </small>

                )}

              </div>


              {/* DEPARTAMENTO */}

              <div className="form-field">

                <label htmlFor="departamento">

                  DEPARTAMENTO

                </label>


                <input
                  id="departamento"
                  name="departamento"
                  type="text"
                  value={formulario.departamento}
                  onChange={handleChange}
                  placeholder="Ej. Santander"
                />

              </div>


              {/* PAÍS */}

              <div className="form-field">

                <label htmlFor="pais">

                  PAÍS

                  <span>
                    *
                  </span>

                </label>


                <input
                  id="pais"
                  name="pais"
                  type="text"
                  value={formulario.pais}
                  onChange={handleChange}
                />


                {errores.pais && (

                  <small className="form-error">
                    {errores.pais}
                  </small>

                )}

              </div>


            </div>

          </section>


          {/* =================================================
              PERÍODO
              ================================================= */}

          <section className="form-section">


            <div className="form-section-heading">

              <span>
                03
              </span>


              <div>

                <h2>
                  Período
                </h2>

                <p>
                  Define el período en el que desarrollaste
                  esta experiencia.
                </p>

              </div>

            </div>


            <div className="form-grid">


              {/* FECHA INICIO */}

              <div className="form-field">

                <label htmlFor="fechaInicio">

                  FECHA DE INICIO

                  <span>
                    *
                  </span>

                </label>


                <input
                  id="fechaInicio"
                  name="fechaInicio"
                  type="month"
                  value={formulario.fechaInicio}
                  onChange={handleChange}
                />


                {errores.fechaInicio && (

                  <small className="form-error">
                    {errores.fechaInicio}
                  </small>

                )}

              </div>


              {/* FECHA FINAL */}

              <div className="form-field">

                <label htmlFor="fechaFin">

                  FECHA DE FINALIZACIÓN

                  {!formulario.esActual && (

                    <span>
                      *
                    </span>

                  )}

                </label>


                <input
                  id="fechaFin"
                  name="fechaFin"
                  type="month"
                  value={formulario.fechaFin}
                  onChange={handleChange}
                  disabled={formulario.esActual}
                />


                {errores.fechaFin && (

                  <small className="form-error">
                    {errores.fechaFin}
                  </small>

                )}

              </div>


              {/* TRABAJO ACTUAL */}

              <div className="form-current">

                <label className="current-checkbox">

                  <input
                    type="checkbox"
                    name="esActual"
                    checked={formulario.esActual}
                    onChange={handleChange}
                  />


                  <span className="checkbox-custom"></span>


                  <span className="current-text">
                    Actualmente trabajo aquí
                  </span>

                </label>

              </div>


            </div>

          </section>


          {/* =================================================
              PERFIL DE LA EXPERIENCIA
              ================================================= */}

          <section className="form-section">


            <div className="form-section-heading">

              <span>
                04
              </span>


              <div>

                <h2>
                  Perfil de la experiencia
                </h2>

                <p>
                  Describe las funciones y capacidades
                  desarrolladas durante esta experiencia.
                </p>

              </div>

            </div>


            <div className="form-single">


              {/* DESCRIPCIÓN */}

              <div className="form-field">

                <label htmlFor="descripcion">

                  DESCRIPCIÓN DEL CARGO

                </label>


                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={handleChange}
                  placeholder="Describe brevemente tus principales funciones y responsabilidades..."
                  rows="5"
                />

              </div>


              {/* TECNOLOGÍAS */}

              <div className="form-field">

                <label htmlFor="tecnologias">

                  TECNOLOGÍAS

                </label>


                <input
                  id="tecnologias"
                  name="tecnologias"
                  type="text"
                  value={formulario.tecnologias}
                  onChange={handleChange}
                  placeholder="Ej. Cisco, Python, MATLAB, AWS"
                />

              </div>


              {/* COMPETENCIAS */}

              <div className="form-field">

                <label htmlFor="competencias">

                  COMPETENCIAS

                </label>


                <input
                  id="competencias"
                  name="competencias"
                  type="text"
                  value={formulario.competencias}
                  onChange={handleChange}
                  placeholder="Ej. Redes, liderazgo, gestión de proyectos"
                />

              </div>


            </div>

          </section>


          {/* =================================================
              ACCIONES
              ================================================= */}

          <div className="form-actions">


            <button
              type="button"
              className="form-cancel"
              onClick={onCancel}
            >

              Cancelar

            </button>


            <button
              type="submit"
              className="form-save"
            >

              {modoEdicion
                ? "Guardar cambios"
                : "Guardar experiencia"}

              <span>
                →
              </span>

            </button>


          </div>


        </form>


      </main>


    </div>

  );

}


export default NuevaExperiencia;