import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Commoncomponents/Header";
import "./styles.scss";
import Popup from "../../components/PopUps/PropsalSubmit";
// import Popup from "../../components/PopUps/PropsalSubmit";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { CoverLetter } from "../../components";
import { Button } from "react-bootstrap";

const SubmitProposal = () => {
  const [isPopupVisible, setPopupVisible] = useState(false);

  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [additionalSkills, setAdditionalSkills] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("");
  const [freelancerCoverLetter, setFreelancerCoverLetter] = useState("");

  // Toggle modal
  const handleShowModal = () => setShowCoverLetter(true);
  const handleCloseModal = () => setShowCoverLetter(false);
  const [errors, setErrors] = useState({
    paymentMethod: "",
    milestones: [],
    projectAmount: "",
    projectDueDate: "",
    project_duration: "",
    cover_letter: "",
    portfolio_link: "",
    attachment: "",
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      paymentMethod: "",
      milestones: [],
      projectAmount: "",
      projectDueDate: "",
      project_duration: "",
      cover_letter: "",
      portfolio_link: "",
      attachment: "",
    };

    // Validate payment method
    if (!paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
      isValid = false;
    }

    // Validate milestones if payment method is milestone
    // Validate milestones if payment method is milestone
    if (paymentMethod === "milestone") {
      const milestoneErrors = [];
      milestones.forEach((milestone, index) => {
        const milestoneError = {};
        if (!milestone.description.trim()) {
          milestoneError.description = "Description is required";
          isValid = false;
        }
        if (!milestone.dueDate) {
          milestoneError.dueDate = "Due date is required";
          isValid = false;
        }
        if (!milestone.amount || milestone.amount <= 0) {
          milestoneError.amount = "Valid amount is required";
          isValid = false;
        }
        milestoneErrors[index] = milestoneError;
      });
      newErrors.milestones = milestoneErrors;
    }

    // Validate project fields if payment method is project
    if (paymentMethod === "project") {
      if (!formData.projectAmount || formData.projectAmount <= 0) {
        newErrors.projectAmount = "Valid project amount is required";
        isValid = false;
      }
      if (!formData.projectDueDate) {
        newErrors.projectDueDate = "Project due date is required";
        isValid = false;
      }
    }

    // Validate project duration
    if (!formData.project_duration.trim()) {
      newErrors.project_duration = "Project duration is required";
      isValid = false;
    }

    // Validate cover letter
    if (!freelancerCoverLetter.trim()) {
      newErrors.cover_letter = "Cover letter is required";
      isValid = false;
    }

    // Validate portfolio link
    if (!formData.portfolio_link.trim()) {
      newErrors.portfolio_link = "Portfolio link is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Step 2: Function to show the popup
  const showPopup = () => {
    setPopupVisible(true);
    setSubmitted(true);
  };

  // Step 3: Function to hide the popup
  const hidePopup = () => {
    setPopupVisible(false);
  };

  const [milestones, setMilestones] = useState([
    { description: "", dueDate: "", amount: "" },
  ]);
  const { jobPostId } = useParams();
  const [jobDetails, setJobDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [freelancerId, setFreelancerId] = useState();
  const [paymentMethod, setPaymentMethod] = useState("");

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { description: "", dueDate: "", amount: "" },
    ]);
  };

  const handleMilestoneChange = (index, field, value) => {
    const newMilestones = [...milestones];
    newMilestones[index][field] = value;
    setMilestones(newMilestones);
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const PlusIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" fill="#00BFFF" />
      <line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="2" />
    </svg>
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/signin");
          return;
        }

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId; // Adjust this based on your token structure
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
        const response = await fetch(
          `${BASE_URL}/api/freelancer/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();

        // Find the freelancer object that matches the logged-in user ID
        const loggedInFreelancer = userData.data.find(
          (freelancer) => freelancer.freelancer_id === userId
        );

        if (loggedInFreelancer) {
          setFreelancerId(loggedInFreelancer.freelancer_id); // Save the logged-in freelancer's ID
        } else {
          console.warn("Freelancer profile not found for logged-in user.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(error.message);
      }
    };

    fetchUserData();
  }, []); // Include navigate in the dependency array to avoid exhaustive-deps warnings.

  useEffect(() => {
    console.log("freelancerId updated:", freelancerId); // This will log whenever freelancerId changes
  }, [freelancerId]);

  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const response = await fetch(
        `${BASE_URL}/api/client/job-posts/${jobPostId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.statusText}`);
      }

      const data = await response.json();
      setJobDetails(data.jobPost);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching job details:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Ensure fetchJobDetails is called when jobPostId changes
  useEffect(() => {
    fetchJobDetails();
  }, [jobPostId]);

  const navigate = useNavigate();

  // Handle input changes for form data
  const handleInputvalueChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;

    // Update the form data with the new value
    setFormData((prevData) => ({ ...prevData, [name]: value }));

    // If the updated field is the portfolio link, fetch the thumbnail
    if (name === "portfolio_link" && value) {
      try {
        const thumbnail = await fetchThumbnail(value); // Fetch the thumbnail
        setFormData((prevData) => ({ ...prevData, thumbnail })); // Update form data with the thumbnail URL
      } catch (error) {
        console.error("Error fetching thumbnail:", error);
      }
    }
  };
  const fetchThumbnail = async (url) => {
    try {
      const response = await fetch(
        `https://api.linkpreview.net/?key=YOUR_API_KEY&q=${url}`
      );
      const data = await response.json();
      return data.image; // Assuming the API returns the image in the `data.image` field
    } catch (error) {
      throw new Error("Failed to fetch thumbnail");
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, attachment: e.target.files[0] });
  };

  const [formData, setFormData] = useState({
    add_requirements: [],
    attachment: null,
    freelancerCoverLetter: "",
    project_duration: "",
    portfolio_link: "",
  });

  const handleSubmit = async (e) => {
    console.log(
      "freelancerCoverLetter before append:",
      formData.freelancerCoverLetter
    );
    e.preventDefault();
    if (!validateForm()) {
      // Show error message
      alert("Please fill in all required fields");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      const add_requirements =
        paymentMethod === "milestone"
          ? {
              by_milestones: milestones.map((m) => ({
                amount: parseFloat(m.amount),
                description: m.description,
                due_date: m.dueDate,
              })),
            }
          : {
              by_project: {
                bid_amount: parseFloat(formData.projectAmount),
                due_date: formData.projectDueDate,
              },
            };
      formDataToSend.append(
        "add_requirements",
        JSON.stringify(add_requirements)
      );
      if (formData.attachment) {
        formDataToSend.append("attachment", formData.attachment);
      }
      if (freelancerCoverLetter) {
        formDataToSend.append("cover_letter", freelancerCoverLetter);
      }

      formDataToSend.append("job_id", jobPostId);
      formDataToSend.append("project_duration", formData.project_duration);
      formDataToSend.append("portfolio_link", formData.portfolio_link);
      formDataToSend.append("client_id", jobDetails._id);
      // Removed: formDataToSend.append('freelancer_id', userId);
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const response = await fetch(
        `${BASE_URL}/api/freelancer/proposal/${jobPostId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to submit proposal: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Proposal submitted successfully:", result);
      navigate("/matchingJobs");
    } catch (error) {
      console.error("Error submitting proposal:", error);
      setError(error.message);
    }
  };

  // Handle additional skills change
  const handleSkillsChange = (e) => {
    setAdditionalSkills(e.target.value);
  };

  // Handle additional skills change
  const handleSpecialInstructions = (e) => {
    setSpecialInstructions(e.target.value);
  };

  console.log("jobid in submit proposal", jobPostId);

  // Fetch cover letter from the backend
  const generateCoverLetter = async () => {
    setLoading(true);
    try {
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/api/freelancer/generate-cover-letter`,
        {
          jobPostId,
          freelancerId,
          additionalSkills,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Replace `yourToken` with the actual token
          },
        }
      );

      console.log("cover letter details", response.data.data);

      // Check if response.data and generated_cover_letter exist
      if (
        response.data &&
        response.data.data &&
        response.data.data.generated_cover_letter
      ) {
        // Access the correct nested property
        setGeneratedCoverLetter(response.data.data.generated_cover_letter);
        setFreelancerCoverLetter(response.data.data.generated_cover_letter);
        setFormData((prev) => ({
          ...prev,
          freelancerCoverLetter: response.data.data.generated_cover_letter,
        }));
        setLoading(false); // Set loading to false once done
      } else {
        console.error(
          "Generated cover letter data is missing from the response"
        );
      }
    } catch (error) {
      console.error("Error generating cover letter:", error);
    }
  };

  // Use useEffect to log changes to generatedCoverLetter
  useEffect(() => {
    console.log("Cover letter updated:", generatedCoverLetter);
  }, [generatedCoverLetter]);

  // Handle direct changes to the cover letter
  const handleCoverLetterChange = (value) => {
    setFreelancerCoverLetter(value);
    setFormData((prev) => ({
      ...prev,
      freelancerCoverLetter: value,
    }));
  };

  // Handle the form submission to save the proposal
  const handleSubmitCoverLetter = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      console.log(
        "cover letter in handle sumbit cover letter function to test save",
        freelancerCoverLetter
      );

      if (freelancerCoverLetter) {
        console.log("Cover letter saved successfully!");
        // Optionally, trigger any additional actions, like refreshing the proposal list
        handleCloseModal(); // Close the modal after saving
      } else {
        console.error(
          "Failed to save the cover letter:"
          // response.data.message
        );
      }
    } catch (error) {
      console.error("Error saving cover letter:", error);
    }
  };

  return (
    <>
      <Header />
      <div className="submit-proposal">
        <h1>Submit a Proposal</h1>
        <div className="outerContainer">
          <div className="horizontal-container">
            <div className="left-section">
              {loading ? (
                <p>Loading job details...</p>
              ) : error ? (
                <p>Error: {error}</p>
              ) : jobDetails ? (
                <div className="job-details">
                  <h2>Job Details</h2>
                  <h3>{jobDetails.job_title}</h3>
                  <p>{jobDetails.location}</p>
                  <div className="job-info">
                    <span>
                      <strong>
                        {jobDetails.budget_type === "fixed"
                          ? "Fixed Price:"
                          : "Hourly Rate:"}
                      </strong>
                      {jobDetails.budget_type === "fixed"
                        ? `$${jobDetails.fixed_price}`
                        : `$${jobDetails.hourly_rate?.from} - $${jobDetails.hourly_rate?.to} /hr`}
                    </span>
                    <span>
                      <strong>Estimated time:</strong>{" "}
                      {jobDetails.project_duration?.duration_of_work}
                    </span>
                    <span>
                      <strong>Level:</strong>{" "}
                      {jobDetails.project_duration?.experience_level}
                    </span>
                  </div>
                  <h3 className="projectoverview">Project Overview</h3>
                  <p>{jobDetails.description}</p>
                  <h3>Skills and Expertise</h3>
                  <div className="skills">
                    {jobDetails.preferred_skills.map((skill, index) => (
                      <span key={index}>{skill}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <p>No job details found</p>
              )}
            </div>
            <div className="right-section">
              <div className="add-requirements">
                <h2>Add Requirements</h2>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label className="Label">
                    Select how do you want to be paid:
                  </label>
                  {/* <div className="form-field"> */}
                  <div className="payment-options">
                    <div className="option">
                      <label htmlFor="milestone">By milestones</label>
                      <input
                        type="radio"
                        id="milestone"
                        name="payment"
                        onChange={() => handlePaymentMethodChange("milestone")}
                      />
                      {/* {errors.paymentMethod && (
    <div className="error-message">{errors.paymentMethod}</div>
  )} */}
                    </div>
                    <div className="option">
                      <label htmlFor="project">By project</label>
                      <input
                        type="radio"
                        id="project"
                        name="payment"
                        onChange={() => handlePaymentMethodChange("project")}
                      />
                      {errors.paymentMethod && (
                        <div className="error-message">
                          {errors.paymentMethod}
                        </div>
                      )}
                    </div>
                  </div>

                  {paymentMethod === "milestone" && (
                    <>
                      <label className="Label">
                        How many milestones do you want to include?
                        <span
                          className="add-milestone-span"
                          onClick={addMilestone}
                        >
                          Add milestones <PlusIcon />
                        </span>
                      </label>

                      {milestones.map((milestone, index) => (
                        <div key={index} className="milestone">
                          <div className="milestone-row">
                            <div className="milestone-field">
                              <label>{index + 1}. Milestone Description:</label>
                              <input
                                type="text"
                                value={milestone.description}
                                onChange={(e) =>
                                  handleMilestoneChange(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                              {errors.milestones[index]?.description && (
                                <div className="error-message">
                                  {errors.milestones[index].description}
                                </div>
                              )}
                            </div>

                            <div className="milestone-field">
                              <label>Due date:</label>
                              <div className="date-input">
                                <input
                                  type="date"
                                  value={milestone.dueDate}
                                  onChange={(e) =>
                                    handleMilestoneChange(
                                      index,
                                      "dueDate",
                                      e.target.value
                                    )
                                  }
                                />
                                {errors.milestones[index]?.dueDate && (
                                  <div className="error-message">
                                    {errors.milestones[index].dueDate}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="milestone-field">
                              <label>Amount:</label>
                              <div className="date-input">
                                <input
                                  type="number"
                                  placeholder="\$12,00 per milestone"
                                  value={milestone.amount}
                                  onChange={(e) =>
                                    handleMilestoneChange(
                                      index,
                                      "amount",
                                      e.target.value
                                    )
                                  }
                                />
                                {errors.milestones[index]?.amount && (
                                  <div className="error-message">
                                    {errors.milestones[index].amount}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {paymentMethod === "project" && (
                    <>
                      <div className="milestone-field">
                        <label>Amount:</label>
                        <input
                          type="number"
                          name="projectAmount"
                          value={formData.projectAmount}
                          onChange={handleInputChange}
                          placeholder="\$12,00"
                        />
                        {errors.projectAmount && (
                          <div className="error-message">
                            {errors.projectAmount}
                          </div>
                        )}
                      </div>
                      <div className="milestone-field">
                        <label>Due Date:</label>
                        <input
                          type="date"
                          name="projectDueDate"
                          value={formData.projectDueDate}
                          onChange={handleInputChange}
                        />
                        {errors.projectDueDate && (
                          <div className="error-message">
                            {errors.projectDueDate}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* <div className="form-field"> */}
                  <label className="Label">
                    How long will this project take?
                  </label>
                  <input
                    type="text"
                    name="project_duration"
                    value={formData.project_duration}
                    onChange={handleInputChange}
                    placeholder="Hours, Days or Months"
                    className="project-duration"
                  />
                  {errors.project_duration && (
                    <div className="error-message">
                      {errors.project_duration}
                    </div>
                  )}
                  {/* </div> */}
                  {/* <div className="form-field"> */}
                  <label className="Label">Cover letter</label>

                  <div>
                    <Button className="button" variant="primary" onClick={handleShowModal}>
                      Generate Cover Letter
                    </Button>

                    {showCoverLetter && (
                      <CoverLetter
                        formData={formData}
                        // freelancerCoverLetter={formData.freelancerCoverLetter}
                        setFreelancerCoverLetter={handleCoverLetterChange} // Use the new handler
                        handleClose={() => setShowCoverLetter(false)}
                        generateCoverLetter={generateCoverLetter}
                        handleSubmitCoverLetter={handleSubmitCoverLetter}
                        generatedCoverLetter={generatedCoverLetter}
                        freelancerCoverLetter={freelancerCoverLetter}
                        // setFreelancerCoverLetter={setFreelancerCoverLetter}
                        additionalSkills={additionalSkills}
                        handleSkillsChange={handleSkillsChange}
                        handleInputChange={handleInputvalueChange}
                        loading={loading}
                      />
                    )}
                    {errors.cover_letter && (
                      <div className="error-message">{errors.cover_letter}</div>
                    )}
                  </div>
                  {/* </div> */}

                  <label className="Label">Attachment</label>
                  <div className="attachment-box">
                    <div className="attachment">
                      <input type="file" onChange={handleFileChange} />
                    </div>
                  </div>

                  {/* <div className="form-field"> */}
                  <label className="Label">Add portfolio link</label>
                  <input
                    type="text"
                    name="portfolio_link"
                    value={formData.portfolio_link}
                    onChange={handleInputChange}
                    placeholder="Enter your portfolio link"
                    className="portfolio-link"
                  />
                  {errors.portfolio_link && (
                    <div className="error-message">{errors.portfolio_link}</div>
                  )}
                  {/* </div> */}
                  {/* {formData.thumbnail ? (
                    <div className="thumbnail-preview">
                      <img src={formData.thumbnail} alt="Portfolio Thumbnail" />
                    </div>
                  ) : (
                    <div className="thumbnail-preview">
                      <img
                        src="https://picsum.photos/200/300"
                        alt="Default Thumbnail"
                      />
                    </div>
                  )} */}

                  <div className="actions">
                    <button
                      type="button"
                      className="cancel"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="submit"
                      onClick={(e) => handleSubmit(e)}
                    >
                      Send proposal
                    </button>
                    {isPopupVisible && <Popup onClose={hidePopup} />}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubmitProposal;
