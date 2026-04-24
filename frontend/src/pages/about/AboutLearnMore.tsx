import { useNavigate } from "react-router-dom";
import "./AboutLearnMore.css";

export default function AboutLearnMore() {
  const navigate = useNavigate();

  return (
    <section className="about-learn-page">
      <div className="about-learn-inner">
        <span className="about-learn-eyebrow">About EcoMap</span>
        <h1 className="about-learn-title">What this dashboard is for</h1>
        <p className="about-learn-intro">
          EcoMap is a scientific dashboard designed to help teams collect,
          organize, and understand environmental antimicrobial resistance data
          from river sampling sites.
        </p>

        <div className="about-learn-grid">
          <article className="about-learn-card">
            <h2>1. Map-based monitoring</h2>
            <p>
              Sampling sites can be visualized on a map so researchers can see
              where data was collected and compare results across locations.
            </p>
          </article>

          <article className="about-learn-card">
            <h2>2. Data exploration</h2>
            <p>
              The dashboard helps users inspect patterns in isolates, AMR
              profiles, and river-related observations in one place.
            </p>
          </article>

          <article className="about-learn-card">
            <h2>3. Better decision support</h2>
            <p>
              By combining mapped sites with sample records, teams can identify
              trends earlier and support evidence-based environmental actions.
            </p>
          </article>

          <article className="about-learn-card">
            <h2>4. Team collaboration</h2>
            <p>
              The platform is built so different contributors can upload,
              manage, and use data consistently through a shared workflow.
            </p>
          </article>
        </div>

        <div className="about-learn-actions">
          <button className="about-learn-button" onClick={() => navigate("/about")}>
            Back to About
          </button>
        </div>
      </div>
    </section>
  );
}
