import React, { useEffect, useState } from "react";
import { Header, Modal } from "../../components";
import { FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./styles.scss";
import Footer from "../../components/footer/footer";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ first_name: "", email: "" });
  const [dashboardStats, setDashboardStats] = useState({
    totalJobs: 0,
    totalCompletedJobs: 0,
    totalOngoingJobs: 0,
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const checkClientProfile = async (userId, token) => {
    try {
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const response = await axios.get(
        `${BASE_URL}/api/client/client-profile-exists/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.exists;
    } catch (error) {
      console.error("Error checking client profile:", error);
      return false;
    }
  };

  const handleNavigation = (path) => {
    if (!hasProfile) {
      setShowProfileModal(true);
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/signin");
          return;
        }

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;

        const profileExists = await checkClientProfile(userId, token);
        setHasProfile(profileExists);
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
        const userResponse = await axios.get(
          `${BASE_URL}/api/client/users/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUser(userResponse.data);

        const statsResponse = await axios.get(
          `${BASE_URL}/api/client/dashboard-stats/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDashboardStats(statsResponse.data.data);
        console.log("response",statsResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        navigate("/signin");
      }
    };

    fetchUser();
  }, [navigate]);

  return (
    <>
      <Header />
      <div className="DashBoard">
        <header className="dashboard-Header">
          <h1>Welcome, {user.first_name || "User"}!</h1>
          <p>
            Manage projects, track progress, and explore freelancer profiles, all in one place.
          </p>
        </header>

        <div className="quick-stats-summary">
          <div className="quick-stats">
            <div className="stat-item">
              <h3>Total Jobs</h3>
              <p>{dashboardStats.totalJobs}</p>
            </div>
            <div className="stat-item">
              <h3>Ongoing Jobs</h3>
              <p>{dashboardStats.totalOngoingJobs}</p>
            </div>
            <div className="stat-item">
              <h3>Completed Jobs</h3>
              <p>{dashboardStats.totalCompletedJobs}</p>
            </div>

            <div className="stat-item">
              <h3>Freelancers Engaged</h3>
              <p>{dashboardStats.totalOngoingJobs}</p>
            </div>
          </div>

          <div className="dashboard-summary">
            <p>
              This dashboard provides an overview of your current performance, job statistics, and upcoming opportunities. Stay informed and make data-driven decisions to ensure the success of your projects.
            </p>
          </div>
        </div>

        <div className="card-container">
          <div className="card" onClick={() => handleNavigation("/jobPosting")}>
            <h2>Post a Job</h2>
            <p>Create new jobs for freelancers to view and apply.</p>
            <button>Post Job</button>
          </div>
          <div className="card" onClick={() => handleNavigation("/alljobs")}>
            <h2>Your Jobs</h2>
            <p>View the jobs you’ve posted and their status.</p>
            <button>View Jobs</button>
          </div>
          <div className="card" onClick={() => handleNavigation("/alljobs")}>
            <h2>View Proposals</h2>
            <p>View proposals on your jobs.</p>
            <button>View Proposals</button>
          </div>
          <div className="card" onClick={() => handleNavigation("/ManageProjectbyclient")}>
            <h2>Job Progress</h2>
            <p>Track progress of ongoing jobs and milestones.</p>
            <button>View Progress</button>
          </div>
          <div className="card" onClick={() => handleNavigation("/freelancercard")}>
            <h2>Freelancer Profiles</h2>
            <p>Explore profiles of freelancers you’ve worked with.</p>
            <button>View Freelancers</button>
          </div>
          <div className="card" onClick={() => handleNavigation("/ClientOfferPage")}>
            <h2>Consultants Offers</h2>
            <p>Check the consultants you have sent requests to.</p>
            <button>View Consultants</button>
          </div>
        </div>

        <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)}>
          <div className="profile-modal-content">
            <h2>Complete Your Profile</h2>
            <p>
              Please complete your profile before accessing this feature. A complete profile helps freelancers understand your business better.
            </p>
            <div className="modal-buttons">
              <button
                className="setup-profile-btn"
                onClick={() => {
                  setShowProfileModal(false);
                  navigate("/ClientProfileForm");
                }}
              >
                Complete Profile
              </button>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>
                Close
              </button>
            </div>
          </div>
        </Modal>

        <button
          className="contact-btn-fixed"
          onClick={() => navigate("/QueryForm", { state: user })}
        >
          <FaEnvelope className="contact-icon" />
          Contact Us
        </button>
        <Footer/>
      </div>
    </>
  );
};

export default ClientDashboard;