import React, { useState, useEffect } from "react";
import "./styles.scss";
import Header from "../Commoncomponents/Header";
//  import {jwtdecode} from 'jwt-decode';
// import jwt_decode from 'jwt-decode';
import { CrossIcon, PlusIcon } from "../../svg/index"; // Dummy SVG icons, replace with your own SVGs
import { useNavigate, useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.7428 10.1254H11.2284L10.9872 9.88367C11.6571 9.00653 12.0007 7.87679 12.0007 6.65882C12.0007 2.97597 9.02403 0 5.34118 0C1.65833 0 -1.31727 2.97597 -1.31727 6.65882C-1.31727 10.3417 1.65833 13.3173 5.34118 13.3173C6.70964 13.3173 7.98657 12.8944 9.08524 12.1272L9.32812 12.3692V12.8837L10.7886 14.3442L12.2189 12.9139L11.7428 10.1254ZM5.34118 10.1254C3.62413 10.1254 2.1254 8.62671 2.1254 6.65882C2.1254 4.69093 3.62413 3.1922 5.34118 3.1922C7.05823 3.1922 8.55696 4.69093 8.55696 6.65882C8.55696 8.62671 7.05823 10.1254 5.34118 10.1254Z"
      fill="#6B6B6B"
    />
  </svg>
);

function ConsultantProfileForm() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { id } = useParams(); // If you're using URL params for editing
  const [isEditMode, setIsEditMode] = useState(false);

  const [profile, setProfile] = useState({
    userId: "",
    profilePicture: null,
    bio: "",
    experience: [{ title: "", company: "", years: "" }],
    skills: [],
    linkedIn: "",
    phoneNumber: "",
    address: "",
    education: [{ degree: "", institution: "", year: "" }],
    certifications: "",
    email: "",
    firstname: "",
    lastname: "",
  });
  const [availableSkills, setAvailableSkills] = useState([
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Figma",
    "Mobile App Design",
    "Prototyping",
    "Mockups",
  ]);
  const [filteredSkills, setFilteredSkills] = useState([...availableSkills]);

  useEffect(() => {
    const fetchEmailFromToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const jwt_decode = (await import("jwt-decode")).default;
        const decodedToken = jwt_decode(token);
        if (decodedToken && decodedToken.email) {
          setProfile((prevProfile) => ({
            ...prevProfile,
            email: decodedToken.email,
          }));
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    };

    fetchEmailFromToken();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      const skill = searchTerm.trim();

      // Add the skill via the refactored `handleAddSkill` function
      handleAddSkill(skill);
    }
  };

  // Add this useEffect after your existing useEffects
  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;
        const response = await fetch(`${BASE_URL}/api/client/Constprofile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          setIsEditMode(true);

          // Update all the state with existing data
          setProfile((prevProfile) => ({
            ...prevProfile,
            ...profileData,
            experience: profileData.experience || [
              { title: "", company: "", years: "" },
            ],
            education: profileData.education || [
              { degree: "", institution: "", year: "" },
            ],
          }));

          // Update skills
          if (profileData.skills && Array.isArray(profileData.skills)) {
            setSkills(profileData.skills);

            // Update available skills by removing already selected ones
            setAvailableSkills((prev) =>
              prev.filter((skill) => !profileData.skills.includes(skill))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfileData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission started");
    console.log("Current profile state:", profile);
    console.log("Skills:", skills);

    const formData = new FormData();
    const updatedProfile = {
      ...profile,
      skills, // Add the skills from the separate state
    };

    console.log("Updated profile before form data:", updatedProfile);

    for (const key in updatedProfile) {
      if (key === "experience" || key === "education") {
        updatedProfile[key].forEach((item, index) => {
          for (const subKey in item) {
            formData.append(`${key}[${index}][${subKey}]`, item[subKey]);
          }
        });
      } else if (key === "skills") {
        for (const skill of skills) {
          formData.append("skills[]", skill); // Append each skill
        }
      } else if (updatedProfile[key]) {
        formData.append(key, updatedProfile[key]);
      }
    }

    // Explicitly append skills as a comma-separated string
    //  if (Array.isArray(skills) && skills.length > 0) {
    //     skills.forEach((skill, index) => {
    //         formData.append(`skills[${index}]`, skill); // Send array format
    //     });
    // }

    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const url = isEditMode
          ? `${BASE_URL}/api/client/Constprofile/update`
          : `${BASE_URL}/api/client/Constprofile`;

        const method = isEditMode ? "PUT" : "POST";

        const response = await fetch(url, {
          method: method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        console.log("Response received:", response);

        if (response.ok) {
          const result = await response.json();
          console.log(
            isEditMode
              ? "Profile updated successfully:"
              : "Profile created successfully:",
            result
          );
          // For example, if using react-toastify:
          // toast.success(result.message || 'Profile created successfully');
          navigate("/ConsultantDash");
        } else {
          const errorText = await response.text();
          console.error("Error saving profile:", errorText);
          // Add error toast notification
          // toast.error(errorText || 'Failed to save profile');
        }
      } catch (error) {
        console.error("Network or server error:", error);
        // Add error toast notification
        // toast.error('Network error. Please try again.');
      }
    } else {
      console.log("No token found, user not authenticated");
      // Add error toast notification
      // toast.error('Please log in to save your profile');
    }
  };

  // Handle changes to input fields
  // const handleInputChange = (e) => {
  //     const { name, value } = e.target;
  //     setProfile((prevProfile) => ({
  //         ...prevProfile,
  //         [name]: value,
  //     }));
  // };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfile((prevProfile) => ({
      ...prevProfile,
      profilePicture: file,
    }));
  };

  // Handle changes to experience fields
  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...profile.experience];
    newExperience[index][field] = value;
    setProfile((prevProfile) => ({
      ...prevProfile,
      experience: newExperience,
    }));
  };

  // Add new experience entry
  const handleAddExperience = () => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      experience: [
        ...prevProfile.experience,
        { title: "", company: "", years: "" },
      ],
    }));
  };

  // Remove experience entry
  const handleRemoveExperience = (index) => {
    const newExperience = profile.experience.filter((_, i) => i !== index);
    setProfile((prevProfile) => ({
      ...prevProfile,
      experience: newExperience,
    }));
  };

  // Handle changes to education fields
  const handleEducationChange = (index, field, value) => {
    const newEducation = [...profile.education];
    newEducation[index][field] = value;
    setProfile((prevProfile) => ({ ...prevProfile, education: newEducation }));
  };

  const handleAddSkill = (skill) => {
    // Prevent adding duplicate skills to `skills`
    if (!skills.includes(skill)) {
      setSkills((prevSkills) => [...prevSkills, skill]);
    }

    // Remove the skill from `availableSkills` if it exists there
    if (availableSkills.includes(skill)) {
      setAvailableSkills((prevAvailableSkills) =>
        prevAvailableSkills.filter((s) => s !== skill)
      );
    }

    // Clear the search term
    setSearchTerm("");
  };

  const handleRemoveSkill = (skill) => {
    // Remove the skill from selected skills
    setSkills((prevSkills) => prevSkills.filter((s) => s !== skill));

    // Add the removed skill back to availableSkills if not already present
    if (!availableSkills.includes(skill)) {
      setAvailableSkills((prevAvailableSkills) => [
        ...prevAvailableSkills,
        skill,
      ]);
    }
  };

  // Add new education entry
  const handleAddEducation = () => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      education: [
        ...prevProfile.education,
        { degree: "", institution: "", year: "" },
      ],
    }));
  };
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    // Filter only from available skills, not already added ones
    setFilteredSkills(
      availableSkills.filter((skill) => skill.toLowerCase().includes(value))
    );
  };

  useEffect(() => {
    setFilteredSkills(
      availableSkills.filter((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [availableSkills, searchTerm]);

  // Remove education entry
  const handleRemoveEducation = (index) => {
    const newEducation = profile.education.filter((_, i) => i !== index);
    setProfile((prevProfile) => ({ ...prevProfile, education: newEducation }));
  };

  const [skills, setSkills] = useState([]);

  return (
    <>
      <Header />
      <form className="consultant-profile-form" onSubmit={handleSubmit}>
        <h1 className="profile-heading">
          {isEditMode ? "Edit Profile" : "Create Profile"}
        </h1>

        <div className="form-group">
          <label>Profile Picture</label>
          <input type="file" onChange={handleFileChange} accept="image/*" />
          {profile.profilePicture && (
            <img
              src={URL.createObjectURL(profile.profilePicture)}
              alt="Profile Preview"
              className="profile-preview"
            />
          )}
        </div>

        <div className="form-group">
          <label>Firs Name</label>
          <input
            type="text"
            name="firstname"
            value={profile.name}
            onChange={handleInputChange}
            placeholder="Your First Name"
          />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            name="lastname"
            // value={profile.name}
            onChange={handleInputChange}
            placeholder="Your Last Name"
          />
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea
            name="bio"
            value={profile.bio}
            onChange={handleInputChange}
            placeholder="Write a short bio..."
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleInputChange}
            placeholder="Your email"
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={profile.phoneNumber}
            onChange={handleInputChange}
            placeholder="e.g. +123456789"
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={profile.address}
            onChange={handleInputChange}
            placeholder="Your address"
          />
        </div>

        <div className="form-group">
          <label>Experience</label>
          {profile.experience.map((exp, index) => (
            <div key={index} className="experience-item">
              <input
                type="text"
                placeholder="Job Title"
                value={exp.title}
                onChange={(e) =>
                  handleExperienceChange(index, "title", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Company"
                value={exp.company}
                onChange={(e) =>
                  handleExperienceChange(index, "company", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Years"
                value={exp.years}
                onChange={(e) =>
                  handleExperienceChange(index, "years", e.target.value)
                }
              />
              <button
                type="button"
                onClick={() => handleRemoveExperience(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddExperience}>
            Add Experience
          </button>
        </div>

        <div className="form-group">
          <label>Education</label>
          {profile.education.map((edu, index) => (
            <div key={index} className="education-item">
              <input
                type="text"
                placeholder="Degree"
                value={edu.degree}
                onChange={(e) =>
                  handleEducationChange(index, "degree", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Institution"
                value={edu.institution}
                onChange={(e) =>
                  handleEducationChange(index, "institution", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Year"
                value={edu.year}
                onChange={(e) =>
                  handleEducationChange(index, "year", e.target.value)
                }
              />
              <button
                type="button"
                onClick={() => handleRemoveEducation(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddEducation}>
            Add Education
          </button>
        </div>

        <label htmlFor="search">Search skills or add your own</label>
        <div className="search-bar">
          <input
            id="search"
            type="text"
            placeholder="Search skills or add your own"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
          <SearchIcon />
        </div>

        <div className="skills-section">
          <h3>Selected Skills</h3>
          <div className="skills-list">
            {skills.map((skill, index) => (
              <button
                key={index}
                onClick={() => handleRemoveSkill(skill)}
                className="skill-button"
              >
                {skill}
                <CrossIcon />
              </button>
            ))}
          </div>
        </div>

        <div className="skills-section">
          <h3>Available Skills</h3>
          <div className="skills-list">
            {filteredSkills.map((skill, index) => (
              <button
                key={index}
                onClick={() => handleAddSkill(skill)}
                className="skill-button"
              >
                {skill}
                <PlusIcon />
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Certifications</label>
          <textarea
            name="certifications"
            value={profile.certifications}
            onChange={handleInputChange}
            placeholder="List your certifications..."
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>LinkedIn Profile</label>
          <input
            type="url"
            name="linkedIn"
            value={profile.linkedIn}
            onChange={handleInputChange}
            placeholder="https://www.linkedin.com/in/username"
          />
        </div>

        <button type="submit" className="submit-button">
          {isEditMode ? "Update Profile" : "Save Profile"}
        </button>
        {isEditMode && (
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate("/ConsultantDash")}
          >
            Cancel
          </button>
        )}
      </form>
    </>
  );
}

export default ConsultantProfileForm;