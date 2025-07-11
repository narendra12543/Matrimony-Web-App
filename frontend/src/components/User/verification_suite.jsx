// UserVerificationDashboard.jsx
import React, { useState } from "react";
import { CheckCircle, Upload, X } from "lucide-react";
import BackButton from "../BackButton";

export default function UserVerificationDashboard() {
  const [toast, setToast] = useState("");
  const [step, setStep] = useState("welcome");
  const [mockAadharNumber, setMockAadharNumber] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    phone: false,
    aadhar: false,
  });

  const handleMockOCR = () => {
    setMockAadharNumber("1234 5678 9012");
    setStep("aadhar-mobile");
  };

  const verificationSteps = [
    { id: "email", label: "Email Verification", completed: verificationStatus.email },
    { id: "phone", label: "Phone Number Verification", completed: verificationStatus.phone },
    { id: "aadhar", label: "Aadhaar Verification", completed: verificationStatus.aadhar },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col md:flex-row p-6">
      <div className="absolute top-4 left-4 z-20">
        <BackButton />
      </div>
      <aside className="hidden md:block w-1/4 pr-4 border-r border-gray-200 relative">
        <h2 className="text-xl font-semibold mb-4">Verification Steps</h2>
        <ul className="space-y-4">
          {verificationSteps.map(({ id, label, completed }) => (
            <li
              key={id}
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setStep(id === "aadhar" ? "aadhar-upload" : id)}
            >
              <span
                className={`${
                  step.startsWith(id) ? "text-orange-600 font-semibold underline" : "text-gray-700"
                } hover:underline`}
              >
                {label}
              </span>
              {completed && <CheckCircle className="text-green-500 w-5 h-5" />}
            </li>
          ))}
        </ul>
        <div className="absolute bottom-6 right-6 w-full pr-4">
          <button
            onClick={() => setStep("documents")}
            className="mt-6 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md"
          >
            View Uploaded Documents
          </button>
        </div>
      </aside>

      <main className="w-full md:w-3/4 flex items-center justify-center relative animate-slide-up">
        <div className="bg-white/20 backdrop-blur-lg shadow-lg rounded-3xl p-10 w-full max-w-xl border border-white/30 transition-all duration-500 ease-in-out animate-fade-in">
          {step === "welcome" && (
            <div className="text-center space-y-4 animate-slide-up">
              <h1 className="text-3xl font-bold text-gray-800">Welcome to the मन Verification Suite</h1>
              <p className="text-gray-600">
                Get verified to increase your profile credibility and improve match quality.
              </p>
              <button
                onClick={() => setStep("email")}
                className="mt-4 py-2 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md"
              >
                Start Verification
              </button>
            </div>
          )}

          {step === "email" && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-2xl font-bold text-center text-gray-800">Email Verification</h1>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your email address"
              />
              <button
                onClick={() => {
                  setVerificationStatus((prev) => ({ ...prev, email: true }));
                  setStep("phone");
                  setToast("Email verified successfully");
                  setTimeout(() => setToast(""), 3000);
                }}
                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md"
              >
                Send Verification Email
              </button>
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-2xl font-bold text-center text-gray-800">Phone Number Verification</h1>
              <input
                type="tel"
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your phone number"
              />
              <button
                onClick={() => {
                  setVerificationStatus((prev) => ({ ...prev, phone: true }));
                  setStep("aadhar-upload");
                  setToast("Phone number verified successfully");
                  setTimeout(() => setToast(""), 3000);
                }}
                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md"
              >
                Send OTP
              </button>
            </div>
          )}

          {step === "aadhar-upload" && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-2xl font-bold text-center text-gray-800">Aadhaar Verification</h1>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Aadhaar (PDF or Image)
              </label>
              <input
                type="file"
                accept=".pdf, image/*"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleMockOCR}
                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md"
              >
                Scan & Continue
              </button>
            </div>
          )}

          {step === "aadhar-mobile" && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-2xl font-bold text-center text-gray-800">Enter Mobile Linked to Aadhaar</h1>
              <input
                type="text"
                value={mockAadharNumber}
                readOnly
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none"
              />
              <input
                type="tel"
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your mobile number"
                onChange={(e) => setManualPhone(e.target.value)}
              />
              <button
                onClick={() => setStep("aadhar-otp")}
                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md"
              >
                Send OTP
              </button>
            </div>
          )}

          {step === "aadhar-otp" && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-2xl font-bold text-center text-gray-800">OTP Verification</h1>
              <input
                type="text"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={`Enter OTP sent to ${manualPhone}`}
              />
              <button
                onClick={() => {
                  setVerificationStatus((prev) => ({ ...prev, aadhar: true }));
                  setToast("Aadhaar verified successfully");
                  setTimeout(() => setToast(""), 3000);
                }}
                className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md"
              >
                Verify
              </button>
              <p className="text-sm text-center text-gray-500">
                Didn&apos;t get OTP?{" "}
                <a href="#" className="text-orange-500 hover:underline">
                  Resend
                </a>
              </p>
            </div>
          )}

          {step === "documents" && (
            <div className="space-y-6 text-center animate-fade-in">
              <h1 className="text-2xl font-bold text-gray-800">Uploaded Documents</h1>
              <p className="text-gray-600">Your uploaded documents will appear here.</p>
              <div className="bg-gray-100 py-4 px-6 rounded-lg text-sm text-gray-500">
                (Mock preview area for documents)
              </div>
              <button
                onClick={() => setStep("welcome")}
                className="mt-4 py-2 px-6 bg-gray-400 hover:bg-gray-500 text-white rounded-lg"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          <p className="text-sm text-gray-500 mt-6 text-center">
            This information is securely processed for user safety. We do not store Aadhaar data.
          </p>
        </div>

        {toast && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-xl text-sm shadow-lg animate-fade-in">
            {toast}
          </div>
        )}

        {verificationStatus.email && verificationStatus.phone && verificationStatus.aadhar && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded-xl shadow-md animate-fade-in">
            <CheckCircle className="w-5 h-5" />
            <span>Profile Verified</span>
          </div>
        )}

        <button
          onClick={() => document.documentElement.classList.toggle("dark")}
          className="absolute top-4 left-4 bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded-md shadow-md"
        >
          Toggle Theme
        </button>
      </main>
    </div>
  );
} 