import React, { useState, useEffect } from "react";
import "./styles.scss";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const EditableProjectCard = ({ project, onSave, onComplete }) => {
  const [freelancerData, setFreelancerData] = useState({
    projectName: "",
    progress: 0,
    due_date: "",
    milestones: [],
    budget: 0,
    description: "",
    projectType: "milestone",
    status: "Ongoing",
    clientApproved: false,
    proposal_id: "",
    client_id: "",
    freelancer_id: "",
  });

  const [clientInfo, setClientInfo] = useState({
    clientName: "Not specified",
  });

  const [showDueDateNotification, setShowDueDateNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previousProgress, setPreviousProgress] = useState(null);
  const [isFetchingProgress, setIsFetchingProgress] = useState(true);
  const navigate = useNavigate();

  // Function to calculate next milestone deadline
  const calculateNextDeadline = (currentIndex, milestones) => {
    // Find the next incomplete milestone after the current index
    for (let i = currentIndex + 1; i < milestones.length; i++) {
      if (milestones[i].status !== "Completed") {
        return milestones[i].due_date;
      }
    }
    // If no next incomplete milestone found, return the last milestone's due date
    return (
      milestones[milestones.length - 1]?.due_date || freelancerData.due_date
    );
  };

  // Function to update milestone deadlines
  const updateMilestoneDeadlines = (milestones) => {
    let lastCompletedIndex = -1;

    // Find the last completed milestone
    for (let i = 0; i < milestones.length; i++) {
      if (milestones[i].status === "Completed") {
        lastCompletedIndex = i;
      }
    }

    // Update deadlines for remaining milestones
    return milestones.map((milestone, index) => {
      if (index <= lastCompletedIndex) {
        // Keep original deadline for completed milestones
        return milestone;
      }

      // Calculate new deadline based on the previous milestone
      const previousMilestone = milestones[index - 1];
      if (previousMilestone && previousMilestone.status === "Completed") {
        // Set new deadline to 2 weeks after the previous milestone's completion
        const newDeadline = new Date(previousMilestone.due_date);
        newDeadline.setDate(newDeadline.getDate() + 14); // Add 14 days
        return {
          ...milestone,
          due_date: newDeadline.toISOString(),
        };
      }

      return milestone;
    });
  };

  console.log("values in project", project);

  useEffect(() => {
    const fetchPreviousProgress = async () => {
      setIsFetchingProgress(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        // const decodedToken = jwtDecode(token);
        const userId = project.client_id;


        console.log("userid id", userId)


        const isOffer = !project.proposal_id;
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL

        let url;
        if (isOffer) {
          // For offers, use projectName
          url = `${BASE_URL}/api/client/project-progress/null?client_id=${userId}&projectName=${encodeURIComponent(project.projectName)}`;
        } else {
          // For normal jobs
          url =  `${BASE_URL}/api/client/project-progress/${project.proposal_id}?client_id=${project.client_id}`;
        }
    
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        

  

        // if (project.source === 'offer') {
        //   // Fetch progress for offers
        //   response = await axios.get(
        //     `http://localhost:5000/api/client/offer-progress`,
        //     {
        //       params: {
        //         client_id: userId,
        //         projectName: project.projectName || project.job_title,
        //       },
        //       headers: {
        //         Authorization: `Bearer ${token}`,
        //         "Content-Type": "application/json",
        //       },
        //     }
        //   );
        // } else {
        //   // Fetch progress for normal projects
        //   response = await axios.get(
        //     `http://localhost:5000/api/client/project-progress/${project.proposal_id}?client_id=${project.client_id}`,
        //     {
        //       headers: {
        //         Authorization: `Bearer ${token}`,
        //         "Content-Type": "application/json",
        //       },
        //     }
        //   );
        // }
    
        console.log("Previous progress data:", response.data);

      

        if (response.data.success) {
          const progressData = response.data.progressData;
          const projectDetails = response.data.projectDetails;
          setPreviousProgress(response.data);
          // Update freelancerData with previous progress
          // Update freelancerData with the fetched progress
          setFreelancerData((prev) => ({
            ...prev,
            projectName: projectDetails.projectName || prev.projectName,
            progress: progressData.overallProgress || prev.progress,
            description: projectDetails.description || prev.description,
            status: projectDetails.status || prev.status,
            clientApproved: projectDetails.clientApproved || false,
            due_date: projectDetails.due_date || prev.due_date,
            milestones: project.source === 'offer' 
            ? [] // For offers, initialize empty milestones
              :progressData.milestones?.map((milestone) => ({
                name: milestone.name,
                status: milestone.status,
                amount: parseFloat(milestone.amount) || 0,
                due_date: milestone.due_date,
                progress: milestone.progress || 0,
              })) || prev.milestones,
            // Preserve other necessary fields
            proposal_id: project.proposal_id,
            client_id: project.client_id,
            freelancer_id: project.freelancer_id,
            projectType: project.source === 'offer' ? 'fixed' : project.projectType,
          }));

          // If there's payment information, store it
          if (projectDetails.paymentStatus === "paid") {
            setFreelancerData((prev) => ({
              ...prev,
              paymentStatus: projectDetails.paymentStatus,
              paymentDetails: projectDetails.paymentDetails,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching previous progress:", error);
        // Don't set error state here as it might not be critical
      } finally {
        setIsFetchingProgress(false);
      }
    };

    if ((project.proposal_id && project.client_id) || project.source === 'offer') {
      fetchPreviousProgress();
    }
  }, [project.proposal_id, project.client_id, project.source]);

  useEffect(() => {
    setFreelancerData({
      projectName: project.projectName || "",
      progress: project.progress || 0,
      due_date: project.due_date || new Date().toISOString(),
      milestones:
        project.source === "offer"
          ? []
          : project.milestones?.map((milestone) => ({
              name: milestone.name || "",
              status: milestone.status || "Not Started",
              amount: parseFloat(milestone.amount) || 0,
              due_date: milestone.due_date || project.due_date,
            })) || [],
      budget:
        typeof project.budget === "string"
          ? parseFloat(project.budget.replace(/[^0-9.-]+/g, ""))
          : project.budget || 0,
      projectType:
        project.source === "offer"
          ? "fixed"
          : project.projectType || "milestone",
      status: project.status || "Ongoing",
      clientApproved: project.clientApproved || false,
      proposal_id: project.proposal_id || "",
      client_id: project.client_id || "",
      freelancer_id: project.freelancer_id || "",
    });
    console.log("project type", project.projectType);

    setClientInfo({
      clientName: project.clientInfo?.clientName || "Not specified",
    });

    const dueDate = new Date(project.due_date);
    const today = new Date();
    const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    setShowDueDateNotification(daysLeft <= 5);
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "progress") {
      processedValue = Math.min(Math.max(parseInt(value) || 0, 0), 100);
    } else if (name === "budget") {
      processedValue = parseFloat(value) || 0;
    }

    setFreelancerData((prev) => ({ ...prev, [name]: processedValue }));
  };

  // Update the handleMilestoneChange function
  const handleMilestoneChange = (index, status) => {
    const updatedMilestones = freelancerData.milestones.map((milestone, i) =>
      i === index ? { ...milestone, status } : milestone
    );

    // Update deadlines when a milestone is completed
    const finalMilestones =
      status === "Completed"
        ? updateMilestoneDeadlines(updatedMilestones)
        : updatedMilestones;

    const completedMilestones = finalMilestones.filter(
      (m) => m.status === "Completed"
    ).length;
    const totalMilestones = finalMilestones.length;
    const progress =
      totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0;

    // Find the next active milestone's deadline
    const nextDeadline = calculateNextDeadline(index, finalMilestones);

    setFreelancerData((prev) => ({
      ...prev,
      milestones: finalMilestones,
      progress,
      due_date: nextDeadline,
    }));
  };

  const shouldShowPendingApproval = () => {
    return freelancerData.progress === 100;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const projectData = {
        ...freelancerData,

        // Include previous payment information if it exists
        paymentStatus: freelancerData.paymentStatus,
        paymentDetails: freelancerData.paymentDetails,
        // Add timestamp for the update
        lastUpdated: new Date().toISOString(),
        status:
          freelancerData.progress === 100 ? "Pending Approval" : "Ongoing",
        source: project.source || "proposal",
        proposal_id: project.proposal_id || null,
      };

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authorization token not found");
      }

      if (!freelancerData.projectName) {
        throw new Error("Project name is required");
      }

      const formattedBudget =
        typeof freelancerData.budget === "string"
          ? parseFloat(freelancerData.budget.replace(/[^0-9.-]+/g, ""))
          : freelancerData.budget;
          const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const response = await axios({
        method: "POST",
        url: `${BASE_URL}/api/freelancer/manageproj`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: projectData,
      });

      console.log("saved progress", response.data.data);
      if (response.data.success) {
        const data = response.data.data;

        // Determine the action based on `shouldShowPendingApproval`
        if (shouldShowPendingApproval()) {
          await onComplete?.(data);
        } else {
          await onSave?.(data);
        }

        // Navigate to freelancersjobpage for both cases
        navigate("/freelancersjobpage");
      } else {
        throw new Error(response.data.message || "Failed to process project");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Error updating project:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this to your milestone rendering section
  const renderMilestoneDeadline = (milestone, index) => {
    const deadlineDate = new Date(milestone.due_date);
    const isOverdue =
      new Date() > deadlineDate && milestone.status !== "Completed";
    const isPending = milestone.status !== "Completed";

    return (
      <div className={`milestone-deadline ${isOverdue ? "overdue" : ""}`}>
        <span className="milestone-number">Milestone {index + 1}</span>
        <span className="deadline-label">Due:</span>
        <span className="deadline-date">
          {deadlineDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        {isOverdue && isPending && (
          <span className="overdue-badge">Overdue</span>
        )}
      </div>
    );
  };

  // Update the calculateMilestoneDueNotifications function
  const calculateMilestoneDueNotifications = (milestones, projectDueDate) => {
    const today = new Date();
    const notifications = [];

    // Sort milestones by due date
    const sortedMilestones = [...milestones].sort(
      (a, b) => new Date(a.due_date) - new Date(b.due_date)
    );

    // Find current active milestone
    const incompleteMilestones = sortedMilestones.filter(
      (m) => m.status !== "Completed"
    );

    if (incompleteMilestones.length > 0) {
      // Current active milestone
      const currentMilestone = incompleteMilestones[0];
      const currentDueDate = new Date(currentMilestone.due_date);
      const daysLeft = Math.ceil(
        (currentDueDate - today) / (1000 * 60 * 60 * 24)
      );

      // Notification for current milestone
      if (daysLeft <= 5 && daysLeft > 0) {
        notifications.push({
          type: "warning",
          message: `Current milestone "${currentMilestone.name}" is due in ${daysLeft} days.`,
        });
      } else if (daysLeft <= 0) {
        notifications.push({
          type: "danger",
          message: `Current milestone "${currentMilestone.name}" is overdue by ${Math.abs(daysLeft)} days!`,
        });
      }

      // Next milestone preview (if exists)
      if (incompleteMilestones.length > 1) {
        const nextMilestone = incompleteMilestones[1];
        const nextDueDate = new Date(nextMilestone.due_date);
        const nextDaysLeft = Math.ceil(
          (nextDueDate - today) / (1000 * 60 * 60 * 24)
        );

        notifications.push({
          type: "info",
          message: `Next milestone "${nextMilestone.name}" will be due in ${nextDaysLeft} days.`,
        });
      }
    }

    // Only show project deadline if it's different from the last milestone
    const lastMilestoneDueDate =
      sortedMilestones[sortedMilestones.length - 1]?.due_date;
    const projectDue = new Date(projectDueDate);

    if (
      lastMilestoneDueDate &&
      new Date(lastMilestoneDueDate).getTime() !== projectDue.getTime()
    ) {
      const projectDaysLeft = Math.ceil(
        (projectDue - today) / (1000 * 60 * 60 * 24)
      );

      if (projectDaysLeft <= 5 && projectDaysLeft > 0) {
        notifications.push({
          type: "warning",
          message: `Overall project deadline in ${projectDaysLeft} days!`,
        });
      } else if (projectDaysLeft <= 0) {
        notifications.push({
          type: "danger",
          message: `Project is overdue by ${Math.abs(projectDaysLeft)} days!`,
        });
      }
    }

    return notifications;
  };

  // Replace your existing due date notification section with this:
  const renderDueDateNotifications = () => {
    const notifications = calculateMilestoneDueNotifications(
      freelancerData.milestones,
      freelancerData.due_date
    );

    return notifications.length > 0 ? (
      <div className="due-date-notifications">
        {notifications.map((notification, index) => (
          <div key={index} className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>
    ) : null;
  };

  return (
    <div className="editable-project-card">
      <h1 className="heading text-sky-400">Manage Ongoing Projects</h1>
      {isLoading && <div className="loading-overlay">Loading...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="client-info">
        <label>Client Name:</label>
        <p>{clientInfo.clientName || "Not Specified"}</p>
      </div>

      <div className="project-info">
        <label>Project Name:</label>
        <input
          type="text"
          name="projectName"
          value={freelancerData.projectName}
          onChange={handleChange}
        />
        <label>Deadline:</label>
        <p style={{ color: showDueDateNotification ? "red" : "inherit" }}>
          {new Date(freelancerData.due_date).toLocaleString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
        {renderDueDateNotifications()}
      </div>

      <div className="project-progress">
        <label>Progress (%):</label>
        <input
          type="number"
          name="progress"
          value={freelancerData.progress}
          onChange={handleChange}
          max="100"
        />
        <div className="progress-bar">
          <div
            className="progress"
            style={{ width: `${freelancerData.progress}%` }}
          ></div>
        </div>
      </div>

      {freelancerData.projectType === "milestone" &&
        freelancerData.milestones.length > 0 && (
          <div className="milestones">
            <h5>Edit Milestones</h5>
            {freelancerData.milestones.map((milestone, index) => (
              <div key={index} className="milestone-item">
                <div className="milestone-header">
                  <h6>{milestone.name}</h6>
                  {renderMilestoneDeadline(milestone, index)}
                </div>
                <div className="milestone-content">
                  <div className="milestone-details">
                    <span className="amount">${milestone.amount}</span>
                    <select
                      value={milestone.status}
                      onChange={(e) =>
                        handleMilestoneChange(index, e.target.value)
                      }
                      className={milestone.status
                        .toLowerCase()
                        .replace(" ", "-")}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="milestone-progress">
                    <div
                      className="progress-bar"
                      style={{
                        width:
                          milestone.status === "Completed"
                            ? "100%"
                            : milestone.status === "In Progress"
                              ? "50%"
                              : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      <div className="project-description">
        <label>Comment or Description:</label>
        <textarea name="description" onChange={handleChange}></textarea>
      </div>

      <div className="project-budget">
        <label>Budget (USD):</label>
        <input
          type="text"
          name="budget"
          value={freelancerData.budget}
          onChange={handleChange}
        />
      </div>

      <div className="buttons-container">
        <button
          onClick={handleSubmit}
          className={`submit-btn ${shouldShowPendingApproval() ? "pending-btn" : "save-btn"}`}
          disabled={isLoading}
        >
          {isLoading
            ? "Saving..."
            : freelancerData.progress === 100
              ? "Mark as Pending Approval"
              : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default EditableProjectCard;
