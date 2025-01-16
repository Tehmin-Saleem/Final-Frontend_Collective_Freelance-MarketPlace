import React from 'react';

import { Link } from 'react-router-dom';

import { Logo } from '../../svg/index'; // Assuming the Logo component is in the same directory as in the header

import './styles.scss'; // Create a CSS file for styling

 

const Footer = () => {

  const currentYear = new Date().getFullYear();

 

  const footerSections = {

    company: {

      title: 'Company',

      links: [

        // { name: 'About Us', path: '/about' },

        // { name: 'Careers', path: '/careers' },

        // { name: 'Press', path: '/press' },

        { name: 'Contact Us', path: '/QueryForm' }

      ]

    },

    resources: {

      title: 'Resources',

      links: [

        // { name: 'Help & Support', path: '/support' },

        // { name: 'Trust & Safety', path: '/trust' },

        { name: 'Privacy Policy', path: '/privacy-policy' },

        { name: 'Terms of Service', path: '/terms-conditions' }

      ]

    },

    // browse: {

    //   title: 'Browse',

    //   links: [

    //     // { name: 'Freelancers', path: '/freelancercard' },

    //     // { name: 'Projects', path: '/matchingjobs' },

    //     // { name: 'Consultants', path: '/consultants' },

    //     // { name: 'Featured Jobs', path: '/alljobs' }

    //   ]

    // }

  };

 

  const socialLinks = [

    { name: 'LinkedIn', icon: '🔗', url: '#' },

    { name: 'Twitter', icon: '🐦', url: '#' },

    { name: 'Facebook', icon: '📘', url: '#' },

    { name: 'Instagram', icon: '📸', url: '#' }





  ];





  // "/terms-conditions" element={<TermsConditions />} />

  //         <Route path="/privacy-policy

 

  return (

    <footer className="footer bg-[#4BCBEB] bg-opacity-10 mt-6">

      <div className="footer-content">

        <div className="footer-logo">

          <Logo width="150" height="60" />

        </div>

        <div className="footer-sections">

          {Object.values(footerSections).map((section) => (

            <div key={section.title} className="footer-section">

              <h3>{section.title}</h3>

              <ul>

                {section.links.map((link) => (

                  <li key={link.name}>

                    <Link to={link.path}>{link.name}</Link>

                  </li>

                ))}

              </ul>

            </div>

          ))}

        </div>

        {/* <div className="footer-social">

          <h3>Connect With Us</h3>

          <div className="social-icons">

            {socialLinks.map((social) => (

              <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer">

                {social.icon}

              </a>

            ))}

          </div>

        </div> */}

      </div>

      <div className="footer-bottom">

        <p>&copy; {currentYear} Embrace-Freelance Market Place. All rights reserved.</p>

        <div className="language-selector">

          {/* <span>English</span> */}

          {/* <span>Español</span>

          <span>Français</span> */}

        </div>

      </div>

    </footer>

  );

};

 

export default Footer;