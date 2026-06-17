export default function Home() {
  return (
    <main style={{ padding: "40px", fontFamily: "'Courier New', monospace" }}>
      <h1 style={{ color: "#c8a96e", fontSize: "14px", letterSpacing: "0.2em" }}>AIOS-50 AGENCY</h1>
      <p style={{ color: "#585858", fontSize: "12px" }}>API endpoints active.</p>
      <ul style={{ color: "#585858", fontSize: "11px", lineHeight: 2 }}>
        <li>POST /api/leads</li>
        <li>GET/POST /api/approve</li>
        <li>POST /api/replies</li>
        <li>POST /api/proposals</li>
        <li>GET/POST /api/delivery</li>
      </ul>
    </main>
  );
}
