import React from "react";
import "./styles.scss";
import { FaBriefcase, FaChartLine, FaUserTie } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Spinner } from "../../components/index";
import Footer from "../../components/footer/footer";

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ConsultantDashboard = () => {
  const [acceptedOffers, setAcceptedOffersCount] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(
          <span key={i} className="star full">
            ★
          </span>
        );
      } else if (i - rating < 1) {
        stars.push(
          <span key={i} className="star half">
            ★
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="star empty">
            ☆
          </span>
        );
      }
    }
    return stars;
  };

  const [chartData, setChartData] = useState({
    labels: [], // Time labels
    datasets: [
      {
        label: "Total Offers",
        data: [],
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
      },
      {
        label: "Accepted Offers",
        data: [],
        borderColor: "#2196f3",
        backgroundColor: "rgba(33, 150, 243, 0.2)",
      },
      {
        label: "Pending Offers",
        data: [],
        borderColor: "#ff9800",
        backgroundColor: "rgba(255, 152, 0, 0.2)",
      },
    ],
  });

  const navigate = useNavigate();

  const handleOffersClick = () => navigate("/ConsultantOfferPage");

  const [offerCounts, setOfferCounts] = useState({
    totalOffers: 0,
    acceptedOffers: 0,
    pendingOffers: 0,
  });

  useEffect(() => {
    const fetchOfferCounts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/signin");
          return;
        }
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
        const decodedToken = jwtDecode(token);
        const consultantId = decodedToken.userId;
  
        const response = await axios.get(`${BASE_URL}/api/client/offers/count/${consultantId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        const { totalOffers, acceptedOffers, pendingOffers } = response.data.data;
        
  
        setOfferCounts({ totalOffers, acceptedOffers, pendingOffers });

        // Update chart data
        setChartData((prevData) => ({
          labels: [...prevData.labels, new Date().toLocaleTimeString()], // Add current time
          datasets: [
            {
              ...prevData.datasets[0],
              data: [...prevData.datasets[0].data, totalOffers],
            },
            {
              ...prevData.datasets[1],
              data: [...prevData.datasets[1].data, acceptedOffers],
            },
            {
              ...prevData.datasets[2],
              data: [...prevData.datasets[2].data, pendingOffers],
            },
          ],
        }));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching offer counts:", error);
      }
    };

    const interval = setInterval(fetchOfferCounts, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval); // Clear interval on component unmount
  }, [navigate]);

  const [user, setUser] = useState({ first_name: "", email: "" });

 
 useEffect(() => {
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      if (!token) {
        navigate("/signin");
        return;
      }

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;
        console.log("Decoded User ID:", userId);

      const response = await axios.get(
        `${BASE_URL}/api/client/users/${userId}`,
       {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
      );

        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/signin");
      }
    };

    fetchUser();
  }, [navigate]);

  // if (loading) {
  //   // **Render Spinner when loading**
  //   return <Spinner size={100} alignCenter />;
  // }

  useEffect(() => {
    const fetchAcceptedOffers = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/signin");
          return;
        }
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
        const decodedToken = jwtDecode(token);
        const consultantId = decodedToken.userId;

        const response = await axios.get(
          `${BASE_URL}/api/client/offers/count/${consultantId}`, // Adjust to your API endpoint
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Accepted offers response:", response.data);

        // Check if the response is in the form you're expecting
        const { acceptedOffers, pendingoffer } = response.data.data;

        // Now, you can use the acceptedoffer count directly
        setAcceptedOffersCount(acceptedOffers); // Assuming you want to store the count of accepted offers

        // If you want to calculate the rating, you might need to modify the backend API to send offers with ratings or handle it differently
        // For now, just log the count
        console.log("Accepted Offers Count:", acceptedOffers);

        // Calculate average rating if necessary (you may need to request detailed offers with ratings from the backend)
        const totalRatings = acceptedOffers * 4.5; // Assuming an average rating of 4.5 for each accepted offer (example)
        const avgRating =
          acceptedOffers > 0 ? totalRatings / acceptedOffers : 0;
        setAverageRating(avgRating);
      } catch (error) {
        console.error("Error fetching accepted offers:", error);
      }
    };

    fetchAcceptedOffers();
  }, [navigate]);
  // if (loading) return <Spinner size={100} alignCenter />;
  // if (error) return <div>{error}</div>;

  return (
    <>
      <Header />
      <div className="consultant-dashboard">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-overlay">
            <h1>Welcome Back! {user.first_name || "User"} </h1>
            <p>Your offers and career growth, all in one place.</p>
          </div>
        </div>

        {/* Offers Card Section */}
        <div className="offers-card" onClick={handleOffersClick}>
          <FaBriefcase className="card-icon" />
          <h2>Offers</h2>
          <p>Manage all your client offers in one place.</p>
          <div className="stats">
            <div className="stat">
              <h3>{offerCounts.totalOffers}</h3>
              <p>Total Offers</p>
            </div>
            <div className="stat">
              <h3>{offerCounts.acceptedOffers}</h3>
              <p>Accepted Offers</p>
            </div>
            <div className="stat">
              <h3>{offerCounts.pendingOffers}</h3>
              <p>Pending Offers</p>
            </div>
          </div>
        </div>

        {/* Additional Content Section */}
        <div className="content-section">
          <div className="content-card">
            <FaChartLine className="content-icon" />
            <h3>Performance Analytics</h3>
            <p>
              Track your performance metrics and analyze your career growth over
              time.
            </p>
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: "Offer Statistics Over Time" },
                },
              }}
            />
          </div>
          <div className="content-card">
            <FaUserTie className="content-icon" />
            <h3 className="h3haeding">Client Reviews</h3>
            <p className="pheading">
              Check out the ratings and reviews to gain valuable insights and
              enhance your services.
            </p>

            <div className="rating-section">
              <div className="stars">{renderStars(averageRating)}</div>
              <p>
                <strong>{averageRating.toFixed(1)}</strong>/5.0{" "}
                {acceptedOffers.length}
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default ConsultantDashboard;
