import { useState } from "react";

import {
  signInWithEmailAndPassword,
  signOut,
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


function Login({ onClose }) {


  /*
   * =====================================================
   * ESTADOS
   * =====================================================
   */

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // Usuario con rol Egresado
  const [egresado, setEgresado] = useState(null);

  // Usuario con rol Administrador
  const [administrador, setAdministrador] = useState(null);


  /*
   * =====================================================
   * INICIO DE SESIÓN
   * =====================================================
   */

  const handleLogin = async (e) => {

    e.preventDefault();

    // Limpiar mensajes anteriores
    setError("");

    // Activar estado de carga
    setLoading(true);


    try {

      /*
       * =================================================
       * 1. AUTENTICACIÓN CON FIREBASE
       * =================================================
       */

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );


      const user =
        userCredential.user;


      console.log(
        "================================="
      );

      console.log(
        "USUARIO AUTENTICADO"
      );

      console.log(
        "Correo:",
        user.email
      );

      console.log(
        "UID:",
        user.uid
      );

      console.log(
        "================================="
      );


      /*
       * =================================================
       * 2. BUSCAR ADMINISTRADOR
       * =================================================
       *
       * La estructura utilizada es:
       *
       * administradores/{UID}
       *
       * Si existe este documento, el usuario es
       * Administrador.
       *
       */

      const adminRef =
        doc(
          db,
          "administradores",
          user.uid
        );


      const adminSnapshot =
        await getDoc(adminRef);


      /*
       * =================================================
       * 3. SI EXISTE EL ADMINISTRADOR
       * =================================================
       */

      if (adminSnapshot.exists()) {


        const datosAdministrador =
          adminSnapshot.data();


        console.log(
          "Administrador encontrado:",
          datosAdministrador
        );


        /*
         * -----------------------------------------------
         * VERIFICAR ESTADO DEL ADMINISTRADOR
         * -----------------------------------------------
         */

        if (datosAdministrador.activo !== true) {

          setError(
            "El administrador se encuentra inactivo. Contacta al administrador del sistema."
          );


          await signOut(auth);

          return;

        }


        /*
         * -----------------------------------------------
         * CREAR OBJETO COMPLETO DEL ADMINISTRADOR
         * -----------------------------------------------
         */

        const administradorCompleto = {

          id:
            adminSnapshot.id,

          uid:
            user.uid,

          ...datosAdministrador,

        };


        console.log(
          "================================="
        );

        console.log(
          "ROL DETECTADO: ADMINISTRADOR"
        );

        console.log(
          administradorCompleto
        );

        console.log(
          "================================="
        );


        /*
         * -----------------------------------------------
         * LIMPIAR ESTADO DE EGRESADO
         * -----------------------------------------------
         */

        setEgresado(null);


        /*
         * -----------------------------------------------
         * GUARDAR ADMINISTRADOR
         * -----------------------------------------------
         */

        setAdministrador(
          administradorCompleto
        );


        /*
         * -----------------------------------------------
         * TERMINAR LOGIN
         * -----------------------------------------------
         *
         * No buscamos el administrador dentro de
         * "egresados".
         *
         */

        return;

      }


      /*
       * =================================================
       * 4. NO ES ADMINISTRADOR
       * =================================================
       *
       * Si no existe:
       *
       * administradores/{UID}
       *
       * entonces comprobamos si es un egresado.
       *
       */


      console.log(
        "El usuario no es administrador."
      );

      console.log(
        "Buscando egresado..."
      );


      /*
       * =================================================
       * 5. BUSCAR EGRESADO EN FIRESTORE
       * =================================================
       *
       * Se busca mediante:
       *
       * egresados
       *    ↓
       * uid == user.uid
       *
       */

      const egresadosRef =
        collection(
          db,
          "egresados"
        );


      const q =
        query(
          egresadosRef,
          where(
            "uid",
            "==",
            user.uid
          )
        );


      const snapshot =
        await getDocs(q);


      /*
       * =================================================
       * 6. VERIFICAR SI EXISTE EL EGRESADO
       * =================================================
       */

      if (snapshot.empty) {


        console.log(
          "El usuario no existe como administrador ni como egresado."
        );


        setError(
          "El usuario no está registrado en CONECTA-TEL."
        );


        /*
         * Cerrar la sesión porque el usuario
         * no pertenece a ninguno de los roles.
         */

        await signOut(auth);

        return;

      }


      /*
       * =================================================
       * 7. OBTENER DOCUMENTO DEL EGRESADO
       * =================================================
       */

      const egresadoDoc =
        snapshot.docs[0];


      /*
       * =================================================
       * 8. OBTENER DATOS
       * =================================================
       */

      const datosEgresado =
        egresadoDoc.data();


      /*
       * =================================================
       * 9. CREAR OBJETO COMPLETO DEL EGRESADO
       * =================================================
       */

      const egresadoCompleto = {

        id:
          egresadoDoc.id,

        uid:
          user.uid,

        ...datosEgresado,

      };


      console.log(
        "================================="
      );

      console.log(
        "ROL DETECTADO: EGRESADO"
      );

      console.log(
        "Egresado encontrado:",
        egresadoCompleto
      );

      console.log(
        "ID documento:",
        egresadoDoc.id
      );

      console.log(
        "UID:",
        datosEgresado.uid
      );

      console.log(
        "================================="
      );


      /*
       * =================================================
       * 10. LIMPIAR ESTADO DE ADMINISTRADOR
       * =================================================
       */

      setAdministrador(null);


      /*
       * =================================================
       * 11. GUARDAR EGRESADO
       * =================================================
       */

      setEgresado(
        egresadoCompleto
      );


    } catch (error) {


      /*
       * =================================================
       * ERROR DE AUTENTICACIÓN
       * =================================================
       */

      console.error(
        "================================="
      );

      console.error(
        "ERROR DE INICIO DE SESIÓN"
      );

      console.error(
        error
      );

      console.error(
        "Código:",
        error?.code
      );

      console.error(
        "Mensaje:",
        error?.message
      );

      console.error(
        "================================="
      );


      /*
       * =================================================
       * MENSAJES ESPECÍFICOS
       * =================================================
       */

      if (
        error?.code ===
        "auth/invalid-credential"
      ) {

        setError(
          "Correo o contraseña incorrectos."
        );

      }

      else if (
        error?.code ===
        "auth/user-not-found"
      ) {

        setError(
          "No existe un usuario registrado con este correo."
        );

      }

      else if (
        error?.code ===
        "auth/wrong-password"
      ) {

        setError(
          "La contraseña es incorrecta."
        );

      }

      else if (
        error?.code ===
        "auth/too-many-requests"
      ) {

        setError(
          "Demasiados intentos. Intenta nuevamente más tarde."
        );

      }

      else if (
        error?.code ===
        "permission-denied"
      ) {

        setError(
          "No tienes permisos para acceder a la información de este usuario."
        );

      }

      else {

        setError(
          "No fue posible iniciar sesión. Intenta nuevamente."
        );

      }

    } finally {


      /*
       * =================================================
       * FINALIZAR CARGA
       * =================================================
       */

      setLoading(false);

    }

  };


  /*
   * =====================================================
   * CERRAR SESIÓN
   * =====================================================
   */

  const handleLogout = async () => {

    try {

      /*
       * Cerrar sesión en Firebase
       */

      await signOut(auth);


      /*
       * Limpiar usuario egresado
       */

      setEgresado(null);


      /*
       * Limpiar administrador
       */

      setAdministrador(null);


      /*
       * Limpiar formulario
       */

      setEmail("");

      setPassword("");

      setError("");


      console.log(
        "Sesión cerrada correctamente."
      );


    } catch (error) {

      console.error(
        "Error al cerrar sesión:",
        error
      );

    }

  };


  /*
   * =====================================================
   * PANEL DEL ADMINISTRADOR
   * =====================================================
   *
   * IMPORTANTE:
   *
   * Primero comprobamos administrador.
   *
   */

  if (administrador) {

    return (

      <PanelAdministrador

        administrador={
          administrador
        }

        onLogout={async () => {

          await handleLogout();

          onClose();

        }}

      />

    );

  }


  /*
   * =====================================================
   * PANEL DEL EGRESADO
   * =====================================================
   */

  if (egresado) {

    return (

      <PanelEgresado

        egresado={
          egresado
        }

        onLogout={async () => {

          await handleLogout();

          onClose();

        }}

      />

    );

  }


  /*
   * =====================================================
   * LOGIN
   * =====================================================
   */

  return (

    <div className="login-overlay">


      <div className="login-modal">


        {/* =================================================
            BOTÓN CERRAR
            ================================================= */}

        <button
          className="login-close"
          onClick={onClose}
          aria-label="Cerrar"
          type="button"
        >

          ×

        </button>


        {/* =================================================
            ENCABEZADO
            ================================================= */}

        <div className="login-header">


          <img
            src="/logo-conecta-tel.png"
            alt="CONECTA-TEL"
          />


          <h2>
            Bienvenido
          </h2>


          <p>
            Ingresa a la plataforma de egresados.
          </p>


        </div>


        {/* =================================================
            FORMULARIO
            ================================================= */}

        <form
          onSubmit={handleLogin}
          className="login-form"
        >


          {/* =================================================
              CORREO
              ================================================= */}

          <label htmlFor="email">

            Correo electrónico

          </label>


          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {

              setEmail(
                e.target.value
              );

              setError("");

            }}
            placeholder="Correo electrónico"
            autoComplete="email"
            required
          />


          {/* =================================================
              CONTRASEÑA
              ================================================= */}

          <label htmlFor="password">

            Contraseña

          </label>


          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {

              setPassword(
                e.target.value
              );

              setError("");

            }}
            placeholder="Contraseña"
            autoComplete="current-password"
            required
          />


          {/* =================================================
              ERROR
              ================================================= */}

          {error && (

            <p
              className="login-error"
              role="alert"
            >

              {error}

            </p>

          )}


          {/* =================================================
              BOTÓN INICIAR SESIÓN
              ================================================= */}

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