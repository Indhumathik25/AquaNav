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

type ZoneData = {
  zone: string
  trips: number
  score: number
  averageFuel: number
  efficiency: number
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

      setTrips(
        Array.isArray(data)
          ? data
          : data.trips || []
      )
    } catch (error) {
      console.error(
        "Analytics error:",
        error
      )

      setError(
        "Unable to connect to AquaNav server."
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * BASIC STATISTICS
   */

  const totalTrips = trips.length

  const totalFuel = trips.reduce(
    (sum, trip) =>
      sum + Number(trip.fuel || 0),
    0
  )

  const goodTrips = trips.filter(
    (trip) => trip.quality === "GOOD"
  ).length

  const averageFuel =
    totalTrips > 0
      ? totalFuel / totalTrips
      : 0

  /*
   * OVERALL PERFORMANCE
   */

  const performanceScore =
    totalTrips > 0
      ? trips.reduce(
          (sum, trip) =>
            sum +
            (qualityScore[trip.quality] || 0),
          0
        ) / totalTrips
      : 0

  /*
   * ZONE ANALYSIS
   */

  const zoneMap: Record<
    string,
    {
      trips: number
      score: number
      fuel: number
    }
  > = {}

  trips.forEach((trip) => {
    if (!zoneMap[trip.area]) {
      zoneMap[trip.area] = {
        trips: 0,
        score: 0,
        fuel: 0,
      }
    }

    zoneMap[trip.area].trips += 1

    zoneMap[trip.area].score +=
      qualityScore[trip.quality] || 0

    zoneMap[trip.area].fuel +=
      Number(trip.fuel || 0)
  })

  const productiveZones: ZoneData[] =
    Object.entries(zoneMap)
      .map(([zone, data]) => {
        const averageScore =
          data.trips > 0
            ? data.score / data.trips
            : 0

        const averageFuel =
          data.trips > 0
            ? data.fuel / data.trips
            : 0

        const efficiency =
          averageFuel > 0
            ? averageScore / averageFuel
            : 0

        return {
          zone,
          trips: data.trips,
          score: averageScore,
          averageFuel,
          efficiency,
        }
      })
      .sort((a, b) => {
        if (
          b.efficiency !==
          a.efficiency
        ) {
          return (
            b.efficiency -
            a.efficiency
          )
        }

        if (
          b.score !==
          a.score
        ) {
          return (
            b.score -
            a.score
          )
        }

        return (
          b.trips -
          a.trips
        )
      })

  const productiveZone =
    productiveZones[0]?.zone || "—"

  const formattedProductiveZone =
    productiveZone === "—"
      ? "—"
      : productiveZone.replace(
          "_",
          " "
        )

  /*
   * DATA-BASED INSIGHT
   */

  const bestZone =
    productiveZones[0]

  const insightText =
    bestZone
      ? `${bestZone.zone.replace(
          "_",
          " "
        )} currently has the strongest combination of fishing performance and fuel efficiency based on your recorded trips.`
      : "Record more fishing trips to generate personalized analytics."

  /*
   * LOADING STATE
   */

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

      {/* HEADER */}

      <header className="page-header">
        <p className="dashboard-label">
          AQUANAV
        </p>

        <h1>
          Fishing Analytics
        </h1>

        <p>
          Insights from your recorded
          fishing trips.
        </p>
      </header>

      {/* ERROR */}

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      {/* PERFORMANCE */}

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
            Based on recorded catch quality
          </span>

        </div>

      </section>

      {/* BASIC STATISTICS */}

      <section className="analytics-grid">

        <article className="analytics-card">
          <p>
            Total Trips
          </p>

          <strong>
            {totalTrips}
          </strong>
        </article>

        <article className="analytics-card">
          <p>
            Good Trips
          </p>

          <strong>
            {goodTrips}
          </strong>
        </article>

        <article className="analytics-card">
          <p>
            Average Fuel
          </p>

          <strong>
            {averageFuel.toFixed(1)} L
          </strong>
        </article>

        <article className="analytics-card">
          <p>
            Total Fuel
          </p>

          <strong>
            {totalFuel.toFixed(1)} L
          </strong>
        </article>

      </section>

      {/* MOST PRODUCTIVE ZONE */}

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
            Average performance:{" "}
            {productiveZones[0].score.toFixed(1)}
            {" "} / 10
          </p>
        )}

      </section>

      {/* DATA-BASED INSIGHT */}

      <section className="analytics-card">

        <div className="analytics-card-header">

          <div>

            <p className="dashboard-label">
              AQUANAV INSIGHT
            </p>

            <h2>
              Fishing Insight
            </h2>

          </div>

          <span className="analytics-zone-icon">
            💡
          </span>

        </div>

        <p>
          {insightText}
        </p>

      </section>

      {/* ZONE ANALYSIS */}

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

            {productiveZones.map(
              (zone) => (

                <div
                  className="analytics-zone-row"
                  key={zone.zone}
                >

                  <div>

                    <strong>
                      {zone.zone.replace(
                        "_",
                        " "
                      )}
                    </strong>

                    <span>
                      {zone.trips}{" "}
                      {zone.trips === 1
                        ? "trip"
                        : "trips"}
                    </span>

                    <span>
                      {zone.averageFuel.toFixed(1)}
                      {" "}L/trip
                    </span>

                  </div>

                  <div>

                    <strong>
                      {zone.score.toFixed(1)}
                      {" "} / 10
                    </strong>

                    <span>
                      Efficiency{" "}
                      {zone.efficiency.toFixed(2)}
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

      )}

      {/* ROUTE OPTIMIZER */}

      <button
        className="primary-button"
        onClick={() =>
          navigate(
            "/route-optimizer"
          )
        }
      >
        Open Route Optimizer
      </button>

      <BottomNav />

    </main>
  )
}

export default AnalyticsPage