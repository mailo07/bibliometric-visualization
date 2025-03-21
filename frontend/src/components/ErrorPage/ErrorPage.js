import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPage.css'; // Ensure you have this CSS file

// If you have the caveman image in your project, import it here.
// For demonstration, I'm using a placeholder from an external URL.
const cavemanImageURL ='https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif';

const ErrorPage = () => {
return (
    <section className="page_404">
<div className="container_404">
        <div className="row_404">
<div className="col_404 text-center">
            <h1 className="code_404">404</h1>
            <img
className="caveman_img"
src={cavemanImageURL}
alt="Caveman 404"/>
            <h3 className="lost_title">Look like you're lost</h3>
            <p className="lost_text">the page you are looking for not available!
            </p>
            <Link to="/" className="link_404">Go to Home</Link></div>
        </div>
</div>
    </section>
);
};

export default ErrorPage;
