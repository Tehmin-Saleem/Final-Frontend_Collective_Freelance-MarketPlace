import React, { useState, useEffect } from "react";
import {
  Header,
  FreelancersJobsCard,
  CommonButton,
  Spinner,
  StatusBadge,
} from "../../components/index";
import "./styles.scss";
import { Filter, IconSearchBar } from "../../svg";
import axios from "axios";
import { jwtDecode } from "jwt-decode";


import { useJobContext } from "../../context/JoBContext";
const FreelancersJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [specificjobs, setSpecificJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [completedJobCount, setCompletedJobCount] = useState(0);
const [ongoingJobCount, setOngoingJobCount] = useState(0);// all, ongoing, pending, completed

const { setJobCounts } = useJobContext();

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

  // Rest of your existing code remains the same...
  const getFilteredJobs = () => {
    return jobs.filter((job) => {
      // console.log("Filtering job:", {
      //   title: job.title,
      //   status: job.status,
      //   jobStatus: job.jobStatus,
      //   searchTerm: searchTerm,
      //   statusFilter: statusFilter,
      // });

      const matchesSearch = job.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (!matchesSearch) {
        console.log(`Job "${job.title}" filtered out by search`);
        return false;
      }

      switch (statusFilter) {
        case "all":
          return true;
        case "ongoing":
          return (
            (job.status === "hired" && job.jobStatus === "pending") ||
            job.jobStatus === "ongoing"||
            (job.source === 'offer' && job.status === 'accepted')
          );
        case "pending":
          return job.status === "pending" || job.status === "accepted"||
          (job.source === 'offer' && job.status === 'pending');
        case "completed":
          return job.status === "completed" || job.jobStatus === "completed"||
          (job.source === 'offer' && job.status === 'completed');
        default:
          return true;
      }
    });
  };

  const filteredJobs = getFilteredJobs();
  const totalPages = Math.ceil(filteredJobs.length / pageSize);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 2; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const handleGoToPage = (e) => {
    if (e.key === "Enter") {
      const page = parseInt(e.target.value);
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        e.target.value = "";
      }
    }
  };
  

  useEffect(() => {
    const calculateJobCounts = () => {
      const completedJobs = jobs.filter(
        (job) =>
          job.status === "completed" ||
          job.jobStatus === "completed" ||
          (job.source === "offer" && job.status === "completed")
      );
  
      const ongoingJobs = jobs.filter(
        (job) =>
          (job.status === "hired" && job.jobStatus === "pending") ||
          job.jobStatus === "ongoing" ||
          (job.source === "offer" && job.status === "accepted")
      );
      console.log("Completed Jobs Count:", completedJobs.length);
      console.log("Ongoing Jobs Count:", ongoingJobs.length);
      
      // Update context instead of local state
      setJobCounts({
        completedJobCount: completedJobs.length,
        ongoingJobCount: ongoingJobs.length
      });
    };
  
    calculateJobCounts();
  }, [jobs, setJobCounts]);

  

  return (
    <div className="jobs-page">
      <Header />
      <h1 className="jobs-heading">My All Jobs</h1>
      <div className="filters-container">
        <div className="searchbar-container">
          <div className="search-bar-wrapper">
            <IconSearchBar className="icon" width="20" height="20" />
            <input
              type="text"
              placeholder="Search jobs by title"
              className="search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
        </div>
        <div className="status-filters">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="status-select"
          >
            <option value="all">All Jobs</option>
            <option value="ongoing">Ongoing</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>{" "}
      {loading ? (
        <Spinner size={100} alignCenter />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="jobs-container">
          {paginatedJobs.length > 0 ? (
            paginatedJobs.map((job) => (
              <FreelancersJobsCard
                key={job.title}
                _id={job.source === 'offer' ? job._id : job.job_id} // Add this line
                job_id={job.job_id}
                client_id={job.client_id}
                title={job.title} // Make sure this is explicitly passed
                clientName={job.clientName}
                clientEmail={job.clientEmail}
                clientCountry={job.clientCountry}
                freelancer_id={job.freelancer_id}
                attachment={job.attachment} // Add this prop
                proposal_id={job.proposal_id} // Add this line
                source={job.source}
                {...job}
                statusBadge={
                  <StatusBadge 
                  status={job.source === 'offer' ? job.status : job.status} 
                  jobStatus={job.source === 'offer' ? job.status : job.jobStatus}
                  />
                }
              />
            ))
          ) : (
            <div className="no-jobs">
              {searchTerm
                ? "No matching jobs found"
                : "You haven't completed any jobs yet"}
            </div>
          )}
        </div>
      )}
      {filteredJobs.length > 0 && (
        <div className="pagination">
          <div className="rows-per-page">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
            </select>
          </div>
          <div className="page-controls">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="page-button"
            >
              ←
            </button>

            {getPageNumbers().map((pageNum, index) => (
              <span
                key={index}
                className={`page-number ${
                  pageNum === currentPage ? "active" : ""
                } ${pageNum === "..." ? "dots" : ""}`}
                onClick={() => pageNum !== "..." && handlePageChange(pageNum)}
              >
                {pageNum}
              </span>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="page-button"
            >
              →
            </button>
          </div>

          <div className="go-to-page">
            <span>Go to page</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              onKeyPress={handleGoToPage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancersJobsPage;