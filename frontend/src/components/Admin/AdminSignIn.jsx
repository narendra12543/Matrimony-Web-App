import React, { useState } from "react";
import FormInput from "../../components/Admin/FormInput";

const AdminSignIn = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would call your API to authenticate admin
    console.log("Admin Sign In Data:", credentials);
    alert("Admin signed in successfully!");
  };

  return (
    <div className="max-w-md mx-auto my-8 p-8 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg bg-white dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Admin Sign In
      </h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          placeholder="Enter your email"
        />
        <FormInput
          label="Password"
          type="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          placeholder="Enter password"
        />
        <button
          type="submit"
          className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold mt-4 transition-colors"
        >
          Sign In
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "2rem auto",
    padding: "2rem",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  button: {
    padding: "0.75rem",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "1rem",
  },
};

export default AdminSignIn;
