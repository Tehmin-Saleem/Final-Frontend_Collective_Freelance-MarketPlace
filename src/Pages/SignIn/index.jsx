import { useState,useEffect } from "react";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate for navigation
import CHARACTER from "../../images/CHARACTER.png";
import Group from "../../images/Group.png";
import Cookies from "js-cookie"; // Import js-cookie for managing cookies

import { CommonButton, TextField } from "../../components/index";
import { Mail, Password, PassEye, Google, Apple ,LogoName} from "../../svg/index";

function SignIn() {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); 
  const location = useLocation();
  const clearUserSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    Cookies.remove("savedEmail");
    Cookies.remove("savedPassword");
  };

  const getDashboardRoute = (role) => {
    switch (role) {
      case "client":
        return "/ClientDashboard";
      case "freelancer":
        return "/FreelanceDashBoard";
      case "consultant":
        return "/ConsultantDash";
      case "admin":
        return "/AdminDashboard";
      default:
        return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Function to validate token
    const checkTokenValidity = async () => {
    
      if (token && location.pathname === "/signin") {
        try {
          const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
          const response = await fetch(`${BASE_URL}/api/client/validate-token`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const role = userInfo?.user?.role;
            const dashboardRoute = getDashboardRoute(role);

            if (dashboardRoute) {
              navigate(dashboardRoute, { replace: true });
            }
          } else {
            // Token is invalid or expired
            clearUserSession();
          }
        } catch (error) {
          console.error("Token validation error:", error);
          clearUserSession();
        }
      }
      setIsLoading(false); // Finished checking authentication
    };

    checkTokenValidity();

    // Load saved credentials if any
    const savedEmail = Cookies.get("savedEmail");
    const savedPassword = Cookies.get("savedPassword");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, [navigate, location, location.pathname]);


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

  const handleLogin = async (e) => {
    e.preventDefault();

    if (emailError || passwordError) {
      setErrorMessage("Please fix the errors before submitting.");
      return;
    }
    if (rememberMe) {
      Cookies.set("savedEmail", email, { expires: 7 }); // Store for 7 days
      Cookies.set("savedPassword", password, { expires: 7 });
    } else {
      Cookies.remove("savedEmail");
      Cookies.remove("savedPassword");
    }
    const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
    try {
      const response = await fetch(`${BASE_URL}/api/client/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,

        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("dataaaa",data);
      
      if (response.ok) {

        if (data.softBanned) {
          // If the user is soft banned, display the message and do not proceed
          setErrorMessage("Your account is soft banned. Please contact support.");
          return;
        }
        
        // Store token and user info together in localStorage
        localStorage.setItem("token", data.token);
      localStorage.setItem(
        "userInfo",
        JSON.stringify({
          user: data.user,  // Store user information
          token: data.token,  // Store token
        })
      );

      console.log("Token received:", data.token);


      const userType = data.user.role;
        const dashboardRoute = getDashboardRoute(userType);

        if (dashboardRoute) {
          navigate(dashboardRoute, { replace: true });
        } else {
          setErrorMessage("Unknown user type.");
        }
      } else {
        // Handle specific error messages
        switch (data.message) {
          case "Token has expired":
            setErrorMessage("Your session has expired. Please log in again.");
            clearUserSession();
            break;
          case "Token is invalid":
            setErrorMessage("Invalid session. Please log in again.");
            clearUserSession();
            break;
          default:
            setErrorMessage(data.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMessage("An error occurred. Please try again later.");
    }
  };

  // If authentication check is in progress, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  

  return (
    <div className="md:flex md:flex-row  h-auto">
      {/* First Half - Logo and Picture */}
      <div className="md:w-1/2 h-screen bg-white hidden md:block">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="mb-6">
            <LogoName />
          </div>
          <div className="mb-3">
            <img src={CHARACTER} alt="Character" className="md:max-w-md" />
          </div>
          <div>
            <img src={Group} alt="Group" />
          </div>
        </div>
      </div>
      

      {/* Second Half - Form */}
      <div className="md:w-1/2 w-full h-screen  md:mr-9 bg-white flex items-center justify-center shadow-lg">
        <div className="w-full max-w-lg p-16 shadow-2xl ">
          <form onSubmit={handleLogin}>
            <h1 className="text-[24px] font-Poppins font-medium text-center px-16 py-2">
              Sign in to your account
            </h1>

            {/* Email Input */}
            <div className="relative">
              <div className="flex mb-4 shadow border rounded-xl w-full py-3 px-3 bg-[#ECF0F1] font-Poppins">
                <div className="pr-3">
                  <Mail />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter work email address"
                  className="text-[#94A3B8] bg-[#ECF0F1] text-[14px] flex-1"
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={validateEmail}
                  value={email}
                />
              </div>
              {emailError && (
                <div className="text-red-500 text-xs mt-1">{emailError}</div>
              )}
            </div>

            {/* Password Input */}
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
                  value={password}
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

            {/* Remember Me Checkbox and Forgot Password Link */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
              <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  className="mr-2 leading-tight"
                  onChange={(e) => setRememberMe(e.target.checked)}
                  checked={rememberMe}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-[12px] font-Poppins text-[#64748B]"
                >
                  Remember me
                </label>
              </div>
              <div>
                <a 
                  href="/ForgotPass"
                  className="text-[#4BCBEB] font-Poppins text-sm hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="flex items-center justify-between">
              <CommonButton
                text="Sign In"
                className="bg-[#4BCBEB] text-[#FFFFFF] font-semibold font-Poppins text-[24px] py-2 px-7 w-full rounded-xl focus:outline-none focus:shadow-outline"
              />
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="text-red-500 text-xs mt-4 text-center">
                {errorMessage}
              </div>
            )}


            {/* Sign Up Link */}
            <div className="mt-8 mx-[20%] font-Poppins text-[14px] text-[#0F172A] text-center">
              Don't have an account?
              <span>
                <a
                  className="text-[#4BCBEB] font-Poppins hover:underline hover:underline-offset-4 text-base font-bold"
                  href="/"
                >
                  Sign Up
                </a>
              </span>
            </div>

            
            {/* Google and Apple Sign-In Options */}
            {/* <div className="mt-5 mx-auto max-w-xs flex flex-row">
              <div className="flex justify-center mb-4 shadow-xl p-3">
                <div className="mr-3">
                  <Google />
                </div>
                <div>
                  <a
                    href="https://www.google.com"
                    className="mr-4 text-[12px] text-[#3498DB] font-Poppins font-semibold text-center"
                  >
                    Continue with Google
                  </a>
                </div>
              </div>
              <div className="flex justify-center mb-4 shadow-xl  p-3">
                <div className="mr-3">
                  <Apple />
                </div>
                <div>
                  <a
                    href="https://www.apple.com"
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

export default SignIn;