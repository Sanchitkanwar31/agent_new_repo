// import { Link } from "wouter";

// export function LandingFooter() {
//   return (
//     <footer className="landing-footer">
//       <div className="landing-container landing-footer-inner">
//         <p className="landing-footer-copy">
//           Signo Voice AI Platform
//         </p>
//         <div className="landing-footer-links">
//           <a href="features">Features</a>
//           <Link href="/dashboard">Dashboard</Link>
//         </div>
//       </div>
//     </footer>
//   );
// }



import React from 'react';
import "@/features/landing/styles/footer.css";
import logo from "@assets/signologo.png";
import { FaFacebookF, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import { FaGooglePlay } from 'react-icons/fa';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';

export function LandingFooter() {
    const currentYear = new Date().getFullYear();
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=in.signo.connect';

    return (
        <footer className='footer'>
            <div className='footer_content'>
                <div className='brand_img'>
                    <a href="https://www.signo.in/in" target="_blank" rel="noopener noreferrer" className='footer_logo_link' aria-label="Visit Signo website">
                        <img src={ logo } className='footer_logo_img' alt="Signo" />
                        
                    </a>
                    <p className='footer_desc'>
                        AI-driven mobility and blue-collar hiring platform connecting logistics companies with verified skilled manpower.
                    </p>
                    {/* <div className='footer_actions'>
                        <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className='play_link' aria-label="Download Signo on Google Play">
                            <FaGooglePlay className='play_icon' />
                            <span>
                                <small>Get the app</small>
                                Google Play
                            </span>
                        </a>
                    </div> */}
                </div>
                <div className='footer_social'>
                    <p className='footer_title'>Social</p>
                    <div className='footer_social_links' aria-label="Social links">
                        <a href="https://www.linkedin.com/company/signo-drive/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                            <FaLinkedinIn />
                            <span>LinkedIn</span>
                        </a>
                        <a href="https://x.com/SignoDrive" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                            <FaTwitter />
                            <span>Twitter</span>
                        </a>
                        <a href="https://www.facebook.com/Signodrive" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <FaFacebookF />
                            <span>Facebook</span>
                        </a>
                    </div>
                </div>
                <div className='footer_contact'>
                    <p className='footer_title'>Contact Us</p>
                    <a
                        href="https://maps.google.com/?q=4th+Floor+C56/32+Sector+62+Noida+Uttar+Pradesh+201309"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="location_wrapper"
                    >
                        <FiMapPin className="location_icon" />

                        <div>
                            <p className='head_office'>
                                HEAD OFFICE: Signodrive Technologies Pvt. Ltd.,
                            </p>

                            <p className='address'>
                                4th Floor, C56/32, Sector 62, Noida,
                            </p>

                            <p className='address'>
                                Uttar Pradesh 201309
                            </p>
                        </div>
                    </a>
                    <div className='global_presence'>
                        <strong>Global Presence:</strong> USA | Canada | Dubai
                    </div>
                    <div className="contact_item">
                        <FiMail className="contact_icon" />
                        <a href="mailto:info@signo.in">info@signo.in</a>
                    </div>
                    <div className="contact_item">
                        <FiPhone className="contact_icon" />
                        <a href="tel:+918700721854">+91 8700721854</a>
                    </div>
                </div>
            </div>

            <div className='footer_bottom'>
                <p>&copy; {currentYear} Signodrive Technologies Pvt. Ltd. All rights reserved.</p>
                <div className='legal_links'>
                    <a href="https://www.signo.in/in/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                    <a href="https://www.signo.in/in/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
