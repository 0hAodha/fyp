import React from "react";
import PropTypes from "prop-types";

const spinnerStyle = {
    border: "6px solid #f3f3f3",
    borderTop: "6px solid #ffffff",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
    marginBottom: "20px"
};

const LoadingOverlay = ({ message }) => (
    <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        background: "rgba(0, 0, 0, 0.85)", display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column",
        textAlign: "center", color: "white", fontSize: "20px", fontWeight: "bold",
        zIndex: 100000
    }}>
        <div style={spinnerStyle}></div>
        {message}
        <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    </div>
);

LoadingOverlay.propTypes = {
    message: PropTypes.string.isRequired
};

export default LoadingOverlay;
