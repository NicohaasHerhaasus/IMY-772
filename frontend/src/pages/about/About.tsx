import { useState, useEffect } from "react";
import "./About.css";
import handswater from "../../assets/hands_holding_water.png"
import rockpool from "../../assets/rockpool.png"
import mountains from "../../assets/mountains.png"

export default function About() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
      <section className="about-page">
        <div className="about-inner">

          {/* LEFT: Text content */}
          <div className={`about-left ${visible ? "visible" : ""}`}>
            <span className="about-eyebrow">About Us</span>

            <h1 className="about-heading">
              <span className="we-are">WE ARE</span>
              <span className="brand">LOGO</span>
            </h1>

            <p className="about-body">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean
              maecenus sem fusce nascetur non habitasse. We are committed to
              protecting and celebrating the world's most vital river ecosystems.
            </p>

            <button className="about-cta">
              Learn More
              <svg width="20" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* RIGHT: Image mosaic */}
          <div className={`about-right ${visible ? "visible" : ""}`}>

            {/* Centre column: stacked top + bottom */}
            <div className="img-col">
              <div className="img-card img-card--top">
                <img src={handswater} alt="Hands cupping water" />
              </div>
              <div className="img-card img-card--bottom">
                <img
                  src={rockpool}
                  alt="Rock Pool"
                />
              </div>
            </div>

            {/* Right column: single tall image */}
            <div className="img-card img-card--tall">
              <img
                src={mountains}
                alt="Mountain valley"
              />
            </div>
          </div>

        </div>
      </section>
  );
}

