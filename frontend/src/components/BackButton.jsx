import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ className = '', onClick }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(-1);
        }
    };

    return (
        <button
            onClick={handleClick}
            title="Go Back"
            className={`
                flex items-center justify-center 
                w-12 h-12 rounded-full 
                bg-[#85BB65]/20 text-[#85BB65] 
                hover:bg-[#85BB65]/30 hover:scale-105 active:scale-95
                transition-all duration-200
                ${className}
            `}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
            </svg>
        </button>
    );
};

export default BackButton;
