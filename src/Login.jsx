
import { useState } from "react";

import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  getIdToken,
  getIdTokenResult,
} from "firebase/auth";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import PanelEgresado from "./PanelEgresado";
import PanelAdministrador from "./PanelAdministrador";

import "./Login.css";

const URL_CAMBIO_PASSWORD =
  "https://us-central1-conecta-tel.cloudfunctions.net/completarCambioPassword";

function Login({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [egresado, setEgresado] = useState(null);
  const [administrador, setAdministrador] = useState(null);

  const [debeCambiarPassword, setDebeCambiarPassword] =
    useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  /*
   * INICIO DE SESIÓN
   * Admite correo de administrador o código de egresado.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const identificador = email.trim();

      // Los administradores ingresan con su correo.
      // Los egresados ingresan con su código único, por ejemplo E-1.
      const correoAcceso = identificador.includes("@")
        ? identificador
        : `ct-${identificador.toLowerCase().replace(/-/g, "")}@conecta-tel.firebaseapp.com`;
      console.log("Correo de acceso calculado:", correoAcceso);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        correoAcceso,
        password
      );

      const user = userCredential.user;
      const tokenInfo = await getIdTokenResult(user, true);

      /*
       * PRIMERO: comprobar si tiene un cambio obligatorio pendiente.
       * No se consultan los paneles hasta completar el cambio.
       */
      if (tokenInfo.claims.mustChangePassword === true) {
        setDebeCambiarPassword(true);
        setAdministrador(null);
        setEgresado(null);
        return;
      }

      /*
       * SEGUNDO: buscar administrador por UID.
       * Se conserva la estructura actual del proyecto.
       */
      const adminRef = doc(db, "administradores", user.uid);
      const adminSnapshot = await getDoc(adminRef);

      if (adminSnapshot.exists()) {
        const datosAdministrador = adminSnapshot.data();

        if (datosAdministrador.activo !== true) {
          await signOut(auth);
          setError(
            "El administrador se encuentra inactivo. Contacta al administrador del sistema."
          );
          return;
        }

        setEgresado(null);
        setAdministrador({
          id: adminSnapshot.id,
          uid: user.uid,
          ...datosAdministrador,
        });

        return;
      }

      /*
       * TERCERO: buscar egresado por UID.
       */
      const egresadosRef = collection(db, "egresados");
      const q = query(
        egresadosRef,
        where("uid", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await signOut(auth);
        setError(
          "El usuario no está registrado en CONECTA-TEL."
        );
        return;
      }

      const egresadoDoc = snapshot.docs[0];
      const datosEgresado = egresadoDoc.data();

      setAdministrador(null);
      setEgresado({
        id: egresadoDoc.id,
        uid: user.uid,
        ...datosEgresado,
      });
    } catch (err) {
      console.error(
        "Error de inicio de sesión:",
        err?.code || "unknown"
      );

      if (
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/user-not-found" ||
        err?.code === "auth/invalid-email"
      ) {
        setError("Código o correo y contraseña incorrectos.");
      } else if (err?.code === "auth/too-many-requests") {
        setError(
          "Demasiados intentos. Intenta nuevamente más tarde."
        );
      } else if (err?.code === "permission-denied") {
        setError(
          "No tienes permisos para acceder a esta información."
        );
      } else {
        setError(
          "No fue posible iniciar sesión. Verifica tus datos e inténtalo nuevamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * CAMBIO OBLIGATORIO DE CONTRASEÑA
   */
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (nuevaPassword.length < 8) {
      setError(
        "La nueva contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      setError(
        "La sesión expiró. Inicia sesión nuevamente."
      );
      setDebeCambiarPassword(false);
      return;
    }

    setLoading(true);

    try {
      /*
       * Firebase Auth actualiza la contraseña.
       */
      await updatePassword(user, nuevaPassword);

      /*
       * Se obtiene un token reciente para llamar al backend.
       */

      const token = await getIdToken(user, true);

      const response = await fetch(URL_CAMBIO_PASSWORD, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nuevaPassword,
        }),
      });

      const resultado = await response.json();

      if (!response.ok || !resultado.success) {
        throw new Error(
          resultado.message ||
            "No se pudo completar el cambio de contraseña."
        );
      }


      /*
       * El backend ya confirmó el cambio y retiró la
       * marca mustChangePassword. Cerramos sesión para
       * iniciar de nuevo con las credenciales actualizadas.
       */
      await signOut(auth);

      setDebeCambiarPassword(false);
      setNuevaPassword("");
      setConfirmarPassword("");
      setPassword("");
      setEmail("");
      setError(
        "Contraseña actualizada. Ingresa nuevamente con tu código y tu nueva contraseña."
      );
    } catch (err) {
      console.error(
        "Error al cambiar contraseña:",
        err?.code || err?.message || "unknown"
      );

      if (err?.code === "auth/weak-password") {
        setError(
          "La contraseña es demasiado débil. Elige otra de al menos 8 caracteres."
        );
      } else if (
        err?.code === "auth/requires-recent-login"
      ) {
        setError(
          "Por seguridad, inicia sesión nuevamente y repite el cambio."
        );
      } else {
        setError(
          err?.message ||
            "No fue posible completar el cambio. Intenta nuevamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * CERRAR SESIÓN Y LIMPIAR ESTADOS
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);

      setEgresado(null);
      setAdministrador(null);
      setDebeCambiarPassword(false);
      setEmail("");
      setPassword("");
      setNuevaPassword("");
      setConfirmarPassword("");
      setError("");
    } catch (err) {
      console.error(
        "Error al cerrar sesión:",
        err?.code || "unknown"
      );
    }
  };

  /*
   * PANTALLA OBLIGATORIA DE CAMBIO DE CONTRASEÑA
   * Se muestra antes de cualquiera de los paneles.
   */
  if (debeCambiarPassword) {
    return (
      <div className="login-overlay">
        <div className="login-modal">
          <div className="login-header">
            <img
              src="/logo-conecta-tel.png"
              alt="CONECTA-TEL"
            />

            <h2>Crea tu nueva contraseña</h2>

            <p>
              Para proteger tu cuenta, debes reemplazar
              la contraseña temporal antes de ingresar.
            </p>
          </div>

          <form
            onSubmit={handleCambiarPassword}
            className="login-form"
          >
            <label htmlFor="nuevaPassword">
              Nueva contraseña
            </label>

            <input
              id="nuevaPassword"
              type="password"
              value={nuevaPassword}
              onChange={(e) =>
                setNuevaPassword(e.target.value)
              }
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              minLength={8}
              required
            />

            <label htmlFor="confirmarPassword">
              Confirmar nueva contraseña
            </label>

            <input
              id="confirmarPassword"
              type="password"
              value={confirmarPassword}
              onChange={(e) =>
                setConfirmarPassword(e.target.value)
              }
              placeholder="Repite la nueva contraseña"
              autoComplete="new-password"
              minLength={8}
              required
            />

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? "Actualizando..."
                : "Guardar nueva contraseña"}
            </button>

            <button
              type="button"
              className="login-close"
              aria-label="Cerrar sesión"
              onClick={handleLogout}
              disabled={loading}
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    );
  }

  /*
   * PANEL ADMINISTRADOR
   */
  if (administrador) {
    return (
      <PanelAdministrador
        administrador={administrador}
        onLogout={async () => {
          await handleLogout();
          onClose();
        }}
      />
    );
  }

  /*
   * PANEL EGRESADO
   */
  if (egresado) {
    return (
      <PanelEgresado
        egresado={egresado}
        onLogout={async () => {
          await handleLogout();
          onClose();
        }}
      />
    );
  }

  /*
   * FORMULARIO DE INICIO DE SESIÓN
   */
  return (
    <div className="login-overlay">
      <div className="login-modal">
        <button
          className="login-close"
          onClick={onClose}
          aria-label="Cerrar"
          type="button"
        >
          ×
        </button>

        <div className="login-header">
          <img
            src="/logo-conecta-tel.png"
            alt="CONECTA-TEL"
          />

          <h2>Bienvenido</h2>

          <p>
            Ingresa a la plataforma de egresados.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="login-form"
        >
          <label htmlFor="email">
            Correo de administrador o código de egresado
          </label>

          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="Correo o código de acceso"
            autoComplete="username"
            required
          />

          <label htmlFor="password">
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Contraseña"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading
              ? "Ingresando..."
              : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
