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

const qualityScore: Record<string, number> = {
  GOOD: 10,
  AVERAGE: 5,
  POOR: 1,
}

function AnalyticsPage() {
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
        setError(
          data.detail || "Unable to load analytics."
        )
        return
      }

      setTrips(data.trips || [])

    } catch (error) {
      console.error("Analytics error:", error)

      setError(
        "Unable to connect to AquaNav server."
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

  const goodTrips = trips.filter(
    (trip) => trip.quality === "GOOD"
  ).length

  const averageFuel =
    trips.length > 0
      ? totalFuel / trips.length
      : 0

  const zoneData: Record<
    string,
    {
      trips: number
      score: number
    }
  > = {}

  trips.forEach((trip) => {

    if (!zoneData[trip.area]) {
      zoneData[trip.area] = {
        trips: 0,
        score: 0,
      }
    }

    zoneData[trip.area].trips += 1

    zoneData[trip.area].score +=
      qualityScore[trip.quality] || 0
  })

  const productiveZones = Object.entries(
    zoneData
  )
    .map(([zone, data]) => ({
      zone,
      trips: data.trips,
      score:
        data.trips > 0
          ? data.score / data.trips
          : 0,
    }))
    .sort((a, b) => {

      if (b.score !== a.score) {
        return b.score - a.score
      }

      return b.trips - a.trips
    })

  const productiveZone =
    productiveZones[0]?.zone || "—"

  const formattedProductiveZone =
    productiveZone === "—"
      ? "—"
      : productiveZone.replace("_", " ")

  const performanceScore =
    totalTrips > 0
      ? trips.reduce(
          (sum, trip) =>
            sum +
            (qualityScore[trip.quality] || 0),
          0
        ) / totalTrips
      : 0

  if (loading) {
    return (
      <main className="analytics-page">

        <header className="page-header">

          <p className="dashboard-label">
            AQUANAV
          </p>

          <h1>
            Analytics
          </h1>

          <p>
            Loading your fishing analytics...
          </p>

        </header>

        <BottomNav />

      </main>
    )
  }

  return (
    <main className="analytics-page">

      <header className="page-header">

        <p className="dashboard-label">
          AQUANAV
        </p>

        <h1>
          Fishing Analytics
        </h1>

        <p>
          Insights from your recorded fishing trips.
        </p>

      </header>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <section className="analytics-highlight">

        <div className="analytics-icon">
          📊
        </div>

        <div>

          <p>
            Performance Score
          </p>

          <h2>
            {performanceScore.toFixed(1)} / 10
          </h2>

          <span>
            Based on catch quality
          </span>

        </div>

      </section>

      <section className="analytics-grid">

        <article className="analytics-card">
          <p>Total Trips</p>

          <strong>
            {totalTrips}
          </strong>
        </article>

        <article className="analytics-card">
          <p>Good Trips</p>

          <strong>
            {goodTrips}
          </strong>
        </article>

        <article className="analytics-card">
          <p>Average Fuel</p>

          <strong>
            {averageFuel.toFixed(1)} L
          </strong>
        </article>

        <article className="analytics-card">
          <p>Total Fuel</p>

          <strong>
            {totalFuel.toFixed(1)} L
          </strong>
        </article>

      </section>

      <section className="analytics-card analytics-zone-card">

        <div className="analytics-card-header">

          <div>
            <p className="dashboard-label">
              PRODUCTIVITY
            </p>

            <h2>
              Most Productive Zone
            </h2>
          </div>

          <span className="analytics-zone-icon">
            📍
          </span>

        </div>

        <strong className="analytics-zone-name">
          {formattedProductiveZone}
        </strong>

        {productiveZones.length > 0 && (
          <p>
            Average performance score:{" "}
            {productiveZones[0].score.toFixed(1)} / 10
          </p>
        )}

      </section>

      {productiveZones.length > 0 && (

        <section className="analytics-card">

          <div className="analytics-card-header">

            <div>
              <p className="dashboard-label">
                ZONE ANALYSIS
              </p>

              <h2>
                Zone Performance
              </h2>
            </div>

          </div>

          <div className="analytics-zone-list">

            {productiveZones.map((zone) => (

              <div
                className="analytics-zone-row"
                key={zone.zone}
              >

                <div>

                  <strong>
                    {zone.zone.replace("_", " ")}
                  </strong>

                  <span>
                    {zone.trips}{" "}
                    {zone.trips === 1
                      ? "trip"
                      : "trips"}
                  </span>

                </div>

                <strong>
                  {zone.score.toFixed(1)} / 10
                </strong>

              </div>

            ))}

          </div>

        </section>

      )}

      <button
        className="primary-button"
        onClick={() => navigate("/route-optimizer")}
      >
        Open Route Optimizer
      </button>

      <BottomNav />

    </main>
  )
}

export default AnalyticsPage