import { useLocation, useNavigate } from "react-router-dom"

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav-item ${
          location.pathname === "/dashboard" ? "active" : ""
        }`}
        onClick={() => navigate("/dashboard")}
      >
        <span>⌂</span>
        <small>Home</small>
      </button>

      <button
        className={`bottom-nav-item ${
          location.pathname === "/log-trip" ? "active" : ""
        }`}
        onClick={() => navigate("/log-trip")}
      >
        <span>＋</span>
        <small>Log Trip</small>
      </button>

      <button
        className={`bottom-nav-item ${
          location.pathname === "/history" ? "active" : ""
        }`}
        onClick={() => navigate("/history")}
      >
        <span>◷</span>
        <small>History</small>
      </button>

      <button
        className={`bottom-nav-item ${
          location.pathname === "/analytics" ? "active" : ""
        }`}
        onClick={() => navigate("/analytics")}
      >
        <span>◈</span>
        <small>Analytics</small>
      </button>

      <button
        className={`bottom-nav-item ${
          location.pathname === "/profile" ? "active" : ""
        }`}
        onClick={() => navigate("/profile")}
      >
        <span>○</span>
        <small>Profile</small>
      </button>
    </nav>
  )
}

export default BottomNav