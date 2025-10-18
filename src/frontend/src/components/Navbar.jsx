import "./Navbar.css";

function Navbar({ user }) {
    return (
        <header className="navbar-container">
            <div className="navbar-left">
                <h1 className="navbar-title">Grocery POS</h1>
            </div>

            <div className="navbar-right">
                <div className="navbar-user">
                    <div className="user-info">
                        <div className="user-name">{user?.name || "User"}</div>
                        <div className="user-role">{user?.role || "Employee"}</div>
                    </div>
                    <div className="user-avatar">
                        {user?.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Navbar;
