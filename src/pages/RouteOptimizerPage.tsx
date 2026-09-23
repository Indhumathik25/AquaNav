import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import BottomNav from "../components/BottomNav.tsx"
const API_URL = "https://aquanav-backend.onrender.com";

type Trip = {
  id: number
  user_id: string
  date: string
  area: string
  quality: string
  fuel: number
  created_at: string
}

type ZoneData = {
  zone: string
  trips: number
  score: number
}

const zones = [
  "ZONE_A",
  "ZONE_B",
  "ZONE_C",
  "ZONE_D",
  "ZONE_E",
]

const qualityScore: Record<string, number> = {
  GOOD: 10,
  AVERAGE: 5,
  POOR: 1,
}

function RouteOptimizerPage() {
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
          data.detail ||
          "Unable to load fishing history."
        )
        return
      }

      setTrips(Array.isArray(data) ? data : data.trips || [])

    } catch (error) {
      console.error(
        "Route optimizer error:",
        error
      )

      setError(
        "Unable to connect to AquaNav server."
      )
    } finally {
      setLoading(false)
    }
  }

  const zoneData: ZoneData[] = zones.map(
    (zone) => {

      const zoneTrips = trips.filter(
        (trip) => trip.area === zone
      )

      const totalScore = zoneTrips.reduce(
        (sum, trip) =>
          sum +
          (qualityScore[trip.quality] || 0),
        0
      )

      const averageScore =
        zoneTrips.length > 0
          ? totalScore / zoneTrips.length
          : 0

      return {
        zone,
        trips: zoneTrips.length,
        score: averageScore,
      }
    }
  )

  const productiveZones = [...zoneData]
    .filter((zone) => zone.trips > 0)
    .sort((a, b) => {

      if (b.score !== a.score) {
        return b.score - a.score
      }

      return b.trips - a.trips
    })

  const optimizedZones =
    productiveZones.slice(0, 3)

  const route = optimizedZones.map(
    (zone) => zone.zone
  )

  const totalFuel = trips.reduce(
    (sum, trip) =>
      sum + Number(trip.fuel || 0),
    0
  )

  const estimatedFuelSaved =
    trips.length > 0
      ? Math.min(
          totalFuel * 0.15,
          Math.max(
            2.5,
            route.length * 2.5
          )
        )
      : 0

  const formatZone = (zone: string) => {
    return zone.replace("_", " ")
  }

  const routeText =
    route.length > 0
      ? route.map(formatZone).join(" → ")
      : "No route available"

  if (loading) {
    return (
      <main className="route-page">

        <header className="page-header route-page-header">

          <p className="dashboard-label">
            AQUANAV
          </p>

          <h1>
            Route Optimizer
          </h1>

          <p>
            Loading your personalized route...
          </p>

        </header>

        <BottomNav />

      </main>
    )
  }

  return (
    <main className="route-page">

      <header className="page-header route-page-header">

        <p className="dashboard-label">
          AQUANAV
        </p>

        <h1>
          Route Optimizer
        </h1>

        <p>
          A personalized route based on your
          fishing history.
        </p>

      </header>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <section className="route-highlight">

        <div className="route-icon">
          🧭
        </div>

        <div className="route-highlight-content">

          <p>
            Recommended Route
          </p>

          <h2>
            {routeText}
          </h2>

          <span>
            Based on your recorded fishing
            performance
          </span>

        </div>

      </section>

      {trips.length === 0 && (

        <section className="route-info">

          <div className="route-info-icon">
            💡
          </div>

          <div>

            <h2>
              Start recording your fishing trips
            </h2>

            <p>
              AquaNav needs fishing history before
              it can recommend a personalized route.
            </p>

            <p>
              Add at least a few fishing trips with
              different zones and catch qualities.
            </p>

          </div>

        </section>

      )}

      {route.length > 0 && (

        <section className="route-map-card">

          <div className="route-section-title">

            <span>
              🗺️
            </span>

            <h2>
              Personalized Navigation Path
            </h2>

          </div>

          <div className="route-path">

            {route.map(
              (zone, index) => (

                <div
                  className="route-step"
                  key={zone}
                >

                  <div className="route-marker">
                    {index + 1}
                  </div>

                  <div className="route-zone">

                    <span>
                      Stop {index + 1}
                    </span>

                    <strong>
                      {formatZone(zone)}
                    </strong>

                  </div>

                  {index <
                    route.length - 1 && (
                    <div className="route-line" />
                  )}

                </div>

              )
            )}

          </div>

        </section>

      )}

      <section className="route-stats">

        <article className="route-stat-card">

          <div className="route-stat-icon">
            ⛽
          </div>

          <div>

            <p>
              Estimated Fuel Saved
            </p>

            <strong>
              {estimatedFuelSaved.toFixed(1)} L
            </strong>

          </div>

        </article>

        <article className="route-stat-card">

          <div className="route-stat-icon">
            📍
          </div>

          <div>

            <p>
              Recommended Zones
            </p>

            <strong>
              {route.length}
            </strong>

          </div>

        </article>

        <article className="route-stat-card">

          <div className="route-stat-icon">
            🧭
          </div>

          <div>

            <p>
              Route Status
            </p>

            <strong className="route-status">
              {route.length > 0
                ? "Personalized"
                : "Waiting for Data"}
            </strong>

          </div>

        </article>

      </section>

      {productiveZones.length > 0 && (

        <section className="route-map-card">

          <div className="route-section-title">

            <span>
              📊
            </span>

            <h2>
              Zone Performance
            </h2>

          </div>

          <div className="route-zone-performance">

            {productiveZones
              .slice(0, 5)
              .map((zone, index) => (

                <div
                  className="route-performance-row"
                  key={zone.zone}
                >

                  <div>

                    <strong>
                      {index + 1}.{" "}
                      {formatZone(zone.zone)}
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

      <section className="route-info">

        <div className="route-info-icon">
          💡
        </div>

        <div>

          <h2>
            How AquaNav Calculates Your Route
          </h2>

          <p>
            AquaNav looks at your recorded catch
            quality for each fishing zone.
          </p>

          <p>
            GOOD catches receive 10 points,
            AVERAGE catches receive 5 points,
            and POOR catches receive 1 point.
          </p>

          <p>
            The zones with the strongest historical
            performance are placed into your
            recommended route.
          </p>

          <p>
            Fuel savings shown here are a prototype
            estimate.
          </p>

        </div>

      </section>

      <div className="route-action">

        <button
          className="primary-button"
          onClick={() => navigate("/log-trip")}
        >
          + Add Fishing Trip
        </button>

        <button
          className="primary-button"
          style={{
            marginTop: "12px",
          }}
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

      </div>

      <BottomNav />

    </main>
  )
}

export default RouteOptimizerPage