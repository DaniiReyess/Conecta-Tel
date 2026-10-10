import { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";
import "./EditarPerfil.css";

function EditarPerfil({ egresado, onCancel, onSaved }) {
  const [formulario, setFormulario] = useState({
    celular: egresado.telefonos?.[0] || "",
    correo: egresado.correos?.[0] || "",
    linkedinUrl: egresado.linkedinUrl || "",
    facebookUrl: egresado.facebookUrl || "",
    empresaActual: egresado.empresaActual || "",
    cargoActual: egresado.cargoActual || "",
    ciudadTrabajo: egresado.ciudadTrabajo || "",
    descripcionProfesional: egresado.descripcionProfesional || "",
  });

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      const q = query(
        collection(db, "egresados"),
        where("uid", "==", egresado.uid)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error("No se encontró el perfil del egresado.");
      }

      const documento = snapshot.docs[0];

      await updateDoc(documento.ref, {
        telefonos: formulario.celular
          ? [formulario.celular]
          : [],

        correos: formulario.correo
          ? [formulario.correo]
          : [],

        linkedinUrl: formulario.linkedinUrl.trim(),
        facebookUrl: formulario.facebookUrl.trim(),

        empresaActual: formulario.empresaActual.trim(),
        cargoActual: formulario.cargoActual.trim(),
        ciudadTrabajo: formulario.ciudadTrabajo.trim(),

        descripcionProfesional:
          formulario.descripcionProfesional.trim(),

        fechaActualizacion: new Date().toISOString(),
      });

      const datosActualizados = {
        ...egresado,
        telefonos: formulario.celular
          ? [formulario.celular]
          : [],

        correos: formulario.correo
          ? [formulario.correo]
          : [],

        linkedinUrl: formulario.linkedinUrl.trim(),
        facebookUrl: formulario.facebookUrl.trim(),

        empresaActual: formulario.empresaActual.trim(),
        cargoActual: formulario.cargoActual.trim(),
        ciudadTrabajo: formulario.ciudadTrabajo.trim(),

        descripcionProfesional:
          formulario.descripcionProfesional.trim(),

        fechaActualizacion: new Date().toISOString(),
      };

      setMensaje("Información actualizada correctamente.");

      setTimeout(() => {
        onSaved(datosActualizados);
      }, 800);

    } catch (error) {
      console.error("Error actualizando perfil:", error);
      setError(
        "No fue posible actualizar la información. Intenta nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="editar-perfil-page">

      <div className="editar-perfil-header">

        <div>
          <span className="editar-eyebrow">
            ACTUALIZACIÓN DE INFORMACIÓN
          </span>

          <h1>Editar mi perfil</h1>

          <p>
            Mantén actualizada tu información profesional en CONECTA-TEL.
          </p>
        </div>

        <button
          type="button"
          className="editar-cancelar-top"
          onClick={onCancel}
        >
          ← Volver al perfil
        </button>

      </div>

      <form
        className="editar-perfil-form"
        onSubmit={handleSubmit}
      >

        <section className="editar-section">

          <div className="editar-section-title">
            <span>01</span>
            <div>
              <h2>Información profesional</h2>
              <p>Actualiza tu situación laboral actual.</p>
            </div>
          </div>

          <div className="editar-grid">

            <div className="editar-field">
              <label>Empresa actual</label>

              <input
                type="text"
                name="empresaActual"
                value={formulario.empresaActual}
                onChange={handleChange}
                placeholder="Ej. Empresa XYZ"
              />
            </div>

            <div className="editar-field">
              <label>Cargo actual</label>

              <input
                type="text"
                name="cargoActual"
                value={formulario.cargoActual}
                onChange={handleChange}
                placeholder="Ej. Ingeniero de Telecomunicaciones"
              />
            </div>

            <div className="editar-field">
              <label>Ciudad de trabajo</label>

              <input
                type="text"
                name="ciudadTrabajo"
                value={formulario.ciudadTrabajo}
                onChange={handleChange}
                placeholder="Ej. Bucaramanga"
              />
            </div>

          </div>

        </section>

        <section className="editar-section">

          <div className="editar-section-title">
            <span>02</span>

            <div>
              <h2>Contacto</h2>
              <p>Información para mantener tus datos actualizados.</p>
            </div>
          </div>

          <div className="editar-grid">

            <div className="editar-field">
              <label>Correo electrónico</label>

              <input
                type="email"
                name="correo"
                value={formulario.correo}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="editar-field">
              <label>Teléfono</label>

              <input
                type="tel"
                name="celular"
                value={formulario.celular}
                onChange={handleChange}
                placeholder="300 000 0000"
              />
            </div>

          </div>

        </section>

        <section className="editar-section">

          <div className="editar-section-title">
            <span>03</span>

            <div>
              <h2>Presencia digital</h2>
              <p>Actualiza tus perfiles profesionales.</p>
            </div>
          </div>

          <div className="editar-grid">

            <div className="editar-field">
              <label>LinkedIn</label>

              <input
                type="url"
                name="linkedinUrl"
                value={formulario.linkedinUrl}
                onChange={handleChange}
                placeholder="https://www.linkedin.com/in/..."
              />
            </div>

            <div className="editar-field">
              <label>Facebook</label>

              <input
                type="url"
                name="facebookUrl"
                value={formulario.facebookUrl}
                onChange={handleChange}
                placeholder="https://www.facebook.com/..."
              />
            </div>

          </div>

        </section>

        <section className="editar-section">

          <div className="editar-section-title">
            <span>04</span>

            <div>
              <h2>Perfil profesional</h2>
              <p>
                Describe brevemente tu experiencia y trayectoria.
              </p>
            </div>
          </div>

          <div className="editar-field">

            <label>Descripción profesional</label>

            <textarea
              name="descripcionProfesional"
              value={formulario.descripcionProfesional}
              onChange={handleChange}
              rows="6"
              placeholder="Cuéntanos sobre tu experiencia profesional..."
            />

          </div>

        </section>

        {mensaje && (
          <div className="editar-mensaje">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="editar-error">
            {error}
          </div>
        )}

        <div className="editar-actions">

          <button
            type="button"
            className="editar-btn-secundario"
            onClick={onCancel}
            disabled={guardando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="editar-btn-principal"
            disabled={guardando}
          >
            {guardando
              ? "Guardando..."
              : "Guardar cambios"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default EditarPerfil;