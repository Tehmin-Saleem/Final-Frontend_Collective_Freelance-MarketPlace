import React, { useEffect, useState } from 'react';
import './styles.scss';
import Header from '../Commoncomponents/Header';
import { message } from 'antd';
import { useLocation } from 'react-router-dom';
import { Modal,Divider, Form, Input, Select, InputNumber } from 'antd';
const ConsultantCard = () => {
  const [consultants, setConsultants] = useState([]);
  const [filteredConsultants, setFilteredConsultants] = useState([]);
  const [filters, setFilters] = useState({
    location: '',
    skill: '',
    experienceLevel: '',
    educationDegree: '',
  });
  const { Option } = Select;
const { TextArea } = Input;
  const location = useLocation();
  const [projectDetails, setProjectDetails] = useState({
    projectName: '',
    projectDescription: ''
  });
  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [offerForm] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extract project details from navigation state
    if (location.state && location.state.project) {
      setProjectDetails(location.state.project);
      console.log("Project Details:", location.state.project);
    }
  }, [location]);
  const showOfferModal = (consultant) => {
    // Ensure project details exist before opening modal
    if (!projectDetails || !projectDetails.projectName) {
      message.error('Please select a project first');
      return;
    }

    setSelectedConsultant(consultant);
    setIsOfferModalVisible(true);
    
    // Preset form with project details
    offerForm.setFieldsValue({
      projectName: projectDetails.projectName,
      projectDescription: projectDetails.description,
      budget_type: 'hourly',
      hourly_rate_from: null,
      hourly_rate_to: null,
      fixed_price: null
    });
  };
  const handleSendOffer = async (formValues) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authorization token is missing');
        return;
      }
  
      const offerPayload = {
        projectName: formValues.projectName,
        projectDescription: formValues.projectDescription,
        budget_type: formValues.budget_type,
        ...(formValues.budget_type === 'hourly'
          ? {
              hourly_rate_from: formValues.hourly_rate_from,
              hourly_rate_to: formValues.hourly_rate_to
            }
          : {
              fixed_price: formValues.fixed_price
            }
        ),
        consultant_id: selectedConsultant.consultant_id
      };
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;
      const response = await fetch(
        `${BASE_URL}/api/client/send-offer-to-consultant/${selectedConsultant.consultant_id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(offerPayload),
        }
      );
  
      const data = await response.json();
  
      if (data.success) {
        message.success('Offer sent successfully');
        setIsOfferModalVisible(false);
        offerForm.resetFields();
      } else {
        message.error(data.message || 'Failed to send offer');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      message.error('An error occurred while sending the offer');
    }
  };
  
  useEffect(() => {
    const fetchConsultants = async () => {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL
      try {
        const response = await fetch(`${BASE_URL}/api/client/Consultantsprofiles`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("profiledata",data);

        if (Array.isArray(data)) {
          setConsultants(data);
          setFilteredConsultants(data); // Initial display
        } else {
          throw new Error('Expected an array from the API');
        }
      } catch (error) {
        console.error('Error fetching consultants:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultants();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

 

  useEffect(() => {
    let updatedConsultants = consultants;

    if (filters.location) {
      updatedConsultants = updatedConsultants.filter((consultant) =>
        consultant.address.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.skill) {
      updatedConsultants = updatedConsultants.filter((consultant) => {
        // If skills is an array, use it directly
        if (Array.isArray(consultant.skills)) {
          return consultant.skills
            .map(skill => skill.trim().toLowerCase())
            .some(skill => skill.includes(filters.skill.toLowerCase()));
        }
        
        // If skills is a string, split it
        if (typeof consultant.skills === 'string') {
          return consultant.skills
            .split(',')
            .map(skill => skill.trim().toLowerCase())
            .some(skill => skill.includes(filters.skill.toLowerCase()));
        }
        
        // If skills is neither array nor string, return false
        return false;
      });
    }

    if (filters.experienceLevel) {
      updatedConsultants = updatedConsultants.filter((consultant) =>
        consultant.experience.some((exp) =>
          exp.years >= parseInt(filters.experienceLevel, 10)
        )
      );
    }

    if (filters.educationDegree) {
      updatedConsultants = updatedConsultants.filter((consultant) =>
        consultant.education.some((edu) =>
          edu.degree.toLowerCase().includes(filters.educationDegree.toLowerCase())
        )
      );
    }

    setFilteredConsultants(updatedConsultants);
  }, [filters, consultants]);

  if (isLoading) {
    return <div>Loading consultants...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (filteredConsultants.length === 0) {
    return <div>No consultants found matching the filters.</div>;
  }

  return (
    <>
     
    <Header/>
    <div className="filter-container">
    
    <div className="filters">
  <div className="filter-input">
    <label htmlFor="location">Location:</label>
    <input
      id="location"
      type="text"
      placeholder="Filter by location"
      value={filters.location}
      onChange={(e) => handleFilterChange('location', e.target.value)}
    />
  </div>
  
  <div className="filter-input">
    <label htmlFor="skill">Skill:</label>
    <input
      id="skill"
      type="text"
      placeholder="Filter by skill"
      value={filters.skill}
      onChange={(e) => handleFilterChange('skill', e.target.value)}
    />
  </div>

  <div className="filter-input">
    <label htmlFor="experienceLevel">Experience:</label>
    <input
      id="experienceLevel"
      type="number"
      placeholder="Filter by min experience (years)"
      value={filters.experienceLevel}
      onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
    />
  </div>

  <div className="filter-input">
    <label htmlFor="educationDegree">Education Degree:</label>
    <input
      id="educationDegree"
      type="text"
      placeholder="Filter by education degree"
      value={filters.educationDegree}
      onChange={(e) => handleFilterChange('educationDegree', e.target.value)}
    />
  </div>
</div>

<div className="consultant-card-container">
        {filteredConsultants.map((consultant) => (
          <div key={consultant._id} className="consultant-card">
            <div>
              <button 
                className="send-offer-button" 
                onClick={() => showOfferModal(consultant)}
                disabled={!projectDetails || !projectDetails.projectName}
              >
                Send Offer
              </button>
            </div>
            <img src={consultant.profilePicture} alt="Profile" className="profile-picture" />
            <h3 className="consultant-name">{consultant.email}</h3>
            <p className="consultant-location">{consultant.address}</p>
            <h4 className="section-title"> {`${consultant.firstname || ''} ${consultant.lastname || ''}`.trim()}</h4>
            <h4 className="section-title">Bio</h4>
            <p className="consultant-bio">{consultant.bio}</p>
            

            <h4 className="section-title">Experience</h4>
            <ul className="experience-list">
              {consultant.experience.map((exp, index) => (
                <li key={index}>
                  <strong>{exp.title}</strong> at {exp.company} ({exp.years} years)
                </li>
              ))}
            </ul>

            <h4 className="section-title">Education</h4>
            <ul className="education-list">
              {consultant.education.map((edu, index) => (
                <li key={index}>
                  <strong>{edu.degree}</strong>, {edu.institution} ({edu.year})
                </li>
              ))}
            </ul>
            <h4 className="section-title">Skills</h4>
            <div className="skills">
  {consultant.skills ? (
    Array.isArray(consultant.skills) ? (
      consultant.skills.map((skill, index) => (
        <span key={index} className="skill-tag">{skill.trim()}</span>
      ))
    ) : (
      consultant.skills.split(',').map((skill, index) => (
        <span key={index} className="skill-tag">{skill.trim()}</span>
      ))
    )
  ) : (
    <p>No skills listed</p>
  )}
</div>

            <h4 className="section-title">Certifications</h4>
            <p>{consultant.certifications}</p>

            <h4 className="section-title">LinkedIn URL</h4>
            <p>{consultant.linkedIn}</p>
          </div>
        ))}
      </div>
    </div>
    <Modal
      title="Send Offer to Consultant"
      visible={isOfferModalVisible}
      onCancel={() => setIsOfferModalVisible(false)}
      onOk={() => offerForm.submit()}
    >
      <Form
        form={offerForm}
        layout="vertical"
        onFinish={handleSendOffer}
      >
        <Form.Item
          name="projectName"
          label="Project Name"
          rules={[{ required: true, message: 'Project name is required' }]}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="projectDescription"
          label="Project Description"
          rules={[{ required: true, message: 'Project description is required' }]}
        >
          <TextArea rows={4} disabled />
        </Form.Item>

        <Form.Item
          name="budget_type"
          label="Budget Type"
          rules={[{ required: true, message: 'Please select budget type' }]}
        >
          <Select placeholder="Select Budget Type">
            <Option value="hourly">Hourly</Option>
            <Option value="fixed">Fixed Price</Option>
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.budget_type !== currentValues.budget_type}
        >
          {({ getFieldValue }) => 
            getFieldValue('budget_type') === 'hourly' ? (
              <>
                <Form.Item
                  name="hourly_rate_from"
                  label="Hourly Rate (From)"
                  rules={[{ required: true, message: 'Please input minimum hourly rate' }]}
                >
                  <InputNumber 
                    min={0} 
                    placeholder="Minimum Hourly Rate" 
                    style={{ width: '100%' }} 
                  />
                </Form.Item>
                <Form.Item
                  name="hourly_rate_to"
                  label="Hourly Rate (To)"
                  rules={[{ 
                    required: true, 
                    message: 'Please input maximum hourly rate' 
                  }, 
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const from = getFieldValue('hourly_rate_from');
                      if (!value || !from || value >= from) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Maximum rate must be greater than minimum rate'));
                    },
                  })]}
                >
                  <InputNumber 
                    min={0} 
                    placeholder="Maximum Hourly Rate" 
                    style={{ width: '100%' }} 
                  />
                </Form.Item>
              </>
            ) : (
              <Form.Item
                name="fixed_price"
                label="Fixed Price"
                rules={[{ required: true, message: 'Please input fixed price' }]}
              >
                <InputNumber 
                  min={0} 
                  placeholder="Fixed Project Price" 
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
    </>
  );
};

export default ConsultantCard;
