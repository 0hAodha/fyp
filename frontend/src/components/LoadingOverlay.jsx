import React from "react";
import PropTypes from "prop-types";

const LoadingOverlay = ({ message }) => (
    <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        background: "rgba(0, 0, 0, 0.5)", display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "white", fontSize: "20px", fontWeight: "bold",
        zIndex: 1000
    }}>
        {message}
    </div>
);

LoadingOverlay.propTypes = {
    message: PropTypes.string.isRequired
};

export default LoadingOverlay;