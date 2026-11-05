// Écran temporaire pour le module challenge (suivi prop firm).
// Le module complet est conservé dans components/challenge/ mais n'est pas
// compilé tant que son backend (connexion MT5) n'est pas en place.
export default function ComingSoon() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "2rem 1rem",
        background: "#020408",
        color: "#E6EDF7",
        fontFamily: "'Rajdhani', sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 3, color: "#00FFB2" }}>
        PROFITYX · CHALLENGE
      </div>
      <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, margin: 0 }}>Bientôt disponible</h1>
      <p style={{ maxWidth: 420, margin: 0, color: "#69748C", lineHeight: 1.6 }}>
        Le suivi de tes comptes prop firm arrive prochainement. Merci de ta patience.
      </p>
    </main>
  );
}
