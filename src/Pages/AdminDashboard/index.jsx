import React, { useState, useEffect, useContext } from "react";
import {
  FaUser,
  FaUsers,
  FaEnvelope,
  FaChartLine,
  FaCog,
  FaBell,
  FaBars,
  FaFilter,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./styles.scss";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { NotificationContext } from "../Notifications/NotificationContext";
import NotificationItem from "../../components/NotificationItem/index";
import { Header } from "../../components";
// import Footer from "../../components/Footer/foote";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [queries, setQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [freelancerCount, setFreelancerCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isQueryResolved, setIsQueryResolved] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);
  const { notifications, unreadCount, fetchNotifications, markAsRead } =
    useContext(NotificationContext);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleNotificationDropdown = () =>
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isNotificationDropdownOpen &&
        !event.target.closest(".notification-container")
      ) {
        setIsNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationDropdownOpen]);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    // For older dates
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const sortedQueries = [...queries].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (selectedStatus === "all") {
      setFilteredQueries(sortedQueries);
    } else {
      setFilteredQueries(
        sortedQueries.filter(
          (query) => (query.status || "Pending") === selectedStatus
        )
      );
    }
  }, [selectedStatus, queries]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

          const decodedToken = jwtDecode(token);
          const isTokenExpired = decodedToken.exp * 1000 < Date.now();
          if (isTokenExpired) {
            console.error('Token has expired');
            return;
          }
          const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
          const queryResponse = await fetch(`${BASE_URL}/api/freelancer/queries`, {
            method: 'GET',
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

          const queryData = await queryResponse.json();
          setQueries(queryData);
       
          const freelancerResponse = await fetch(`${BASE_URL}/api/freelancer/count`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!freelancerResponse.ok) {
          throw new Error("Failed to fetch freelancer count");
        }

        const freelancerData = await freelancerResponse.json();
        setFreelancerCount(freelancerData.count);

          const clientResponse = await fetch(`${BASE_URL}/api/client/count`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!clientResponse.ok) {
          throw new Error("Failed to fetch client count");
        }

        const clientData = await clientResponse.json();
        setClientCount(clientData.count);

        fetchNotifications();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

      fetchData();
    }, [fetchNotifications]);
    const handleResolveClick = async (queryId) => {
     const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const response = await fetch(`${BASE_URL}/api/freelancer/queries/${queryId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      const queryData = await response.json();
      setSelectedQuery(queryData);
      setIsModalOpen(true);
    } else {
      console.error("Failed to fetch query details");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuery(null);
  };

    const handleConfirmResolve = async (queryId) => {
      try {
       const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
          const response = await fetch(`${BASE_URL}/api/freelancer/queries/${queryId}`, {
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({ status: 'Resolved' }),  // Send the updated status
          });

      if (!response.ok) {
        throw new Error("Failed to update query status");
      }

      // Update local state to reflect the change
      setQueries((prevQueries) =>
        prevQueries.map((query) =>
          query._id === queryId ? { ...query, status: "Resolved" } : query
        )
      );

      setIsQueryResolved(true); // Mark as resolved in local state
      setSelectedQuery((prev) => ({ ...prev, status: "Resolved" })); // Update the selected query

      // Close the modal after successfully resolving the query
      handleCloseModal(); // Close the modal after query resolution
    } catch (error) {
      console.error("Error updating query status:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification._id);
    }

    const message = notification.message.toLowerCase();

    // Check message content for navigation
    if (message.includes("hired")) {
      navigate("/freelancersjobpage", {
        state: { jobId: notification.job_id },
      });
    } else if (message.includes("received a new offer")) {
      // Use notification._id for the offerId
      navigate(`/OfferDetails/${notification.job_id}`, {
        state: {
          jobId: notification.job_id,
        },
      });
    } else {
      console.log(
        "Notification message not mapped to any route:",
        notification.message
      );
      console.log("id", notification.job_id);
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const groupNotificationsByDate = (notifications) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    notifications.forEach((notification) => {
      const notificationDate = new Date(notification.timestamp).toDateString();
      if (notificationDate === today) {
        groups["Today"].push(notification);
      } else if (notificationDate === yesterday) {
        groups["Yesterday"].push(notification);
      } else {
        groups["Earlier"].push(notification);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  };

     
  

    return (
      <>
      {/* <Header/> */}
      <div className="admin-dashboard">
        <aside className={isSidebarOpen ? "sidebar open" : "sidebar closed"}>
          <div className="logo">Admin Panel</div>
          <ul className="menu">
            <li>
              <FaChartLine /> Dashboard
            </li>
            <li onClick={() => navigate("/freelancerslist")}>
              <FaUsers /> Freelancers
            </li>
            <li>
              <FaUser /> Clients
            </li>
            <li>
              <FaEnvelope /> Queries
            </li>
            {/* <li>
              <FaCog /> Settings
            </li> */}
          </ul>
        </aside>

        <div className="main-content">
          <header className="top-bar">
            <button className="menu-button" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <div className="admin-info">
              <div className="notification-container relative ">
                <div
                  className="notification-icon-wrapper cursor-pointer "
                  onClick={toggleNotificationDropdown}
                >
                  <FaBell className="icon " />
                  {unreadCount > 0 && (
                    <span className="notification-badge ">{unreadCount}</span>
                  )}
                </div>

                {isNotificationDropdownOpen && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      <p className="unread-count">
                        {unreadCount} unread notifications
                      </p>
                    </div>
                    <div className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className={`notification-wrapper ${
                              notification.is_read ? "read" : "unread"
                            }`}
                          >
                            <NotificationItem notification={notification} />
                          </div>
                        ))
                      ) : (
                        <p className="no-notifications">
                          No notifications to display.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <img
                src="https://via.placeholder.com/40"
                alt="Admin Profile"
                className="admin-avatar"
              />
              <span>Admin</span>
            </div>
          </header>

          <section className="dashboard-summary">
            <div className="card" onClick={() => navigate("/freelancerslist")}>
              <FaUsers className="card-icon" />
              <h3>Freelancers</h3>
              <p>{freelancerCount}</p>
            </div>
            <div className="card" onClick={() => navigate("/clientslist")}>
              <FaUser className="card-icon" />
              <h3>Clients</h3>
              <p>{clientCount}</p>
            </div>
            <div className="card">
              <FaEnvelope className="card-icon" />
              <h3>Active Queries</h3>
              <p>{queries.length}</p>
            </div>
          </section>

          <section className="queries-section">
            <div className="queries-header">
              <h2>Recent Queries</h2>
              <div className="filter-controls">
                <FaFilter className="filter-icon" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="status-filter"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
            <table className="queries-table">
              <thead>
                <tr>
                  <th>Query ID</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueries.map((query) => (
                  <tr
                    key={query._id}
                    className={
                      query.status === "Resolved"
                        ? "resolved-row"
                        : "pending-row"
                    }
                  >
                    <td>{query._id}</td>
                    <td>{query.queryType}</td>
                    <td>{query.name}</td>
                    <td>{query.message}</td>
                    <td className="date-column">
                      {formatDate(query.createdAt)}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${query.status?.toLowerCase() || "pending"}`}
                      >
                        {query.status || "Pending"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`resolve-btn ${query.status === "Resolved" ? "view-btn" : ""}`}
                        onClick={() => handleResolveClick(query._id)}
                      >
                        {query.status === "Resolved" ? "View" : "Resolve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {isModalOpen && selectedQuery && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Query Details</h2>
                <div className="modal-content">
                  <p>
                    <strong>Query ID:</strong> {selectedQuery._id}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedQuery.queryType}
                  </p>
                  <p>
                    <strong>From:</strong> {selectedQuery.name}
                  </p>
                  <p>
                    <strong>Message:</strong> {selectedQuery.message}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedQuery.status}
                  </p>

                  {/* Show message only when the user clicks 'View' button */}
                  {isQueryResolved && selectedQuery.status === "Resolved" && (
                    <p style={{ marginTop: "20px", color: "green" }}>
                      Your query has been successfully resolved.
                    </p>
                  )}
                </div>
                <div className="button-group">
                  <button
                    className="resolve-confirm-btn"
                    onClick={() => handleConfirmResolve(selectedQuery._id)}
                  >
                    {selectedQuery.status === "Resolved"
                      ? "View"
                      : "Complete Query"}
                  </button>
                  <button
                    className="modal-close-btn"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
