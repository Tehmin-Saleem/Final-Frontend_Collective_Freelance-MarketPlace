import React, { useState, useEffect, useRef } from "react";
import { Header, Proposalscard, Spinner } from "../../components/index";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./styles.scss";

const IndexPage = () => {
  const [proposals, setProposals] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Track loading state
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [userMap, setUserMap] = useState({});
  const [isJobFilled, setIsJobFilled] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/signin");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;

        const [proposalsResponse, userResponse] = await Promise.all([
          axios.get(
            `${BASE_URL}/api/freelancer/getproposals?jobId=${jobId}`,
            { headers }
          ),
          axios.get(`${BASE_URL}/api/client/users`, { headers }),
        ]);

        console.log("Proposals Response:", proposalsResponse.data);
        console.log("Users Response:", userResponse.data);

        const userCountryMap = userResponse.data.reduce((acc, user) => {
          acc[user._id] = user.country_name;
          return acc;
        }, {});

        const freelancerIds = proposalsResponse.data.proposals.map(
          (proposal) => proposal.freelancer_id
        );
        console.log("freelancer id ", freelancerIds);

        const proposalsWithCountry = proposalsResponse.data.proposals.map(
          (proposal) => {
            const freelancerId = proposal.freelancerProfile?.userId;
            return {
              ...proposal,
              country: freelancerId
                ? userCountryMap[freelancerId] || "Unknown"
                : "Unknown",
              image: proposal.freelancerProfile?.image,
              ProposalID: proposal._id,
              status: proposal.status || "Available", // Add this line to include the status
            };
          }
        );

        console.log(
          "Proposals with country and Cloudinary URLs:",
          proposalsWithCountry
        );

        setProposals(proposalsWithCountry);
        setLoading(false); // Set loading to false after data is fetched
      } catch (err) {
        console.error(
          "Error fetching data:",
          err.response ? err.response.data : err.message
        );
        setError(`Error fetching data: ${err.message}`);
        setLoading(false); // Set loading to false in case of an error
      }
    };

    fetchData();
  }, [jobId, navigate]);

  const formatRate = (proposal) => {
    if (!proposal.add_requirements) return "Not specified";

    // Handle by_project rate
    if (proposal.add_requirements.by_project?.bid_amount) {
      return `By Project: $${proposal.add_requirements.by_project.bid_amount}`;
    }

    // Handle milestone rate - sum all milestone amounts
    if (proposal.add_requirements.by_milestones) {
      const total = proposal.add_requirements.by_milestones.reduce(
        (sum, milestone) => sum + (parseFloat(milestone.amount) || 0),
        0
      );
      return `By Milestone: $${total}`;
    }

    return "Not specified";
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value));
    setCurrentPage(1);
  };

  const handleProposalClick = (proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProposal(null);
  };

  const handleHireSuccess = (proposalId) => {
    setProposals((prevProposals) =>
      prevProposals.map((p) =>
        p.ProposalID === proposalId ? { ...p, status: "Hired" } : p
      )
    );
  };

  const indexOfLastProposal = currentPage * rowsPerPage;
  const indexOfFirstProposal = indexOfLastProposal - rowsPerPage;
  const currentProposals = proposals.slice(
    indexOfFirstProposal,
    indexOfLastProposal
  );
  const totalPages = Math.ceil(proposals.length / rowsPerPage);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCloseModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  return (
    <>
      <Header />
      <div className="proposals-page">
        <h1 className="proposals-heading">Proposals</h1>

        {loading ? (
          <div>
            <Spinner size={100} alignCenter />
          </div>
        ) : (
          <div className="profiles-container">
            {currentProposals.map((proposal) => (
              <div
                key={proposal.id}
                onClick={() => handleProposalClick(proposal)}
                className="profile-card"
              >
                <Proposalscard
                  freelancerId={proposal.freelancer_id} // Add this line
                  ProposalID={proposal.id}
                  onHireSuccess={handleHireSuccess}
                  name={proposal.freelancerProfile?.name || "No Name"}
                  title={proposal.freelancerProfile?.experience?.title || ""}
                  location={proposal.country || "Unknown"}
                  rate={
                    proposal.rate
                      ? `${proposal.rate}`
                      : proposal.add_requirements?.by_project?.bid_amount
                      ? `${proposal.add_requirements.by_project.bid_amount}$`
                      : proposal.add_requirements?.by_milestones
                      ? `${proposal.add_requirements.by_milestones.reduce(
                          (sum, milestone) =>
                            sum + (parseFloat(milestone.amount) || 0),
                          0
                        )}$`
                      : "Not specified"
                  }
                  // due_date={proposal.due_date}
                  earned={`$${
                    proposal.freelancerProfile?.totalHours +
                    (proposal.freelancerProfile?.totalJobs || 0)
                  }+ earned`}
                  timeline={proposal.timeline || "Not specified"}
                  image={proposal.image}
                  coverLetter={
                    proposal.coverLetter || "No cover letter available"
                  }
                  jobTitle={proposal.jobTitle || "No job title"}
                  status={proposal.status}
                  isAuthenticatedUser={proposal.isAuthenticatedUser}
                  onHire={() => handleHire(proposal)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="pagination">
          <span>Rows per page</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
          <div className="page-controls">
            {[...Array(totalPages).keys()].map((page) => (
              <span
                key={page + 1}
                onClick={() => handlePageChange(page + 1)}
                className={currentPage === page + 1 ? "active" : ""}
              >
                {page + 1}
              </span>
            ))}
          </div>
          <span>Go to page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => handlePageChange(parseInt(e.target.value))}
          />
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>

        {isModalOpen && selectedProposal && (
          <div className="modal" ref={modalRef}>
            <div className="modal-content">
              <h2>Proposal Details</h2>
              <p>
                <strong>Job Title:</strong> {selectedProposal.jobTitle}
              </p>
              <p>
                <strong>Cover Letter:</strong> {selectedProposal.coverLetter}
              </p>
              <p>
                <strong>Timeline:</strong> {selectedProposal.timeline}
              </p>
              <p>
                <strong>Rate:</strong> {formatRate(selectedProposal)}
              </p>
              {selectedProposal.add_requirements?.by_milestones && (
                <div>
                  <h3>Milestone Breakdown:</h3>
                  {selectedProposal.add_requirements.by_milestones.map(
                    (milestone, index) => (
                      <p key={index}>
                        <strong>Milestone {index + 1}:</strong> $
                        {milestone.amount}
                        {milestone.description && ` - ${milestone.description}`}
                      </p>
                    )
                  )}
                </div>
              )}
              <p>
                <strong>Location:</strong> {selectedProposal.country}
              </p>
              <button onClick={handleCloseModal}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default IndexPage;
