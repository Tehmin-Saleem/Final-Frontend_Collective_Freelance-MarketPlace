import React, { createContext, useContext, useEffect, useState } from "react";

import { jwtDecode } from "jwt-decode";
import axios from "axios";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState();
  const [user, setUser] = useState([]);
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState([]);
  const [error, setError] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [selectedFreelancer, setSelectedFreelancer] = useState(null); 
  const [selectedClient, setSelectedClient] = useState(null); 
  const [messages, setMessages] = useState([]);



  useEffect(() => {
  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
  
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      const userRole = decodedToken.role; // Assuming role is included in the token (client/freelancer)

  
      
      const headers = {
        Authorization: `Bearer ${token}`,
      };
  
      let userData;
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      if (userRole === 'freelancer') {
        // If the user is a freelancer, fetch freelancer profile details
        const response = await axios.get(`${BASE_URL}/api/freelancer/profile/${userId}`, {
          headers,
        });
        userData = response.data;
        setUser(userData); // Set profile data specifically for freelancers
      } else if (userRole === 'client') {
        const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
        // If the user is a client, fetch client-specific data
        const response = await axios.get(`${BASE_URL}/api/client/users/${userId}`, {
          headers,
        });
        userData = response.data;
        
        // Set user data specifically for clients
        setUser(userData);
      }
  
      // Pass the fetched data to setUser based on the role
  
      
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err.message || "Failed to fetch user data");
     
    }
  };
  
  fetchProfileData();
}, []);


// Function to set the selected freelancer when a chat is selected
const selectFreelancer = (freelancer, client) => {
  setSelectedFreelancer(freelancer);
  setSelectedClient(client);
  
};


  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats,
        setChats,
        loggedUser,
        setLoggedUser,
        selectedFreelancer, // Include selectedFreelancer in the context
        selectFreelancer,    // Include the function to select the freelancer
        messages, 
        setMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
