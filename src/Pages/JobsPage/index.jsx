import React, { useState, useEffect } from "react";
import axios from "axios";
import { JobsCard, Header, Spinner } from "../../components/index";
import "./styles.scss";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode"; // Corrected jwtDecode import

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userMap, setUserMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [goToPage, setGoToPage] = useState("");
  const [filters, setFilters] = useState({
    type: "", // Fixed or Hourly
    experienceLevel: "",
    preferredSkill: "",
    clientCountry: "",
  });
  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };
  useEffect(() => {
    const filtered = jobs.filter((job) => {
      const matchesType = !filters.type || (filters.type === "Fixed" ? job.budget_type === "fixed" : job.budget_type === "hourly");
      const matchesExperience = !filters.experienceLevel || job.project_duration?.experience_level === filters.experienceLevel;
      const matchesSkill = !filters.preferredSkill || job.preferred_skills?.some((skill) => skill.toLowerCase().includes(filters.preferredSkill.toLowerCase()));
      const matchesCountry = !filters.clientCountry || job.country?.toLowerCase().includes(filters.clientCountry.toLowerCase());
      const matchesSearch = job.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
  
      return matchesType && matchesExperience && matchesSkill && matchesCountry && matchesSearch;
    });
  
    setFilteredJobs(filtered);
  }, [filters, searchTerm, jobs]);
      

  const formatTimeDifference = (createdAt) => {
    if (!createdAt || isNaN(new Date(createdAt).getTime())) {
      return "Invalid time"; // Fallback for missing or invalid date
    }

    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffInMs = now - createdDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} days ago`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/signin");
          return;
        }

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;

        const headers = {
          Authorization: `Bearer ${token}`,
        };
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
        // Fetch jobs, user data, and payment methods concurrently
        const [jobsResponse, userResponse, paymentMethodsResponse] =
          await Promise.all([
            axios.get(`${BASE_URL}/api/client/job-posts`, {
              headers,
            }),
            axios.get(`${BASE_URL}/api/client/users`, { headers }),
            axios.get(`${BASE_URL}/api/client/payment-methods`, {
              headers,
            }),
          ]);

        const paymentMethodsArray = Array.isArray(
          paymentMethodsResponse.data.paymentMethods
        )
          ? paymentMethodsResponse.data.paymentMethods
          : []; // Fallback to empty array if not

        const userCountryMap = userResponse.data.reduce((acc, user) => {
          acc[user._id] = user.country_name;
          return acc;
        }, {});

        const paymentMethodMap = paymentMethodsArray.reduce((acc, method) => {
          if (method && method.client_id) {
            acc[method.client_id.toString()] = true; // Mark as verified
          }
          return acc;
        }, {});

        setPaymentMethods(paymentMethodMap);

        const jobsWithPaymentStatus = jobsResponse.data.jobPosts.map((job) => {
          const clientId = job.client_id?._id;
          return {
            ...job,
            paymentMethodStatus: paymentMethodMap[clientId]
              ? "Payment Verified"
              : "No Payment Method Available",
            country: clientId
              ? userCountryMap[clientId] || "Unknown"
              : "Unknown",
          };
        });

        setJobs(jobsWithPaymentStatus);
        setFilteredJobs(jobsWithPaymentStatus);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const formatRate = (job) => {
    if (job.budget_type === "fixed") {
      return `$${job.fixed_price}`;
    } else if (job.budget_type === "hourly" && job.hourly_rate) {
      const { from, to } = job.hourly_rate;
      return `$${from}-$${to}/hr`;
    } else {
      return "Rate not specified";
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = jobs.filter((job) => {
      const titleMatch = job.job_title?.toLowerCase().includes(term);
      const tagsMatch = job.preferred_skills?.some((tag) =>
        tag.toLowerCase().includes(term)
      );
      const timelineMatch = job.project_duration?.duration_of_work
        ?.toLowerCase()
        .includes(term);
      const countryMatch = job.country?.toLowerCase().includes(term);

      return titleMatch || tagsMatch || timelineMatch || countryMatch;
    });

    setFilteredJobs(filtered);
  };

  const indexOfLastJob = currentPage * rowsPerPage;
  const indexOfFirstJob = indexOfLastJob - rowsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / rowsPerPage);

  if (loading) return <Spinner size={100} alignCenter />;
  if (error) return <div>{error}</div>;

  return (
    <div className="jobs-page">
      <Header />
      <h1 className="jobs-heading">All Jobs</h1>
      
      <input
        type="text"
        placeholder="Search by title, tags, timeline, or country"
        value={searchTerm}
        onChange={handleSearch}
        className="search-bar"
      />
      
      <div className="filters">
        <select onChange={(e) => handleFilterChange("type", e.target.value)}>
          <option value="">All Types</option>
          <option value="Fixed">Fixed</option>
          <option value="Hourly">Hourly</option>
        </select>
        
        <select onChange={(e) => handleFilterChange("experienceLevel", e.target.value)}>
          <option value="">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Expert">Expert</option>
        </select>
        
        <input
          type="text"
          placeholder="Filter by skill"
          onChange={(e) => handleFilterChange("preferredSkill", e.target.value)}
        />
        
        <input
          type="text"
          placeholder="Filter by country"
          onChange={(e) => handleFilterChange("clientCountry", e.target.value)}
        />
      </div>
      
      <div className="jobs-container">
        {currentJobs.map((job) => (
          <JobsCard
            key={job._id}
            jobPostId={job._id}
            type={job.budget_type === "fixed" ? "Fixed" : "Hourly"}
            title={job.job_title}
            rate={formatRate(job)}
            timeline={job.project_duration?.duration_of_work || "Not specified"}
            level={job.project_duration?.experience_level || "Not specified"}
            description={job.description || "No description provided"}
            tags={job.preferred_skills || []}
            proposalCount={job.proposalCount}
            paymentMethodStatus={job.paymentMethodStatus}
            location={job.country}
            clientName={
              job.client_id
                ? `${job.client_id.first_name} ${job.client_id.last_name}`
                : "Unknown"
            }
            createdAt={job.createdAt ? formatTimeDifference(job.createdAt) : "Date not available"}
            clientLocation={job.client_id?.country_name || "Unknown"}
          />
        ))}
      </div>
      
      <div className="pagination">
        <span>Rows per page</span>
        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
        </select>
        
        <div className="page-controls">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={currentPage === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  
};

export default JobsPage;