import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAllUsers } from '../services/userService';
import { sendRequest } from '../services/requestService';
import { useAuth } from '../contexts/Chat/AuthContext';
import { MessageCircle, Heart, Star, Globe, Briefcase, GraduationCap, MapPin, Cake, Smartphone, User, Camera, Smile, Globe2, Coffee, Music, BookOpen } from 'lucide-react';

export default function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteStatus, setInviteStatus] = useState('idle');
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    setLoading(true);
    getAllUsers()
      .then(data => {
        const users = Array.isArray(data) ? data : data.users || [];
        setProfile(users.find(u => u._id === userId) || null);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSendInvite = async () => {
    if (!user || !profile?._id || user._id === profile._id) return;
    setInviteStatus('loading');
    try {
      await sendRequest(profile._id);
      setInviteStatus('sent');
    } catch {
      setInviteStatus('idle');
    }
  };

  const handleMessage = () => {
    navigate(`/chat/${profile._id}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse flex flex-col items-center">
        <div className="rounded-full bg-purple-200 h-24 w-24 mb-4"></div>
        <div className="h-6 bg-purple-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-purple-200 rounded w-32"></div>
      </div>
    </div>
  );
  
  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <div className="text-6xl mb-4">👻</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
      <p className="text-gray-600 max-w-md mb-6">
        The profile you're looking for doesn't exist or may have been removed
      </p>
      <button 
        onClick={() => navigate('/')}
        className="px-6 py-3 rounded-full font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all"
      >
        Discover Other Profiles
      </button>
    </div>
  );

  // Calculate age from date of birth
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile.dateOfBirth);

  // Process interests and hobbies
  const interestsArray = Array.isArray(profile.interests)
    ? profile.interests
    : typeof profile.interests === 'string'
      ? profile.interests.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  const hobbiesArray = Array.isArray(profile.hobbies)
    ? profile.hobbies
    : typeof profile.hobbies === 'string'
      ? profile.hobbies.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  // Icon mapping for interests
  const interestIcons = {
    travel: <Globe2 className="w-5 h-5 mr-2 text-blue-500" />,
    music: <Music className="w-5 h-5 mr-2 text-purple-500" />,
    reading: <BookOpen className="w-5 h-5 mr-2 text-green-500" />,
    coffee: <Coffee className="w-5 h-5 mr-2 text-amber-600" />,
    default: <Smile className="w-5 h-5 mr-2 text-pink-500" />
  };

  const getInterestIcon = (interest) => {
    const lowerInterest = interest.toLowerCase();
    for (const [key, icon] of Object.entries(interestIcons)) {
      if (lowerInterest.includes(key)) return icon;
    }
    return interestIcons.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6">
      {/* Floating decorative elements */}
      <div className="fixed top-20 left-10 w-32 h-32 rounded-full bg-purple-100 opacity-20 blur-xl -z-10"></div>
      <div className="fixed bottom-40 right-20 w-48 h-48 rounded-full bg-pink-100 opacity-20 blur-xl -z-10"></div>
      
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="relative rounded-2xl overflow-hidden mb-6 shadow-lg">
          <div 
            className="h-48 md:h-64 w-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{
              backgroundImage: profile.coverPhoto && `url(${profile.coverPhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
          
          {/* Profile picture */}
          <div className="absolute -bottom-16 mb-[100px] left-1/2 transform -translate-x-1/2">
            <div className="relative group">
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.firstName} 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-xl transition-transform duration-300 group-hover:scale-105" 
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-5xl font-bold text-purple-700 border-4 border-white shadow-xl">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
              )}
              {profile.isVerified && (
                <div className="absolute -top-2 -right-2 bg-white p-1 rounded-full shadow-md">
                  <Star className="w-5 h-5 text-blue-500 fill-current" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main profile content */}
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 border border-gray-100">
          <div className="text-center mt-16 md:mt-8 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {profile.firstName} {profile.lastName}
              {age && <span className="text-xl text-gray-500 ml-2">, {age}</span>}
            </h1>
            <div className="flex items-center justify-center text-gray-600 mb-6">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{[profile.city, profile.country].filter(Boolean).join(', ') || 'Unknown location'}</span>
            </div>
            
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={handleSendInvite}
                disabled={inviteStatus === 'sent' || inviteStatus === 'loading'}
                className={`px-6 py-2 rounded-full font-medium flex items-center gap-2 transition-all ${
                  inviteStatus === 'sent'
                    ? 'bg-green-500 text-white opacity-80 cursor-not-allowed'
                    : inviteStatus === 'loading'
                      ? 'bg-gray-500 text-white opacity-80 cursor-wait'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <Heart className="w-5 h-5" />
                {inviteStatus === 'sent' ? 'Connected' : inviteStatus === 'loading' ? 'Sending...' : 'Connect'}
              </button>
              <button
                onClick={handleMessage}
                className="px-6 py-2 rounded-full font-medium flex items-center gap-2 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-all hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" />
                Message
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex justify-center border-b border-gray-200 mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-full">
              {['about', 'interests', 'photos'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                    activeTab === tab
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="space-y-8">
            {activeTab === 'about' && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* About section */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-purple-500" />
                      About Me
                    </h2>
                    {profile.aboutMe ? (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {profile.aboutMe}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">No bio yet</p>
                    )}
                  </div>

                  {/* Personal details */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-purple-500" />
                      Personal Details
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Cake className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Birthday</div>
                          <div>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <User className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Gender</div>
                          <div>{profile.gender || 'Not specified'}</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Smartphone className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Phone</div>
                          <div>{profile.phone || 'Not specified'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional details */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-purple-500" />
                      Professional Life
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <GraduationCap className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Education</div>
                          <div>{profile.education || 'Not specified'}</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Briefcase className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Occupation</div>
                          <div>{profile.occupation || 'Not specified'}</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Work Location</div>
                          <div>{profile.workLocation || 'Not specified'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility meter */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-pink-500" />
                      Compatibility
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Personality Match</span>
                          <span className="text-sm font-medium text-gray-700">{Math.floor(Math.random() * 30) + 70}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full" 
                            style={{ width: `${Math.floor(Math.random() * 30) + 70}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Interest Similarity</span>
                          <span className="text-sm font-medium text-gray-700">{Math.floor(Math.random() * 40) + 60}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full" 
                            style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'interests' && (
              <div className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-pink-500" />
                    Interests & Hobbies
                  </h2>
                  
                  {interestsArray.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-medium text-gray-700 mb-4">Interests</h3>
                      <div className="flex flex-wrap gap-3">
                        {interestsArray.map((interest, idx) => (
                          <div 
                            key={interest} 
                            className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 hover:shadow-md transition-all"
                          >
                            {getInterestIcon(interest)}
                            <span className="text-gray-800">{interest}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hobbiesArray.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-4">Hobbies</h3>
                      <div className="flex flex-wrap gap-3">
                        {hobbiesArray.map((hobby, idx) => (
                          <div 
                            key={hobby} 
                            className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 hover:shadow-md transition-all"
                          >
                            {getInterestIcon(hobby)}
                            <span className="text-gray-800">{hobby}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {interestsArray.length === 0 && hobbiesArray.length === 0 && (
                    <div className="text-center py-8">
                      <Smile className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No interests or hobbies specified yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="bg-gray-50 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-purple-500" />
                  Photo Gallery
                </h2>
                {profile.photos && profile.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.photos.map((photo, idx) => (
                      <div 
                        key={idx} 
                        className="aspect-square bg-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all group"
                      >
                        <img 
                          src={photo} 
                          alt={`${profile.firstName}'s photo ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No photos yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      When {profile.firstName} shares photos, they'll appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}