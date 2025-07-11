import React, { useState, useEffect, useRef } from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {
  User,
  Briefcase,
  Home,
  Heart,
  Camera,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  X,
  MapPin,
  Shield,
  Eye,
  Mail,
  Phone,
  Calendar,
  Users,
  GraduationCap,
  Building,
  DollarSign
} from 'lucide-react';
import BackButton from '../../BackButton';
import { useAuth } from '../../../contexts/Chat/AuthContext';
import axios from 'axios';

const CreateProfile = ({ onProfileCreated = () => {} }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    maritalStatus: '',
    religion: '',
    caste: '',
    motherTongue: '',
    manglik: '',
    bodyType: '',
    complexion: '',
    physicalStatus: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    residentialStatus: '',
    education: '',
    educationDetails: '',
    occupation: '',
    occupationDetails: '',
    annualIncome: '',
    workLocation: '',
    familyType: '',
    familyStatus: '',
    familyValues: '',
    fatherOccupation: '',
    motherOccupation: '',
    siblings: '',
    familyLocation: '',
    diet: '',
    smoking: '',
    drinking: '',
    hobbies: '',
    interests: '',
    aboutMe: '',
    partnerAgeMin: '',
    partnerAgeMax: '',
    partnerHeightMin: '',
    partnerHeightMax: '',
    partnerEducation: '',
    partnerOccupation: '',
    partnerIncome: '',
    partnerLocation: '',
    partnerReligion: '',
    partnerCaste: '',
    partnerMaritalStatus: '',
    partnerAbout: '',
    photos: []
  });
  const navigate = useNavigate();
  const location = useLocation();
  const totalSteps = 6;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Refs for focusable fields
  const aboutMeRef = useRef(null);
  const photosRef = useRef(null);
  const emailRef = useRef(null);

  const steps = [
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Contact & Location', icon: MapPin },
    { id: 3, title: 'Professional', icon: Briefcase },
    { id: 4, title: 'Family', icon: Home },
    { id: 5, title: 'Lifestyle', icon: Heart },
    { id: 6, title: 'Photos', icon: Camera }
  ];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const file = files[0]; // Only one at a time for now
    const formData = new FormData();
    formData.append('photo', file);
    try {
      // Optionally show upload progress
      const response = await axios.post('/api/v1/users/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const photoUrl = response.data.photoUrl;
      setProfileData(prev => ({
        ...prev,
        photos: [...prev.photos, photoUrl].slice(0, 10) // Max 10 photos
      }));
    } catch (err) {
      setError('Photo upload failed');
    }
  };

  const removePhoto = (index) => {
    setProfileData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      // Prepare form data (handle photos if needed)
      const formData = { ...profileData };
      // If you want to handle photo uploads, you may need to use FormData and a separate endpoint
      const response = await axios.put(`/api/v1/users/${user._id}`, formData);
      setSuccess('Profile updated successfully!');
      onProfileCreated(response.data);
      navigate('/profile/view');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = () => {
    onProfileCreated(profileData);
    navigate('/profile/view');
   
  };

  // Focus/scroll logic
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusField = params.get('focus');
    if (focusField) {
      // Map field to step and ref
      const fieldToStep = {
        aboutMe: 5,
        photos: 6,
        email: 2,
        // add more mappings as needed
      };
      const fieldToRef = {
        aboutMe: aboutMeRef,
        photos: photosRef,
        email: emailRef,
        // add more mappings as needed
      };
      const step = fieldToStep[focusField];
      if (step) setCurrentStep(step);
      setTimeout(() => {
        const ref = fieldToRef[focusField];
        if (ref && ref.current) {
          ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (ref.current.focus) ref.current.focus();
        }
      }, 400); // Wait for step to render
    }
    // eslint-disable-next-line
  }, [location.search]);

  useEffect(() => {
    // Fetch user profile and pre-fill form
    const fetchProfile = async () => {
      if (!user || !user._id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/v1/users/${user._id}`);
        if (response.data) {
          setProfileData(prev => ({ ...prev, ...response.data }));
        }
      } catch (err) {
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">Personal Information</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">First Name *</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your first name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Last Name *</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your last name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Gender *</label>
                <select
                  value={profileData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Height *</label>
                <select
                  value={profileData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Height</option>
                  <option value={"4'6\""}>4'6"</option>
                  <option value={"4'7\""}>4'7"</option>
                  <option value={"4'8\""}>4'8"</option>
                  <option value={"4'9\""}>4'9"</option>
                  <option value={"4'10\""}>4'10"</option>
                  <option value={"4'11\""}>4'11"</option>
                  <option value={"5'0\""}>5'0"</option>
                  <option value={"5'1\""}>5'1"</option>
                  <option value={"5'2\""}>5'2"</option>
                  <option value={"5'3\""}>5'3"</option>
                  <option value={"5'4\""}>5'4"</option>
                  <option value={"5'5\""}>5'5"</option>
                  <option value={"5'6\""}>5'6"</option>
                  <option value={"5'7\""}>5'7"</option>
                  <option value={"5'8\""}>5'8"</option>
                  <option value={"5'9\""}>5'9"</option>
                  <option value={"5'10\""}>5'10"</option>
                  <option value={"5'11\""}>5'11"</option>
                  <option value={"6'0\""}>6'0"</option>
                  <option value={"6'1\""}>6'1"</option>
                  <option value={"6'2\""}>6'2"</option>
                  <option value={"6'3\""}>6'3"</option>
                  <option value={"6'4\""}>6'4"</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Marital Status *</label>
                <select
                  value={profileData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Status</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Religion *</label>
                <select
                  value={profileData.religion}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christian">Christian</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Buddhist">Buddhist</option>
                  <option value="Jain">Jain</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Mother Tongue *</label>
                <select
                  value={profileData.motherTongue}
                  onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Language</option>
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">Contact & Location</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Email *</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your email"
                  ref={emailRef}
                  readOnly={!!profileData.email}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Country *</label>
                <select
                  value={profileData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Country</option>
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">State *</label>
                <input
                  type="text"
                  value={profileData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your state"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">City *</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your city"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Residential Status</label>
                <select
                  value={profileData.residentialStatus}
                  onChange={(e) => handleInputChange('residentialStatus', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Status</option>
                  <option value="Citizen">Citizen</option>
                  <option value="Permanent Resident">Permanent Resident</option>
                  <option value="Work Permit">Work Permit</option>
                  <option value="Student Visa">Student Visa</option>
                  <option value="Temporary Visa">Temporary Visa</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">Professional Information</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Education *</label>
                <select
                  value={profileData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Education</option>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Education Details</label>
                <input
                  type="text"
                  value={profileData.educationDetails}
                  onChange={(e) => handleInputChange('educationDetails', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="e.g., B.Tech in Computer Science"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Occupation *</label>
                <select
                  value={profileData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Occupation</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Government Employee">Government Employee</option>
                  <option value="Private Employee">Private Employee</option>
                  <option value="Student">Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Occupation Details</label>
                <input
                  type="text"
                  value={profileData.occupationDetails}
                  onChange={(e) => handleInputChange('occupationDetails', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="e.g., Senior Software Developer at Google"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Annual Income</label>
                <select
                  value={profileData.annualIncome}
                  onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Income Range</option>
                  <option value="Below ₹2 LPA">Below ₹2 LPA</option>
                  <option value="₹2-5 LPA">₹2-5 LPA</option>
                  <option value="₹5-10 LPA">₹5-10 LPA</option>
                  <option value="₹10-15 LPA">₹10-15 LPA</option>
                  <option value="₹15-25 LPA">₹15-25 LPA</option>
                  <option value="₹25-50 LPA">₹25-50 LPA</option>
                  <option value="Above ₹50 LPA">Above ₹50 LPA</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Work Location</label>
                <input
                  type="text"
                  value={profileData.workLocation}
                  onChange={(e) => handleInputChange('workLocation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter work location"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">Family Information</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Family Type</label>
                <select
                  value={profileData.familyType}
                  onChange={(e) => handleInputChange('familyType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Family Type</option>
                  <option value="Joint Family">Joint Family</option>
                  <option value="Nuclear Family">Nuclear Family</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Family Status</label>
                <select
                  value={profileData.familyStatus}
                  onChange={(e) => handleInputChange('familyStatus', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Status</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Upper Middle Class">Upper Middle Class</option>
                  <option value="Rich">Rich</option>
                  <option value="Affluent">Affluent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Father's Occupation</label>
                <input
                  type="text"
                  value={profileData.fatherOccupation}
                  onChange={(e) => handleInputChange('fatherOccupation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter father's occupation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Mother's Occupation</label>
                <input
                  type="text"
                  value={profileData.motherOccupation}
                  onChange={(e) => handleInputChange('motherOccupation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter mother's occupation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Siblings</label>
                <input
                  type="text"
                  value={profileData.siblings}
                  onChange={(e) => handleInputChange('siblings', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="e.g., 1 Brother, 1 Sister"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Family Location</label>
                <input
                  type="text"
                  value={profileData.familyLocation}
                  onChange={(e) => handleInputChange('familyLocation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter family location"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">Lifestyle & About Me</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Diet</label>
                <select
                  value={profileData.diet}
                  onChange={(e) => handleInputChange('diet', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Diet</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Jain Vegetarian">Jain Vegetarian</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Smoking</label>
                <select
                  value={profileData.smoking}
                  onChange={(e) => handleInputChange('smoking', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Option</option>
                  <option value="Never">Never</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Regularly">Regularly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Drinking</label>
                <select
                  value={profileData.drinking}
                  onChange={(e) => handleInputChange('drinking', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Option</option>
                  <option value="Never">Never</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Socially">Socially</option>
                  <option value="Regularly">Regularly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Hobbies</label>
                <input
                  type="text"
                  value={profileData.hobbies}
                  onChange={(e) => handleInputChange('hobbies', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="e.g., Reading, Traveling, Music"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">About Me</label>
              <textarea
                value={profileData.aboutMe}
                onChange={(e) => handleInputChange('aboutMe', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                placeholder="Tell us about yourself..."
                ref={aboutMeRef}
              />
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-xl border border-gray-300 dark:border-gray-600">
              <h4 className="text-lg font-semibold text-black dark:text-white mb-4">Partner Preferences</h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Age Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={profileData.partnerAgeMin}
                      onChange={(e) => handleInputChange('partnerAgeMin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={profileData.partnerAgeMax}
                      onChange={(e) => handleInputChange('partnerAgeMax', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                      placeholder="Max"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Education</label>
                  <input
                    type="text"
                    value={profileData.partnerEducation}
                    onChange={(e) => handleInputChange('partnerEducation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                    placeholder="Preferred education"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Occupation</label>
                  <input
                    type="text"
                    value={profileData.partnerOccupation}
                    onChange={(e) => handleInputChange('partnerOccupation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                    placeholder="Preferred occupation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Location</label>
                  <input
                    type="text"
                    value={profileData.partnerLocation}
                    onChange={(e) => handleInputChange('partnerLocation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                    placeholder="Preferred location"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">Upload Photos</h3>
            
            <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-xl border border-gray-300 dark:border-gray-600">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-black dark:text-white" />
                <h4 className="text-lg font-semibold text-black dark:text-white">Photo Guidelines</h4>
              </div>
              <ul className="text-sm text-black dark:text-white space-y-1">
                <li>• Upload clear, recent photos of yourself</li>
                <li>• Face should be clearly visible</li>
                <li>• No group photos or photos with other people</li>
                <li>• Maximum 10 photos allowed</li>
                <li>• Supported formats: JPG, PNG (Max 5MB each)</li>
              </ul>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-900">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                ref={photosRef}
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-black dark:text-white mb-2">Upload Photos</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Click to select photos or drag and drop</p>
              </label>
            </div>
            
            {profileData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profileData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-black dark:bg-white text-white dark:text-black rounded-full p-1 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black py-8 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        {/* Header with View Profile Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold text-black dark:text-white mb-2">Create Your Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">Find your perfect life partner with a complete profile</p>
          </div>
          
          <button
            onClick={handleViewProfile}
            className="flex items-center space-x-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
          >
            <Eye className="w-5 h-5" />
            <span>View Profile</span>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-6 mb-8 border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    isCompleted 
                      ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black' 
                      : isActive 
                        ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black' 
                        : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-black dark:text-white' : isCompleted ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Step {step.id}
                    </p>
                    <p className={`text-xs ${
                      isActive ? 'text-black dark:text-white' : isCompleted ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ml-4 ${
                      isCompleted ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-black dark:bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-8 mb-8 border border-gray-300 dark:border-gray-700">
          {success && <div className="text-green-600 font-semibold mb-4">{success}</div>}
          {error && <div className="text-red-600 font-semibold mb-4">{error}</div>}
          {loading && <div className="text-center py-4">Loading profile data...</div>}
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all ${
              currentStep === 1
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 dark:bg-gray-400 text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>
          
          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              <Check className="w-5 h-5" />
              <span>{loading ? 'Saving...' : 'Create Profile'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
