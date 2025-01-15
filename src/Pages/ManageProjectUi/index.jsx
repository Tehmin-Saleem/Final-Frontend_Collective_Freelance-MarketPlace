import React, { useState, useEffect } from "react";
import "./styles.scss";
// import { jwtDecode } from "jwt-decode";
import Header from "../../components/Commoncomponents/Header";
import { Chat } from "../../svg/index";
import axios from "axios";
import { useParams } from "react-router-dom";
import ReviewModal from "../../components/ReviewsModal";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { jwtDecode } from "jwt-decode";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  PaperClipOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Progress,
  Space,
  Tag,
  Row,
  Col,
  Divider,
  Timeline,
  Empty,
  Alert,
  Statistic,
  Typography,
  Modal,
  Button,
  message,
} from "antd";

const { Title, Text, Paragraph } = Typography;
import Spinner from "../../components/chatcomponents/Spinner";

import { PAYPAL_OPTIONS } from "../../config/paypal.config"; // Update the path
import ConsultantCard from "../../components/ConsultantCards";

const ManageProjectsByClient = () => {
  console.log("ManageProjectsByClient rendering");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  // Add a new state for storing freelancer payments if needed
  const [freelancerPayments, setFreelancerPayments] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState({});

  // Add function to update payment status
  const updatePaymentStatus = (projectId, status, details) => {
    setPaymentStatus((prev) => ({
      ...prev,
      [projectId]: { status, details },
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
        // Fetch client profile and ongoing projects in parallel
        const [profileResponse, projectsResponse, offersResponse] =
          await Promise.all([
            axios.get(`${BASE_URL}/api/client/profile`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${BASE_URL}/api/client/ongoing-projects`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${BASE_URL}/api/client/accepted-offers`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        console.log("Profile Response:", profileResponse.data);
        console.log("Projects Response:", projectsResponse.data);
        console.log("Offers Response:", offersResponse.data);

        setProfileData(profileResponse.data.data);
        const projectsData = projectsResponse.data.data;
        const offersData = offersResponse.data.data;

        // Combine and sort by date
        const combinedData = [...projectsData, ...offersData].sort(
          (a, b) => new Date(b.startDate) - new Date(a.startDate)
        );

        console.log("Combined projects and offers:", combinedData);

        // console.log("projects", projectsData);
        setProjects(combinedData);

        // Fetch payment details for each freelancer
        const freelancerPaymentDetails = await Promise.all(
          projectsData.map(async (project) => {
            const freelancerId =
              project.freelancer._id ||
              project.proposalDetails?.Proposal_id?.freelancer ||
              project.freelancer?.id;

            if (!freelancerId) {
              console.warn(
                "No freelancer ID found for project:",
                project.projectId
              );
              return null;
            }

            const paymentDetails =
              await fetchFreelancerPaymentDetails(freelancerId);

            return {
              freelancerId,
              paymentDetails: paymentDetails || null,
            };
          })
        );

        // Filter out null entries
        const validPaymentDetails = freelancerPaymentDetails.filter(
          (detail) => detail && detail.freelancerId && detail.paymentDetails
        );

        console.log("Valid Freelancer Payment Details:", validPaymentDetails);
        setFreelancerPayments(validPaymentDetails);
      } catch (error) {
        console.error("Error fetching data :", error);
        setError(error.message || "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  useEffect(() => {
    console.log("Projects state updated:", projects);
  }, [projects]);

  useEffect(() => {
    console.log("Selected project state updated:", selectedProject);
  }, [selectedProject]);

  const fetchFreelancerPaymentDetails = async (freelancerId) => {
    try {
      const token = localStorage.getItem("token");
      // console.log("Fetching payment details for freelancer ID:", freelancerId);
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const response = await axios.get(
        `${BASE_URL}/api/client/payment-method/${freelancerId}`, // Changed to freelancer endpoint
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // console.log("Payment details response:", response.data); // Log the full response

      if (response.data && response.data.paymentMethod) {
        return response.data.paymentMethod;
      }
      console.error("No payment details found in response");
      return null;
    } catch (error) {
      console.error("Error fetching freelancer payment details:", error);
      if (error.response) {
        console.log("Error response:", error.response.data);
      }
      return null; // Return null instead of throwing error to handle it gracefully
    }
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  if (loading) return <Spinner alignCenter />;
  if (error) return <div className="error-message">{error}</div>;

  const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = useState(false);
    const [error, setError] = useState(null);

    if (hasError) {
      return (
        <div style={{ padding: "20px", color: "red" }}>
          Error: {error?.message}
        </div>
      );
    }

    try {
      return children;
    } catch (err) {
      setError(err);
      setHasError(true);
      return null;
    }
  };

  return (
    <>
      <PayPalScriptProvider options={PAYPAL_OPTIONS}>
        <Header />
        <ErrorBoundary>
          <div className="manage-projects">
            <ErrorBoundary>
              {/* Header Section */}
              <div className="upperhead">
                <div className="header-content">
                  <h1>Manage Ongoing Projects</h1>
                  <p>Track project progress and milestones</p>
                </div>

                <div className="client-profile">
                  <img
                    src={
                      profileData?.image || "https://via.placeholder.com/150"
                    }
                    alt={profileData?.name || "Client"}
                    className="profile-image"
                  />
                  <div className="profile-info">
                    <span className="name">
                      {profileData?.name || "Loading..."}
                    </span>
                    <span className="email">{profileData?.email}</span>
                  </div>
                </div>
              </div>
            </ErrorBoundary>

            <ErrorBoundary>
              {/* Projects Section */}
              <div className="projects-container">
                {/* Project List */}
                <div className="project-list">
                  {projects.length === 0 ? (
                    <div className="no-projects">No ongoing projects found</div>
                  ) : (
                    projects.map((project) => (
                      <ProjectCard
                        key={project.projectId}
                        project={project}
                        onClick={() => handleProjectClick(project)}
                        isSelected={
                          selectedProject?.projectId === project.projectId
                        }
                      />
                    ))
                  )}
                </div>

                {/* Project Details */}
                {selectedProject && (
                  <ProjectDetails
                    project={selectedProject}
                    freelancerPayments={freelancerPayments}
                    onProjectUpdate={(updatedProject) => {
                      setProjects((prevProjects) =>
                        prevProjects.map((p) =>
                          p._id === updatedProject._id ? updatedProject : p
                        )
                      );
                      setSelectedProject(updatedProject);
                    }}
                  />
                )}
              </div>
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      </PayPalScriptProvider>
    </>
  );
};

const ProjectCard = ({ project, onClick, isSelected }) => {
  const isOffer = project.type === "offer";

  // console.log("ProjectCard is being rendering");
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatBudgetDisplay = (budget) => {
    if (budget.type === "hourly") {
      return `${budget.hourly_rate.from}-${budget.hourly_rate.to}/hr`;
    }
    return `${budget.amount} USD`;
  };

  return (
    <div
      className={`project-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="project-header">
        <h3>{project.projectName}</h3>
        <span className="budget">{formatBudgetDisplay(project.budget)}</span>
        {isOffer && <Tag color="blue">Offer</Tag>}
      </div>

      <div className="freelancer-info">
        <img
          src={project?.freelancer?.image || "https://via.placeholder.com/40"}
          alt={project.freelancer.name}
          className="freelancer-image"
        />
        <div className="freelancer-details">
          <span className="name">{project.freelancer.name}</span>
          <div className="freelancer-meta">
            <span className="location">
              {project.freelancer.location?.country}
            </span>
            {/* <span className="rating">★ {project.freelancer.rating.toFixed(1)}</span> */}
          </div>
          <span className="status">
            {isOffer ? "Accepted on" : "Hired on"}{" "}
            {formatDate(project.startDate)}
          </span>
        </div>
      </div>

      <div className="skills">
        {project.preferred_skills &&
          project.preferred_skills.map((skill, index) => (
            <span key={index} className="skill">
              {skill}
            </span>
          ))}
      </div>

      <div className="project-footer">
        <div className="deadline">
          <ClockCircleOutlined />
          <span>
            Due:{" "}
            {project.deadline
              ? formatDate(project.deadline)
              : "No deadline set"}
          </span>
        </div>
        {!isOffer && (
          <div className="milestone-count">
            <CheckCircleOutlined />
            <span>{project.milestones?.length || 0} Milestones</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectDetails = ({
  project,
  onProjectStatusChange,
  freelancerPayments,
}) => {
  console.log("ProjectDetails is being rendering");
  const [activeTab, setActiveTab] = useState("overview");
  const [consultantId, setConsultantId] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [description, setdescription] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ProjectId, setProjectId] = useState(false);
  // Add these state variables
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [currentProject, setCurrentProject] = useState(project);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (progressData?.projectDetails) {
      setPaymentStatus(progressData.projectDetails.paymentStatus);
      setPaymentDetails(progressData.projectDetails.paymentDetails);
    }
  }, [progressData]);

  const handlePaymentSuccess = async (updatedProject) => {
    setIsPaymentLoading(true);
    try {
      setCurrentProject(updatedProject);
      setPaymentStatus(updatedProject.paymentStatus);
      setPaymentDetails(updatedProject.paymentDetails);
      setProgressData((prev) => ({
        ...prev,
        projectDetails: {
          ...prev?.projectDetails,
          paymentStatus: updatedProject.paymentStatus,
          paymentDetails: updatedProject.paymentDetails,
        },
      }));
      await fetchProgress();
      message.success("Payment processed successfully!");
    } catch (error) {
      console.error("Error updating payment status:", error);
      message.error("Error updating payment status");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (progressData?.projectDetails?.paymentStatus === "paid") {
      // message.success("Payment completed successfully!");
      // Update UI to show paid status
      setPaymentStatus("paid");
    }
  }, [progressData]);

  const handleMarkAsComplete = () => {
    // Instead of making the API call here, just show the modal
    setShowReviewModal(true);
  };
  const handleHireConsultant = () => {
    navigate("/Consultantprofiles", {
      state: {
        project: project, // Pass the entire project object
        projectId: project._id,
        projectName: project.projectName,
        projectDescription: project.description,
      },
    });
  };

  // const fetchProgress = async () => {
  //   // if (!projectId) return;
  //   setLoading(true);
  //   try {

  //   const token = localStorage.getItem("token");
  //   const decodedToken = jwtDecode(token);
  //   const userId = decodedToken.userId;

  //   // const id = project.proposalDetails.Proposal_id._id;

  //   let response;

  //   if (project.type === 'offer') {
  //     // Fetch progress for offers
  //     response = await axios.get(
  //       `http://localhost:5000/api/client/offer-progress`,
  //       {
  //         params: {
  //           client_id: userId,
  //           projectName: project.projectName || project.job_title
  //         },
  //         headers: { Authorization: `Bearer ${token}` }
  //       }
  //     );
  //   } else {
  //     // Existing code for regular projects
  //     const id = project.proposalDetails.Proposal_id._id;
  //     response = await axios.get(
  //       `http://localhost:5000/api/client/project-progress/${id}?client_id=${userId}`,
  //       {
  //         headers: { Authorization: `Bearer ${token}` }
  //       }
  //     );
  //   }

  //   // try {
  //   //   const token = localStorage.getItem("token");

  //   //   const response = await axios.get(
  //   //     `http://localhost:5000/api/client/project-progress/${id}?client_id=${userId}`,
  //   //     {
  //   //       headers: { Authorization: `Bearer ${token}` },
  //   //     }
  //   //   );
  //   //   // console.log("Progress :", response.data);
  //   //   setdescription(response.data.projectDetails.description);
  //   //   setProjectId(response.data.projectDetails.projectId);

  //   //   setProgressData(response.data);

  //   //   // Update payment status and details if available
  //   //   if (response.data.projectDetails) {
  //   //     setPaymentStatus(response.data.projectDetails.paymentStatus);
  //   //     setPaymentDetails(response.data.projectDetails.paymentDetails);
  //   //   }

  //   //   setError(null);

  //   console.log("progress data in case of offers ", response.data.data)
  //   console.log("progress data in case of projects", response.data)

  //   if (response.data.success) {
  //     const progressData = response.data.data || response.data ;
  //     setdescription(response.data.projectDetails.description);
  //     setProjectId(response.data.projectDetails.projectId);
  //     setProgressData(progressData);

  //     if (progressData.projectDetails) {
  //       setPaymentStatus(progressData.projectDetails.paymentStatus);
  //       setPaymentDetails(progressData.projectDetails.paymentDetails);
  //     }

  //     setError(null);
  //   }
  //   } catch (err) {
  //     console.error("Error fetching progress:", err);
  //     setError(
  //       err.response?.data?.message || "Error fetching project progress"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchProgress = async () => {
    const token = localStorage.getItem("token");
    const decodedToken = jwtDecode(token);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;

      let response;

      if (project.type === "offer") {
        // Fetch progress for offers
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
        response = await axios.get(
          `${BASE_URL}/api/client/offer-progress`,
          {
            params: {
              client_id: userId,
              projectName: project.projectName || project.job_title,
            },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          const progressData = response.data.data;
          // Check if there's any progress data
          if (progressData && Object.keys(progressData).length > 0) {
            setdescription(progressData.projectDetails?.description || "");
            setProjectId(progressData.projectDetails?.projectId || "");
            setProgressData({
              ...progressData,
              overallProgress: progressData?.overallProgress || 0,
              milestones: progressData?.milestones || [],
            });

            if (progressData.projectDetails) {
              setPaymentStatus(progressData.projectDetails.paymentStatus);
              setPaymentDetails(progressData.projectDetails.paymentDetails);
            }
          } else {
            // Handle no progress case
            setProgressData({ noProgress: true });
            setdescription("");
            setProjectId("");
            setPaymentStatus("");
            setPaymentDetails(null);
          }
        }
      } else {
        // Fetch progress for regular projects
        const id = project.proposalDetails.Proposal_id._id;
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
        response = await axios.get(
          `${BASE_URL}/api/client/project-progress/${id}?client_id=${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data.success) {
          const progressData = response.data;

          if (progressData && Object.keys(progressData).length > 0) {
            setdescription(progressData.projectDetails?.description || "");
            setProjectId(progressData.projectDetails?.projectId || "");
            setProgressData({
              ...progressData,
              overallProgress: progressData?.overallProgress || 0,
              milestones: progressData?.milestones || [],
            });

            if (progressData.projectDetails) {
              setPaymentStatus(progressData.projectDetails.paymentStatus);
              setPaymentDetails(progressData.projectDetails.paymentDetails);
            }
          } else {
            // Handle no progress case
            // Set default values when no progress is found
            setProgressData({
              overallProgress: 0,
              milestones: [],
              noProgress: true,
            });
            setdescription("");
            setProjectId("");
            setPaymentStatus("");
            setPaymentDetails(null);
          }
        }
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching progress:", err);
      // Instead of setting error, set no progress state
      setProgressData({ noProgress: true });
      setdescription("");
      setProjectId("");
      setPaymentStatus("");
      setPaymentDetails(null);
    } finally {
      setLoading(false);
    }
   
  };

  useEffect(() => {
    if (activeTab === "milestones") {
      fetchProgress();
    }
  }, [activeTab, project]);

  // const id = ProjectId;
  // console.log("outside", ProjectId);

  // const handleReviewSubmit = async (ProjectId, reviewData) => {
  //   try {
  //     setIsSubmitting(true);
  //     const token = localStorage.getItem("token");
  //     const decodedToken = jwtDecode(token);
  //     const userId = decodedToken.userId;

  //     // Make the API call to mark project as completed with review
  //     const response = await axios.post(
  //       `http://localhost:5000/api/client/complete-project/${ProjectId}`,
  //       {
  //         stars: reviewData.rating,
  //         message: reviewData.review,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     if (response.data.success) {
  //       message.success(
  //         "Project marked as completed and review submitted successfully"
  //       );
  //       setShowReviewModal(false);

  //       // Notify parent component about status change
  //       if (onProjectStatusChange) {
  //         onProjectStatusChange(project._id, "completed");
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error submitting review:", error);
  //     message.error(error.response?.data?.message || "Failed to submit review");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleViewFile = (fileUrl, fileType) => {
    setFileUrl(fileUrl);
    setFileType(fileType);

    if (fileType && fileUrl) {
      if (fileType.startsWith('image/')) {
        // For images, check if it's a URL or a Blob and handle accordingly
        if (fileUrl.startsWith('http')) {
          // If the fileUrl is a URL (like Cloudinary)
          window.open(fileUrl, '_blank');
        } else {
          // Otherwise, open the Blob URL
          window.open(fileUrl, '_blank');
        }
      } else if (fileType === 'application/pdf') {
        // For PDF, open in a new tab
        window.open(fileUrl, '_blank');
      } else {
        alert('Unsupported file type.');
      }
    } else {
      alert("No file available to view.");
    }
  };

  // File Preview
  // const renderFilePreview = () => {
  //   if (fileType && fileUrl) {
  //     if (fileType.startsWith('image/')) {
  //       return <img src={fileUrl} alt="Attachment Preview" className="file-preview-image" />;
  //     } else if (fileType === 'application/pdf') {
  //       return (
  //         <embed
  //           src={fileUrl}
  //           type="application/pdf"
  //           width="100%"
  //           height="500px"
  //           className="file-preview-pdf"
  //         />
  //       );
  //     }
  //   }
  //   return null;
  // };

  // Helper function to get file type from file extension
  const getFileTypeFromExtension = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return `image/${extension}`;
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  };


  const handleReviewSubmit = async (ProjectId, reviewData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;

      // Use the correct project ID from the project object
      const actualProjectId = project.projectId; // This is where the ID is stored

      console.log("Submitting review with:", {
        actualProjectId,
        reviewData,
        projectType: project.type,
      });

      // Validate project ID
      if (!actualProjectId) {
        throw new Error("No valid project ID found");
      }

      // Only send the required fields
      const requestData = {
        stars: reviewData.rating,
        message: reviewData.review,
      };
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      // Choose the appropriate endpoint based on project type
      const endpoint =
        project.type === "offer"
          ? `${BASE_URL}/api/client/complete-offer/${actualProjectId}`
          : `${BASE_URL}/api/client/complete-project/${ProjectId}`;

      const response = await axios.post(endpoint, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        message.success(
          "Project marked as completed and review submitted successfully"
        );
        setShowReviewModal(false);

        // Notify parent component about status change
        if (onProjectStatusChange) {
          onProjectStatusChange(project._id, "completed");
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      message.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
    return <div>{decodedToken?.clientId}</div>;
  };

  const formatHourlyRate = (project) => {
    if (project.type === "offer") {
      // Handle offer type projects
      if (
        project.budget?.hourly_rate?.from &&
        project.budget?.hourly_rate?.to
      ) {
        return `${project.budget.hourly_rate.from} - ${project.budget.hourly_rate.to}/hr`;
      } else if (project.budget?.amount) {
        return `${project.budget.amount}`; // For fixed price offers
      }
    } else {
      // Handle normal job type projects
      if (project.hourly_rate?.from && project.hourly_rate?.to) {
        return `${project.hourly_rate.from} - ${project.hourly_rate.to}/hr`;
      }
    }
    return "Rate not specified";
  };

  const formatProjectDuration = (project) => {
    if (project.type === "offer") {
      return null; // Return null for offers as we don't want to display it
    }
    try {
      if (project.project_duration?.duration_of_work?.duration_of_work) {
        return project.project_duration.duration_of_work.duration_of_work;
      }
      return "Duration not specified";
    } catch (error) {
      console.error("Error formatting project duration:", error);
      return "Duration not specified";
    }
  };

  const formatExperienceLevel = (project) => {
    if (project.type === "offer") {
      return null; // Return null for offers as we don't want to display it
    }
    try {
      if (project.project_duration?.duration_of_work?.experience_level) {
        return project.project_duration.duration_of_work.experience_level;
      }
      return "Experience level not specified";
    } catch (error) {
      console.error("Error formatting project duration:", error);
      return "Duration not specified";
    }
  };

  const handlePaymentError = (error) => {
    message.error(`Payment failed: ${error}`);
  };

  const renderMilestonesContent = () => {
    if (loading) return <Spinner />;

    if (error)
      return (
        <Alert message="Error" description={error} type="error" showIcon />
      );

    if (!progressData || progressData.noProgress) {
      return (
        <div className="no-progress-container">
          <div className="no-progress-message">
            No progress has been reported by the freelancer yet.
          </div>
        </div>
      );
    }

    // Check if progress is milestone-based
    if (progressData.milestones && progressData.milestones.length > 0) {
      const { milestones } = progressData;

      return (
        <div className="milestone-progress">
          <Card title="Milestones Timeline" style={{ marginTop: 16 }}>
            <Timeline mode="left">
              {milestones.map((milestone, index) => (
                <Timeline.Item
                  key={index}
                  color={
                    milestone.status === "Completed"
                      ? "green"
                      : milestone.status === "In Progress"
                        ? "blue"
                        : "gray"
                  }
                  label={new Date(milestone.due_date).toLocaleDateString()}
                >
                  <div className="milestone-details">
                    <h4>{milestone.name}</h4>
                    <p>
                      Due Date:
                      {new Date(milestone.due_date).toLocaleDateString()}
                    </p>
                    <p>Status: {milestone.status}</p>
                    <p>Amount: ${milestone.amount}</p>

                    {milestone.status === "Completed" && !milestone.paid && (
                      <div className="milestone-payment-section">
                        {milestone.paid ||
                        progressData?.projectDetails?.paymentStatus ===
                          "paid" ? (
                          <Alert
                            message={`Milestone ${index + 1} Payment Complete`}
                            description={
                              <div>
                                <p>Amount Paid: ${milestone.amount}</p>
                                <p>
                                  Date:{" "}
                                  {new Date(
                                    progressData?.projectDetails?.paymentDetails?.paymentDate
                                  ).toLocaleDateString()}
                                </p>
                                <p>
                                  Method:{" "}
                                  {
                                    progressData?.projectDetails?.paymentDetails
                                      ?.paymentMethod
                                  }
                                </p>
                              </div>
                            }
                            type="success"
                            showIcon
                          />
                        ) : (
                          <div className="payment-button-container">
                            <PayPalPaymentButton
                              amount={parseFloat(milestone.amount)}
                              freelancerPayments={freelancerPayments}
                              project={project}
                              milestoneId={milestone._id}
                              onSuccess={() => handlePaymentSuccess(milestone)}
                              onError={handlePaymentError}
                              freelancerId={
                                currentProject.freelancer_profile_id ||
                                currentProject.freelancer?._id
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </div>
      );
    }

    const {
      progressData: progress,
      timeMetrics,
      projectDetails,
    } = progressData;

    // In the renderMilestonesContent function, update the fixed project condition:

    if (progressData.progressData?.type === "fixed") {
      const projectBudget = progressData.projectDetails?.budget || 0;
      const isCompleted = progressData.progressData.overallProgress === 100;
      const isPendingApproval =
        progressData.projectDetails.status === "Pending Approval";

      return (
        <div className="fixed-project-payment">
          <Card className="overall-progress-card">
            <Title level={4}>Overall Project Progress</Title>
            <div className="progress-container">
              <Progress
                percent={progressData.progressData.overallProgress || 0}
                status="active"
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                strokeWidth={15}
              />
            </div>
          </Card>

          {/* Project Details */}
          <Card style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Project Budget"
                  value={projectBudget}
                  prefix="$"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Status"
                  value={progressData.projectDetails.status}
                />
              </Col>
            </Row>
          </Card>

          {/* Payment Section */}
          {isCompleted && isPendingApproval && paymentStatus === "unpaid" && (
            <Card title="Project Payment" style={{ marginTop: 16 }}>
              {progressData.projectDetails.paymentStatus === "paid" ? (
                <Alert
                  message="Payment Complete"
                  description={
                    <div>
                      <p>Amount Paid: ${projectBudget}</p>
                      <p>
                        Date:{" "}
                        {new Date(
                          progressData.projectDetails.paymentDetails?.paymentDate
                        ).toLocaleDateString()}
                      </p>
                      <p>
                        Method:{" "}
                        {
                          progressData.projectDetails.paymentDetails
                            ?.paymentMethod
                        }
                      </p>
                      <p>
                        Transaction ID:{" "}
                        {
                          progressData.projectDetails.paymentDetails
                            ?.transactionId
                        }
                      </p>
                    </div>
                  }
                  type="success"
                  showIcon
                />
              ) : (
                <>
                  <Alert
                    message="Project Ready for Payment"
                    description="The project has been completed and is pending payment approval."
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

                  <Row justify="center">
                    <Col span={16}>
                      <div className="payment-amount">
                        <Statistic
                          title="Total Amount Due"
                          value={projectBudget}
                          prefix="$"
                          style={{ marginBottom: 16 }}
                        />
                      </div>

                      <div className="payment-options">
                        <PayPalPaymentButton
                          amount={projectBudget}
                          freelancerId={project.freelancer?._id}
                          milestoneId={null}
                          onSuccess={handlePaymentSuccess}
                          freelancerPayments={freelancerPayments}
                          project={project}
                          onError={handlePaymentError}
                        />
                      </div>
                    </Col>
                  </Row>
                </>
              )}
            </Card>
          )}

          {/* Project Statistics */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Days Remaining"
                  value={progressData.timeMetrics.daysRemaining}
                  suffix="days"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Days Elapsed"
                  value={progressData.timeMetrics.daysElapsed}
                  suffix={`/ ${progressData.timeMetrics.totalDays}`}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Last Updated"
                  value={new Date(
                    progressData.timeMetrics.lastUpdated
                  ).toLocaleDateString()}
                />
              </Card>
            </Col>
          </Row>

          {/* Mark as Complete Button - Show only when progress is 100% */}
          {progressData.progressData.overallProgress === 100 && (
  <div style={{ marginTop: 16 }}>
    <Button
      type="primary"
      className="mark-complete-btn"
      onClick={handleMarkAsComplete}
      style={{ marginRight: 8 }} // Add spacing between buttons
    >
      Mark as Completed
    </Button>
    <Button
      type="primary"
      className="mark-complete-btn"
      onClick={handleHireConsultant}
    >
      Hire Consultant
    </Button>
  </div>
)}
          {/* <Button
            type="primary"
            className="hire-consulatnt-btn"
            onClick={handleHireConsultant}
            style={{ marginTop: 16 }}
          >
            Hire Consultant
          </Button> */}
        </div>
      );
    }

    // console.log("for fixed progress data", progressData);

    return (
      <div className="milestone-progress">
        {/* Overall Progress Card with Progress Bar */}
        <Card className="overall-progress-card">
          <Title level={4}>Overall Project Progress</Title>
          <div className="progress-container">
            <Progress
              percent={progress.overallProgress}
              status="active"
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
              strokeWidth={15}
            />
          </div>
        </Card>

        {/* Project Statistics */}
        <Row gutter={[16, 16]} className="stats-cards">
          <Col span={6}>
            <Card>
              <Statistic
                title="Overall Progress"
                value={progress.overallProgress}
                suffix="%"
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed Milestones"
                value={progress.completedMilestones}
                suffix={`/ ${progress.totalMilestones}`}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Days Remaining"
                value={timeMetrics.daysRemaining}
                suffix="days"
                valueStyle={{
                  color: timeMetrics.isOverdue ? "#ff4d4f" : "#722ed1",
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Days Elapsed"
                value={timeMetrics.daysElapsed}
                suffix={`/ ${timeMetrics.totalDays}`}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
        </Row>
        {/* Project Description */}
        <Card style={{ marginTop: 16, marginBottom: 16 }}>
          <Title level={5}>Project Details</Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Project Name: </Text>
              <Text>{projectDetails.projectName}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Last Updated: </Text>
              <Text>{new Date(progress.lastUpdated).toLocaleString()}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: 16 }}>
            <Col span={24}>
              <Text strong>Description: </Text>
              <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                {projectDetails.description}
              </Paragraph>
            </Col>
          </Row>
        </Card>
        {/* Milestones Timeline */}
        <Card title="Milestones Timeline" style={{ marginTop: 16 }}>
          <Timeline mode="left">
            {progress.milestones.map((milestone, index) => (
              <Timeline.Item
                key={index}
                color={
                  milestone.status === "Completed"
                    ? "green"
                    : milestone.status === "In Progress"
                      ? "blue"
                      : "gray"
                }
                label={new Date(milestone.due_date).toLocaleDateString()}
              >
                <div className="milestone-details">
                  <h4>{milestone.name}</h4>
                  <p>
                    Due Date:{" "}
                    {new Date(milestone.due_date).toLocaleDateString()}
                  </p>
                  <p>Status: {milestone.status}</p>
                  {/* <p>Payment Status {}</p> */}
                  {milestone.status === "Completed" && !milestone.paid && (
                    <div>
                      <PayPalPaymentButton
                        amount={milestone.amount}
                        onSuccess={() => handlePaymentSuccess(milestone)}
                        onError={handlePaymentError}
                        freelancerPayments={freelancerPayments} // Add this prop
                        project={project} // Pass as project not projects
                      />
                    </div>
                  )}
                </div>
                <Card className="milestone-card" bordered={false}>
                  <Row justify="space-between" align="middle">
                    <Col span={16}>
                      <Title level={5}>{milestone.name}</Title>
                      <Text type="secondary">
                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                      </Text>
                    </Col>
                    <Col span={8} style={{ textAlign: "right" }}>
                      <Tag
                        color={
                          milestone.status === "Completed"
                            ? "success"
                            : milestone.status === "In Progress"
                              ? "processing"
                              : "default"
                        }
                      >
                        {milestone.status}
                      </Tag>
                      <div style={{ marginTop: 8 }}>
                        <Text strong>${milestone.amount}</Text>
                      </div>
                    </Col>
                  </Row>
                  <Progress
                    percent={milestone.progress}
                    status={
                      milestone.status === "Completed"
                        ? "success"
                        : milestone.status === "In Progress"
                          ? "active"
                          : "normal"
                    }
                    style={{ marginTop: 16 }}
                  />
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
        {progress.overallProgress === 100 && (
          <Button
            type="primary"
            className="mark-complete-btn"
            onClick={handleMarkAsComplete}
            style={{ marginTop: 16 }}
          >
            Mark as Completed
          </Button>
        )}
      </div>
    ); // If no progress data at all
    // return <Empty description="No progress data available" />;
  };

  // In ProjectDetails component
  useEffect(() => {
    if (currentProject?.paymentStatus === "paid") {
      setPaymentStatus("paid");
      setPaymentDetails(currentProject.paymentDetails);
    }
  }, [currentProject]);

  useEffect(() => {
    const refreshPaymentStatus = async () => {
      if (activeTab === "milestones" && currentProject?.projectId) {
        await fetchProgress();
      }
    };

    refreshPaymentStatus();
  }, [activeTab, currentProject?.projectId]);

  const refreshPaymentStatus = async () => {
    console.log("Referesh payment status is being rendering");
    setIsPaymentLoading(true);
    try {
      await fetchProgress();
      message.success({
        content: "Payment status refreshed successfully",
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      });
    } catch (error) {
      message.error({
        content: "Failed to refresh payment status",
        icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
      });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const [remarks, setRemarks] = useState([]);

  const handleRemarksTabClick = async () => {
    setActiveTab("Remarks"); // Set the active tab

    try {
      // Get the token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found in localStorage");
        return;
      }

      // Get the userInfo object from localStorage
      const userInfo = localStorage.getItem("userInfo");

      if (!userInfo) {
        console.error("No userInfo found in localStorage");
        return;
      }

      // Parse userInfo to extract clientId
      const parsedUserInfo = JSON.parse(userInfo);
      const clientId = parsedUserInfo?.user?.clientId;

      if (!clientId) {
        console.error("Client ID not found in userInfo");
        return;
      }
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      console.log("Client ID for fetching the remarks:", clientId);

      // Send the job_title (project name) and clientId as query parameters in the URL
      const response = await fetch(
        `${BASE_URL}/api/client/getRemarksByProjectAndClient/${project.job_title}/${clientId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Include token in Authorization header
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("data fetched of remarks", data);

        setRemarks(data);
        console.log("setreamrks", setRemarks); // Update the remarks state with the fetched data
      } else {
        console.error("Failed to fetch remarks");
      }
    } catch (error) {
      console.error("Error fetching remarks:", error);
    }
  };

  const handleMessageClick = () => {
    navigate("/chat");
  };

  return (
    <div className="project-details">
      {/* Show payment button only if not paid */}
      {currentProject.progress === 100 &&
        currentProject.paymentStatus !== "paid" && (
          <PayPalPaymentButton
            amount={currentProject.budget}
            project={currentProject}
            onSuccess={handlePaymentSuccess}
            onError={(error) => message.error(error)}
          />
        )}

      <div className="tabs">
        <button
          className={`tab bg-sky-400 ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "milestones" ? "active" : ""}`}
          onClick={() => setActiveTab("milestones")}
        >
          Milestones
        </button>
        <button
          className={`tab ${activeTab === "proposal" ? "active" : ""}`}
          onClick={() => setActiveTab("proposal")}
        >
          Proposal
        </button>
        <button
          className={`tab ${activeTab === "Remarks" ? "active" : ""}`}
          onClick={handleRemarksTabClick}
        >
          Remarks
        </button>

        {/* {activeTab === "Remarks" && (
          <div className="remarks-section">
            <h2>Remarks for {project.job_title}</h2>
            {remarks.length > 0 ? (
              <ul>
                {remarks.map((remark, index) => (
                  <li key={index}>
                    <p>
                      <strong>Remark {index + 1}:</strong> {remark.remark}
                    </p>
                    <p>
                      <em>Created At:</em>{" "}
                      {new Date(remark.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No remarks available for this job title.</p>
            )}
          </div>
        )} */}
      </div>
{/* 
      {paymentStatus === "paid" && paymentDetails && (
        <div className="payment-status-container">
          <div className="payment-status-header">
            <Alert
              message="Payment Successfully Completed"
              description={
                <div className="payment-details">
                  <p>
                    <strong>Transaction ID:</strong>{" "}
                    {paymentDetails.transactionId}
                  </p>
                  <p>
                    <strong>Amount Paid:</strong> $
                    {typeof paymentDetails.amount === "number"
                      ? paymentDetails.amount.toFixed(2)
                      : parseFloat(paymentDetails.amount || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Payment Date:</strong>{" "}
                    {new Date(paymentDetails.paymentDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Payment Method:</strong>{" "}
                    {paymentDetails.paymentMethod.charAt(0).toUpperCase() +
                      paymentDetails.paymentMethod.slice(1)}
                  </p>
                </div>
              }
              type="success"
              showIcon
              className="payment-alert"
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={refreshPaymentStatus}
              loading={isPaymentLoading}
              className="refresh-button"
            >
              Refresh Status
            </Button>
          </div>
        </div>
      )} */}

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview">
            <div className="job-Card">
              <div className="header-job">
                <div>
                  <h3 className="job-Title">{project.job_title}</h3>
                  <p className="job-Location">{project.location || "Remote"}</p>
                  <p className="job-posted-Time">
                    <span className="posted-text">Started:</span>
                    <span className="time-text">
                      {new Date(project.startDate).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              <hr className="divider" />

              <div className="job-infor">
                <span className="job-info-item">
                  <span className="labeltext">
                    {project.budget_type === "fixed"
                      ? "Fixed Price:"
                      : "Hourly Rate:"}
                  </span>
                  <span className="value">
                    {project.budget_type === "fixed"
                      ? `$${project.budget.amount}`
                      : formatHourlyRate(project)}
                  </span>
                </span>

                {!project.type && ( // Changed condition here
                  <>
                    <span className="job-info-item">
                      <span className="labeltext">Project Duration:</span>
                      <span className="value">
                        {formatProjectDuration(project)}
                      </span>
                    </span>
                    <span className="job-info-item">
                      <span className="labeltext">Experience Level:</span>
                      <span className="value">
                        {formatExperienceLevel(project)}
                      </span>
                    </span>
                  </>
                )}
              </div>

              <h4 className="section-title">Project Overview:</h4>
              <p className="job-description">
                {project.description || "No description provided."}
              </p>

              {project.attachment && (
                  <>
                    <h4 className="section-title">Attachment:</h4>
                    <div className="attachments">
                      <div className="attachment-item">
                        <div className="attachment-file">
                          <span className="file-icon">📄</span>
                          <span className="file-name">
                            {project.attachment.fileName}
                          </span>
                        </div>
                        <button
                          className="view-btn"
                          onClick={() =>
                            handleViewFile(
                              project.attachment.path,
                              project.attachment.fileType || getFileTypeFromExtension(project.attachment.fileName)
                            )
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="eye-icon"
                            width="20"
                            height="20"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3 9c7 0 10-9 10-9s-3-9-10-9-10 9-10 9 3 9 10 9z"
                            />
                          </svg>
                          View
                        </button>
                      </div>
                    </div>
                    {/* <div className="file-preview">
                      {renderFilePreview()}
                    </div> */}
                  </>
                )}

              <h4 className="section-title">Skills and Expertise:</h4>
              <div className="skills">
                {project?.preferred_skills ? (
                  project.preferred_skills.map((skill) => (
                    <span key={skill} className="skill">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="no-skills">No skills specified</p>
                )}
              </div>
            </div>
            {paymentStatus === "paid" && paymentDetails && (
            <div className="payment-status-container">
              <div className="payment-status-header">
                <Alert
                  message="Payment Successfully Completed"
                  description={
                    <div className="payment-details">
                      <p>
                        <strong>Transaction ID:</strong>{" "}
                        {paymentDetails.transactionId}
                      </p>
                      <p>
                        <strong>Amount Paid:</strong> $
                        {typeof paymentDetails.amount === "number"
                          ? paymentDetails.amount.toFixed(2)
                          : parseFloat(paymentDetails.amount || 0).toFixed(2)}
                      </p>
                      <p>
                        <strong>Payment Date:</strong>{" "}
                        {new Date(
                          paymentDetails.paymentDate
                        ).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Payment Method:</strong>{" "}
                        {paymentDetails.paymentMethod.charAt(0).toUpperCase() +
                          paymentDetails.paymentMethod.slice(1)}
                      </p>
                    </div>
                  }
                  type="success"
                  showIcon
                  className="payment-alert"
                />
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={refreshPaymentStatus}
                  loading={isPaymentLoading}
                  className="refresh-button"
                >
                  Refresh Status
                </Button>
              </div>
            </div>
          )}
          </div>
        )}

        {activeTab === "milestones" && renderMilestonesContent()}

        {activeTab === "proposal" && (
          <div className="proposal">
            {project.type === "offer" ? (
              // For offers
              <div className="offer-details">
                <Card className="offer-info-card">
                  <div className="offer-header">
                    <Tag color="blue" icon={<CheckCircleOutlined />}>
                      Direct Offer
                    </Tag>
                    <span className="offer-status">Accepted</span>
                  </div>

                  <Divider />

                  <div className="offer-content">
                    <Row gutter={[16, 24]}>
                      <Col span={24}>
                        <Title level={5}>Project Overview</Title>
                        <Paragraph>{project.description}</Paragraph>
                      </Col>

                      <Col span={12}>
                        <Statistic
                          title="Budget Type"
                          value={
                            project.budget.type === "fixed"
                              ? "Fixed Price"
                              : "Hourly Rate"
                          }
                        />
                      </Col>

                      <Col span={12}>
                        <Statistic
                          title="Amount"
                          value={
                            project.budget.type === "fixed"
                              ? `${project.budget.amount}`
                              : `${project.budget.hourly_rate?.from} - ${project.budget.hourly_rate?.to}/hr`
                          }
                          prefix="$"
                        />
                      </Col>

                      <Col span={24}>
                        <Title level={5}>Timeline</Title>
                        <Row gutter={[16, 16]}>
                          <Col span={12}>
                            <Text type="secondary">Start Date</Text>
                            <br />
                            <Text strong>
                              {new Date(project.startDate).toLocaleDateString()}
                            </Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Due Date</Text>
                            <br />
                            <Text strong>
                              {new Date(project.deadline).toLocaleDateString()}
                            </Text>
                          </Col>
                        </Row>
                      </Col>

                      {project.preferred_skills &&
                        project.preferred_skills.length > 0 && (
                          <Col span={24}>
                            <Title level={5}>Required Skills</Title>
                            <div className="skills-container">
                              {project.preferred_skills.map((skill, index) => (
                                <Tag key={index} color="blue">
                                  {skill}
                                </Tag>
                              ))}
                            </div>
                          </Col>
                        )}

                      {project.attachment && (
                        <Col span={24}>
                          <Title level={5}>Attachments</Title>
                          <Card size="small" className="attachment-card">
                            <Space>
                              <PaperClipOutlined />
                              <Text>{project.attachment.fileName}</Text>
                              <Button
                                type="link"
                                icon={<DownloadOutlined />}
                                onClick={() =>
                                  window.open(project.attachment.path)
                                }
                              >
                                Download
                              </Button>
                            </Space>
                          </Card>
                        </Col>
                      )}
                    </Row>
                  </div>

                  <Divider />

                  <div className="proposal-actions">
                    <button
                      className="message-btn"
                      onClick={handleMessageClick}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Message Freelancer
                    </button>
                  </div>
                </Card>
              </div>
            ) : (
              // For regular proposals
              <>
                <div className="proposal-header">
                  <span className="proposal-status accepted">
                    Proposal Accepted
                  </span>
                </div>

                <div className="proposal-section">
                  <h3>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M7 8h10M7 12h10M7 16h10" />
                    </svg>
                    Cover Letter
                  </h3>
                  <div className="cover-letter">
                    <p>{project.proposalDetails.coverLetter}</p>
                  </div>
                </div>

                <div className="proposal-details">
                  <div className="detail-card">
                    <div className="detail-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="label">Estimated Duration </span>
                    <span className="value">
                      {project.proposalDetails.estimatedDuration}
                    </span>
                  </div>

                  {project.proposalDetails.attachments && (
                    <div className="proposal-attachments">
                      <h4>Attachments</h4>
                      <div className="attachments-list">
                        {project.proposalDetails.attachments.map(
                          (attachment, index) => (
                            <div key={index} className="attachment-item">
                              <div className="file-icon">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="file-info">
                                <div className="file-name">
                                  {attachment.name}
                                </div>
                                <div className="file-size">
                                  {attachment.size}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="proposal-actions">
                  <button className="message-btn" onClick={handleMessageClick}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message Freelancer
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "Remarks" && (
          <div className="remarks-section">
            <h2>Remarks for {project.job_title}</h2>
            {remarks.length > 0 ? (
              <ul>
                {remarks.map((remark, index) => (
                  <li key={index}>
                    <p>
                      <strong>Remark {index + 1}:</strong> {remark.remark}
                    </p>
                    <p>
                      <em>Created At:</em>{" "}
                      {new Date(remark.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No remarks available for this job title.</p>
            )}
          </div>
        )}

        {/* {activeTab === "Remarks" && (
          <div className="remarks-section">
            <h2>Remarks for {project.job_title}</h2>
            {remarks.length > 0 ? (
              <ul>
                {remarks.map((remark, index) => (
                  <li key={index}>
                    <p>
                      <strong>Remark {index + 1}:</strong> {remark.remark}
                    </p>
                    <p>
                      <em>Created At:</em>{" "}
                      {new Date(remark.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No remarks available for this job title.</p>
            )}
          </div>
        )} */}
      </div>

      {/* Add ReviewModal here */}
      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={(reviewData) =>
          handleReviewSubmit(ProjectId || actualProjectId, reviewData)
        }
        freelancerName={project.freelancer?.name || "Freelancer"}
        isSubmitting={isSubmitting}
        project={project}
      />
    </div>
  );
};

const PayPalPaymentButton = ({
  amount: initialAmount, // Rename to initialAmount
  // amount,
  freelancerPayments, // Add this prop
  project,
  milestoneId,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState(initialAmount);
  const [showPayPalButtons, setShowPayPalButtons] = useState(false);

  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value >= 0) {
      setCustomAmount(value);
    }
  };

  const handleProceed = () => {
    if (customAmount > 0) {
      setShowPayPalButtons(true);
    } else {
      onError("Please enter a valid amount");
    }
  };

  // Add validation with meaningful error messages
  if (!project) {
    console.warn("Project prop is required for PayPalPaymentButton");
    return null;
  }

  if (!customAmount || isNaN(customAmount)) {
    console.warn("Valid amount is required for PayPalPaymentButton");
    return null;
  }

  // // Add debugging logs
  // useEffect(() => {
  //   console.log("PayPalPaymentButton Props:", {
  //     amount,
  //     project,
  //     milestoneId,
  //     freelancerPayments,
  //   });
  // }, []);

  // Get freelancer payment details from the project
  const freelancerId =
    project?.freelancer?._id ||
    project?.proposalDetails?.Proposal_id?.freelancer ||
    project?.freelancer?.id;

  // console.log("pojects", project);

  // Safely check for freelancerPayments before using find
  const freelancerPaymentInfo = Array.isArray(freelancerPayments)
    ? freelancerPayments.find(
        (payment) => payment.freelancerId === freelancerId
      )
    : null;

  // console.log("Freelancer Payment Info:", freelancerPaymentInfo);

  const paypalEmail =
    freelancerPaymentInfo?.paymentDetails?.paypal_details?.email;

  // Add safety checks
  if (!freelancerPayments || !Array.isArray(freelancerPayments)) {
    console.error(
      "freelancerPayments is not properly initialized:",
      freelancerPayments
    );
    return <div>Error: Payment system not properly configured</div>;
  }

  if (!freelancerId) {
    console.error("Freelancer ID not found in project:", project);
    return <div>Error: Freelancer information not found</div>;
  }

  if (!paypalEmail) {
    console.error("PayPal email not found for freelancer:", freelancerId);
    return <div>Error: PayPal details not available</div>;
  }

  const createOrder = (data, actions) => {
    if (!paypalEmail) {
      onError("Freelancer PayPal email not found");
      return;
    }

    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: customAmount.toFixed(2), // Use customAmount instead of amount
          },
          payee: {
            email_address: paypalEmail, // Freelancer's PayPal email
          },
          description: `Payment for Project: ${project.projectName}`,
        },
      ],
    });
  };

  const handleApprove = async (data, actions) => {
    setLoading(true);
    try {
      // console.log("Payment approved, capturing order...");
      const order = await actions.order.capture();
      // console.log("Order captured:", order);
      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;

      if (!freelancerId) {
        throw new Error("Freelancer ID not found");
      }

      // Log the project object to verify the ID
      // console.log("Project data being sent:", project);

      // Get proposal_id from project
      const proposal_id = project.proposalDetails?.Proposal_id?._id;

      // if (!proposal_id) {
      //   throw new Error("Proposal ID not found in project data");
      // }

      // Create payment data
      const paymentData = {
        freelancerId,
        milestoneId,
        amount: customAmount,
        paymentMethod: "paypal",
        orderId: order.id,
        projectId: project._id || project.projectId, // Try both _id and projectId
        projectType: project.budget_type || "fixed",
        // proposal_id: project.proposalDetails.Proposal_id._id, // Add these
        isOffer: project.type === "offer", // Add this flag
        projectName: project.projectName, // Add project name for offers

        ...(project.type !== "offer" && {
          proposal_id: project.proposalDetails?.Proposal_id?._id,
        }),
        client_id: userId,
        paypalEmail: freelancerPayments?.find(
          (p) => p.freelancerId === freelancerId
        )?.paymentDetails?.paypal_details?.email,
        // Add these fields for debugging
        paymentDetails: {
          payer: order.payer,
          status: order.status,
          orderId: order.id,
          paymentIntentId: order.id,
          create_time: order.create_time,
          update_time: order.update_time,
          name: project.projectName,
          type: project.budget_type,
          transactionId: order.id,
          paymentDate: new Date().toISOString(),
          amount: customAmount,
          paymentMethod: "paypal",

          // status: project.status
        },
      };

      console.log("Payment Data being sent:", paymentData);

      // console.log("Sending payment data to backend:", paymentData);

      if (!paymentData.projectId) {
        throw new Error("Project ID is missing");
      }

      // Process payment on the backend
      const paymentResponse = await axios.post(
        `${BASE_URL}/api/client/process-payment`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // console.log("Backend payment processing:", paymentResponse.data);

      if (paymentResponse.data.success) {
        onSuccess({
          ...paymentResponse.data.project,
          paymentStatus: "paid",
          paymentDetails: {
            ...paymentResponse.data.project.paymentDetails,
            amount: customAmount,
          },
        });
      }
      // }
    } catch (error) {
      console.error("Error processing PayPal payment:", error);
      onError(error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  // Validate required data before rendering PayPal buttons
  if (!customAmount || customAmount <= 0) {
    console.error("Invalid amount for PayPal payment:", amount);
    return null;
  }

  if (!paypalEmail) {
    return <div>Error: Freelancer PayPal details not found</div>;
  }

  return (
    <div className="paypal-button-container">
      {loading && <div className="payment-loading">Processing payment...</div>}

      {/* <PayPalButtons
        style={{
          layout: "horizontal",
          color: "gold",
          shape: "rect",
          label: "pay",
        }}
        createOrder={createOrder}
        onApprove={handleApprove}
        onError={(err) => {
          console.error("PayPal error:", err);
          onError(err.message || "Payment failed");
        }}
        disabled={loading}
      />
    </div>
  ); */}

      {!showPayPalButtons ? (
        <div className="custom-amount-section">
          <div className="amount-input-wrapper">
            <label htmlFor="payment-amount">Enter Payment Amount ($)</label>
            <input
              type="number"
              id="payment-amount"
              value={customAmount}
              onChange={handleAmountChange}
              min="0"
              step="0.01"
              className="payment-amount-input"
            />
          </div>
          <button
            onClick={handleProceed}
            className="proceed-button"
            disabled={!customAmount || customAmount <= 0}
          >
            Proceed to Payment
          </button>
        </div>
      ) : (
        <div>
          <div className="amount-display">
            Amount to pay: ${customAmount.toFixed(2)}
          </div>
          <button
            onClick={() => setShowPayPalButtons(false)}
            className="edit-amount-button"
          >
            Edit Amount
          </button>
          <PayPalButtons
            style={{
              layout: "horizontal",
              color: "gold",
              shape: "rect",
              label: "pay",
            }}
            createOrder={createOrder}
            onApprove={(data, actions) => handleApprove(data, actions)}
            onError={(err) => {
              console.error("PayPal error:", err);
              onError(err.message || "Payment failed");
            }}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
};

export default ManageProjectsByClient;