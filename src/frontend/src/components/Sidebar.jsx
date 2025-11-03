import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import "./Sidebar.css";

function Sidebar() {
    const { user } = useContext(AuthContext);
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
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
                    <Link to="/dashboard" className="sidebar-link">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 9.77746V16.2C5 17.8802 5 18.7203 5.32698 19.362C5.6146 19.9265 6.07354 20.3854 6.63803 20.673C7.27976 21 8.11984 21 9.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7203 19 17.8802 19 16.2V5.00002M21 12L15.5668 5.96399C14.3311 4.59122 13.7133 3.90484 12.9856 3.65144C12.3466 3.42888 11.651 3.42893 11.0119 3.65159C10.2843 3.90509 9.66661 4.59157 8.43114 5.96452L3 12M14 21V15H10V21" />
                        </svg>
                        {!collapsed && <span>Dashboard</span>}
                    </Link>
                </li>

                <li>
                    <Link to="/cashier" className="sidebar-link">
                        <svg width="20" height="20" viewBox="-2.56 -2.56 37.12 37.12" fill="#000000">
                            <g>
                                <path d="M388.154,725 L367.813,725 L362,735 L393.967,735 L388.154,725 Z M391,749 L365.003,749 L365,743 L366.964,743 C368.038,743 369.741,742.042 370.462,740.576 C371.271,742.001 372.781,743 374.223,743 C375.746,743 377.423,742.094 377.983,740.784 C378.544,742.063 380.186,743 381.678,743 C383.158,743 384.691,741.912 385.467,740.426 C386.374,741.926 387.665,743 389,743 C389.293,743 390.744,743.048 391,743 Z M362.025,737 L362,737 C361.982,737.435 362,738.431 362,739 C362,740.065 362.383,741.229 363.001,742 L363.031,753 C363.031,755.209 364.878,757 367.156,757 L388.811,757 C391.089,757 393,755.209 393,753 L393,742 C393.7,741.176 394,740.33 394,739 L394,737 L362.025,737 Z" transform="translate(-362, -725)" fill="currentColor"/>
                            </g>
                        </svg>
                        {!collapsed && <span>Register</span>}
                    </Link>
                </li>

                {user?.isAdmin && (
                    <>
                        <li>
                            <Link to="/salesreport" className="sidebar-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M9 17v-6M13 17v-10M17 17v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {!collapsed && <span>Sales Report</span>}
                            </Link>
                        </li>

                        <li>
                            <Link to="/inventory" className="sidebar-link">
                                <svg fill="currentColor" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20" viewBox="-20.48 -20.48 296.96 296.96" enable-background="new 0 0 256 253" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier">
                                    <path d="M122,219H76v-45h18v14h10v-14h18V219z M182,219h-46v-45h18v14h10v-14h18V219z M152,160h-46v-45h18v14h10v-14h18V160z M2,69 c0,13.678,9.625,25.302,22,29.576V233H2v18h252v-18h-22V98.554c12.89-3.945,21.699-15.396,22-29.554v-8H2V69z M65.29,68.346 c0,6.477,6.755,31.47,31.727,31.47c21.689,0,31.202-19.615,31.202-31.47c0,11.052,7.41,31.447,31.464,31.447 c21.733,0,31.363-20.999,31.363-31.447c0,14.425,9.726,26.416,22.954,30.154V233H42V98.594C55.402,94.966,65.29,82.895,65.29,68.346 z M222.832,22H223V2H34v20L2,54h252L222.832,22z"></path> </g>
                                </svg>
                                {!collapsed && <span>Inventory</span>}
                            </Link>
                        </li>

                        <li>
                            <Link to="/discounts" className="sidebar-link">
                                <svg width="20" height="20" viewBox="-1.92 -1.92 27.84 27.84"
                                     xmlns="http://www.w3.org/2000/svg" id="discount" className="icon glyph"
                                     fill="none">
                                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                    <g id="SVGRepo_iconCarrier">
                                        <path
                                            d="M21.59,9.83A4.21,4.21,0,0,1,21.17,9,4.73,4.73,0,0,1,21,8.07a4.19,4.19,0,0,0-.64-2.16,4.15,4.15,0,0,0-1.87-1.28,4.36,4.36,0,0,1-.84-.43A4.55,4.55,0,0,1,17,3.54a4.29,4.29,0,0,0-1.81-1.4A4.19,4.19,0,0,0,13,2.21a4.24,4.24,0,0,1-1.94,0A4.19,4.19,0,0,0,8.8,2.14,4.29,4.29,0,0,0,7,3.54a4.55,4.55,0,0,1-.66.66,4.36,4.36,0,0,1-.84.43A4.15,4.15,0,0,0,3.62,5.91,4.19,4.19,0,0,0,3,8.07,4.73,4.73,0,0,1,2.83,9a4.21,4.21,0,0,1-.42.81A4.3,4.3,0,0,0,1.64,12a4.3,4.3,0,0,0,.77,2.17,4.21,4.21,0,0,1,.42.81,4.73,4.73,0,0,1,.15.95,4.19,4.19,0,0,0,.64,2.16,4.15,4.15,0,0,0,1.87,1.28,4.36,4.36,0,0,1,.84.43,4.55,4.55,0,0,1,.66.66,4.29,4.29,0,0,0,1.81,1.4,2.91,2.91,0,0,0,.87.13,6,6,0,0,0,1.36-.2,4.24,4.24,0,0,1,1.94,0,4.19,4.19,0,0,0,2.23.07A4.29,4.29,0,0,0,17,20.46a4.55,4.55,0,0,1,.66-.66,4.36,4.36,0,0,1,.84-.43,4.15,4.15,0,0,0,1.87-1.28A4.19,4.19,0,0,0,21,15.93a4.73,4.73,0,0,1,.15-.95,4.21,4.21,0,0,1,.42-.81A4.3,4.3,0,0,0,22.36,12,4.3,4.3,0,0,0,21.59,9.83ZM9.5,8A1.5,1.5,0,1,1,8,9.5,1.5,1.5,0,0,1,9.5,8Zm5,8A1.5,1.5,0,1,1,16,14.5,1.5,1.5,0,0,1,14.5,16Zm1.21-6.29-6,6a1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.42l6-6a1,1,0,0,1,1.42,1.42Z"
                                            fill="currentColor"></path>
                                    </g>
                                </svg>
                                {!collapsed && <span>Discounts</span>}
                            </Link>
                        </li>
                    </>
                )}

                <li className={`dropdown ${openDropdown ? "open" : ""}`}>
                    <button onClick={toggleDropdown} className="sidebar-link dropdown-toggle">
                        <svg fill="currentColor" width="20" height="20" viewBox="-51.2 -51.2 742.40 742.40"
                             xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <path
                                    d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z"></path>
                            </g>
                        </svg>
                        {!collapsed && <span>User Management</span>}
                        <svg width="14" height="14" viewBox="0 0 24 24" className={`arrow ${openDropdown ? "rotate" : ""}`} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier">
                            <path d="M6 9L11.7874 14.7874V14.7874C11.9048 14.9048 12.0952 14.9048 12.2126 14.7874V14.7874L18 9" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g>
                        </svg>
                    </button>
                    <ul className="dropdown-menu">
                        <li>
                            <Link to="/CustomerList" className="sidebar-sublink">Customers</Link>
                        </li>
                        {user?.isAdmin && (
                            <li>
                                <Link to="/employees" className="sidebar-sublink">Employees</Link>
                            </li>
                        )}
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
