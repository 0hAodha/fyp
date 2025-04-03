import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
    return (
        <nav
            style={{
                position: "fixed",
                top: "0",
                right: "0",
                left: "0",
                height: "5vh",
                background: "rgba(255, 255, 255, 0.9)",
                color: "black",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                transition: "height 0.2s ease-in-out, padding 0.2s ease-in-out",
                zIndex: 1200,
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)"
            }}
        >
            <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                <img
                    src="/ticket.png"  // Ensure this path is correct
                    alt="Iompar"
                    style={{width: "24px", height: "24px", borderRadius: "5px"}}
                />
                <div style={{fontSize: "18px", fontWeight: "bold"}}>
                    <Link to="/" style={{textDecoration: "none", color: "black"}}>
                        Iompar
                    </Link>
                </div>
            </div>

                <div style={{display: "flex", gap: "20px"}}>
                    <Link
                        to="/"
                        style={{
                            textDecoration: "none",
                            color: "black",
                            padding: "5px 10px",
                            borderRadius: "5px",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.target.style.background = "rgba(0, 0, 0, 0.1)")}
                        onMouseLeave={(e) => (e.target.style.background = "transparent")}
                    >
                        Home
                    </Link>
                    <Link
                        to="/statistics"
                        style={{
                            textDecoration: "none",
                            color: "black",
                            padding: "5px 10px",
                            borderRadius: "5px",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.target.style.background = "rgba(0, 0, 0, 0.1)")}
                        onMouseLeave={(e) => (e.target.style.background = "transparent")}
                    >
                        Statistics
                    </Link>
                    <Link
                        to="/help"
                        style={{
                            textDecoration: "none",
                            color: "black",
                            padding: "5px 10px",
                            borderRadius: "5px",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.target.style.background = "rgba(0, 0, 0, 0.1)")}
                        onMouseLeave={(e) => (e.target.style.background = "transparent")}
                    >
                        Help
                    </Link>
                </div>
        </nav>
);
};

export default Navbar;
