import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!userId.trim() || !password.trim()) {
      setError("Please enter your user ID and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid user ID or password.");
        return;
      }

      // Save the logged-in user
      localStorage.setItem(
        "currentUser",
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        "currentUserName",
        data.user.name
      );

      // Go to dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to AquaNav server. Please make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <h1>AquaNav</h1>

          <p>
            Navigate Smarter. Save Fuel. Fish Better.
          </p>
        </div>

        {/* Login Form */}
        <form
          className="auth-form"
          onSubmit={handleLogin}
        >

          {/* User ID */}
          <div className="form-group">
            <label htmlFor="userId">
              User ID
            </label>

            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
                setError("");
              }}
              placeholder="Enter your user ID"
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>

        </form>
        {/* Register */}
        <div className="auth-footer">

          <p>
            Don't have an account?
          </p>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="auth-link"
          >
            Create Account
          </button>

        </div>

      </div>
    </div>
  );
}