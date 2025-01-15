import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.scss';
import Header from '../../Commoncomponents/Header';
import { useLocation } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import headerImage from "../../../images/heroimage.jpg";

const ProjectDetailsModal = () => {
  const location = useLocation();

  const { offerId } = location.state || {}; // Safely retrieve offerId from state
  
  // const [offerId, setOfferId] = useState(() => {

  
  //   return localStorage.getItem('offerId') || (location.state && location.state.offerId);
  // });

  const [projectDetails, setProjectDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientEmail, setClientEmail] = useState('');

  const [newRemark, setNewRemark] = useState('');
  const [remarks, setRemarks] = useState([]);

  
  console.log('Location state:', location.state); // Log location state
   console.log('Offer ID:', offerId); // Log retrieved offerId
  //  console.log('consultantid:', consultantId);
  // useEffect(() => {
  //   if (offerId) {
  //     localStorage.setItem('offerId', offerId);
  //   }
  // }, [offerId]);

  if (!offerId) {
    console.log('Offer ID is missing!');
    setError('Offer ID is missing. Please provide a valid offer ID.');
    return;
  }
  
  



  
  // Function to close the modal
  const closeModal = () => {
    setShowModal(false);
    setError(null); // Clear any error when closing
    setProjectDetails(null); // Clear project details when closing
  };

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
  
    try {
      const decodedToken = jwtDecode(token);
      return decodedToken.userId; // Replace `userId` with the correct field name from your token payload
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const fetchRemarks = async () => {
    if (!offerId) return;
  
    try {
      const token = localStorage.getItem('token');
      const consultantId = getUserIdFromToken();
  
      if (!consultantId) {
        setError('Consultant ID is missing. Please log in again.');
        return;
      }
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const response = await axios.get(
        `${BASE_URL}/api/client/${offerId}/${consultantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      setRemarks(response.data);
    } catch (err) {
      setError('Failed to fetch remarks. Please try again later.');
      console.error('Error fetching remarks:', err.response || err);
    }
  };


  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not authorized. Please log in first.');
        return;
      }
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;
      const response = await axios.post(
        `${BASE_URL}/api/client/add`,
        {
          offerId,
          remark: newRemark,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const { remark, clientEmail } = response.data;
      console.log("client email",clientEmail);

      setRemarks((prevRemarks) => [remark, ...prevRemarks]);
      setNewRemark(''); // Clear input after submission
      setClientEmail(clientEmail); 
    } catch (err) {
      console.error('Error adding remark:', err.response || err);
    }
  };

  const openModal = async () => {
    if (!offerId) {
      setError('Offer ID is missing. Please provide a valid offer ID.');
      return;
    }

    const token = localStorage.getItem('token'); // Retrieve the token
    if (!token) {
      setError('You are not authorized. Please log in first.');
      return;
    }

    setShowModal(true);
    setLoading(true);
    const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL

    try {
      const response3 = await axios.get(
        `${BASE_URL}/api/client/project-details/${offerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setProjectDetails(response3.data); // Assuming response.data contains project details
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load project details. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch remarks and project details when the modal is opened
  useEffect(() => {
    if (showModal) {
      fetchRemarks(); // Fetch remarks when modal opens
    }
  }, [showModal]);

  // Fetch remarks when component mounts (to make sure they persist after refresh)
  useEffect(() => {
    fetchRemarks(); // Fetch remarks when the component is mounted
  }, [offerId]);


 
  return (
    <>
    <Header />
   
   <div className="project-details-page">
        {/* Hero Section */}
        <div className="hero-section">
          <img
            src={headerImage}
            alt="Project Collaboration"
            className="hero-image"
          />
          <h1>Welcome to the Project Details Page</h1>
          <p className="hero-text">
            Before proceeding, please make sure to review the confidentiality guidelines. 
            Protecting project details ensures trust and professionalism.
          </p>
        </div>

        {/* Instructions Section */}
        <div className="instructions">
          <h2>Instructions</h2>
          <p>
            By clicking the "See Project Details" button below, you agree to the following:
          </p>
          <ul>
            <li>Maintain confidentiality and avoid sharing project information with others.</li>
            <li>Use the provided details only for the intended purpose.</li>
            <li>Reach out to the client directly if you have any queries or concerns.</li>
          </ul>
        </div>

        {/* See Project Details Button */}
        <button className="see-details-btn" onClick={openModal}>
          See Project Details
        </button>

    {showModal && (
      <div className="modal-overlay">
        <div className="modal-container">
          <button className="close-btn" onClick={() => setShowModal(false)}>
            &times;
          </button>
          <h2 className="modal-title">Project Details</h2>

          {loading && <p>Loading...</p>}
          {error && <p className="error">{error}</p>}

          {projectDetails && !loading && !error && (
            <div className="modal-content">
              <p>
                <strong>Project Name:</strong> {projectDetails.projectName}
              </p>
              <p>
                <strong>Description:</strong> {projectDetails.description}
              </p>
              <p>
                <strong>Budget:</strong> {projectDetails.budget}
              </p>
              <p>
                <strong>Deadline:</strong>{' '}
                {new Date(projectDetails.deadline).toLocaleDateString()}
              </p>
              <p>
                <strong>GitHub URL:</strong>{' '}
                <a
                  href={projectDetails.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              </p>
              <p>
                <strong>Additional Notes:</strong>{' '}
                {projectDetails.additionalNotes || 'N/A'}
              </p>
            </div>
          )}

          {/* Remarks Section */}
          <div className="remarks-section">
            <label htmlFor="remarks">Add Your Remarks:</label>
            <textarea
              id="remarks"
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              placeholder="Write your remarks here..."
              rows="4"
            ></textarea>
            <button className="add-remarks-btn" onClick={handleAddRemark}>
              Submit Remarks
            </button>

            <div className="existing-remarks">
              {remarks.map((remark) => (
                <p key={remark._id} className="remark">
                  <span className="remark-text">{remark.remark}</span>
                  <span className="remark-date">{new Date(remark.createdAt).toLocaleString()}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="guidelines">
            <p>If you have any queries:</p>
            <ul>
            <li>
  Contact via{' '}
  <a href={`mailto:${clientEmail}`} target="_blank" rel="noopener noreferrer">
    Email
  </a>
</li>
              <li>Chat using the icon below</li>
              <li>Schedule a meeting at your convenience</li>
            </ul>
          </div>

          <div className="chat-icon">
            <a href="/chat" title="Chat with Client">
              💬 Chat
            </a>
          </div>
        </div>
      </div>
    )}
    </div>
  </>
  );
};

export default ProjectDetailsModal;
