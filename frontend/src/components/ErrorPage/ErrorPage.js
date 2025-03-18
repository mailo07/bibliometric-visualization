import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPage.css';

const ErrorPage = () => {
    return (
        <div>
            <header className="bg-gray-800 bg-opacity-80 text-white p-6 flex justify-between items-center">
                <Link to="/" className="flex items-center">
                    <i className="fas fa-home text-xl"></i>
                    <span className="ml-2">Home</span>
                </Link>
            </header>
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 shadow-md w-full mx-auto mt-32 text-center not-found-box">
                <div className="not-found-heading">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">We couldn't find the page you were looking for.</h1>
                </div>
                <div className="not-found-content">
                    <p className="text-gray-600 mb-4">This is either because:</p>
                    <ul className="list-disc pl-10 text-left text-gray-700 mb-6">
                        <li>There is an error in the URL entered into your web browser. Please check the URL and try again.</li>
                        <li>The page you are looking for has been moved or deleted.</li>
                    </ul>
                    <p className="text-gray-600 mb-6">You can return to our homepage by <Link to="/" className="text-blue-600 underline">clicking here</Link>, or you can try searching for the content you are seeking.</p>
                </div>
                <p className="text-gray-800 text-4xl font-bold mt-20">Biblioknow</p>
                <div className="mt-4 flex justify-center space-x-5">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900">
                        <i className="fab fa-twitter"></i>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900">
                        <i className="fab fa-instagram"></i>
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900">
                        <i className="fab fa-facebook"></i>
                    </a>
                </div>
                <footer className="mt-20"></footer>
            </div>
            <footer className="bg-black text-white text-center py-10 mt-10">
                <p className="text-gray-500 text-sm">This website is a just an educational project and is not meant for intended use. User discretion is advised.</p>
            </footer>
        </div>
    );
};

export default ErrorPage;