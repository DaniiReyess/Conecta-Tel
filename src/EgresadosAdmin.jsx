import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import "./EgresadosAdmin.css";


function EgresadosAdmin() {

  // =====================================================
  // ESTADOS
  // =====================================================

  const [egresados, setEgresados] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");

  const [ciudadFiltro, setCiudadFiltro] = useState("");

  const [formacionFiltro, setFormacionFiltro] = useState("");

  const [
    egresadoSeleccionado,
    setEgresadoSeleccionado
  ] = useState(null);

  const [clasificacionIA, setClasificacionIA] = useState(null);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState("");
  const [observacionRevision, setObservacionRevision] = useState("");

  // =====================================================
  // CARGAR EGRESADOS
  // =====================================================

  useEffect(() => {

    const cargarEgresados = async () => {

      try {

        setLoading(true);
        setError("");

        console.log(
          "========================================"
        );

        console.log(
          "CARGANDO EGRESADOS ADMINISTRATIVOS..."
        );

        console.log(
          "========================================"
        );


        const egresadosRef = collection(
          db,
          "egresados"
        );


        const snapshot = await getDocs(
          egresadosRef
        );


        const lista = snapshot.docs.map(
          (documento) => {

            const datos = documento.data();

            return {
              id: documento.id,
              ...datos,
            };

          }
        );


        // Orden alfabético
        lista.sort(
          (a, b) => {

            const nombreA =
              `${a.nombres || ""} ${a.apellidos || ""}`
                .trim()
                .toLowerCase();


            const nombreB =
              `${b.nombres || ""} ${b.apellidos || ""}`
                .trim()
                .toLowerCase();


            return nombreA.localeCompare(
              nombreB,
              "es"
            );

          }
        );


        setEgresados(lista);


        console.log(
          "Egresados cargados:",
          lista.length
        );


      } catch (error) {

        console.error(
          "Error cargando egresados:",
          error
        );


        setError(
          "No fue posible cargar la información de los egresados."
        );


      } finally {

        setLoading(false);

      }

    };


    cargarEgresados();

  }, []);


  // =====================================================
  // CIUDADES
  // =====================================================

  const ciudades = useMemo(() => {

    const conjunto = new Set();


    egresados.forEach(
      (egresado) => {

        const ciudad =
          egresado.ciudadTrabajo;


        if (
          typeof ciudad === "string" &&
          ciudad.trim() !== ""
        ) {

          conjunto.add(
            ciudad.trim()
          );

        }

      }
    );


    return Array.from(conjunto).sort(
      (a, b) =>
        a.localeCompare(
          b,
          "es"
        )
    );

  }, [egresados]);


  // =====================================================
  // NIVELES DE FORMACIÓN
  // =====================================================

  const nivelesFormacion = useMemo(() => {

    const conjunto = new Set();


    egresados.forEach(
      (egresado) => {

        const nivel =
          egresado.nivelFormacion;


        if (
          typeof nivel === "string" &&
          nivel.trim() !== ""
        ) {

          conjunto.add(
            nivel.trim()
          );

        }

      }
    );


    return Array.from(conjunto).sort(
      (a, b) =>
        a.localeCompare(
          b,
          "es"
        )
    );

  }, [egresados]);


  // =====================================================
  // FILTRAR EGRESADOS
  // =====================================================

  const egresadosFiltrados = useMemo(() => {

    const texto =
      busqueda
        .trim()
        .toLowerCase();


    return egresados.filter(
      (egresado) => {

        const nombreCompleto =
          `${egresado.nombres || ""} ${egresado.apellidos || ""}`
            .toLowerCase();


        const correo =
          String(
            egresado.correo || ""
          ).toLowerCase();


        const empresa =
          String(
            egresado.empresaActual || ""
          ).toLowerCase();


        const cargo =
          String(
            egresado.cargoActual || ""
          ).toLowerCase();


        const ciudad =
          String(
            egresado.ciudadTrabajo || ""
          ).toLowerCase();


        const coincideBusqueda =
          texto === "" ||
          nombreCompleto.includes(texto) ||
          correo.includes(texto) ||
          empresa.includes(texto) ||
          cargo.includes(texto) ||
          ciudad.includes(texto);


        const coincideCiudad =
          ciudadFiltro === "" ||
          egresado.ciudadTrabajo === ciudadFiltro;


        const coincideFormacion =
          formacionFiltro === "" ||
          egresado.nivelFormacion === formacionFiltro;


        return (
          coincideBusqueda &&
          coincideCiudad &&
          coincideFormacion
        );

      }
    );

  }, [
    egresados,
    busqueda,
    ciudadFiltro,
    formacionFiltro
  ]);


  // =====================================================
  // LIMPIAR FILTROS
  // =====================================================

  const limpiarFiltros = () => {

    setBusqueda("");

    setCiudadFiltro("");

    setFormacionFiltro("");

  };


  // =====================================================
  // FORMATEAR FECHA
  // =====================================================

  const formatearFecha = (fecha) => {

    if (!fecha) {

      return "No registrada";

    }


    // Firestore Timestamp
    if (
      typeof fecha === "object" &&
      typeof fecha.toDate === "function"
    ) {

      return fecha
        .toDate()
        .toLocaleDateString(
          "es-CO"
        );

    }


    // Fecha como string
    if (
      typeof fecha === "string"
    ) {

      const fechaObjeto =
        new Date(fecha);


      if (
        !Number.isNaN(
          fechaObjeto.getTime()
        )
      ) {

        return fechaObjeto.toLocaleDateString(
          "es-CO"
        );

      }

    }


    return String(fecha);

  };


  // =====================================================
  // OBTENER NOMBRE
  // =====================================================

  const obtenerNombre = (egresado) => {

    const nombre =
      `${egresado.nombres || ""} ${egresado.apellidos || ""}`
        .trim();


    return (
      nombre ||
      "Egresado sin nombre"
    );

  };


  // =====================================================
  // ABRIR PERFIL
  // =====================================================

  const abrirPerfil = (egresado) => {

    console.log(
      "========================================"
    );

    console.log(
      "ABRIENDO PERFIL DEL EGRESADO:"
    );

    console.log(
      egresado
    );

    console.log(
      "========================================"
    );

    // La clasificación solo aparece después
    // de ejecutar nuevamente el análisis con IA.
    setErrorIA("");

    setEgresadoSeleccionado(
      egresado
    );

  };

  // ======================================================
  // CARGAR CLASIFICACIÓN IA DESDE FIRESTORE
  // ======================================================

  useEffect(() => {

    const cargarClasificacionIA = async () => {

      if (!egresadoSeleccionado?.id) {

        setClasificacionIA(null);

        return;
      }

      try {

        setErrorIA("");

        const clasificacionRef = doc(
          db,
          "clasificacionesIA",
          egresadoSeleccionado.id
        );

        const clasificacionSnapshot =
          await getDoc(clasificacionRef);

        if (clasificacionSnapshot.exists()) {

          const clasificacion =
            clasificacionSnapshot.data();

          console.log(
            "CLASIFICACIÓN IA CARGADA DESDE FIRESTORE:",
            clasificacion
          );

          setClasificacionIA(
            clasificacion
          );

          setObservacionRevision(
            clasificacion.observacionRevision || ""
          );

        } else {

          console.log(
            "EL EGRESADO NO TIENE CLASIFICACIÓN IA."
          );

          setClasificacionIA(null);

          setObservacionRevision("");

        }

      } catch (error) {

        console.error(
          "Error al cargar la clasificación de IA:",
          error
        );

        setClasificacionIA(null);

        setErrorIA(
          "No fue posible cargar la clasificación del perfil."
        );

      }

    };

    cargarClasificacionIA();

  }, [egresadoSeleccionado?.id]);

  // =====================================================
  // CLASIFICAR PERFIL CON IA
  // =====================================================

  const clasificarConIA = async () => {

    if (!egresadoSeleccionado?.id) {
      setErrorIA(
        "No se encontró el identificador del egresado."
      );

      return;
    }

    try {

      setCargandoIA(true);
      setErrorIA("");
      setClasificacionIA(null);


      
      const user = auth.currentUser;

      if (!user) {
        throw new Error(
          "Debes iniciar sesión para clasificar al egresado."
        );
      }

      const token = await user.getIdToken();

      const response = await fetch(
        "https://testfirestoregemini-ujatq2kktq-uc.a.run.app",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            egresadoId: egresadoSeleccionado.id,
          }),
        }
      );



      const resultado = await response.json();

      if (!response.ok || !resultado.success) {

        throw new Error(
          resultado.message ||
          "No fue posible clasificar el perfil."
        );

      }

      setClasificacionIA(
        resultado.clasificacion
      );

    } catch (error) {

      console.error(
        "Error clasificando perfil con IA:",
        error
      );

      setErrorIA(
        error.message ||
        "No fue posible generar la clasificación."
      );

    } finally {

      setCargandoIA(false);

    }

  };

  // =====================================================
  // APROBAR CLASIFICACIÓN IA
  // =====================================================

  const aprobarClasificacion = async () => {

    if (!egresadoSeleccionado?.id) {
      setErrorIA("No se encontró el identificador del egresado.");
      return;
    }

    if (!clasificacionIA) {
      setErrorIA("No existe una clasificación para aprobar.");
      return;
    }

    try {

      setErrorIA("");

      const clasificacionRef = doc(
        db,
        "clasificacionesIA",
        egresadoSeleccionado.id
      );

      const observacion =
        observacionRevision.trim();

      await updateDoc(
        clasificacionRef,
        {
          estadoRevision: "aprobada",

          revisadoPor: "Administrador",

          fechaRevision: new Date(),

          observacionRevision:
            observacion ||
            "Clasificación aprobada por el administrador.",
        }
      );

      setClasificacionIA(
        (clasificacionActual) => ({
          ...clasificacionActual,

          estadoRevision: "aprobada",

          revisadoPor: "Administrador",

          fechaRevision: new Date(),

          observacionRevision:
            observacion ||
            "Clasificación aprobada por el administrador.",
        })
      );

      setObservacionRevision(
        observacion ||
        "Clasificación aprobada por el administrador."
      );

      console.log(
        "Clasificación IA aprobada correctamente."
      );

    } catch (error) {

      console.error(
        "Error aprobando clasificación IA:",
        error
      );

      setErrorIA(
        "No fue posible aprobar la clasificación."
      );
    }
  };

  // =====================================================
  // CERRAR PERFIL
  // =====================================================

  const cerrarPerfil = () => {

    setEgresadoSeleccionado(
      null
    );

  };


  // =====================================================
  // ESC PARA CERRAR MODAL
  // =====================================================

  useEffect(() => {

    const manejarTecla = (event) => {

      if (
        event.key === "Escape" &&
        egresadoSeleccionado
      ) {

        cerrarPerfil();

      }

    };


    document.addEventListener(
      "keydown",
      manejarTecla
    );


    return () => {

      document.removeEventListener(
        "keydown",
        manejarTecla
      );

    };

  }, [egresadoSeleccionado]);


  // =====================================================
  // BLOQUEAR SCROLL CUANDO EL MODAL ESTÁ ABIERTO
  // =====================================================

  useEffect(() => {

    if (egresadoSeleccionado) {

      document.body.style.overflow = "hidden";

    } else {

      document.body.style.overflow = "";

    }


    return () => {

      document.body.style.overflow = "";

    };

  }, [egresadoSeleccionado]);


  // =====================================================
  // MODAL / PERFIL DEL EGRESADO
  // =====================================================

  const renderPerfil = () => {

    if (
      !egresadoSeleccionado
    ) {

      return null;

    }


    const contenidoPerfil = (

      <div
        className="egresado-detail-overlay"
        onMouseDown={(event) => {

          if (
            event.target === event.currentTarget
          ) {

            cerrarPerfil();

          }

        }}
      >

        <div
          className="egresado-detail"
          role="dialog"
          aria-modal="true"
          aria-labelledby="perfil-egresado-titulo"
        >

          {/* =================================================
              HEADER
              ================================================= */}

          <div className="egresado-detail-header">

            <div>

              <span>
                PERFIL DEL EGRESADO
              </span>


              <h2 id="perfil-egresado-titulo">

                {obtenerNombre(
                  egresadoSeleccionado
                )}

              </h2>

            </div>


            <button
              type="button"
              className="egresado-detail-close"
              onClick={cerrarPerfil}
              aria-label="Cerrar perfil"
              title="Cerrar"
            >

              ×

            </button>

          </div>


          {/* =================================================
              INFORMACIÓN PERSONAL Y PROFESIONAL
              ================================================= */}

          <div className="egresado-detail-grid">


            {/* CORREO */}

            <div>

              <span>
                CORREO
              </span>

              <strong>

                {Array.isArray(egresadoSeleccionado.correos)
                  ? egresadoSeleccionado.correos[0] || "No registrado"
                  : egresadoSeleccionado.correos || "No registrado"}

              </strong>

            </div>


            {/* CELULAR */}

              <div>

                <span>
                  CELULAR
                </span>

                <strong>

                  {Array.isArray(egresadoSeleccionado.telefonos)
                    ? egresadoSeleccionado.telefonos[0] || "No registrado"
                    : egresadoSeleccionado.telefonos || "No registrado"}

                </strong>

              </div>


            {/* FECHA DE GRADO */}

            <div>

              <span>
                FECHA DE GRADO
              </span>

              <strong>

                {formatearFecha(
                  egresadoSeleccionado.fechaGrado
                )}

              </strong>

            </div>


            {/* NIVEL DE FORMACIÓN */}

            <div>

              <span>
                NIVEL DE FORMACIÓN
              </span>

              <strong>

                {egresadoSeleccionado.nivelFormacion ||
                  "No registrado"}

              </strong>

            </div>


            {/* EMPRESA */}

            <div>

              <span>
                EMPRESA ACTUAL
              </span>

              <strong>

                {egresadoSeleccionado.empresaActual ||
                  "No registrada"}

              </strong>

            </div>


            {/* CARGO */}

            <div>

              <span>
                CARGO ACTUAL
              </span>

              <strong>

                {egresadoSeleccionado.cargoActual ||
                  "No registrado"}

              </strong>

            </div>


            {/* CIUDAD */}

            <div>

              <span>
                CIUDAD DE TRABAJO
              </span>

              <strong>

                {egresadoSeleccionado.ciudadTrabajo ||
                  "No registrada"}

              </strong>

            </div>


            {/* TIPO DE EMPRESA */}

            <div>

              <span>
                TIPO DE EMPRESA
              </span>

              <strong>

                {egresadoSeleccionado.tipoEmpresa ||
                  "No registrado"}

              </strong>

            </div>


            {/* DIRECCIÓN */}

            <div>

              <span>
                DIRECCIÓN DE RESIDENCIA
              </span>

              <strong>

                {egresadoSeleccionado.direccionResidencia ||
                  "No registrada"}

              </strong>

            </div>


            {/* SEXO */}

            <div>

              <span>
                SEXO BIOLÓGICO
              </span>

              <strong>

                {egresadoSeleccionado.sexoBiologico ||
                  "No registrado"}

              </strong>

            </div>


          </div>


          {/* =================================================
              DESCRIPCIÓN PROFESIONAL
              ================================================= */}

          <div className="egresado-detail-description">

            <span>
              DESCRIPCIÓN PROFESIONAL
            </span>


            <p>

              {egresadoSeleccionado.descripcionProfesional ||
                "El egresado no ha registrado una descripción profesional."}

            </p>

          </div>

          {/* =================================================
              CLASIFICACIÓN CON IA
              ================================================= */}

          <div className="egresado-detail-ai">

            <span>
              ANÁLISIS INTELIGENTE
            </span>

            <button
              type="button"
              onClick={clasificarConIA}
              disabled={cargandoIA}
            >
              {cargandoIA
                ? "Analizando perfil..."
                : "Clasificar perfil con IA →"}
            </button>

            {errorIA && (
              <p>
                {errorIA}
              </p>
            )}

            {clasificacionIA && (
              <div className="clasificacion-ia-resultado">
                <div className="clasificacion-ia-encabezado">
                  <span>RESULTADO DEL ANÁLISIS</span>
                  <small>
                    Clasificación generada por IA · Gemini 2.5 Flash
                  </small>
                </div>

                <div className="clasificacion-ia-grid">

                  <div className="clasificacion-ia-item">
                    <span>ÁREA PROFESIONAL</span>
                    <strong>
                      {clasificacionIA.areaProfesional || "No disponible"}
                    </strong>
                  </div>

                  <div className="clasificacion-ia-item">
                    <span>ESPECIALIDAD</span>
                    <strong>
                      {clasificacionIA.especialidad || "No disponible"}
                    </strong>
                  </div>

                  <div className="clasificacion-ia-item">
                    <span>CARGO PRINCIPAL</span>
                    <strong>
                      {clasificacionIA.cargoPrincipal || "No disponible"}
                    </strong>
                  </div>

                  <div className="clasificacion-ia-item">
                    <span>SECTOR</span>
                    <strong>
                      {clasificacionIA.sector || "No disponible"}
                    </strong>
                  </div>

                  <div className="clasificacion-ia-item clasificacion-ia-item-completo">
                    <span>TECNOLOGÍAS</span>

                    <div className="clasificacion-ia-tags">
                      {Array.isArray(clasificacionIA.tecnologias) &&
                      clasificacionIA.tecnologias.length > 0 ? (
                        clasificacionIA.tecnologias.map((tecnologia, index) => (
                          <span key={index}>
                            {tecnologia}
                          </span>
                        ))
                      ) : (
                        <strong>No disponible</strong>
                      )}
                    </div>
                  </div>

                  <div className="clasificacion-ia-item clasificacion-ia-item-completo">
                    <span>PALABRAS CLAVE</span>

                    <div className="clasificacion-ia-tags">
                      {Array.isArray(clasificacionIA.palabrasClave) &&
                      clasificacionIA.palabrasClave.length > 0 ? (
                        clasificacionIA.palabrasClave.map((palabra, index) => (
                          <span key={index}>
                            {palabra}
                          </span>
                        ))
                      ) : (
                        <strong>No disponible</strong>
                      )}
                    </div>
                  </div>

                </div>

                <div className="clasificacion-ia-pie">
                  <span>
                    Estado de revisión:{" "}
                  <strong
                    className={
                      clasificacionIA.estadoRevision === "aprobada"
                        ? "estado-aprobada"
                        : "estado-pendiente"
                    }
                  >
                    {clasificacionIA.estadoRevision || "pendiente"}
                  </strong>
                  </span>

                  <span>
                    Generado por IA:{" "}
                    <strong>
                      {clasificacionIA.generadoPorIA ? "Sí" : "No"}
                    </strong>
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* =================================================
              REVISION IA
              ================================================= */}

          {clasificacionIA && (
            <div className="clasificacion-ia-revision">

              {/* INFORMACIÓN */}
              <div className="clasificacion-ia-revision-info">

                <span className="clasificacion-ia-revision-titulo">
                  REVISIÓN ADMINISTRATIVA
                </span>

                <p>
                  {clasificacionIA.estadoRevision === "aprobada"
                    ? "La clasificación generada por inteligencia artificial fue validada por el administrador."
                    : "Esta clasificación fue generada mediante inteligencia artificial y requiere validación por parte del administrador."}
                </p>

              </div>


              {/* OBSERVACIÓN DEL ADMINISTRADOR */}
              <div className="clasificacion-ia-revision-observacion">

                <label htmlFor="observacionRevision">
                  OBSERVACIÓN DEL ADMINISTRADOR
                </label>

                <textarea
                  id="observacionRevision"
                  value={observacionRevision}
                  onChange={(event) =>
                    setObservacionRevision(event.target.value)
                  }
                  placeholder="Escriba una observación sobre la clasificación..."
                  rows={3}
                />

              </div>


              {/* PARTE INFERIOR */}
              <div className="clasificacion-ia-revision-footer">

                {/* ESTADO */}
                <div className="clasificacion-ia-revision-estado">

                  <span>ESTADO ACTUAL</span>

                  <strong
                    className={
                      clasificacionIA.estadoRevision === "aprobada"
                        ? "estado-aprobada"
                        : "estado-pendiente"
                    }
                  >
                    {clasificacionIA.estadoRevision || "pendiente"}
                  </strong>

                </div>


                {/* ACCIÓN */}
                <button
                  type="button"
                  className={
                    clasificacionIA.estadoRevision === "aprobada"
                      ? "clasificacion-ia-aprobada"
                      : "clasificacion-ia-aprobar"
                  }
                  onClick={aprobarClasificacion}
                  disabled={clasificacionIA.estadoRevision === "aprobada"}
                >
                  {clasificacionIA.estadoRevision === "aprobada"
                    ? "✓ Clasificación aprobada"
                    : "✓ Aprobar clasificación"}
                </button>

              </div>

            </div>
          )}

          {/* =================================================
              REDES PROFESIONALES
              ================================================= */}

          <div className="egresado-detail-links">

            {egresadoSeleccionado.linkedinUrl && (

              <a
                href={
                  egresadoSeleccionado.linkedinUrl
                }
                target="_blank"
                rel="noopener noreferrer"
              >

                LinkedIn →

              </a>

            )}


            {egresadoSeleccionado.facebookUrl && (

              <a
                href={
                  egresadoSeleccionado.facebookUrl
                }
                target="_blank"
                rel="noopener noreferrer"
              >

                Facebook →

              </a>

            )}

          </div>


          {/* =================================================
              ID DEL REGISTRO
              ================================================= */}

          <div className="egresado-detail-id">

            <span>
              ID DEL REGISTRO
            </span>

            <code>
              {egresadoSeleccionado.id}
            </code>

          </div>


        </div>

      </div>

    );


    // =====================================================
    // PORTAL
    // =====================================================

    return createPortal(
      contenidoPerfil,
      document.body
    );

  };


  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (

    <>

      <section className="egresados-admin">


        {/* =================================================
            ENCABEZADO
            ================================================= */}

        <div className="egresados-admin-header">

          <div>

            <span className="egresados-admin-label">

              GESTIÓN DE EGRESADOS

            </span>


            <h2>
              Egresados registrados
            </h2>


            <p>

              Consulta y gestiona la información
              de los egresados registrados en
              CONECTA-TEL.

            </p>

          </div>


          <div className="egresados-admin-total">

            <span>
              REGISTROS
            </span>

            <strong>
              {egresadosFiltrados.length}
            </strong>

          </div>

        </div>


        {/* =================================================
            FILTROS
            ================================================= */}

        <div className="egresados-admin-filters">


          {/* BUSCAR */}

          <div className="egresados-search">

            <span>
              BUSCAR
            </span>


            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Nombre, correo, empresa, cargo o ciudad..."
            />

          </div>


          {/* CIUDAD */}

          <div className="egresados-filter">

            <span>
              CIUDAD
            </span>


            <select
              value={ciudadFiltro}
              onChange={(e) =>
                setCiudadFiltro(
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

          </div>


          {/* FORMACIÓN */}

          <div className="egresados-filter">

            <span>
              FORMACIÓN
            </span>


            <select
              value={formacionFiltro}
              onChange={(e) =>
                setFormacionFiltro(
                  e.target.value
                )
              }
            >

              <option value="">
                Todos los niveles
              </option>


              {nivelesFormacion.map(
                (nivel) => (

                  <option
                    key={nivel}
                    value={nivel}
                  >
                    {nivel}
                  </option>

                )
              )}

            </select>

          </div>


          {/* LIMPIAR */}

          <button
            type="button"
            className="egresados-clear"
            onClick={limpiarFiltros}
          >

            Limpiar

          </button>

        </div>


        {/* =================================================
            ERROR
            ================================================= */}

        {error && (

          <div className="egresados-admin-error">

            {error}

          </div>

        )}


        {/* =================================================
            CARGANDO
            ================================================= */}

        {loading ? (

          <div className="egresados-admin-loading">

            <span></span>

            Cargando egresados...

          </div>

        ) : (

          /* =================================================
             TABLA
             ================================================= */

          <div className="egresados-table-wrapper">

            <table className="egresados-table">

              <thead>

                <tr>

                  <th>
                    EGRESADO
                  </th>

                  <th>
                    CIUDAD
                  </th>

                  <th>
                    EMPRESA
                  </th>

                  <th>
                    CARGO
                  </th>

                  <th>
                    FORMACIÓN
                  </th>

                  <th>
                    ACCIÓN
                  </th>

                </tr>

              </thead>


              <tbody>

                {egresadosFiltrados.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="egresados-empty"
                    >

                      No se encontraron
                      egresados con los
                      filtros seleccionados.

                    </td>

                  </tr>

                ) : (

                  egresadosFiltrados.map(
                    (egresado) => (

                      <tr
                        key={egresado.id}
                      >


                        {/* EGRESADO */}

                        <td>

                          <div className="egresado-name">

                            <strong>

                              {obtenerNombre(
                                egresado
                              )}

                            </strong>


                            <span>

                              {egresado.correo ||
                                "Correo no registrado"}

                            </span>

                          </div>

                        </td>


                        {/* CIUDAD */}

                        <td>

                          {egresado.ciudadTrabajo ||
                            "No registrada"}

                        </td>


                        {/* EMPRESA */}

                        <td>

                          {egresado.empresaActual ||
                            "No registrada"}

                        </td>


                        {/* CARGO */}

                        <td>

                          {egresado.cargoActual ||
                            "No registrado"}

                        </td>


                        {/* FORMACIÓN */}

                        <td>

                          {egresado.nivelFormacion ||
                            "No registrado"}

                        </td>


                        {/* ACCIÓN */}

                        <td>

                          <button
                            type="button"
                            className="egresado-view-button"
                            onClick={() =>
                              abrirPerfil(
                                egresado
                              )
                            }
                          >

                            Ver perfil →

                          </button>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* =================================================
          MODAL
          
          IMPORTANTE:
          Está FUERA de la sección principal.
          createPortal lo lleva directamente al body.
          ================================================= */}

      {renderPerfil()}

    </>

  );

}


export default EgresadosAdmin;