import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "About", path: "/about" },
  { label: "Map View", path: "/map-view" },
  { label: "AMR Profiles", path: "/amr-profiles" },
  { label: "Sample Details", path: "/river-flows" },
  { label: "Data Explorer", path: "/data-explorer" },
  { label: "Datasets", path: "/isolates" },
];

export default function Navbar() {
  const location = useLocation();
  const { user, login, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar__logo">
        EcoMap
      </Link>

      {/* Nav Links */}
      <ul className="navbar__links">
        {NAV_LINKS.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`navbar__link ${isActive ? "navbar__link--active" : ""}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Profile Icon + Dropdown */}
      <div className="navbar__profile" ref={dropdownRef}>
        <button
          className="navbar__profile-btn"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-label="Open profile menu"
          aria-expanded={dropdownOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            width={28}
            height={28}
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="9" r="3" />
            <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="navbar__dropdown">
            {user ? (
              <>
                <Link
                  to="/admin"
                  className="navbar__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  Admin Settings
                </Link>
                <div className="navbar__dropdown-divider" />
                <button
                  className="navbar__dropdown-item navbar__dropdown-item--danger"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </>
            ) : (
              <button
                className="navbar__dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  login();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}>
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Admin Login
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
