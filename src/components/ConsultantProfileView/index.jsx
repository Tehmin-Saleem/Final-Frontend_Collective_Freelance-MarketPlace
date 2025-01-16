import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import "./styles.scss";
import Header from "../Commoncomponents/Header";
import { useNavigate, Link } from "react-router-dom";
const ConsultantProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [userName, setUserName] = useState("");
  const [userPicture, setUserPicture] = useState(""); // This will hold the profile picture URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;
        const decodedToken = jwtDecode(token);
        const consultantId = decodedToken.userId;

        if (!consultantId) {
          throw new Error("No consultant ID found in token");
        }

        const response = await fetch(
          `${BASE_URL}/api/client/Constprofile/${consultantId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        const skills = Array.isArray(data.profile.skills)
          ? data.profile.skills
          : data.profile.skills
            ? [data.profile.skills]
            : [];
        setProfile({
          ...data.profile,
          skills, // ensure skills is an array
        });

        // Handle profile picture and name
        const profilePicture =
          data.profile?.profilePicture || "/default-profile.png";
        setUserPicture(profilePicture);
        const response1 = await fetch(
          `${BASE_URL}/api/client/users/${consultantId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data1 = await response1.json();
        setUserName(data1.first_name || "Unnamed User");

        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading consultant profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="not-found-container">
        <h2>Profile Not Found</h2>
        <p>The requested consultant profile could not be found.</p>
      </div>
    );
  }

  const handleEditProfile = () => {
    // Navigate to the ConsultantProfileForm with the current profile data
    navigate("/ConsultantProfileForm", {
      state: {
        isEditMode: true,
        profileData: profile,
      },
    });
  };

  return (
    <>
      <Header />
      <div className="consultant-profile-view">
        <div className="profile-card">
          <div className="profile-actions">
            <button className="edit-button" onClick={handleEditProfile}>
              Edit Profile
            </button>
          </div>

          <div className="profile-header">
            {userPicture && (
              <div className="profile-picture-container">
                <img
                  src={userPicture} // Directly use the profile picture URL here
                  alt="User Profile"
                  className="profile-picture"
                  onError={(e) => {
                    e.target.src = "/default-profile.png";
                    e.target.onerror = null;
                  }}
                />
              </div>
            )}

            <h2 className="profile-name">
              {profile.firstname && profile.lastname
                ? `${profile.firstname} ${profile.lastname}`
                : "Unnamed User"}
            </h2>

            {/* Display bio if it exists */}
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          </div>

          {/* Other sections like Contact, Experience, Education, etc. */}
          <div className="profile-section contact-info">
            <h3>Contact Information</h3>
            <div className="info-grid">
              {profile.email && (
                <div className="info-item">
                  <span>Email: {profile.email}</span>
                </div>
              )}
              {profile.phoneNumber && (
                <div className="info-item">
                  <span>Phone: {profile.phoneNumber}</span>
                </div>
              )}
              {profile.address && (
                <div className="info-item">
                  <span>Address: {profile.address}</span>
                </div>
              )}
              {profile.linkedIn && (
                <div className="info-item">
                  <a
                    href={profile.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="linkedin-link"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="profile-section experience">
            <h3>Professional Experience</h3>
            {profile.experience?.length > 0 ? (
              <div className="experience-list">
                {profile.experience.map((exp, index) => (
                  <div key={index} className="experience-item">
                    <h4>{exp.title}</h4>
                    <p className="company">{exp.company}</p>
                    <p className="years">{exp.years}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-content">No experience listed</p>
            )}
          </div>

          <div className="profile-section education">
            <h3>Education</h3>
            {profile.education?.length > 0 ? (
              <div className="education-list">
                {profile.education.map((edu, index) => (
                  <div key={index} className="education-item">
                    <h4>{edu.degree}</h4>
                    <p className="institution">{edu.institution}</p>
                    <p className="year">{edu.year}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-content">No education listed</p>
            )}
          </div>

          {profile.certifications && (
            <div className="profile-section certifications">
              <h3>Certifications</h3>
              <p>{profile.certifications}</p>
            </div>
          )}

          <div className="profile-section skills">
            <h3>Skills & Expertise</h3>
            {Array.isArray(profile.skills) && profile.skills.length > 0 ? (
              <div className="skills-container">
                {profile.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="no-content">No skills listed</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsultantProfileView;