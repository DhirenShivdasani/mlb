import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import 'daisyui/dist/full.css'; // Import daisyUI styles
import './styles.css'; // Import the CSS for flip animation

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false); // State to handle card flip
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide % 3) + 1); // Assuming 3 slides
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  useEffect(() => {
    const savedEmail = localStorage.getItem('email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!validateEmail(email)) {
      setError('Email is invalid');
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post('/login', {
        email,
        password,
      });
      if (response.data.status === 'success') {
        onLogin(email);
        if (rememberMe) {
          localStorage.setItem('email', email);
        } else {
          localStorage.removeItem('email');
        }
        navigate('/');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Invalid Credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!validateEmail(signupEmail)) {
      setSignupError('Email is invalid');
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post('/register', {
        email: signupEmail,
        password: signupPassword,
      });
      if (response.data.status === 'success') {
        setIsFlipped(false);
      } else {
        setSignupError(response.data.message);
      }
    } catch (err) {
      setSignupError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex">
      <div className="left-section bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683304-673a23048d34')" }}>
        <div className="bg-gradient-to-r from-black to-transparent w-full h-full flex items-center justify-center">
          <div className="text-white text-center px-10 space-y-5">
            <h2 className="text-4xl font-bold">Welcome to Prop Scout!</h2>
            <p className="text-lg">Track the latest sports betting odds available with ease for the wide variety of player props available on DFS betting platforms</p>
            <div className="carousel w-full mt-8">
              <div id="slide1" className="carousel-item relative w-full">
                <div className="card w-full bg-base-100 shadow-xl image-full">
                  <div className="card-body p-6">
                    <h2 className="card-title text-2xl font-bold">Real-time Odds</h2>
                    <figure><img src={`${process.env.PUBLIC_URL}/images/real_time_odds.png`} alt="Real-time Odds" /></figure>
                    <p className="mt-4">Stay updated with real-time odds for various player props. Never miss an opportunity to make informed betting decisions with up-to-the-minute data.</p>
                  </div>
                </div>
                <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                  <a href="#slide3" className="btn btn-circle">❮</a>
                  <a href="#slide2" className="btn btn-circle">❯</a>
                </div>
              </div>
              <div id="slide2" className="carousel-item relative w-full">
                <div className="card w-full bg-base-100 shadow-xl image-full">
                  <div className="card-body p-6">
                    <h2 className="card-title text-2xl font-bold">Wide Variety of Props</h2>
                    <figure><img src="https://images.unsplash.com/photo-1543163521-1bf374cb1a4e" alt="Wide Variety of Props" /></figure>
                    <p className="mt-4">Choose from a wide variety of player props available. From points scored to rebounds, find the perfect bet that suits your strategy.</p>
                  </div>
                </div>
                <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                  <a href="#slide1" className="btn btn-circle">❮</a>
                  <a href="#slide3" className="btn btn-circle">❯</a>
                </div>
              </div>
              <div id="slide3" className="carousel-item relative w-full">
                <div className="card w-full bg-base-100 shadow-xl image-full">
                  <div className="card-body p-6">
                    <h2 className="card-title text-2xl font-bold">Favorite Props & Notifications</h2>
                    <figure><img src="https://images.unsplash.com/photo-1553356084-28c76f48c088" alt="Favorite Props & Notifications" /></figure>
                    <p className="mt-4">Select your favorite props and receive real-time notifications whenever the odds change. Stay ahead of the game and make timely betting decisions.</p>
                  </div>
                </div>
                <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                  <a href="#slide2" className="btn btn-circle">❮</a>
                  <a href="#slide1" className="btn btn-circle">❯</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="right-section flex items-center justify-center w-full lg:w-1/2 bg-gray-100 p-8">
        <div className="relative w-full max-w-md">
          <div className={`flip-card ${isFlipped ? 'flip' : ''}`}>
            <div className="flip-card-inner">
              {/* Login Form */}
              <div className="flip-card-front flex items-center justify-center">
                <div className="card-content w-full">
                  <div className="text-center mb-6">
                    <img src="https://via.placeholder.com/100" alt="Logo" className="mx-auto w-24 h-24" />
                    <h2 className="text-3xl font-bold text-gray-900 mt-4">Login</h2>
                  </div>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {error && <div className="text-red-500 text-center">{error}</div>}
                    <div className="form-group">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          <FaEnvelope />
                        </span>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="input input-bordered w-full pl-10"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          <FaLock />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="input input-bordered w-full pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="rememberMe"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">Remember me</label>
                      </div>
                      <div className="text-sm">
                        <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">Forgot your password?</a>
                      </div>
                    </div>
                    <div className="form-group">
                      {loading ? (
                        <div className="flex justify-center">
                          <span className="loading loading-spinner loading-lg"></span>
                        </div>
                      ) : (
                        <button type="submit" className="btn btn-primary w-full bg-blue-600 hover:bg-blue-700 text-white">Login</button>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Don't have an account? <span onClick={() => setIsFlipped(true)} className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">Sign Up here</span></p>
                    </div>
                  </form>
                </div>
              </div>

              {/* Signup Form */}
              <div className="flip-card-back flex items-center justify-center">
                <div className="card-content w-full">
                  <div className="text-center mb-6">
                    <img src="https://via.placeholder.com/100" alt="Logo" className="mx-auto w-24 h-24" />
                    <h2 className="text-3xl font-bold text-gray-900 mt-4">Sign Up</h2>
                  </div>
                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    {signupError && <div className="text-red-500 text-center">{signupError}</div>}
                    <div className="form-group">
                      <label htmlFor="signupEmail" className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          <FaEnvelope />
                        </span>
                        <input
                          type="email"
                          id="signupEmail"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          className="input input-bordered w-full pl-10"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700">Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          <FaLock />
                        </span>
                        <input
                          type="password"
                          id="signupPassword"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          className="input input-bordered w-full pl-10"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      {loading ? (
                        <div className="flex justify-center">
                          <span className="loading loading-spinner loading-lg"></span>
                        </div>
                      ) : (
                        <button type="submit" className="btn btn-primary w-full bg-blue-600 hover:bg-blue-700 text-white">Sign Up</button>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Already have an account? <span onClick={() => setIsFlipped(false)} className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">Login here</span></p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;