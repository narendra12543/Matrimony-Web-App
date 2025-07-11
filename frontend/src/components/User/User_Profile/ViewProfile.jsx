import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Briefcase,
  Home,
  Heart,
  Camera,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Users,
  GraduationCap,
  Building,
  DollarSign,
  Edit
} from 'lucide-react';
import BackButton from '../../BackButton';
import { useAuth } from '../../../contexts/Chat/AuthContext';
import axios from 'axios';

const ViewProfile = ({ onBackToCreate, isDarkMode }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/v1/users/${user._id}`);
        setProfileData(response.data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (user && user._id) fetchProfile();
  }, [user]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const InfoCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-6 border border-gray-300 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="w-6 h-6 text-black dark:text-white" />
        <h3 className="text-xl font-bold text-black dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <span className="text-gray-600 dark:text-gray-400 font-medium">{label}:</span>
        <span className="text-black dark:text-white">{value}</span>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading profile...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-xl text-red-600">{error}</div>;
  if (!profileData) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-black py-8 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBackToCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 dark:bg-gray-400 text-white dark:text-black rounded-full font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Edit</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-black dark:text-white mb-2">
              {profileData.firstName} {profileData.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {calculateAge(profileData.dateOfBirth) && `${calculateAge(profileData.dateOfBirth)} years old`}
              {profileData.city && profileData.state && ` • ${profileData.city}, ${profileData.state}`}
            </p>
          </div>
          
          <button
            onClick={onBackToCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
          >
            <Edit className="w-5 h-5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Profile Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Photos */}
          <div className="lg:col-span-1">
            <InfoCard title="Photos" icon={Camera}>
              {profileData.photos.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {profileData.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No photos uploaded</p>
                </div>
              )}
            </InfoCard>
          </div>

          {/* Right Column - Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <InfoCard title="Personal Information" icon={User}>
              <div className="space-y-2">
                <InfoRow label="Full Name" value={`${profileData.firstName} ${profileData.lastName}`} />
                <InfoRow label="Date of Birth" value={profileData.dateOfBirth} />
                <InfoRow label="Age" value={calculateAge(profileData.dateOfBirth).toString()} />
                <InfoRow label="Gender" value={profileData.gender} />
                <InfoRow label="Height" value={profileData.height} />
                <InfoRow label="Marital Status" value={profileData.maritalStatus} />
                <InfoRow label="Religion" value={profileData.religion} />
                <InfoRow label="Mother Tongue" value={profileData.motherTongue} />
              </div>
            </InfoCard>

            {/* Contact Information */}
            <InfoCard title="Contact & Location" icon={MapPin}>
              <div className="space-y-2">
                <InfoRow label="Email" value={profileData.email} />
                <InfoRow label="Phone" value={profileData.phone} />
                <InfoRow label="Country" value={profileData.country} />
                <InfoRow label="State" value={profileData.state} />
                <InfoRow label="City" value={profileData.city} />
                <InfoRow label="Residential Status" value={profileData.residentialStatus} />
              </div>
            </InfoCard>

            {/* Professional Information */}
            <InfoCard title="Professional Information" icon={Briefcase}>
              <div className="space-y-2">
                <InfoRow label="Education" value={profileData.education} />
                <InfoRow label="Education Details" value={profileData.educationDetails} />
                <InfoRow label="Occupation" value={profileData.occupation} />
                <InfoRow label="Occupation Details" value={profileData.occupationDetails} />
                <InfoRow label="Annual Income" value={profileData.annualIncome} />
                <InfoRow label="Work Location" value={profileData.workLocation} />
              </div>
            </InfoCard>

            {/* Family Information */}
            <InfoCard title="Family Information" icon={Home}>
              <div className="space-y-2">
                <InfoRow label="Family Type" value={profileData.familyType} />
                <InfoRow label="Family Status" value={profileData.familyStatus} />
                <InfoRow label="Father's Occupation" value={profileData.fatherOccupation} />
                <InfoRow label="Mother's Occupation" value={profileData.motherOccupation} />
                <InfoRow label="Siblings" value={profileData.siblings} />
                <InfoRow label="Family Location" value={profileData.familyLocation} />
              </div>
            </InfoCard>

            {/* Lifestyle Information */}
            <InfoCard title="Lifestyle & About Me" icon={Heart}>
              <div className="space-y-2">
                <InfoRow label="Diet" value={profileData.diet} />
                <InfoRow label="Smoking" value={profileData.smoking} />
                <InfoRow label="Drinking" value={profileData.drinking} />
                <InfoRow label="Hobbies" value={profileData.hobbies} />
                {profileData.aboutMe && (
                  <div className="pt-4">
                    <h4 className="text-lg font-semibold text-black dark:text-white mb-2">About Me</h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profileData.aboutMe}</p>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Partner Preferences */}
            <InfoCard title="Partner Preferences" icon={Users}>
              <div className="space-y-2">
                <InfoRow 
                  label="Age Range" 
                  value={profileData.partnerAgeMin && profileData.partnerAgeMax ? 
                    `${profileData.partnerAgeMin} - ${profileData.partnerAgeMax} years` : ''} 
                />
                <InfoRow label="Education" value={profileData.partnerEducation} />
                <InfoRow label="Occupation" value={profileData.partnerOccupation} />
                <InfoRow label="Location" value={profileData.partnerLocation} />
              </div>
            </InfoCard>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-8 space-x-4">
          <button
            onClick={onBackToCreate}
            className="px-8 py-3 bg-gray-600 dark:bg-gray-400 text-white dark:text-black rounded-full font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-all shadow-lg hover:shadow-xl"
          >
            Edit Profile
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
          >
            Print Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;
