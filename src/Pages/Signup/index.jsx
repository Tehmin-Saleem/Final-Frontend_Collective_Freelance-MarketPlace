import { useState, useEffect } from "react";
import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import CHARACTER from "../../images/CHARACTER.png";
import Group from "../../images/Group.png";
import { signInWithGoogle } from "../../Firebase";
import { Link } from "react-router-dom";

import { CommonButton, TextField } from "../../components/index";
import {
  LogoName,
  Fname,
  Mail,
  Password,
  PassEye,
  Google,
  Apple,
  Location,
} from "../../svg/index";

function Signup() {
  const handleGoogleSignIn = () => {
    signInWithGoogle()
      .then((result) => {
        const user = result.user;
        console.log("User Info: ", user);
        navigate("/ClientDashboard"); // Handle the user information
      })
      .catch((error) => {
        console.error("Error during sign in: ", error);
      });
  };
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [country, setCountry] = useState(""); // State for country
  const [isChecked, setIsChecked] = useState(false);
  const [checkboxError, setCheckboxError] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword.length < 8) {
      setPasswordError("Your password is not strong enough.");
    } else {
      setPasswordError("");
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateEmail = () => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const validateName = () => {
    if (firstName.trim() === "" || lastName.trim() === "") {
      setNameError("Please enter your full name.");
    } else {
      setNameError("");
    }
  };
  const handleCheckboxChange = (e) => {
    setIsChecked(e.target.checked);
    if (e.target.checked) {
      setCheckboxError(""); // Clear the checkbox error if checked
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    validateName();
    validateEmail();
    if (password.length < 8) {
      setPasswordError("Your password is not strong enough.");
      return;
    }

    if (nameError || emailError || passwordError) {
      return;
    }
    if (!isChecked) {
      setCheckboxError(
        "You must agree to the Terms and Conditions and Privacy Policy."
      );
      return;
    }

    const role = localStorage.getItem("userType");

    // const user = localStorage.getItem("userInfo");

    try {
      // const response = await axios.post(
      //   "http://localhost:5000/api/client/signup",
      //   {
      //     email,
      //     password,
      //     first_name: firstName,
      //     last_name: lastName,
      //     role,
      //     country_name: country,
      //   }
      // );
      
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      // cnsole.log('base', BASE_URL)
      const response = await fetch(`${BASE_URL}/api/client/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          role,
          country_name: country,
        }),
      });
  
      // console.log('api', BASE_URL);
      const data = await response.json();
      console.log("data at signup", data);
  
      console.log("Signup response:", response);
      if (response.status === 201) {
        console.log("Signup successful");
  
        // Storing the user info and token in localStorage
        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            user: data.user, // user info
            token: data.token, // token from server
          })
        );
  
        console.log("User info stored in localStorage:", data.user);
        console.log("Token stored in localStorage:", data.token);
        navigate("/signin");
        console.log("Signup successful");

        navigate("/signin");
      }
    } catch (error) {
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
        setSignupError(
          error.response.data.message || "An error occurred during signup"
        );
      } else if (error.request) {
        console.error("Error request:", error.request);
        setSignupError("No response received from server");
      } else {
        console.error("Error message:", error.message);
        setSignupError("Error setting up the request");
      }
    }
  };

  return (
    <div className="md:flex md:flex-row  h-[730px]">
      {/* First Half - Logo and Picture */}
      <div className="md:w-1/2  bg-white hidden md:block h-[730px]">
        <div className="flex flex-col items-center justify-center h-[730px] ">
          <div className="mb-6">
            <LogoName />
          </div>
          <div className="mb-3">
            <img src={CHARACTER} alt="Character" className=" md:max-w-md" />
          </div>
          <div>
            <img src={Group} alt="Group" />
          </div>
        </div>
      </div>

      {/*================= Second Half - Form ================*/}
      <div className="md:w-1/2 w-full h-[730px] md:mt-9 md:mr-9 bg-white flex items-center justify-center shadow-lg">
        <div className="w-full max-w-lg px-16 shadow-2xl h-600  ">
          <form onSubmit={handleSubmit}>
            <h1 className="text-[24px] font-Poppins font-medium text-center px-16 py-2">
              Please sign up to hire talented individuals
            </h1>

            <div className="relative">
              <div className="flex mb-4 shadow border rounded-xl w-full py-3 px-3 bg-[#ECF0F1] font-Poppins">
                <div className="pr-3">
                  <Fname />
                </div>
                <input
                  type="text"
                  id="Firstname"
                  name="Firstname"
                  placeholder="Enter First name"
                  className="text-[#94A3B8] bg-[#ECF0F1] text-[14px] flex-1"
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={validateName}
                  errorMessage={nameError}
                  required
                  value={firstName}
                />
              </div>
            </div>
            <div className="relative">
              <div className="flex mb-4 shadow border rounded-xl w-full py-3 px-3 bg-[#ECF0F1] font-Poppins">
                <div className="pr-3">
                  <Fname />
                </div>
                <input
                  type="text"
                  id="Lastname"
                  name="Lastname"
                  placeholder="Enter Last name"
                  className="text-[#94A3B8] bg-[#ECF0F1] text-[14px] flex-1"
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={validateName}
                  errorMessage={nameError}
                  required
                  value={lastName}
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex mb-4 shadow border rounded-xl w-full py-3 px-3 bg-[#ECF0F1] font-Poppins">
                <div className="pr-3">
                  <Mail />
                </div>
                <input
                  type="text"
                  id="Lastname"
                  name="Lastname"
                  placeholder="Enter work email address"
                  className="text-[#94A3B8] bg-[#ECF0F1] text-[14px] flex-1"
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={validateEmail}
                  errorMessage={emailError}
                  required
                  value={email}
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex mb-4 shadow border rounded-xl w-full py-3 px-3 bg-[#ECF0F1] font-Poppins">
                <div className="pr-3">
                  <Password />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter Password (8 or more characters)"
                  className="text-[#94A3B8] bg-[#ECF0F1] text-[14px] flex-1"
                  onChange={handlePasswordChange}
                  required
                />

                <span
                  className="cursor-pointer"
                  onClick={handleTogglePasswordVisibility}
                >
                  <div className="pr-3">
                    <PassEye />
                  </div>
                </span>
              </div>
              {passwordError && (
                <div className="text-red-500 text-xs mt-1">{passwordError}</div>
              )}
            </div>

            <div className="relative">
              <div className="flex mb-4 shadow border rounded-xl w-full py-3 px-3 bg-[#ECF0F1] font-Poppins">
                <div className="pr-3">
                  <Location />
                </div>
                {!showCustomInput ? (
                  <select
                    id="country"
                    name="country"
                    className="text-[#94A3B8] bg-[#ECF0F1] text-[14px] flex-1 appearance-none outline-none"
                    onChange={(e) => {
                      if (e.target.value === "other") {
                        setShowCustomInput(true);
                        setCountry("");
                      } else {
                        setCountry(e.target.value);
                      }
                    }}
                    value={country || ""}
                  >
                    <option value="" disabled>
                      Select your country
                    </option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <div className="flex flex-1 items-center">
                    <input
                      type="text"
                      placeholder="Enter your country"
                      className="text-[#94A3B8] bg-[#ECF0F1] text-[14px] flex-1 outline-none"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                    <button
                      onClick={() => setShowCustomInput(false)}
                      className="ml-2 text-[#94A3B8] hover:text-gray-600"
                    >
                      ←
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                className="mr-2 leading-tight"
                checked={isChecked}
                onChange={handleCheckboxChange}
              />
              <label
                htmlFor="terms"
                className="text-[12px] font-Poppins text-[#64748B] mt-3"
              >
                By creating an account means you agree to the{" "}
                <Link
                  to="/terms-conditions"
                  className="text-[#4BCBEB] font-semibold hover:underline cursor-pointer"
                >
                  Terms and Conditions
                </Link>{" "}
                and our{" "}
                <Link
                  to="/privacy-policy"
                  className="text-[#4BCBEB] font-semibold hover:underline cursor-pointer"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <CommonButton
                text="Create My Account"
                type="submit"
                className="bg-[#4BCBEB] text-[#FFFFFF] font-semibold font-Poppins text-[24px] py-2 px-7 w-full rounded-xl focus:outline-none focus:shadow-outline"
              />
            </div>

            {signupError && (
              <div className="text-red-500 text-xs mt-2">{signupError}</div>
            )}

            <div className="mt-8 mb-6 mx-[13%] font-Poppins text-[14px] text-[#0F172A] items-center md:text-left">
              Already have an account?
              <span>
                <a
                  className="text-[#4BCBEB] font-Poppins hover:underline hover:underline-offset-4 text-base font-bold"
                  href="/signin"
                >
                  Log In
                </a>
              </span>
            </div>
            {/* New div for Google and Apple buttons */}
            {/* <div className="mt-5 mx-auto max-w-xs flex flex-row">
              <div className="flex justify-center mb-4 shadow-xl p-3">
                <div className="mr-3">
                  <Google />
                </div>
                <button
                  className="mr-4 text-[12px] text-[#3498DB] font-Poppins font-semibold text-center"
                  id="google-login"
                  onClick={handleGoogleSignIn}
                >
                  Continue with Google
                </button>
              </div>
              <div className="flex justify-center mb-4 shadow-xl p-3">
                <div className="mr-3">
                  <Apple />
                </div>
                <div>
                  <a
                    href="https://www.apple.com" // Replace with the actual Apple authentication URL
                    className="mr-4 text-[12px] text-[#3498DB] font-Poppins font-semibold text-center"
                  >
                    Continue with Apple
                  </a>
                </div>
              </div>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
