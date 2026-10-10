import { useEffect, useState } from "react";
import Login from "./Login";
import "./App.css";

function App() {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const elements = document.querySelectorAll(
      ".showcase, .platform, .features, .intelligence, .project"
    );

    elements.forEach((element) => {
      element.classList.add("reveal");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="site">

      {/* =====================================================
          NAVBAR
          ===================================================== */}

      <header className="navbar">

        <div className="navbar-inner">

          <a href="#inicio" className="brand">
            <img
              src="/logo-conecta-tel-icon.png"
              alt="CONECTA-TEL"
            />
          </a>

          <nav className="nav-menu">
            <a href="#inicio">Inicio</a>
            <a href="#plataforma">Plataforma</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#proyecto">Proyecto</a>
          </nav>

          <button
            className="nav-login"
            onClick={() => setShowLogin(true)}
          >
            Ingresar
          </button>

        </div>

      </header>


      {/* =====================================================
          CONTENIDO PRINCIPAL
          ===================================================== */}

      <main>

        {/* =====================================================
            HERO
            ===================================================== */}

        <section id="inicio" className="hero">

          <div className="hero-glow"></div>

          <div className="hero-tag">
            <span></span>
            UNIVERSIDAD SANTO TOMÁS
            <b>-</b>
            INGENIERÍA DE TELECOMUNICACIONES
          </div>

          <h1>
            Conectando el talento
            <br />
            <strong>de nuestros egresados.</strong>
          </h1>

          <p className="hero-description">
            Plataforma inteligente para el seguimiento y caracterización
            de egresados de Ingeniería de Telecomunicaciones.
          </p>

          <div className="hero-actions">

            <button
              className="primary-button"
              onClick={() => setShowLogin(true)}
            >
              Ingresar a la plataforma
              <span>→</span>
            </button>

            <a
              href="#plataforma"
              className="text-button"
            >
              Conocer el proyecto
              <span>↓</span>
            </a>

          </div>

          <div className="scroll-indicator">
            <span></span>
            DESPLAZAR PARA EXPLORAR
          </div>

        </section>


        {/* =====================================================
            SHOWCASE
            ===================================================== */}

        <section className="showcase">

          <div className="showcase-card">

            <div className="showcase-header">

              <div>
                <small>CONECTA-TEL</small>
                <p>Plataforma de seguimiento</p>
              </div>

              <div className="mvp-status">
                <span></span>
                MVP 2026
              </div>

            </div>


            <div className="showcase-body">

              <div className="logo-area">

                <div className="logo-glow"></div>

                <img
                  src="/logo-conecta-tel.png"
                  alt="CONECTA-TEL"
                />

              </div>


              <div className="data-panel">

                <div className="data-panel-title">
                  <span>INFORMACIÓN</span>
                  <span>01 — 04</span>
                </div>


                <div className="data-row">
                  <div className="data-number">01</div>

                  <div>
                    <h3>Seguimiento profesional</h3>
                    <p>
                      Trayectoria académica y laboral.
                    </p>
                  </div>
                </div>


                <div className="data-row">
                  <div className="data-number">02</div>

                  <div>
                    <h3>Geolocalización</h3>
                    <p>
                      Ubicación y movilidad profesional.
                    </p>
                  </div>
                </div>


                <div className="data-row">
                  <div className="data-number">03</div>

                  <div>
                    <h3>Inteligencia artificial</h3>
                    <p>
                      Caracterización de perfiles profesionales.
                    </p>
                  </div>
                </div>


                <div className="data-row">
                  <div className="data-number">04</div>

                  <div>
                    <h3>Dashboard institucional</h3>
                    <p>
                      Indicadores para análisis y consulta.
                    </p>
                  </div>
                </div>

              </div>

            </div>


            <div className="showcase-footer">
              <span>SEGUIMIENTO</span>
              <span>GEOLOCALIZACIÓN</span>
              <span>IA</span>
              <span>DASHBOARD</span>
            </div>

          </div>

        </section>


        {/* =====================================================
            PLATAFORMA
            ===================================================== */}

        <section
          id="plataforma"
          className="platform section"
        >

          <div className="section-label">
            01 PLATAFORMA
          </div>

          <div className="platform-content">

            <h2>
              Una plataforma para
              <br />
              <span>conocer nuestra comunidad.</span>
            </h2>

            <div className="platform-text">

              <p>
                CONECTA-TEL integra información profesional,
                ubicación geográfica y herramientas de análisis
                para facilitar el seguimiento de nuestros egresados.
              </p>

              <div className="platform-line"></div>

              <span>
                INFORMACIÓN · CONEXIÓN · ANÁLISIS
              </span>

            </div>

          </div>

        </section>


        {/* =====================================================
            FUNCIONALIDADES
            ===================================================== */}

        <section
          id="funcionalidades"
          className="features section"
        >

          <div className="section-label">
            02 FUNCIONALIDADES DEL MVP
          </div>

          <div className="features-header">

            <h2>
              Información que
              <br />
              <span>genera conexiones.</span>
            </h2>

            <p>
              El sistema reúne diferentes fuentes de información
              para construir una visión actualizada de la comunidad
              de egresados.
            </p>

          </div>


          <div className="feature-list">

            <article className="feature-item">

              <span className="feature-index">
                01
              </span>

              <div className="feature-info">
                <h3>Gestión de egresados</h3>

                <p>
                  Registro, consulta y actualización de información
                  académica y profesional.
                </p>
              </div>

              <span className="feature-arrow">
                ↗
              </span>

            </article>


            <article className="feature-item">

              <span className="feature-index">
                02
              </span>

              <div className="feature-info">
                <h3>Historial geográfico</h3>

                <p>
                  Seguimiento de ciudades, empresas y roles
                  desempeñados durante la trayectoria laboral.
                </p>
              </div>

              <span className="feature-arrow">
                ↗
              </span>

            </article>


            <article className="feature-item">

              <span className="feature-index">
                03
              </span>

              <div className="feature-info">
                <h3>Caracterización inteligente</h3>

                <p>
                  Clasificación básica de sectores, tecnologías
                  y competencias mediante inteligencia artificial.
                </p>
              </div>

              <span className="feature-arrow">
                ↗
              </span>

            </article>


            <article className="feature-item">

              <span className="feature-index">
                04
              </span>

              <div className="feature-info">
                <h3>Dashboard institucional</h3>

                <p>
                  Visualización de indicadores y resultados para
                  apoyar el análisis institucional.
                </p>
              </div>

              <span className="feature-arrow">
                ↗
              </span>

            </article>

          </div>

        </section>


        {/* =====================================================
            INFORMACIÓN INTELIGENTE
            ===================================================== */}

        <section className="intelligence section">

          <div className="section-label">
            03 INFORMACIÓN INTELIGENTE
          </div>

          <div className="intelligence-grid">

            <div className="intelligence-title">

              <h2>
                De los datos
                <br />
                <span>a las conexiones.</span>
              </h2>

              <p>
                La plataforma permite relacionar la trayectoria
                profesional con su componente geográfico y generar
                información útil para la institución.
              </p>

            </div>


            <div className="intelligence-cards">

              <div className="info-card">

                <span className="card-icon">
                  ◌
                </span>

                <small>
                  GEOLOCALIZACIÓN
                </small>

                <h3>
                  ¿Dónde están nuestros egresados?
                </h3>

                <p>
                  Visualización de ciudades y trayectoria
                  laboral mediante información geográfica.
                </p>

              </div>


              <div className="info-card">

                <span className="card-icon">
                  ✦
                </span>

                <small>
                  INTELIGENCIA ARTIFICIAL
                </small>

                <h3>
                  ¿Qué caracteriza sus perfiles?
                </h3>

                <p>
                  Clasificación básica de sectores, tecnologías
                  y competencias profesionales.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            PROYECTO
            ===================================================== */}

        <section
          id="proyecto"
          className="project"
        >

          <div className="section-label">
            04 PROYECTO INTEGRADOR
          </div>

          <h2>
            Tecnología al servicio
            <br />
            <span>del seguimiento académico.</span>
          </h2>

          <p>
            CONECTA-TEL busca fortalecer el vínculo entre la
            Universidad Santo Tomás y sus egresados de Ingeniería
            de Telecomunicaciones mediante información organizada,
            geolocalización y análisis inteligente.
          </p>


          <div className="technology-list">
            <span>REACT</span>
            <span>FIREBASE</span>
            <span>GOOGLE MAPS</span>
            <span>GEMINI AI</span>
          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer>

        <div className="footer-inner">

          <div className="footer-brand">

            <img
              src="/logo-conecta-tel.png"
              alt="CONECTA-TEL"
            />

            <p>
              Plataforma inteligente para el seguimiento y
              caracterización de egresados.
            </p>

          </div>

          <div className="footer-info">

            <span>
              UNIVERSIDAD SANTO TOMÁS
            </span>

            <span>
              INGENIERÍA DE TELECOMUNICACIONES
            </span>

            <span>
              2026
            </span>

          </div>

        </div>

      </footer>


      {/* =====================================================
          LOGIN
          ===================================================== */}

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
        />
      )}

    </div>
  );
}

export default App;