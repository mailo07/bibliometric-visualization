import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from 'scrollreveal';
import './AboutPage.css';

const AboutPage = () => {
const [openIndex, setOpenIndex] = useState(null);

const handleAccordionClick = (index) => {
    setOpenIndex(openIndex === index ? null : index);
};

const handleSignUpClick = (e) => {
    e.preventDefault();
    window.location.href = '/registerlogin?show=register';
  };

useEffect(() => {
    // Initialize ScrollReveal
    const sr = ScrollReveal({
        origin: 'bottom',
        distance: '50px',
        duration: 1000,
        delay: 200,
        easing: 'ease-in-out',
        reset: false
    });

    // Apply animations to different elements
    sr.reveal('.header-content', { delay: 200 });
    sr.reveal('.main-content', { delay: 400 });
   
    sr.reveal('.accordion-item', { interval: 200 });
    sr.reveal('img', { delay: 500 });
    
    sr.reveal('video', { delay: 400 });
   

    return () => sr.destroy();
}, []);

return (
<div className="AboutPage">
      {/* Header Section */}
    <header className="header">
        <div className="header-content">
        <div className="nav"></div>
        <div className="header-buttons">
            <Link className="home" to="/"><i className="fas fa-home"></i> HOME</Link>
        </div>
        </div>

      <div className="main-content">
        <div className="tag">FREE AND OPEN SOURCE</div>
            <h1>BIBLIOKNOW</h1>
            <p>Serves all the patents and scholarly work in the world as a free, open and secure digital public good, with user privacy a paramount focus</p>
        <button className="cta" onClick={handleSignUpClick}>SIGNUP</button>
                </div>
            </header>
    
    <div id="root-index"></div>
    <div id="root-index-2"></div>

      {/* Typewriter and Accordion */}
    <div className="flex flex-col md:flex-row min-h-screen">
        <div className="md:w-1/2 p-10">
        <div className="typewriter mt-16">
            <h1 className="text-5xl font-bold mb-8">Welcome to Biblioknow</h1>
            <br />
            <p className="text-lg mb-8">
            Our promise to you when using this website, we will always provide
            the best we have at no cost, to be used and shared by anyone with
            absolute peace of mind no one is watching.
            </p>
        </div>

        <AccordionItem
            title="Steadfast - Always Reliable" 
            content="Biblioknow allows accessible resources for studying scholarly communication and technical innovations."
            isOpen={openIndex === 0}
            onClick={() => handleAccordionClick(0)}
            className="accordion-item"
        />

        <AccordionItem
            title="Open - No Constraints" 
            content="Open access to a wide range of resources without any constraints."
            isOpen={openIndex === 1} 
            onClick={() => handleAccordionClick(1)}
            className="accordion-item"
        />

        <AccordionItem
            title="Advanced Service" 
            content="Advanced services for in-depth research and study."
            isOpen={openIndex === 2} 
            onClick={() => handleAccordionClick(2)}
            className="accordion-item"
        />
        </div>

        {/* Image Section on the right */}
        <div className="md:w-1/2 p-10">
        <img src="https://images.pexels.com/photos/11858826/pexels-photo-11858826.jpeg" alt="Bookshelves filled with books in a library" className="w-2/3 h-auto object-cover mx-auto" />
        </div>
    </div>

      {/* Scrolling Text Effect */}
    <div className="flex flex-col min-h-screen">
        <header className="bg-[#f0f0f0] text-[#4a3b2b] font-bold p-4 overflow-hidden relative">
        <div className="fade fade-left"></div>
        <div className="flex justify-center items-center">
            <span className="scrolling-text text-7xl">
            Bibliometric data Analysis and Visualization
            </span>
        </div>
        <div className="fade fade-right"></div>
        </header>

        <main className="flex justify-center items-center flex-grow p-8">
        <div className="text-center mr-8">
            <p className="text-lg">
            Discover, Analyse, and Map Global Innovation Knowledge
            </p>
        </div>
        <div>
            <video id="autoplayVideo"  className="w-[600px] h-auto" muted loop autoPlay>
            <source src="https://videos.pexels.com/video-files/6980539/6980539-uhd_2560_1440_25fps.mp4" type="video/mp4"/> Your browser does not support the video tag. </video>
        </div>
        </main>

        <footer className="bg-[#000000] text-[#FFFFFF] p-16">
        <div className="flex justify-around">
            <div className="text-center" >
            <h2 className="text-3xl font-bold"style={{ fontSize: '1.5em' }}>&copy; 2025 Biblioknow</h2>
            <div className="footer-subtitle">
                <p className="text-sm" style={{ fontSize: '0.9em' }}>Free and Open Source Scholarly Search</p>
                <p className="text-xs" style={{ fontSize: '0.8em' }}> Please Note: This is just an Educational Project. Not intended for real use </p>
            </div>
            </div>
            <div className="text-center">
            <h2 className="text-2xl font-bold" style={{ fontSize: '1.2em' }}> Location </h2>
            <p>India</p>
            <p>Meghalaya</p>
            </div>
            <div className="text-center">
            <h2 className="text-2xl font-bold" style={{ fontSize: '1.2em' }}>Contact</h2>
            <p><a href="mailto:Biblioknow00@outlook.com">BiblioKnow00@outlook.com</a><br />
                (+91) 123467890
            </p>
            </div>
        </div>
        </footer>
    </div>
    </div>
);
};

// AccordionItem Component
function AccordionItem({ title, content, isOpen, onClick, className }) {
return (
    <div className={`border-t border-gray-400 py-4 ${className || ''}`}>
    <div className="flex justify-between items-center cursor-pointer" onClick={onClick}>
        <h2 className="text-2xl font-semibold accordion-title">{title}</h2>
        <i className={`fas ${isOpen ? 'fa-minus' : 'fa-plus'} accordion-icon`} />
    </div>
    <div
        className={`accordion-content ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-gray-700 mt-2">{content}</p>
    </div>
    </div>
);
}

export default AboutPage;