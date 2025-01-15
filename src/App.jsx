import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { JobProvider } from "./context/JoBContext";
import TermsConditions from './components/TermsConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
// import "./App.css";
import {
  ProfileView,
  Proposal,
  JobsPage,
  SignIn,
  Signup,
  ClientDashboard,
  FreelancersDoneJobsPage,
  ErrorPage,
  SignUpSection,
  OfferForm,
  PostJob,
  JobDetails,
  MyProfile,
  DescriptionPage,
  SkillManagement,
  Budget,
  ProjectDuration,
  Attachment,
  FreeLancerCard,
  ApplyJob,
  FreelanceDashboardPage,
  AllJobsPage,
} from "./Pages/index";
// import SendOffer from "./components/FormProposal/OfferForm";
import { Header, FreelancerCards } from "./components/index";
import SubmitProposal from "./Pages/SubmitProposal";
import Notification from "./Pages/Notifications";
import Chat from "./Pages/ChatPage";
// import OfferForm from "./components/FormProposal/OfferForm";

import PaymentMethod from "./Pages/PaymentMethod";
import ProposalPopup from "./components/PopUps/PropsalSubmit";
import Popup from "./components/PopUps/PropsalSubmit";
import ReviewPopup from "./components/PopUps/ReviewPopup";
import JobPostedPopup from "./components/PopUps/JobPosted";
import ForgotPassword from "./Pages/ResetPass";
import ChangePassword from "./Pages/ForgotPass";
import ChatProvider from "./context/ChatProvider";
import { NotificationProvider } from "./Pages/Notifications/NotificationContext";
import { JobStatusProvider } from "./context/JobStatus";

import OfferDetails from "./Pages/OfferCard";
import Clientdash from "./Pages/Dashboard";
import ManageProjects from "./Pages/ManageProjects";
import ManageProjectbycient from "./Pages/ManageProjectUi";
import ClientProfile from "./Pages/ClientProfileView";
import ClientProfilePage from "./Pages/ClientProfileForm";
import AdminDashboard from "./Pages/AdminDashboard";
import QueryForm from "./components/Commoncomponents/QueryForm";
import FreelancerList from "./components/FreelancersList";
import ClientList from "./components/ClientLists";
import ConsultantDashboard from "./Pages/ConsultantDashboard";
import ConsultantProfileForm from "./components/ConsultantProfileForm";
import ConsultantProfileView from "./components/ConsultantProfileView";
import ConsultantCard from "./components/ConsultantCards";
import Offers from "./Pages/FetchOffers";
import ClientOffersPage from "./components/ConsultantOffer";
import ConsultantOffers from "./components/ConsultantoffersFetch";
import SendProjectDetails from "./components/ProjectDetailsForm";
import ProjectDetailsModal from "./components/PopUps/SeeProjectDetails";
// import { JobProvider } from "./context/JoBContext";
// import PaymentMethod from './components/PaymentMethod';


const freelancers = [
  {
    name: "Usman Shahid",
    location: "Pakistan",
    profilePic: "https://randomuser.me/api/portraits/men/1.jpg",
    smallProfilePic: "https://randomuser.me/api/portraits/women/2.jpg",

    roles: ["UI/UX Designer", "Figma Expert", "WordPress", "Graphic Designer"],
    rate: "$12/hr",
    successRate: "96% Job Success",
    earnings: "$10k+ earned",
    skills: [
      "Mobile app design",
      "Wireframe",
      "Mockup",
      "Prototyping",
      "Figma",
      "User flow",
      "+10",
    ],
    description:
      "I am an Upwork Verified and Experienced UI/UX/Graphic Designer with over 10+ years of quality experience in Websites, Mobile Apps, Branding, Editorials, Marketing Collateral, and much more...",
  },
  {
    name: "Sara Khan",
    location: "India",
    profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
    smallProfilePic: "https://randomuser.me/api/portraits/women/1.jpg",
    roles: ["UI/UX Designer", "Web Developer"],
    rate: "$15/hr",
    successRate: "98% Job Success",
    earnings: "$15k+ earned",
    skills: ["HTML", "CSS", "JavaScript", "React", "Photoshop", "+8"],
    description:
      "Passionate about creating seamless web experiences. With over 8 years in the industry, I specialize in front-end development, ensuring responsive and visually appealing designs.",
  },
  {
    name: "Sara Khan",
    location: "India",
    profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
    smallProfilePic: "https://randomuser.me/api/portraits/women/1.jpg",
    roles: ["UI/UX Designer", "Web Developer"],
    rate: "$15/hr",
    successRate: "98% Job Success",
    earnings: "$15k+ earned",
    skills: ["HTML", "CSS", "JavaScript", "React", "Photoshop", "+8"],
    description:
      "Passionate about creating seamless web experiences. With over 8 years in the industry, I specialize in front-end development, ensuring responsive and visually appealing designs.",
  },
  {
    name: "Usman Shahid",
    location: "Pakistan",
    profilePic: "https://randomuser.me/api/portraits/men/1.jpg",
    smallProfilePic: "https://randomuser.me/api/portraits/women/2.jpg",

    roles: ["UI/UX Designer", "Figma Expert", "WordPress", "Graphic Designer"],
    rate: "$12/hr",
    successRate: "96% Job Success",
    earnings: "$10k+ earned",
    skills: [
      "Mobile app design",
      "Wireframe",
      "Mockup",
      "Prototyping",
      "Figma",
      "User flow",
      "+10",
    ],
    description:
      "I am an Upwork Verified and Experienced UI/UX/Graphic Designer with over 10+ years of quality experience in Websites, Mobile Apps, Branding, Editorials, Marketing Collateral, and much more...",
  },

  // Add more freelancers as needed
];

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignUpSection />} />
          <Route path="/notifications" element={<Notification />} />

          <Route path="/alljobs" element={<AllJobsPage />} />
          <Route path="/matchingjobs" element={<JobsPage />} />
          {/* <Route
            path="/freelancersjobpage"
            element={<FreelancersDoneJobsPage />}
          />
          <Route path="/offerform" element={<OfferForm />} />
          <Route
            path="/freelancedashboard"
            element={<FreelanceDashboardPage />}
          /> */}
          <Route path="/applyjob" element={<ApplyJob />} />
          <Route path="/applyjob/:jobPostId" element={<ApplyJob />} />
          <Route path="/profile/:userId" element={<ProfileView />} />
          <Route path="/profile/:userId" element={<ProfileView />} />
          <Route path="/offerform" element={<OfferForm />} />

          <Route
            path="/freelancercard"
            element={
              <FreeLancerCard
                heading="All freelancers"
                freelancers={freelancers}
              />
            }
          />
          <Route path="/clientdashboard" element={<ClientDashboard />} />
          <Route path="/jobposting" element={<PostJob />} />
          <Route path="/jobdescription" element={<DescriptionPage />} />
          <Route path="/preferredskills" element={<SkillManagement />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/projectduration" element={<ProjectDuration />} />
          <Route path="/attachment" element={<Attachment />} />
          <Route path="/projectdetails" element={<JobDetails />} />
          <Route path="/myprofile" element={<MyProfile />} />
          <Route
            path="/submitproposal/:jobPostId"
            element={<SubmitProposal />}
          />
          <Route path="/submitproposal" element={<SubmitProposal />} />
          <Route path="/payment" element={<PaymentMethod />} />
          <Route path="/proposalpopup" element={<Popup />} />
          <Route path="/reviewpopup" element={<ReviewPopup />} />
          <Route path="/jobpopup" element={<JobPostedPopup />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Chat Route with ChatProvider */}
          <Route
            path="/chat"
            element={
              <ChatProvider>
                <Chat />
              </ChatProvider>
            }
          />

          <Route
            path="/proposals"
            element={
              <JobStatusProvider>
                <Proposal />
              </JobStatusProvider>
            }
          />
          <Route path="/ReviewPopUp" element={<ReviewPopup />} />
          <Route path="/Alljobspage" element={<AllJobsPage />} />
          <Route path="/JobPopUp" element={<JobPostedPopup />} />
          <Route path="/ForgotPass" element={<ForgotPassword />} />
          <Route path="/ChangePass/:id/:token" element={<ChangePassword />} />
          {/* <Route path="/OfferDetails/:id" element={<OfferDetails/>} />  */}
          <Route
            path="/OfferDetails/:offerId"
            element={<OfferDetails />}
          />
          <Route path="/ClientDash" element={<Clientdash />} />

          <Route
            path="/proposals/:proposalId"
            element={
              <JobStatusProvider>
                <Proposal />
              </JobStatusProvider>
            }
          />

          <Route
            path="/freelancersjobpage"
            element={
              <JobProvider>
                <FreelancersDoneJobsPage />
              </JobProvider>
            }
          />

          <Route
            path="/freelancedashboard"
            element={
              <JobProvider>
                <FreelanceDashboardPage />
              </JobProvider>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<ErrorPage />} />
          <Route path="/Payment" element={<PaymentMethod />} />
          <Route path="/propsalPopUp" element={<Popup />} />
          <Route path="/QueryForm" element={<QueryForm />} />

          <Route path="/ReviewPopUp" element={<ReviewPopup />} />
          <Route path="/Alljobspage" element={<AllJobsPage />} />
          <Route path="/JobPopUp" element={<JobPostedPopup />} />
          <Route path="/ForgotPass" element={<ForgotPassword />} />
          <Route path="/ChangePass/:id/:token" element={<ChangePassword />} />
          <Route path="/OfferDetails" element={<OfferDetails />} />
          {/* <Route path="/ClientDash" element={<Clientdash />} /> */}

          <Route path="/ManageProj" element={<ManageProjects />} />

          <Route
            path="/ManageProjectbyclient"
            element={<ManageProjectbycient />}
          />

          {/* //View your profile page// */}
          <Route path="/ClientProfile" element={<ClientProfile />} />
          {/* //make your profile by fiiling the form  */}
          <Route path="/ClientProfileForm" element={<ClientProfilePage />} />

          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/freelancerslist" element={<FreelancerList />} />
          <Route path="/clientslist" element={<ClientList />} />

          <Route path="/ConsultantDash" element={<ConsultantDashboard />} />

          <Route
            path="/ConsultantProfileForm"
            element={<ConsultantProfileForm />}
          />
          <Route
            path="/ConsultantProfileView"
            element={<ConsultantProfileView />}
          />
          <Route path="/Consultantprofiles" element={<ConsultantCard />} />

          <Route path="/freelancerOffers" element={<Offers />} />
          {/* <Route path="/profile/:id"  element={<ConsultantProfileView />} /> */}
          <Route path="/ClientOfferPage" element={<ClientOffersPage />} />

          <Route path="/ConsultantOfferPage" element={<ConsultantOffers />} />
          <Route path="/SendProjectDetails" element={<SendProjectDetails />} />
          <Route path="/SeeProjectDetails" element={<ProjectDetailsModal />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
