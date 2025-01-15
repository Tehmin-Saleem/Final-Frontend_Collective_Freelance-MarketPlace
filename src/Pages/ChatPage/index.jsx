import React, { useState, useEffect } from "react";
import "./styles.scss";
import axios from "axios";
// import ChatInterface from "./ChatInterface";
import {
  Header,
  ChatLoading,
  UserListItems,
  Spinner,
} from "../../components/index";
import { ChatState } from "../../context/ChatProvider";
import { getSender } from "../../components/chatcomponents/ChatLogic";
import { BigCross, Attachment } from "../../svg";
import Lottie from "react-lottie";
import ScrollableChat from "../../components/chatcomponents/ScrollableChat";
import io from "socket.io-client";
import animationData from "../../animations/typing.json";
import { jwtDecode } from "jwt-decode";

 const ENDPOINT = 'http://13.61.176.80:5000';; // "https://talk-a-tive.herokuapp.com"; -> After deployment
var socket, selectedChatCompare;

const Chat = () => {
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State to control drawer
  const [searchResult, setSearchResult] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState(""); // State for error messages
  // const [loggedUser, setLoggedUser] = useState();
  const [fetchAgain, setFetchAgain] = useState(false);
  // const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [preview, setPreview] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    chatId: null,
  });

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const {
    user,
    selectedChat,
    setSelectedChat,
    notification,
    setNotification,
    chats,
    setChats,
    loggedUser,
    setLoggedUser,
    selectFreelancer,
    messages,
    setMessages,
  } = ChatState();

  const handleChatSelect = (chat) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    const decodedToken = jwtDecode(token);
    const userRole = decodedToken.role;

    const user1 = chat.users[0];
    const user2 = chat.users[1];

    // Ensure roles are correctly assigned based on actual user roles, not array index
    const freelancer = user1?.role === "freelancer" ? user1._id : user2._id;
    const client = user1?.role === "client" ? user1._id : user2._id;

    console.log("freelancer in function handleChatSelect", freelancer);
    console.log("client in function handleChatSelect", client);

    if (userRole === "client") {
      selectFreelancer(freelancer); // Set the selected freelancer
    } else if (userRole === "freelancer") {
      selectFreelancer(client); // Set the selected client
    }
  };

  const handleRightClick = (e, chatId) => {
    e.preventDefault(); // Prevent the default context menu
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      chatId: chatId,
    });
  };

  const handleDeleteChat = async () => {
    if (contextMenu.chatId) {
      await deleteChat(contextMenu.chatId); // Call the deleteChat function
      setContextMenu({ visible: false, x: 0, y: 0, chatId: null });
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, chatId: null });
  };

  // Function to open the drawer
  const handleSearchClick = () => {
    setIsDrawerOpen(true);
  };

  // Function to close the drawer
  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  // ===========
  const handleSearch = async () => {
    if (!search) {
      setError("Please enter something in the search."); // Show error if input is empty
      return;
    }

    // Check if user is undefined
    if (!user) {
      console.error("User data is not available yet.");
      setError("User data is not available yet. Please try again.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    const decodedToken = jwtDecode(token);
    const userRole = decodedToken.role;

    //

    try {
      setLoading(true);
      setError(""); // Clear previous error messages

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      // Define search route based on user role
      let route;
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      if (userRole === "client") { 
        // Clients should search for freelancers
        route = `${BASE_URL}/api/client/searchFreelancers?search=${search}`;
      } else if (userRole === "freelancer") {
        // Freelancers should search for clients
        route = `${BASE_URL}/api/freelancer/searchClients?search=${search}`;
      } else {
        setError("Invalid user role. Please log in again.");
        setLoading(false);
        return;
      }

      const { data } = await axios.get(route, config); // Use the correct route based on role

      setLoading(false);
      setSearchResult(data); // Store the search result
    } catch (error) {
      setLoading(false);
      setError("Failed to load search results. Please try again."); // Handle error
    }
  };

  // ===========

  // const handleSearch = async () => {
  //   if (!search) {
  //     setError("Please enter something in the search."); // Show error if input is empty
  //     return;
  //   }

  //   // Check if user is undefined
  //   if (!user) {
  //     console.error("User data is not available yet.");
  //     setError("User data is not available yet. Please try again.");
  //     return;
  //   }

  //   console.log("user data in chat page", user);

  //   try {
  //     setLoading(true);
  //     setError(""); // Clear previous error messages

  //     const config = {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${user.token}`,
  //       },
  //     };
  //     // console.log("token in handle  search", user.token);

  //     // i have to correct the route here ..........
  //     const { data } = await axios.get(
  //       `http://localhost:5000/api/client/SearchAllUsers?search=${search}`,
  //       config
  //     );

  //     setLoading(false);
  //     setSearchResult(data); // Store the search result
  //     // console.log(data);
  //   } catch (error) {
  //     setLoading(false);
  //     setError("Failed to load search results. Please try again."); // Handle error
  //   }
  // };

  // =======================

  const accessChat = async (userId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    // console.log("token in acceschats", user.token);

    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const { data } = await axios.post(
        `${BASE_URL}/api/client/accesschats`,
        { userId },
        config
      );

      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      // console.log("data in function accesschats", data);
      setLoadingChat(false);
      closeDrawer();
      // onClose(); // close the sidedrawer after this
    } catch (error) {
      setError("Failed to fetch chats. Please try again."); // Handle error
    }
  };

  // part below the drawer that is Mychats
  // =============

  const fetchChats = async () => {
    // console.log(userId);

    // Get userInfo from localStorage and parse it
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const { data } = await axios.get(
        `${BASE_URL}/api/client/fetchchats`,
        config
      );

      setChats(data);
    } catch (error) {
      setError("Failed to load the chats. Please try again."); // Handle error
      console.log(error);
    }
  };

  useEffect(() => {
    // Check if the user is a freelancer (has freelancer_id) or a client
    const loggedInUserId = user.data?.freelancer_id || user._id;

    // Set loggedUser to freelancer_id if freelancer, otherwise to _id (client)
    setLoggedUser(loggedInUserId);

    fetchChats();
  }, [fetchAgain, user]); // Combine the dependencies in one array

  // messages related integration

  const fetchMessages = async () => {
    if (!selectedChat) return;

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      setLoading(true);
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      const { data } = await axios.get(
        `${BASE_URL}/api/client/allMessages/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);
      console.log(data);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      setError("Failed to load all the message"); // Handle error
      console.log(error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    const decodedToken = jwtDecode(token);
    const userRole = decodedToken.role;

    socket = io(ENDPOINT);

    if (userRole === "client") {
      socket.emit("setup", user); // Emit only when the user data is available
    } else if (userRole === "freelancer") {
      socket.emit("setup", user.data);
    }

    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // Listen for message deletion event
    socket.on("message deleted", (data) => {
      // data will contain messageId
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== data.messageId)
      );
    });

    // eslint-disable-next-line
  }, [user]); // Add 'user' as a dependency to ensure useEffect runs after user is set

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const sendMessage = async (event) => {
    if ((event.key === "Enter" || event.type === "click") && (newMessage.trim() || attachment)) {
      socket.emit("stop typing", selectedChat._id);
  
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
  
      try {
        let response;
        
        if (attachment) {
          const formData = new FormData();
          
          // Add fields in specific order
          formData.append("chatId", selectedChat._id);
          if (newMessage.trim()) {
            formData.append("content", newMessage.trim());
          }
          formData.append("file", attachment);
  
          // Debug log
          console.log("Sending FormData with:");
          console.log("chatId:", selectedChat._id);
          console.log(" content:", newMessage.trim());
          console.log(" file:", attachment.name);
  
          const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
          response = await axios.post(
            `${BASE_URL}/api/client/sendMessage`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              // Important: Set this to handle the upload properly
              maxBodyLength: Infinity,
              maxContentLength: Infinity,
            }
          );
        } else {
          // Text-only message remains the same 
           const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
          response = await axios.post(
           `${BASE_URL}/api/client/sendMessage`,
            {
              chatId: selectedChat._id,
              content: newMessage.trim()
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
  
        const { data } = response;
        
        // Reset form state
        setNewMessage("");
        setAttachment(null);
        setPreview(null);
  
        // Update UI
        socket.emit("new message", data);
        setMessages([...messages, data]);
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === data.chat._id
              ? { ...chat, latestMessage: data }
              : chat
          )
        );
      } catch (error) {
        console.error("Error sending message:", {
          message: error.message,
          data: error.response?.data,
          status: error.response?.status
        });
        setError(error.response?.data?.error || "Failed to send message");
      }
    }
  };
  
  
  const downloadFile = async (fileUrl, fileName) => {
    try {
      const response = await axios({
        url: `${BASE_URL}${fileUrl}`,
        method: 'GET',
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError("Failed to download file");
      console.error(error);
    }
  };
  
  
  // Update the ScrollableChat component to handle file attachments
  const MessageItem = ({ message }) => {
    return (
      <div className={`message ${isMessageSentByMe ? 'sent' : 'received'}`}>
        <div className="message-content">
          {message.content && <p>{message.content}</p>}
          {message.attachment && (
            <div className="attachment-container">
              <div className="file-info">
                <span>{message.attachment.fileName}</span>
                <button
                  className="download-btn"
                  onClick={() => downloadFile(message.attachment.path, message.attachment.fileName)}
                >
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit
        alert("File size exceeds 100MB limit.");
        return;
      }
  
      setAttachment(file);
  
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };
  

  const deleteChat = async (chatId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found");
      }

      // Decode the token to get user role
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.role;

      let route;
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      if (userRole === "client") {
       
        route = `${BASE_URL}/api/client/deletechat/${chatId}`;
      } else if (userRole === "freelancer") {
        // Freelancers use this route to delete chats
        route = `${BASE_URL}/api/freelancer/deletechat/${chatId}`;
      } else {
        console.error("Invalid user role.");
        setError("Invalid user role. Please log in again.");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.delete(route, config); // Use the correct route based on role

      // Update UI after chat is deleted
      setChats(chats.filter((chat) => chat._id !== chatId));
      setSelectedChat(null); // Optionally clear the selected chat
    } catch (error) {
      console.error("Error deleting chat", error);
      setError("Failed to delete the chat");
    }
  };
  const handleSend = () => {
    if (newMessage.trim() || attachment) {
      sendMessage({ type: "click" });
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    setPreview(null);
  };
  return (
    <>
     <Header />
      <div className="chat-page">
        <div className="left-section">
          <h2 className="msg">Messages</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search"
              onClick={handleSearchClick}
            />
          </div>

          <div
            className={`mychats-container ${selectedChat ? 'hide-on-mobile' : ''}`}
          >
            <div className="mychats-header">My Chats</div>

            <div className="chat-box" onClick={closeContextMenu}>
              {chats ? (
                <div className="chat-list">
                  {chats.map((chat) => (
                    <div
                      onClick={() => setSelectedChat(chat)}
                      onContextMenu={(e) => handleRightClick(e, chat._id)}
                      className={`chat-item ${selectedChat === chat ? 'selected' : ''}`}
                      key={chat._id}
                    >
                      <p
                        className="chat-name"
                        onClick={() => handleChatSelect(chat)}
                      >
                        {!chat.isGroupChat
                          ? getSender(loggedUser, chat.users)
                          : chat.chatName}
                      </p>
                      {chat.latestMessage && chat.latestMessage.sender && (
                        <p className="chat-latest-message">
                          <strong>{chat.latestMessage.sender.first_name}:</strong>{' '}
                          {chat.latestMessage.content.length > 50
                            ? chat.latestMessage.content.substring(0, 51) + '...'
                            : chat.latestMessage.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <ChatLoading />
              )}

              {contextMenu.visible && (
                <div
                  className="context-menu"
                  style={{
                    top: contextMenu.y,
                    left: contextMenu.x,
                    position: 'absolute',
                  }}
                >
                  <button onClick={handleDeleteChat}>Delete Chat</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-section">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <button className="icon-button" onClick={() => setSelectedChat('')}>
                  ←
                </button>
                <span className="chat-title">
                  {!selectedChat.isGroupChat ? getSender(user, selectedChat.users) : selectedChat.chatName.toUpperCase()}
                </span>
              </div>

             {/* Replace this section in your existing Chat.js */}
<div className="mainchat-box">
  {loading ? (
    <div className="spinner"></div>
  ) : (
    <div className="messages">
      <ScrollableChat messages={messages} />
    </div>
  )}

  {/* <ChatInterface 
    selectedChat={selectedChat}
    messages={messages}
    onSendMessage={sendMessage}
    isTyping={istyping}
  /> */}


                <div className="form-control">
                  {istyping && (
                    <div className="typing-animation">
                      <Lottie options={defaultOptions} width={70} />
                    </div>
                  )}

<div className="message-input-container">
  <input
    type="text"
    id="first-name"
    required
    placeholder="Type your message..."
    onKeyDown={sendMessage}
    className="message-input"
    value={newMessage}
    onChange={typingHandler}
  />

<input
    type="file"
    id="fileInput"
    onChange={handleFileChange}
    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
    style={{ display: 'none' }}
  />
  <label htmlFor="fileInput" className="attach-button">
    <Attachment />
  </label>

  <button 
    className="send-button"
    onClick={sendMessage}
    style={{
      padding: '8px 16px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginLeft: '8px'
    }}
  >
    Send
  </button>
</div>

{attachment && (
  <div className="file-preview" style={{ 
    margin: '10px 0',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }}>
    <div style={{ flex: 1 }}>
      <p style={{ margin: 0 }}>
        <strong>Attached:</strong> {attachment.name}
      </p>
      {preview && (
        <img 
          src={preview} 
          alt="Preview" 
          style={{
            maxWidth: '200px',
            maxHeight: '150px',
            marginTop: '8px',
            borderRadius: '4px'
          }}
        />
      )}
    </div>
    <button 
      onClick={() => {
        setAttachment(null);
        setPreview(null);
      }}
      style={{
        padding: '4px 8px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Remove
    </button>
    </div>
)}
                </div>
              </div>
            </>
          ) : (
            <div className="rightchat-container">
              <p className="rightchat-text">Click on a user to start chatting</p>
            </div>
          )}

          <div className={`side-drawer ${isDrawerOpen ? 'open' : ''}`}>
            <div className="drawer-header">
              <h3 className="drawer_search">Search</h3>
              <button onClick={closeDrawer}>
                <BigCross />
              </button>
            </div>

            <div className="drawer-search-bar">
              <input
                type="text"
                placeholder="Search Users"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="drawer-search-bar-button" onClick={handleSearch}>
                Go
              </button>

              {error && <div className="error-message">{error}</div>}

              {loading ? (
                <ChatLoading />
              ) : (
                searchResult.map((user) => (
                  <UserListItems
                    key={user.userId}
                    user={user}
                    handleFunction={() => accessChat(user._id)}
                  />
                ))
              )}

              {loadingChat && <Spinner />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;