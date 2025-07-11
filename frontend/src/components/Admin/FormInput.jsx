import React from "react";

const FormInput = ({ label, type, name, value, onChange, placeholder }) => (
  <div className="form-group" style={{ marginBottom: "1rem" }}>
    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "0.5rem",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
      required
    />
  </div>
);

export default FormInput;
