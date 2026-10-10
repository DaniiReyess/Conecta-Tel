import "./PerfilEgresadoAdmin.css";


function PerfilEgresadoAdmin({
  egresado,
  onBack,
}) {

  if (!egresado) {
    return null;
  }


  const valor = (campo) => {

    if (
      egresado[campo] === undefined ||
      egresado[campo] === null ||
      egresado[campo] === ""
    ) {
      return "No registrado";
    }

    return egresado[campo];

  };


  return (

    <div className="perfil-admin">


      {/* =================================================
          ENCABEZADO
          ================================================= */}

      <div className="perfil-admin-header">

        <div>

          <span className="perfil-admin-eyebrow">
            PERFIL DEL EGRESADO
          </span>

          <h2>
            {valor("nombres")} {valor("apellidos")}
          </h2>

          <p>
            Información académica y profesional registrada
            en CONECTA-TEL.
          </p>

        </div>


        <button
          type="button"
          className="perfil-admin-back"
          onClick={onBack}
        >
          ← Volver
        </button>

      </div>


      {/* =================================================
          INFORMACIÓN PERSONAL
          ================================================= */}

      <section className="perfil-admin-section">

        <span className="perfil-admin-section-title">
          INFORMACIÓN PERSONAL
        </span>


        <div className="perfil-admin-grid">

          <div className="perfil-admin-item">

            <span>Nombre completo</span>

            <strong>
              {valor("nombres")} {valor("apellidos")}
            </strong>

          </div>


          <div className="perfil-admin-item">

            <span>Correo</span>

            <strong>
              {valor("correo")}
            </strong>

          </div>


          <div className="perfil-admin-item">

            <span>Celular</span>

            <strong>
              {valor("celular")}
            </strong>

          </div>


          <div className="perfil-admin-item">

            <span>Sexo</span>

            <strong>
              {valor("sexoBiologico")}
            </strong>

          </div>

        </div>

      </section>


      {/* =================================================
          INFORMACIÓN ACADÉMICA
          ================================================= */}

      <section className="perfil-admin-section">

        <span className="perfil-admin-section-title">
          INFORMACIÓN ACADÉMICA
        </span>


        <div className="perfil-admin-grid">

          <div className="perfil-admin-item">

            <span>Fecha de grado</span>

            <strong>
              {valor("fechaGrado")}
            </strong>

          </div>


          <div className="perfil-admin-item">

            <span>Nivel de formación</span>

            <strong>
              {valor("nivelFormacion")}
            </strong>

          </div>

        </div>

      </section>


      {/* =================================================
          INFORMACIÓN PROFESIONAL
          ================================================= */}

      <section className="perfil-admin-section">

        <span className="perfil-admin-section-title">
          INFORMACIÓN PROFESIONAL
        </span>


        <div className="perfil-admin-grid">

          <div className="perfil-admin-item">

            <span>Empresa actual</span>

            <strong>
              {valor("empresaActual")}
            </strong>

          </div>


          <div className="perfil-admin-item">

            <span>Cargo actual</span>

            <strong>
              {valor("cargoActual")}
            </strong>

          </div>


          <div className="perfil-admin-item">

            <span>Ciudad de trabajo</span>

            <strong>
              {valor("ciudadTrabajo")}
            </strong>

          </div>


          <div className="perfil-admin-item">

            <span>Tipo de empresa</span>

            <strong>
              {valor("tipoEmpresa")}
            </strong>

          </div>

        </div>

      </section>


      {/* =================================================
          DESCRIPCIÓN
          ================================================= */}

      <section className="perfil-admin-section">

        <span className="perfil-admin-section-title">
          DESCRIPCIÓN PROFESIONAL
        </span>


        <p className="perfil-admin-description">
          {valor("descripcionProfesional")}
        </p>

      </section>


      {/* =================================================
          REDES PROFESIONALES
          ================================================= */}

      <section className="perfil-admin-section">

        <span className="perfil-admin-section-title">
          REDES PROFESIONALES
        </span>


        <div className="perfil-admin-links">

          {egresado.linkedinUrl ? (

            <a
              href={egresado.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn →
            </a>

          ) : (

            <span>
              LinkedIn no registrado
            </span>

          )}


          {egresado.facebookUrl ? (

            <a
              href={egresado.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook →
            </a>

          ) : (

            <span>
              Facebook no registrado
            </span>

          )}

        </div>

      </section>


    </div>

  );

}


export default PerfilEgresadoAdmin;