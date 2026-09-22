import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import BottomNav from "../components/BottomNav.tsx"

const API_URL = "http://127.0.0.1:8000"

type Trip = {
  id: number
  user_id: string
  date: string
  area: string
  quality: string
  fuel: number
  created_at: string
}

function DashboardPage() {
  const navigate = useNavigate()

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  )

  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `${API_URL}/trips/${currentUser.user_id}`,
        {
          headers: {
            "X-User-ID": currentUser.user_id,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || "Unable to load fishing data.")
        return
      }

      setTrips(data.trips || [])
    } catch (error) {
      console.error("Dashboard error:", error)

      setError(
        "Unable to connect to AquaNav server. Make sure FastAPI is running."
      )
    } finally {
      setLoading(false)
    }
  }

  const totalTrips = trips.length

  const totalFuel = trips.reduce(
    (sum, trip) => sum + Number(trip.fuel || 0),
    0
  )

  const zoneCounts: Record<string, number> = {}

  trips.forEach((trip) => {
    zoneCounts[trip.area] =
      (zoneCounts[trip.area] || 0) + 1
  })

  const topZone =
    Object.entries(zoneCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "—"

  const formattedTopZone =
    topZone === "—"
      ? "—"
      : topZone.replace("_", " ")

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("currentUserName")
    navigate("/login")
  }

  if (loading) {
    return (
      <main className="dashboard-page">

        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">
              AQUANAV
            </p>

            <h1>
              Loading...
            </h1>

            <p>
              Loading your fishing dashboard.
            </p>
          </div>
        </header>

        <section className="dashboard-grid">
          <article className="dashboard-card">
            <h2>Loading your data...</h2>
            <p>Please wait.</p>
          </article>
        </section>

        <BottomNav />

      </main>
    )
  }

  return (
    <main className="dashboard-page">

      <header className="dashboard-header">

        <div>
          <p className="dashboard-label">
            AQUANAV
          </p>

          <h1>
            Welcome back,
            <br />
            {currentUser?.name || "Fisherman"}
          </h1>

          <p>
            Navigate Smarter. Save Fuel. Fish Better.
          </p>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </header>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <section className="dashboard-grid">

        <article className="dashboard-card">
          <p>Total Fishing Trips</p>

          <h2>
            {totalTrips}
          </h2>

          <span>
            Recorded trips
          </span>
        </article>

        <article className="dashboard-card">
          <p>Most Visited Zone</p>

          <h2>
            {formattedTopZone}
          </h2>

          <span>
            Based on your history
          </span>
        </article>

        <article className="dashboard-card">
          <p>Total Fuel Used</p>

          <h2>
            {totalFuel.toFixed(1)} L
          </h2>

          <span>
            Recorded fuel consumption
          </span>
        </article>

      </section>

      <section className="dashboard-welcome">

        <div>
          <p className="dashboard-label">
            FISHING DATA
          </p>

          <h2>
            Keep your trips updated
          </h2>

          <p>
            Log each fishing trip to improve your
            personal analytics and route recommendations.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/log-trip")}
        >
          + Log Fishing Trip
        </button>

      </section>

      <section className="dashboard-actions">

        <button
          className="primary-button"
          onClick={() => navigate("/history")}
        >
          View Fishing History
        </button>

        <button
          className="primary-button"
          onClick={() => navigate("/analytics")}
        >
          View Analytics
        </button>

        <button
          className="primary-button"
          onClick={() => navigate("/route-optimizer")}
        >
          Open Route Optimizer
        </button>

      </section>

      <BottomNav />

    </main>
  )
}

export default DashboardPage