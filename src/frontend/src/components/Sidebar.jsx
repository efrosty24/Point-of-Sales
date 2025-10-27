import { useState } from "react";
import "./Sidebar.css";

function Sidebar() {
    const [collapsed, setCollapsed] = useState(true);
    const [openDropdown, setOpenDropdown] = useState(false);

    const toggleCollapse = () => setCollapsed(!collapsed);

    const toggleDropdown = () => {
        if (collapsed) setCollapsed(false);
        setOpenDropdown(!openDropdown);
    };

    return (
        <aside className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
            <div className="sidebar-header">
                <button onClick={toggleCollapse} className="collapse-btn">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h7"
                        />
                    </svg>
                </button>
                {!collapsed && (
                    <div className="sidebar-title-wrapper">
                        <div className="sidebar-title">
                            <h2>Welcome Back</h2>
                            <p>Navigation</p>
                        </div>
                    </div>
                )}
            </div>

            <ul className="sidebar-menu">
                <li>
                    <a href="/Dashboard" className="sidebar-link">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 9.77746V16.2C5 17.8802 5 18.7203 5.32698 19.362C5.6146 19.9265 6.07354 20.3854 6.63803 20.673C7.27976 21 8.11984 21 9.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7203 19 17.8802 19 16.2V5.00002M21 12L15.5668 5.96399C14.3311 4.59122 13.7133 3.90484 12.9856 3.65144C12.3466 3.42888 11.651 3.42893 11.0119 3.65159C10.2843 3.90509 9.66661 4.59157 8.43114 5.96452L3 12M14 21V15H10V21"
                            />
                        </svg>
                        {!collapsed && <span>Dashboard</span>}
                    </a>
                </li>

                <li>
                    <a href="/SalesReport" className="sidebar-link">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M3 3v18h18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M9 17v-6M13 17v-10M17 17v-4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {!collapsed && <span>Sales Report</span>}
                    </a>
                </li>

                <li>
                    <a href="/Cashier" className="sidebar-link">
                        <svg
                            width="20"
                            height="20"
                            viewBox="-2.56 -2.56 37.12 37.12"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="#000000"
                        >
                            <g id="SVGRepo_iconCarrier">
                                <path
                                    d="M388.154,725 L367.813,725 L362,735 L393.967,735 L388.154,725 L388.154,725 Z M391,749 L365.003,749 L365,743 L366.964,743 C368.038,743 369.741,742.042 370.462,740.576 C371.271,742.001 372.781,743 374.223,743 C375.746,743 377.423,742.094 377.983,740.784 C378.544,742.063 380.186,743 381.678,743 C383.158,743 384.691,741.912 385.467,740.426 C386.374,741.926 387.665,743 389,743 C389.293,743 390.744,743.048 391,743 L391,749 L391,749 Z M362.025,737 L362,737 C361.982,737.435 362,738.431 362,739 C362,740.065 362.383,741.229 363.001,742 L363.031,753 C363.031,755.209 364.878,757 367.156,757 L388.811,757 C391.089,757 393,755.209 393,753 L393,742 C393.7,741.176 394,740.33 394,739 L394,737 L362.025,737 L362.025,737 Z"
                                    transform="translate(-362, -725)"
                                    fill="currentColor"
                                />
                            </g>
                        </svg>
                        {!collapsed && <span>Cashier</span>}
                    </a>
                </li>

                <li className={`dropdown ${openDropdown ? "open" : ""}`}>
                    <button onClick={toggleDropdown} className="sidebar-link dropdown-toggle">
                        <svg
                            width="24px"
                            height="24px"
                            viewBox="-1.92 -1.92 27.84 27.84"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M20.1 9.2214C18.29 9.2214 17.55 7.9414 18.45 6.3714C18.97 5.4614 18.66 4.3014 17.75 3.7814L16.02 2.7914C15.23 2.3214 14.21 2.6014 13.74 3.3914L13.63 3.5814C12.73 5.1514 11.25 5.1514 10.34 3.5814L10.23 3.3914C9.78 2.6014 8.76 2.3214 7.97 2.7914L6.24 3.7814C5.33 4.3014 5.02 5.4714 5.54 6.3814C6.45 7.9414 5.71 9.2214 3.9 9.2214C2.86 9.2214 2 10.0714 2 11.1214V12.8814C2 13.9214 2.85 14.7814 3.9 14.7814C5.71 14.7814 6.45 16.0614 5.54 17.6314C5.02 18.5414 5.33 19.7014 6.24 20.2214L7.97 21.2114C8.76 21.6814 9.78 21.4014 10.25 20.6114L10.36 20.4214C11.26 18.8514 12.74 18.8514 13.65 20.4214L13.76 20.6114C14.23 21.4014 15.25 21.6814 16.04 21.2114L17.77 20.2214C18.68 19.7014 18.99 18.5314 18.47 17.6314C17.56 16.0614 18.3 14.7814 20.11 14.7814C21.15 14.7814 22.01 13.9314 22.01 12.8814V11.1214C22 10.0814 21.15 9.2214 20.1 9.2214ZM12 15.2514C10.21 15.2514 8.75 13.7914 8.75 12.0014C8.75 10.2114 10.21 8.7514 12 8.7514C13.79 8.7514 15.25 10.2114 15.25 12.0014C15.25 13.7914 13.79 15.2514 12 15.2514Z" />
                        </svg>
                        {!collapsed && <span>Settings</span>}
                        <svg
                            width="16px"
                            height="16px"
                            viewBox="-1.92 -1.92 27.84 27.84"
                            className={`arrow ${openDropdown ? "rotate" : ""}`}
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 15L12 9L18 15"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <ul className="dropdown-menu">
                        <li>
                            <a href="/CustomerList" className="sidebar-sublink">Users</a>
                        </li>
                    </ul>
                </li>
            </ul>

            <div className="sidebar-footer">
                {!collapsed && <p>© 2025 Team 7</p>}
            </div>
        </aside>
    );
}

export default Sidebar;
