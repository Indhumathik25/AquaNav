import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !name.trim() ||
      !userId.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId.trim(),
          name: name.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail || "Unable to create account."
        );
        return;
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (error) {
      console.error("Registration error:", error);

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

        <div className="auth-header">
          <h1>AquaNav</h1>

          <p>
            Create your fisherman account
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleRegister}
        >

          {/* Name */}
          <div className="form-group">
            <label htmlFor="name">
              Full Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="Enter your name"
              autoComplete="name"
            />
          </div>

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
              placeholder="Create a user ID"
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
              placeholder="Create a password"
              autoComplete="new-password"
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError("");
              }}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          {/* Register button */}
          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>

        {/* Back to Login */}
        <div className="auth-footer">

          <p>
            Already have an account?
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="auth-link"
          >
            Back to Login
          </button>

        </div>

      </div>
    </div>
  );
}