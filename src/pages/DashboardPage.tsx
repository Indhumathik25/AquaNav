import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import BottomNav from "../components/BottomNav.tsx"

const API_URL = "https://aquanav-backend.onrender.com"

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

  const userId = currentUser?.user_id

  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!userId) {
      navigate("/login")
      return
    }

    const fetchTrips = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(
          `${API_URL}/trips/${userId}`,
          {
            headers: {
              "X-User-ID": userId,
            },
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setError(
            data.detail ||
              "Unable to load fishing data."
          )
          return
        }

        setTrips(
          Array.isArray(data)
            ? data
            : data.trips || []
        )
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        )

        setError(
          "Unable to connect to AquaNav server."
        )
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [userId, navigate])

  /*
   * BASIC TRIP STATISTICS
   */

  const totalTrips = trips.length

  const totalFuel = trips.reduce(
    (sum, trip) =>
      sum + Number(trip.fuel || 0),
    0
  )

  const averageFuel =
    totalTrips > 0
      ? totalFuel / totalTrips
      : 0

  /*
   * CATCH QUALITY
   */

  const goodTrips = trips.filter(
    (trip) => trip.quality === "GOOD"
  ).length

  const averageTrips = trips.filter(
    (trip) => trip.quality === "AVERAGE"
  ).length

  const poorTrips = trips.filter(
    (trip) => trip.quality === "POOR"
  ).length

  /*
   * MOST VISITED ZONE
   */

  const zoneCounts: Record<
    string,
    number
  > = {}

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

  /*
   * DATA-BASED FISHING STATUS
   */

  let fishingStatus =
    "Start recording trips"

  let fishingStatusText =
    "Add fishing trips to generate personalized insights."

  if (totalTrips > 0) {
    const goodPercentage =
      (goodTrips / totalTrips) * 100

    if (goodPercentage >= 60) {
      fishingStatus =
        "Strong fishing history"

      fishingStatusText =
        `${goodPercentage.toFixed(
          0
        )}% of your recorded trips have GOOD catch quality.`
    } else if (goodPercentage >= 30) {
      fishingStatus =
        "Mixed fishing results"

      fishingStatusText =
        "Your recorded trips contain a mix of catch-quality results."
    } else {
      fishingStatus =
        "More data needed"

      fishingStatusText =
        "Continue recording trips to build a stronger fishing history."
    }
  }

  /*
   * LOGOUT
   */

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem(
      "currentUserName"
    )

    navigate("/login")
  }

  /*
   * LOADING
   */

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
            <h2>
              Loading your data...
            </h2>

            <p>
              Please wait.
            </p>
          </article>
        </section>

        <BottomNav />
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      {/* HEADER */}

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">
            AQUANAV
          </p>

          <h1>
            Welcome back,
            <br />
            {currentUser?.name ||
              "Fisherman"}
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

      {/* ERROR */}

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      {/* DASHBOARD STATISTICS */}

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <p>
            Total Fishing Trips
          </p>

          <h2>
            {totalTrips}
          </h2>

          <span>
            Recorded trips
          </span>
        </article>

        <article className="dashboard-card">
          <p>
            Most Visited Zone
          </p>

          <h2>
            {formattedTopZone}
          </h2>

          <span>
            Based on your history
          </span>
        </article>

        <article className="dashboard-card">
          <p>
            Total Fuel Used
          </p>

          <h2>
            {totalFuel.toFixed(1)} L
          </h2>

          <span>
            Recorded fuel consumption
          </span>
        </article>

        <article className="dashboard-card">
          <p>
            Average Fuel
          </p>

          <h2>
            {averageFuel.toFixed(1)} L
          </h2>

          <span>
            Fuel per fishing trip
          </span>
        </article>
      </section>

      {/* FISHING STATUS */}

      <section className="dashboard-welcome">
        <div>
          <p className="dashboard-label">
            FISHING STATUS
          </p>

          <h2>
            {fishingStatus}
          </h2>

          <p>
            {fishingStatusText}
          </p>

          {totalTrips > 0 && (
            <p>
              Good: {goodTrips} · Average:{" "}
              {averageTrips} · Poor:{" "}
              {poorTrips}
            </p>
          )}
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate("/log-trip")
          }
        >
          + Log Fishing Trip
        </button>
      </section>

      {/* QUICK ACTIONS */}

      <section className="dashboard-actions">
        <button
          className="primary-button"
          onClick={() =>
            navigate("/history")
          }
        >
          View Fishing History
        </button>

        <button
          className="primary-button"
          onClick={() =>
            navigate("/analytics")
          }
        >
          View Analytics
        </button>

        <button
          className="primary-button"
          onClick={() =>
            navigate("/route-optimizer")
          }
        >
          Open Route Optimizer
        </button>
      </section>

      <BottomNav />
    </main>
  )
}

export default DashboardPage