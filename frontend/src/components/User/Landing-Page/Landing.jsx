import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  }
  const handleSignup = () => {
    navigate('/signup');
  }
  return (
    <div className="font-sans bg-white text-black overflow-hidden">
      {/* Navigation Bar */}
      <nav className="bg-gray-100 h-28 flex items-center justify-between px-8">
        <div className="flex items-center space-x-12">
          <img 
            src="/assets/Matrimony/save_the_date_card.png" 
            alt="Logo" 
            className="h-24 w-30 object-contain"
          />
          
          <div className="hidden lg:flex space-x-8">
            <a href="#" className="text-2xl font-semibold">Home</a>
            <a href="#" className="text-2xl">Services</a>
            <a href="#" className="text-2xl">About</a>
            <a href="#" className="text-2xl">Contact</a>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button onClick={handleLogin} className="bg-teal-400 text-white px-6 py-3 rounded-lg font-bold text-lg cursor-pointer">
            Login
          </button>
          <button onClick= {handleSignup} className="bg-teal-400 text-white px-6 py-3 rounded-lg font-bold text-lg cursor-pointer">
            Signup
          </button>
          <img 
            src="/assets/Matrimony/87a2197ff62dbde390a5c7601340e371.svg" 
            alt="Menu" 
            className="w-12 h-12"
          />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen bg-green-900 overflow-hidden">
        <img 
          src="/assets/Matrimony/pine_forest.png" 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />
        
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <img 
            src="/assets/Matrimony/couple_piggyback.png" 
            alt="Happy couple" 
            className="w-full max-w-4xl mb-8"
          />
          
          <h1 className="text-7xl font-bold text-white mb-8 max-w-4xl leading-tight">
            Find your forever
          </h1>
          
          <p className="text-2xl text-white mb-12">
            Discover a world beyond matrimony
          </p>
          
          <button className="bg-teal-400 text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-teal-500 transition">
            Find Your Match
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-red-600 py-8">
        <div className="container mx-auto flex flex-wrap justify-center items-center gap-8 text-white">
          <div className="text-center px-4">
            <p className="text-2xl font-semibold">80 Lakh Success Stories</p>
          </div>
          
          <div className="h-8 w-px bg-white"></div>
          
          <div className="text-center px-4">
            <div className="flex justify-center mb-2">
              {[...Array(5)].map((_, i) => (
                <img 
                  key={i}
                  src="/assets/Matrimony/yellow_star_1.svg" 
                  alt="Star" 
                  className="w-5 h-5 mx-1"
                />
              ))}
            </div>
            <p className="text-2xl font-semibold">#1 Matchmaking Service</p>
          </div>
          
          <div className="h-8 w-px bg-white"></div>
          
          <div className="text-center px-4">
            <p className="text-2xl font-semibold">
              Ratings on Playstore by 2.4 lakh users
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <h2 className="text-5xl font-bold text-center mb-16">
          The Shaadi Experience
        </h2>
        
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="border border-gray-300 rounded-xl p-8 hover:shadow-lg transition">
            <div className="flex items-center mb-6">
              <img 
                src="/assets/Matrimony/hand_with_coin.svg" 
                alt="Money back" 
                className="w-10 h-10 mr-4"
              />
              <h3 className="text-xl font-bold">30 Day Money Back Guarantee</h3>
            </div>
            <p className="text-gray-600">
              Get matched with someone special within 30 days, or we'll refund your money—guaranteed!
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="border border-gray-300 rounded-xl p-8 hover:shadow-lg transition">
            <div className="flex items-center mb-6">
              <img 
                src="/assets/Matrimony/blue_checkmark.svg" 
                alt="Blue tick" 
                className="w-10 h-10 mr-4"
              />
              <h3 className="text-xl font-bold">Blue Tick to find your Green Flag</h3>
            </div>
            <p className="text-gray-600">
              Did you know our blue-tick profiles get 40% more connection requests than others?
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="border border-gray-300 rounded-xl p-8 hover:shadow-lg transition">
            <div className="flex items-center mb-6">
              <img 
                src="/assets/Matrimony/lightbulb_idea.png" 
                alt="AI" 
                className="w-10 h-10 mr-4"
              />
              <h3 className="text-xl font-bold">Matchmaking Powered by AI</h3>
            </div>
            <p className="text-gray-600">
              Cutting-edge technology with two decades of matchmaking expertise to help you find "the one".
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-red-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">
            Real Stories, True Connections
          </h2>
          <p className="text-xl text-center max-w-3xl mx-auto mb-16">
            Discover how Shaadi has brought together couples through meaningful connections and shared journeys. Your success story could be next!
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-pink-50 border-2 border-black p-6 rounded-lg">
              <img 
                src="/assets/Matrimony/couple_embrace.png" 
                alt="Couple" 
                className="w-full h-96 object-cover rounded mb-6"
              />
              <h3 className="text-3xl font-bold mb-4">Ajinkya & Ashwini</h3>
              <p className="text-gray-700">
                Thank you, I have found my soulmate on this site. We started talking and later involved our parents and everything went well. Both families are happy now and we are engaged on 9th May 2025.
              </p>
              <button className="mt-6 bg-teal-200 px-8 py-3 rounded-lg font-bold hover:bg-teal-300 transition">
                View Story
              </button>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-pink-50 border-2 border-black p-6 rounded-lg">
              <img 
                src="/assets/Matrimony/traditional_ceremony.png" 
                alt="Couple" 
                className="w-full h-96 object-cover rounded mb-6"
              />
              <h3 className="text-3xl font-bold mb-4">Shreyashree & Sukdev</h3>
              <p className="text-gray-700">
                Thank you, I have found my soulmate on this site. We started talking and later involved our parents and everything went well. Both families are happy now and we are engaged on 9th May 2025.
              </p>
              <button className="mt-6 bg-teal-200 px-8 py-3 rounded-lg font-bold hover:bg-teal-300 transition">
                View Story
              </button>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <button className="bg-green-300 px-12 py-5 rounded-full text-xl font-bold hover:bg-green-400 transition">
              Get Your Match
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-800 to-blue-400 text-white">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-5xl font-medium mb-8">
            Trusted matchmakers committed to your perfect match
          </h2>
          <p className="text-xl mb-12 max-w-4xl mx-auto">
            Contact Us for Legal Assistance
          </p>
          <button className="bg-blue-900 px-8 py-4 rounded-xl font-bold hover:bg-blue-950 transition">
            Profession-Based Matching
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">RabDiJodi</h3>
              <p className="mb-4 text-gray-400">
                Trusted matchmakers committed to your perfect match
              </p>
              <div className="flex space-x-4">
                <img src="/assets/Matrimony/facebook_logo.svg" alt="Facebook" className="w-8 h-8" />
                <img src="/assets/Matrimony/instagram_logo.svg" alt="Instagram" className="w-8 h-8" />
                <img src="/assets/Matrimony/linkedin_logo.svg" alt="LinkedIn" className="w-8 h-8" />
                <img src="/assets/Matrimony/youtube_logo.svg" alt="YouTube" className="w-8 h-8" />
              </div>
            </div>
            
            <div>
              <h4 className="text-xl font-semibold mb-6">Useful Links</h4>
              <ul className="space-y-3 text-gray-400">
                <li>About Us</li>
                <li>Contact Us</li>
                <li>FAQs</li>
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xl font-semibold mb-6">Careers</h4>
              <ul className="space-y-3 text-gray-400">
                <li>Blog</li>
                <li>Press</li>
                <li>Partnerships</li>
                <li>Support</li>
                <li>Help Center</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xl font-semibold mb-6">Resources</h4>
              <ul className="space-y-3 text-gray-400">
                <li>Events</li>
                <li>Community</li>
                <li>Social Media</li>
                <li>Newsletter</li>
                <li>Subscribe</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-8 mb-4 md:mb-0">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Cookies Policy</a>
            </div>
            
            <p className="text-gray-400">
              © 2024 RabDiJodi. All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;