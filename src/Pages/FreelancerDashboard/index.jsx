
import React, { useEffect, useState, useCallback } from "react";
import { Header, ZoomedImage, Modal } from "../../components";

import { BackgroundLining } from "../../svg";
import { FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./styles.scss";
import FreelancersJobsPage from "../Freelancers-Done-jobspage";
import { useJobContext } from "../../context/JoBContext";
// import JobCountUpdater from "../../components/JobCounterUpdator";
// import Footer from "../../components/footer/foote";
const FreelanceDashboardPage = () => {
  const [user, setUser] = useState({ first_name: "", email: "" });
  const [quickStats, setQuickStats] = useState({
    totalJobsApplied: 0,
    ongoingJobs: 0,
    completedJobs: 0,
    clientRatings: 0,
  });
  const [uniqueJobCount, setUniqueJobCount] = useState(0);
  const navigate = useNavigate();

  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [jobs, setJobs] = useState(null);
  const { jobCounts } = useJobContext();
  const fetchFreelancerReviews = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const decodedToken = jwtDecode(token);
      const freelancerId = decodedToken.userId;

      console.log("Token:", token);
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      console.log("freelancerid", freelancerId);
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/api/freelancer/${freelancerId}/reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("response review", response.data.data.average_rating);
      setReviews(response.data.data.average_rating);

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancerReviews();
  }, []);

  // const statsResponse = await axios.get(`http://localhost:5000/api/freelancer/proposals/count/${userId}`, {
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // setQuickStats(prevStats => ({
  //   ...prevStats,
  //   totalJobsApplied: statsResponse.data.totalProposals
  // }));
  // const responses = await axios.get(`http://localhost:5000/api/freelancer/hired-jobs/${userId}`, {
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // setQuickStats(prevStats => ({
  //   ...prevStats,
  //   ongoingJobs: responses.data.count
  // }));

  // const completedresponses = await axios.get(`http://localhost:5000/api/freelancer/completed-jobs/${userId}`, {
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // console.log("completed " , completedresponses.data.data.totalCompletedJobs)
  // setQuickStats(prevStats => ({
  //   ...prevStats,
  //   completedJobs: completedresponses.data.data.totalCompletedJobs
  // }));

  // const ongoingJobsResponse = await axios.get(`http://localhost:5000/api/freelancer/hired-jobs/${userId}`, {
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // console.log("dattaatattatatata",ongoingJobsResponse.data.count);
  // setQuickStats(prevStats => ({
  //   ...prevStats,
  //   ongoingJobs: ongoingJobsResponse.data.count
  // }));

  // // Fetch stats
  // const statsResponse = await axios.get(`http://localhost:5000/api/freelancer/proposals/count/${userId}`, {
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // setQuickStats(statsResponse.data);

  //     } catch (error) {
  //       // navigate('/signin');
  //     }
  //   };

  //   fetchUser();
  // }, [navigate]);

  useEffect(() => {
    if (jobCounts) {
      setQuickStats((prevStats) => ({
        ...prevStats,
        completedJobs: jobCounts.completedJobCount || 0,
        ongoingJobs: jobCounts.ongoingJobCount || 0,
        totalJobsApplied: uniqueJobCount,
      }));
    }
  }, [jobCounts, uniqueJobCount]);

  useEffect(() => {
    // Log quickStats after it updates
    console.log("Updated quickStats:", quickStats);
  }, [quickStats]);
  // Check if profile exists
  const checkProfileExists = async (userId, token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const response = await axios.get(
        `${BASE_URL}/api/freelancer/freelancer-profile-exists/${userId}`,
        config
      );

      setHasProfile(response.data.exists);
      return response.data.exists;
    } catch (error) {
      console.error("Error checking profile existence:", error);
      setHasProfile(false);
      return false;
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/signin");
          return;
        }

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;

        // Check profile existence first
        const profileExists = await checkProfileExists(userId, token);
        setHasProfile(profileExists);

        // If no profile, show modal immediately if they somehow reached this page
        if (!profileExists) {
          setShowProfileModal(true);
        }

        // Rest of your existing fetchUser code...
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      }
    };

    initializeDashboard();
  }, [navigate]);

  // Navigation guard function
  const handleNavigation = async (path) => {
    const token = localStorage.getItem("token");
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;

    const profileExists = await checkProfileExists(userId, token);

    if (!profileExists) {
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

        // Check profile existence
        await checkProfileExists(userId, token);
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL

        const response = await axios.get(
          `${BASE_URL}/api/client/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(response.data);

        // const statsResponse = await axios.get(
        //   `http://localhost:5000/api/freelancer/proposals/count/${userId}`,
        //   {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }
        // );
        // setQuickStats((prevStats) => ({
        //   ...prevStats,
        //   totalJobsApplied: statsResponse.data.totalProposals,
        // }));
        // const responses = await axios.get(
        //   `http://localhost:5000/api/freelancer/hired-jobs/${userId}`,
        //   {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }
        // );
        // setQuickStats((prevStats) => ({
        //   ...prevStats,
        //   ongoingJobs: responses.data.count,
        // }));

        // const completedresponses = await axios.get(
        //   `http://localhost:5000/api/freelancer/completed-jobs/${userId}`,
        //   {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }
        // );
        // console.log(
        //   "completed ",
        //   completedresponses.data.data.totalCompletedJobs
        // );
        // setQuickStats((prevStats) => ({
        //   ...prevStats,
        //   completedJobs: completedresponses.data.data.totalCompletedJobs,
        // }));

        // const ongoingJobsResponse = await axios.get(
        //   `http://localhost:5000/api/freelancer/hired-jobs/${userId}`,
        //   {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }
        // );
        // console.log("dattaatattatatata", ongoingJobsResponse.data.count);
        // setQuickStats((prevStats) => ({
        //   ...prevStats,
        //   ongoingJobs: ongoingJobsResponse.data.count,
        // }));

        // // Fetch stats
        // const statsResponse = await axios.get(`http://localhost:5000/api/freelancer/proposals/count/${userId}`, {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        // setQuickStats(statsResponse.data);
      } catch (error) {
        // navigate('/signin');
      }
    };

    fetchUser();
  }, [navigate]);

  const handleJobSearchButtonClick = () => {
    navigate("/matchingjobs");
  };

  const handleProfileButtonClick = () => {
    navigate("/profile/:userId");
  };

  const openQueryForm = () => {
    navigate("/QueryForm", { state: user });
  };

  const fetchOffersAndJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const decodedToken = jwtDecode(token);
      const loggedInUserId = decodedToken.userId;

      if (!loggedInUserId) {
        throw new Error("Unable to decode user ID from token");
      }
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      // Fetch both hired jobs and offers in parallel
      const [hireResponse, offersResponse] = await Promise.all([
        axios.get(`${BASE_URL}/api/client/hire`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        axios.get(`${BASE_URL}/api/freelancer/offers`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      // Process hired jobs
      console.log("offers", offersResponse.data);
      // console.log("hire response", hireResponse.data.data);

      // Map offers with detailed logging

      const hireStatusMap = (hireResponse.data.data || []).reduce(
        (map, hire) => {
          if (hire?.jobId?.id) {
            map[hire.jobId.id] = {
              status: hire.status,
              freelancerId: hire.freelancerId?.id,
              proposalId: hire.proposalId, // Add this line to include proposalId
            };
          }
          return map;
        },
        {}
      );

      const jobToFreelancerMap = (hireResponse.data.data || []).reduce(
        (map, hire) => {
          if (
            hire?.jobId?.id &&
            hire?.freelancerId?.id &&
            hire.freelancerId.id === loggedInUserId
          ) {
            map[hire.jobId.id] = hire.freelancerId.id;
          }
          return map;
        },
        {}
      );

      // Fetch job posts
      const jobsResponse = await axios.get(
        `${BASE_URL}/api/client/job-posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // console.log("job response", jobsResponse.data);

      // Process hired jobs
      const hiredJobs = (jobsResponse.data?.jobPosts || [])
        .filter((job) => jobToFreelancerMap[job._id])
        .map((job) => ({
          job_id: job._id,
          type: job.budget_type === "fixed" ? "Fixed" : "Hourly",
          title: job.job_title || "Untitled Job",
          client_id: job.client_id._id,
          // client_id: job.client.id,
          clientName: job.client.name,
          clientEmail: job.client.email,
          clientCountry: job.client.country,
          freelancer_id: hireStatusMap[job._id].freelancerId,
          proposal_id: hireStatusMap[job._id].proposalId, // Add this line
          rate:
            job.budget_type === "fixed"
              ? `$${job.fixed_price}`
              : `$${job.hourly_rate?.from}-$${job.hourly_rate?.to}/hr`,
          timeline: job.project_duration?.duration_of_work || "Not specified",
          level: job.project_duration?.experience_level || "Not specified",
          description: job.description || "No description provided",
          tags: job.preferred_skills || [],
          verified: job.paymentMethodStatus === "Payment method verified",
          location: job.country || "Not specified",
          postedTime: new Date(job.createdAt).toLocaleDateString(),
          status: hireStatusMap[job._id].status || "pending",
          jobStatus: job.jobstatus || "pending",

          source: "hired",
          attachment: job.attachment
            ? {
                fileName:
                  job.attachment.fileName || job.attachment.originalname,
                path: job.attachment.path,
              }
            : null,
        }));

      const acceptedOffers = (offersResponse.data?.offers || []).map(
        (offer) => ({
          // No need to filter by freelancer_id as backend already handles this
          job_id: offer.job_id,
          type: offer.type, // Backend already formats this
          title: offer.title, // Backend provides formatted title
          client_id: offer.client_id,
          freelancer_id: offer.freelancer_id,
          rate: offer.rate, // Backend already formats the rate string
          description: offer.description,
          detailed_description: offer.detailed_description,
          tags: offer.tags,
          location: offer.location,
          postedTime: offer.postedTime, // Backend already formats the date
          status: offer.status,
          // New fields available from backend
          clientName: offer.clientName,

          clientCountry: offer.clientCountry,
          attachment: offer.attachment,
          // Fields that need to be added to backend response
          due_date: offer.due_date, // Date comes formatted from backend
          timeline: offer.estimated_timeline
            ? `${offer.estimated_timeline.duration} ${offer.estimated_timeline.unit}`
            : "Not specified",

          verified: false, // Add to backend if needed
          jobStatus: offer.status, // Match the status
          source: "offer", // Add if needed for frontend differentiation
        })
      );

      // Combine and deduplicate jobs and offers
      const combinedJobs = [...hiredJobs, ...acceptedOffers];
      const uniqueJobs = Array.from(
        new Map(combinedJobs.map((item) => [item.job_id, item])).values()
      );
      console.log("offers fetched:", offersResponse.data);
      // const TotalJObCount=uniqueJobs.length;
      setUniqueJobCount(uniqueJobs.length);

      setJobs(uniqueJobs);
    } catch (error) {
      console.error("Error in fetchOffersAndJobs:", error);
      setError("Failed to fetch jobs and offers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersAndJobs();
  }, []);

  return (
    <div className="dashboard-page">
      <Header />
      <div className="background-section mt-8">
        <h1>Welcome, {user.first_name}!</h1>
        <p>
          Send proposals, Accept offers,Manage projects, and explore jobs
          matching your skills, all in one place.
        </p>
      </div>



      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          {/* <JobCountUpdater uniqueJobCount={handleUpdateJobCount} /> */}
          <h3>Total Jobs Applied</h3>
          <p>{uniqueJobCount}</p>
        </div>
        <div className="stat-item">
          <h3>Ongoing Jobs</h3>
          <p>{quickStats.ongoingJobs}</p>
        </div>
        <div className="stat-item">
          <h3>Completed Jobs</h3>
          <p>{quickStats.completedJobs}</p>
        </div>
        <div className="stat-item">
          <h3>Client Ratings</h3>
          <p>{reviews}</p>
        </div>
      </div>

      <div className="summary-section">
        <p>
          This dashboard provides an overview of your current performance, job
          statistics, and upcoming opportunities. Stay informed and make
          data-driven decisions to ensure the success of your projects.
        </p>
      </div>

      {/* Cards for functionality */}
      <div className="card-container">
        <div className="card" onClick={() => handleNavigation("/matchingjobs")}>
          <h2>Browse Jobs</h2>
          <p>Explore available opportunities that match your skills.</p>
          <button>Browse Jobs</button>
        </div>
        <div
          className="card"
          onClick={() => handleNavigation("/freelancerOffers")}
        >
          <h2>offers</h2>
          <p>View and manage the offers.</p>
          <button>View offers</button>
        </div>
        <div
          className="card"
          onClick={() => {
            const token = localStorage.getItem("token");
            const userId = jwtDecode(token).userId;
            navigate(hasProfile ? `/profile/${userId}` : "/myProfile");
          }}
        >
          <h2>Profile Settings</h2>
          <p>Update your profile and portfolio to attract clients.</p>
          <button>Update Profile</button>
        </div>

        <div
          className="card"
          onClick={() => handleNavigation("/freelancersjobpage")}
        >
          <h2>My Jobs</h2>
          <p>Review your past jobs and client feedback.</p>
          <button>View Your Jobs</button>
        </div>
      </div>

      {/* Contact Button */}
      <button className="contact-btn-fixed" onClick={openQueryForm}>
        <FaEnvelope className="contact-icon" />
        Contact Us
      </button>

      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      >
        <h2>Complete Your Profile</h2>
        <p>
          To access all features and start finding great opportunities, please
          complete your profile first. This will help clients better understand
          your skills and experience.
        </p>
        <button
          className="create-profile-btn"
          onClick={() => {
            setShowProfileModal(false);
            navigate("/myProfile");
          }}
        >
          Create Profile
        </button>
        <button
          className="modal-close"
          onClick={() => setShowProfileModal(false)}
        >
          Close
        </button>
      </Modal>
      {/* <Footer/> */}
    </div>
  );
};

export default FreelanceDashboardPage;
