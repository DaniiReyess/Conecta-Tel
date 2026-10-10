import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { db } from "./firebase";
import "./EncuestasAdmin.css";

const clean = (v) => typeof v === "string" ? v.trim() : "";

const dateText = (v) => {
  if (!v) return "Sin fecha";
  try {
    const d = typeof v.toDate === "function" ? v.toDate() : new Date(v);
    return Number.isNaN(d.getTime()) ? "Sin fecha" : d.toLocaleDateString("es-CO");
  } catch { return "Sin fecha"; }
};

function EncuestasAdmin() {
  const [encuestas, setEncuestas] = useState([]);
  const [preguntas, setPreguntas] = useState({});
  const [respuestas, setRespuestas] = useState([]);
  const [egresados, setEgresados] = useState([]);
  const [selected, setSelected] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [es, rs, gs] = await Promise.all([
          getDocs(collection(db, "encuestas")),
          getDocs(collection(db, "respuestasEncuestas")),
          getDocs(collection(db, "egresados")),
        ]);

        const e = es.docs.map(d => ({ id: d.id, ...d.data() }));
        const r = rs.docs.map(d => ({ id: d.id, ...d.data() }));
        const g = gs.docs.map(d => ({ id: d.id, ...d.data() }));
        const p = {};

        for (const encuesta of e) {
          const ps = await getDocs(collection(db, "encuestas", encuesta.id, "preguntas"));
          p[encuesta.id] = ps.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a,b) => Number(a.numero || 0) - Number(b.numero || 0));
        }

        setEncuestas(e);
        setRespuestas(r);
        setEgresados(g);
        setPreguntas(p);
        if (e.length) setSelected(e[0].id);
      } catch (err) {
        console.error("Error cargando encuestas:", err);
        setError("No fue posible cargar las encuestas y sus resultados.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const current = useMemo(() => encuestas.find(e => e.id === selected), [encuestas, selected]);
  const questions = preguntas[selected] || [];
  const currentQuestion = questions.find(q => q.id === question) || questions[0];

  useEffect(() => {
    setQuestion(questions[0]?.id || "");
  }, [selected, questions.length]);

  const surveyResponses = useMemo(
    () => respuestas.filter(r => r.encuestaId === selected),
    [respuestas, selected]
  );

  const participants = new Set(surveyResponses.map(r => r.egresadoId).filter(Boolean)).size;
  const participation = egresados.length ? Math.round(participants / egresados.length * 100) : 0;

  const results = useMemo(() => {
    if (!currentQuestion) return [];
    const map = {};
    (currentQuestion.opciones || []).forEach(o => { map[o] = 0; });
    surveyResponses.forEach(r => {
      const value = r.respuestas?.[String(currentQuestion.numero)];
      if (value !== undefined && value !== null && String(value).trim()) {
        const key = String(value);
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([nombre, cantidad]) => ({
        nombre, cantidad,
        porcentaje: surveyResponses.length ? Math.round(cantidad / surveyResponses.length * 100) : 0
      }))
      .sort((a,b) => b.cantidad - a.cantidad);
  }, [currentQuestion, surveyResponses]);

  const obtenerNombreParticipante = (egresadoId) => {
    const egresado = egresados.find(
      (item) => item.id === egresadoId
    );

    if (!egresado) {
      return "Participante no identificado";
    }

    const nombreCompleto = [
      egresado.nombres,
      egresado.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (nombreCompleto) {
      return nombreCompleto;
    }

    if (egresado.nombre) {
      return String(egresado.nombre).trim();
    }

    if (egresado.correo) {
      return String(egresado.correo).trim();
    }

    if (Array.isArray(egresado.correos) && egresado.correos.length) {
      return String(egresado.correos[0]).trim();
    }

    return "Participante no identificado";
  };

  const exportCSV = () => {
    if (!current) return;

    const headers = [
      "Participante",
      "Fecha respuesta",
      ...questions.map(
        (q) => `Pregunta ${q.numero}: ${q.texto}`
      ),
    ];

    const rows = surveyResponses.map((response) => [
      obtenerNombreParticipante(response.egresadoId),
      dateText(response.fechaRespuesta),
      ...questions.map(
        (q) =>
          response.respuestas?.[String(q.numero)] ?? ""
      ),
    ]);

    const quote = (value) =>
      `"${String(value ?? "")
        .replace(/"/g, '""')
        .replace(/\r?\n/g, " ")}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(quote).join(";"))
      .join("\r\n");

    const blob = new Blob(
      ["\ufeff", csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      `CONECTA-TEL_${(
        current.titulo || current.id
      ).replace(
        /[^\wáéíóúÁÉÍÓÚñÑ -]/g,
        "_"
      )}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <section className="encuestas-admin encuestas-state">
      <div className="encuestas-spinner" />
      <strong>Cargando encuestas y resultados...</strong>
      <span>Consultando preguntas y respuestas desde Firestore.</span>
    </section>
  );

  if (error) return (
    <section className="encuestas-admin encuestas-state">
      <strong>{error}</strong>
      <span>Revisa la consola para conocer el detalle técnico.</span>
    </section>
  );

  return (
    <section className="encuestas-admin">
      <header className="encuestas-header">
        <div>
          <span className="encuestas-eyebrow">ANÁLISIS DE PARTICIPACIÓN</span>
          <h1>Encuestas</h1>
          <p>Consulta encuestas, preguntas y resultados registrados por los egresados.</p>
        </div>
        <button className="encuestas-export" type="button" onClick={exportCSV} disabled={!current}>
          ↓ Exportar resultados
        </button>
      </header>

      <section className="encuestas-selector">
        <span>ENCUESTAS DISPONIBLES</span>
        <h2>{encuestas.length} encuesta{encuestas.length !== 1 ? "s" : ""}</h2>
        <div className="encuestas-tabs">
          {encuestas.map(e => (
            <button
              type="button"
              key={e.id}
              className={e.id === selected ? "active" : ""}
              onClick={() => setSelected(e.id)}
            >
              <strong>{e.titulo || e.id}</strong>
              <small>{e.estado || "SIN ESTADO"}</small>
            </button>
          ))}
        </div>
      </section>

      {current && (
        <>
          <section className="encuesta-info">
            <div>
              <span>{current.estado || "SIN ESTADO"}</span>
              <h2>{current.titulo || current.id}</h2>
              <p>{current.descripcion || "Sin descripción registrada."}</p>
            </div>
            <div className="encuesta-kpis">
              <div><small>Preguntas</small><strong>{questions.length}</strong></div>
              <div><small>Participantes</small><strong>{participants}</strong></div>
              <div><small>Participación</small><strong>{participation}%</strong></div>
              <div><small>Respuestas</small><strong>{surveyResponses.length}</strong></div>
            </div>
          </section>

          <section className="encuestas-content">
            <aside className="preguntas-panel">
              <div className="preguntas-title"><span>PREGUNTAS</span><strong>{questions.length}</strong></div>
              {questions.length === 0 ? (
                <div className="empty-small">No hay preguntas registradas.</div>
              ) : questions.map(q => (
                <button
                  type="button"
                  key={q.id}
                  className={q.id === currentQuestion?.id ? "active" : ""}
                  onClick={() => setQuestion(q.id)}
                >
                  <b>{q.numero}.</b>
                  <span>{q.texto}</span>
                  {q.obligatoria && <small>Obligatoria</small>}
                </button>
              ))}
            </aside>

            <main className="resultado-panel">
              {currentQuestion ? (
                <>
                  <div className="resultado-title">
                    <div>
                      <span>PREGUNTA {currentQuestion.numero}</span>
                      <h2>{currentQuestion.texto}</h2>
                      <small>Tipo: {currentQuestion.tipo || "No especificado"}</small>
                    </div>
                    <strong>
  {results.reduce(
    (total, item) => total + item.cantidad,
    0
  )}
</strong>
                  </div>

                  {results.length ? (
                    <>
                      <div className="resultado-chart">
                        <ResponsiveContainer width="100%" height={310}>
                          <BarChart data={results} layout="vertical" margin={{ top: 8, right: 25, left: 8, bottom: 8 }}>
                            <CartesianGrid stroke="rgba(80,157,204,0.08)" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill:"#58768a", fontSize:8 }} />
                            <YAxis type="category" dataKey="nombre" width={155} axisLine={false} tickLine={false} tick={{ fill:"#8ca2b2", fontSize:8 }} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) {
                                  return null;
                                }

                                return (
                                  <div className="encuesta-chart-tooltip">
                                    <span className="encuesta-chart-tooltip-title">
                                      {label}
                                    </span>

                                    <strong>
                                      {payload[0].value} respuesta
                                      {payload[0].value !== 1 ? "s" : ""}
                                    </strong>
                                  </div>
                                );
                              }}
                              cursor={{
                                fill: "rgba(54, 198, 244, 0.05)",
                              }}
                            />
                            <Bar dataKey="cantidad" fill="#168dff" radius={[0,5,5,0]} barSize={18} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="resultados-resumen">
                        {results.map(r => (
                          <div key={r.nombre}>
                            <span>{r.nombre}</span>
                            <b>{r.porcentaje}%</b>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="encuestas-empty">
                      <div>0</div>
                      <strong>Todavía no hay respuestas</strong>
                      <span>Los resultados aparecerán automáticamente cuando un egresado responda.</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="encuestas-empty">
                  <div>?</div>
                  <strong>Selecciona una pregunta</strong>
                  <span>Aquí se mostrarán sus resultados.</span>
                </div>
              )}
            </main>
          </section>
        </>
      )}

      {!encuestas.length && (
        <div className="encuestas-empty">
          <div>0</div>
          <strong>No hay encuestas registradas</strong>
          <span>Las encuestas aparecerán aquí cuando existan en Firestore.</span>
        </div>
      )}

      <footer className="encuestas-footer">
        <span>CONECTA-TEL · Gestión administrativa de encuestas</span>
        <span>Información consultada dinámicamente desde Firestore</span>
      </footer>
    </section>
  );
}

export default EncuestasAdmin;
