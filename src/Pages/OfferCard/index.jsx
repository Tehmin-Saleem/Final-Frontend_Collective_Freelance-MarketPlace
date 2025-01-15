import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Header } from "../../components";
import { MapPin, Briefcase, Clock, DollarSign, Paperclip } from "lucide-react";
import { useLocation } from "react-router-dom";

const OfferDetails = () => {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const location = useLocation();
  const offerId = location.pathname.split("/").pop();

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  console.log('offerid', offerId);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    // Hide toast after 10 seconds
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 10000);
  };

  useEffect(() => {
    const fetchOfferDetails = async () => {
      try {
        if (!offerId) {
          setError("No offer ID provided");
          setLoading(false);
          return;
        }

        // Basic validation on the frontend
        const validHexRegex = /^[0-9a-fA-F]{24}$/;
        if (!validHexRegex.test(offerId)) {
          throw new Error(`Invalid offer ID format: ${offerId}. Must be a 24-character hexadecimal string.`);
        }

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        console.log('Token:', token); // Log the token

        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;
        console.log('Fetching offer with ID:', offerId);
        console.log('Request URL:', `${BASE_URL}/api/freelancer/offers/${offerId}`);

        const response = await axios.get(
          `${BASE_URL}/api/freelancer/offers/${offerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Offer API Response:", response.data);
        const fetchedOffer = response.data;
        setOffer(fetchedOffer);

        // Handle attachments
        if (fetchedOffer.attachment?.fileType) {
          setFileType(fetchedOffer.attachment.fileType);
          setFileUrl(fetchedOffer.attachment.path);
        } else if (fetchedOffer.attachment?.fileName) {
          const extension = fetchedOffer.attachment.fileName.split(".").pop().toLowerCase();
          if (["jpg", "jpeg", "png"].includes(extension)) {
            setFileType("image/" + extension);
          } else if (extension === "pdf") {
            setFileType(fetchedOffer.attachment.mimeType || "application/pdf");
            setFileUrl(fetchedOffer.attachment.path);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching offer details:", error);
        const errorMessage = error.response?.data?.message
          ? `${error.response.data.message} ${error.response.data.details || ''}`
          : error.message || "Failed to fetch offer details";

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchOfferDetails();
  }, [offerId]);

  const getReviewPercentage = (completedJobs) => {
    const maxJobs = 100; // Set a maximum completed jobs value (can be adjusted)
    return Math.min((completedJobs / maxJobs) * 100, 100); // Ensure it's between 0 and 100
  };

  const handleAcceptOffer = async () => {
    try {
      setSubmitLoading(true);
      console.log("Accepting offer:", offerId);
      const token = localStorage.getItem("token");
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;
      const updateResponse = await axios.patch(
        `${BASE_URL}/api/freelancer/offers/${offerId}`,
        { status: "accepted" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Accept offer response:", updateResponse.data);

      if (updateResponse.data) {
        // Update local state
        setOffer((prev) => ({
          ...prev,
          status: "accepted",
        }));
        alert("Offer accepted successfully");

        // Emit an event or call a callback function

        // Navigate to the FreelancersJobsPage
        // navigate('/freelancersjobpage');
      } else {
        console.error("No data in update response");
        throw new Error("Failed to update offer status");
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      // Show error to user
      alert(
        "Failed to accept offer: " +
          (error.response?.data?.message || "Unknown error")
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeclineOffer = async () => {
    try {
      setSubmitLoading(true);
      console.log("Declining offer:", offerId);
      const token = localStorage.getItem("token");
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;

      const updateResponse = await axios.patch(
        `${BASE_URL}/api/freelancer/offers/${offerId}`,
        { status: "declined" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Decline offer response:", updateResponse.data);

      if (updateResponse.data) {
        setOffer((prev) => ({
          ...prev,
          status: "declined",
        }));
        alert("Offer declined successfully");
      } else {
        throw new Error("Failed to update offer status");
      }
    } catch (error) {
      console.error("Error declining offer:", error);
      alert(
        "Failed to decline offer: " +
          (error.response?.data?.message || "Unknown error")
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleViewFile = () => {
    if (fileType && fileUrl) {
      if (fileType.startsWith("image/")) {
        // For images, check if it's a URL or a Blob and handle accordingly
        if (fileUrl.startsWith("http")) {
          // If the fileUrl is a URL (like Cloudinary)
          window.open(fileUrl, "_blank");
        } else {
          // Otherwise, open the Blob URL
          window.open(fileUrl, "_blank");
        }
      } else if (fileType === "application/pdf") {
        // For PDF, open in a new tab
        window.open(fileUrl, "_blank");
      } else {
        alert("Unsupported file type.");
      }
    } else {
      alert("No file available to view.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Offer details not found.
      </div>
    );
  }

  const reviewPercentage = getReviewPercentage(
    offer.clientStats?.completedJobs || 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto p-6 mt-20">
        <div className="mt-8 bg-white shadow-lg rounded-lg">
          <div className="space-y-4 p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-sky-600">
                      {(offer.clientFirstName || "John").charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-sky-600">
                      {offer.clientFirstName} {offer.clientLastName}
                    </h3>
                    <p className="text-sm text-gray-600">Client</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  {/* Using a simple map pin icon (or you can use your own or an emoji) */}
                  <span className="w-4 h-4">&#x1F4CD;</span>
                  <span>{offer.clientCountry || "Country not specified"}</span>
                </div>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-4">
                    {/* <div className="flex items-center">
      <span className="text-yellow-400">★</span>
      <span className="ml-1 text-sm text-gray-600">
        {offer.clientStats?.rating || 0} ({offer.clientStats?.totalReviews || 0} reviews)
      </span>
    </div> */}
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="ml-1 text-sm text-gray-600">
                        {offer.clientStats?.completedJobs || 0} jobs completed
                      </span>
                    </div>
                  </div>

                  {/* {offer.clientStats?.recentReviews?.length > 0 && (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-sky-600 mb-2">Recent Reviews</h4>
      <div className="space-y-2">
        {offer.clientStats.recentReviews.map((review, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(review.stars)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {review.reviewerName}
                </span>
              </div>
            </div>
            {review.message && (
              <p className="text-sm text-gray-600 mt-1">{review.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )} */}
                </div>
                <h2 className="text-xl font-semibold text-sky-600">Title</h2>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {offer.job_title}
                </h2>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-3 bg-sky-100 text-sky-700 rounded-full whitespace-nowrap">
                  <span>Rate:</span>
                  {offer.budget_type === "hourly" ? (
                    <>
                      <span className="w-4 h-4">&#x23F1;</span>{" "}
                      {/* Clock icon */}
                      <span>
                        ${offer.hourly_rate.from} - ${offer.hourly_rate.to}/hr
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-4 h-4 text-lg">&#x24;</span>{" "}
                      {/* Dollar icon */}
                      <span>${offer.fixed_price}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6">
            {/* Project Description */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-sky-600">
                Project Description
              </h2>
              <div className="prose max-w-none text-gray-700">
                <p>{offer.description}</p>
                {offer.detailed_description && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-md font-medium mb-2 text-sky-600">
                      Additional Details
                    </h3>
                    <p>{offer.detailed_description}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Required Skills */}
            {offer.preferred_skills && offer.preferred_skills.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {offer.preferred_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {offer.attachment && offer.attachment.fileName && (
              <div className="mt-4">
                <p>Attachment: {offer.attachment.fileName}</p>
                <button
                  onClick={handleViewFile}
                  className="flex items-center gap-2 text-sky-600 hover:text-sky-700"
                >
                  <span className="w-4 h-4">&#x1F441;</span>
                  View Attachment
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              {offer && (
                <>
                  <button
                    onClick={handleAcceptOffer}
                    disabled={submitLoading}
                    className={`px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 ${
                      submitLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {submitLoading ? "Processing..." : "Accept Offer"}
                  </button>
                  <button
                    onClick={handleDeclineOffer}
                    disabled={submitLoading}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    {submitLoading ? "Processing..." : "Decline Offer"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      {toast.show && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default OfferDetails;
