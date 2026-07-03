import React, { useState } from "react";
import PredictionCard from "../../components/cards/PredictionCard";
import QuestionCard from "../../components/cards/QuestionCard";
import MatchCard from "../../components/cards/MatchCard";
import CardButton from "../../components/cards/CardButton";
import Navbar from "../../components/navbar/Navbar";
import Hero from "../../components/hero/Hero";
import atleticoLogo from "../../assets/png/ATM.png";

const TABS = ["PredictionCard", "QuestionCard", "MatchCard", "Buttons"];

const DesignPreview = () => {
  const [active, setActive] = useState("PredictionCard");

  return (
    <div className="bg-primary-background min-h-screen p-8">
      {/* ── Navbar ── */}
      <section style={{ marginBottom: "48px" }}>
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: "13px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#5a6b89",
            marginBottom: "16px",
          }}
        >
          Navbar
        </p>
        <Navbar />
      </section>

      {/* ── Hero ── */}
      <section style={{ marginBottom: "48px" }}>
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: "13px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#5a6b89",
            marginBottom: "16px",
          }}
        >
          Hero
        </p>
        <Hero />
      </section>

      {/* ── Cards ── */}
      <section>
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: "13px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#5a6b89",
            marginBottom: "16px",
          }}
        >
          Cards
        </p>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflow: "auto",
            marginBottom: "32px",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: "0.7px solid #b4d1ed",
                background:
                  active === tab ? "#b4d1ed" : "rgba(255,255,255,0.06)",
                color: active === tab ? "#12152a" : "#ffffff",
                fontFamily: "'Roboto', sans-serif",
                fontWeight: active === tab ? 500 : 400,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {active === "PredictionCard" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <p className="text-gray-400 text-xs mb-2">Con logo</p>
              <PredictionCard
                teamLogo={atleticoLogo}
                question="¿Atlético de Madrid ganará la Champions esta temporada?"
                options={[
                  { label: "Atlético", pct: 65 },
                  { label: "Rival", pct: 35 },
                ]}
                poolAmount="$12.340,00"
              />
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-2">Sin logo</p>
              <PredictionCard
                question="¿Argentina ganará el próximo Mundial?"
                options={[
                  { label: "Argentina", pct: 42 },
                  { label: "Otro", pct: 58 },
                ]}
                poolAmount="$8.900,50"
              />
            </div>
          </div>
        )}

        {active === "QuestionCard" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <p className="text-gray-400 text-xs mb-2">Con logo</p>
              <QuestionCard
                teamLogo={atleticoLogo}
                question="¿Ganará Atlético el próximo partido?"
                pct={70}
                poolAmount="$5.606,90"
              />
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-2">Sin logo</p>
              <QuestionCard
                question="¿Messi se retirará antes de 2026?"
                pct={35}
                poolAmount="$3.200,00"
              />
            </div>
          </div>
        )}

        {active === "MatchCard" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <p className="text-gray-400 text-xs mb-2">Con draw</p>
              <MatchCard
                homeTeam={{
                  name: "Atlético Madrid",
                  logo: atleticoLogo,
                  pct: 55,
                }}
                awayTeam={{ name: "Barcelona", logo: atleticoLogo, pct: 30 }}
                draw={{ pct: 15 }}
                poolAmount="$9.100,00"
              />
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-2">Con draw</p>
              <MatchCard
                homeTeam={{ name: "Argentina", logo: atleticoLogo, pct: 45 }}
                awayTeam={{ name: "Brasil", logo: atleticoLogo, pct: 35 }}
                draw={{ pct: 20 }}
                poolAmount="$21.500,00"
              />
            </div>
          </div>
        )}

        {active === "Buttons" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "32px" }}
          >
            <div>
              <p className="text-gray-400 text-xs mb-3">Yes</p>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center", maxWidth: "320px" }}
              >
                <CardButton
                  label="Yes"
                  color="#bad659"
                  variant="yes"
                  pct={65}
                />
                <CardButton
                  label="Atlético Madrid"
                  color="#bad659"
                  variant="yes"
                  pct={55}
                />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-3">No</p>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center", maxWidth: "320px" }}
              >
                <CardButton
                  label="No"
                  color="#f89182"
                  variant="no"
                  pct={35}
                />
                <CardButton
                  label="Barcelona"
                  color="#f89182"
                  variant="no"
                  pct={30}
                />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-3">Draw</p>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center", maxWidth: "160px" }}
              >
                <CardButton
                  label="Draw"
                  color="#b4d1ed"
                  variant="yes"
                  pct={15}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default DesignPreview;
