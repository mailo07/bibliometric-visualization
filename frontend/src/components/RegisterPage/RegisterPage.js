import React, { useState } from 'react';

import './RegisterPage.css';

export default function RegisterLoginPage() {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className={`flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-200 to-indigo-300`}>
      <div className={`relative w-[850px] h-[550px] bg-white rounded-[30px] shadow-xl overflow-hidden transition-all duration-700 ${isActive ? 'active' : ''}`}>
        {/* Login Form */}
        <div className={`absolute right-0 w-1/2 h-full flex flex-col items-center text-center p-10 transition-all duration-700 ${isActive ? 'right-1/2' : ''}`}>
          <form>
            <h1 className="text-3xl font-bold">Login</h1>
            <div className="relative my-6">
              <input type="text" placeholder="Username" required className="w-full p-3 pr-10 bg-gray-200 rounded-lg text-lg" />
              <i className="fas fa-user absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-xl"></i>
            </div>
            <div className="relative my-6">
              <input type="password" placeholder="Password" required className="w-full p-3 pr-10 bg-gray-200 rounded-lg text-lg" />
              <i className="fas fa-lock absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-xl"></i>
            </div>
            <a href="#" className="text-sm text-gray-600">Forgot Password?</a>
            <button type="submit" className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg">Login</button>
            <p className="mt-4">or login with social platforms</p>
            <div className="flex justify-center mt-4 space-x-3">
              <a href="#" className="text-2xl text-gray-700"><i className="fab fa-google"></i></a>
              <a href="#" className="text-2xl text-gray-700"><i className="fab fa-facebook"></i></a>
              <a href="#" className="text-2xl text-gray-700"><i className="fab fa-github"></i></a>
              <a href="#" className="text-2xl text-gray-700"><i className="fab fa-linkedin"></i></a>
            </div>
          </form>
        </div>

        {/* Registration Form */}
        <div className={`absolute right-0 w-1/2 h-full flex flex-col items-center text-center p-10 transition-all duration-700 ${isActive ? 'visible' : 'invisible'}`}>
          <form>
            <h1 className="text-3xl font-bold">Registration</h1>
            <div className="relative my-6">
              <input type="text" placeholder="Username" required className="w-full p-3 pr-10 bg-gray-200 rounded-lg text-lg" />
              <i className="fas fa-user absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-xl"></i>
            </div>
            <div className="relative my-6">
              <input type="email" placeholder="Email" required className="w-full p-3 pr-10 bg-gray-200 rounded-lg text-lg" />
              <i className="fas fa-envelope absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-xl"></i>
            </div>
            <div className="relative my-6">
              <input type="password" placeholder="Password" required className="w-full p-3 pr-10 bg-gray-200 rounded-lg text-lg" />
              <i className="fas fa-lock absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-xl"></i>
            </div>
            <button type="submit" className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg">Register</button>
            <p className="mt-4">or register with social platforms</p>
            <div className="flex justify-center mt-4 space-x-3">
              <a href="#" className="text-2xl text-gray-700"><i className="fab fa-google"></i></a>
              <a href="#" className="text-2xl text-gray-700"><i className="fab fa-facebook"></i></a>
              <a href="#" className="text-2xl text-gray-700"><i className="fab fa-github"></i></a>
              <a href="#" className="text-2xl text-gray-700"><i className="fab fa-linkedin"></i></a>
            </div>
          </form>
        </div>

        {/* Toggle Section */}
        <div className="absolute w-full h-full">
          <div className="absolute left-0 w-1/2 h-full flex flex-col items-center justify-center bg-blue-500 text-white transition-all duration-700" style={{ transform: isActive ? "translateX(-100%)" : "translateX(0)" }}>
            <h1 className="text-3xl font-bold">Hello, Welcome!</h1>
            <p className="mt-4">Don't have an account?</p>
            <button className="mt-4 px-6 py-2 border border-white rounded-lg" onClick={() => setIsActive(true)}>Register</button>
          </div>
          <div className="absolute right-0 w-1/2 h-full flex flex-col items-center justify-center bg-blue-500 text-white transition-all duration-700" style={{ transform: isActive ? "translateX(0)" : "translateX(100%)" }}>
            <h1 className="text-3xl font-bold">Welcome Back!</h1>
            <p className="mt-4">Already have an account?</p>
            <button className="mt-4 px-6 py-2 border border-white rounded-lg" onClick={() => setIsActive(false)}>Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}
