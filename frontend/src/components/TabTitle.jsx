import React from "react";
import { Helmet } from "react-helmet";
import favicon from "../../src/assets/icons/train-station.png"

const TabTitle = () => {
    return (
        <Helmet>
            <title>Iompar</title>
            <link rel="icon" href={favicon} />
        </Helmet>
    );
};

export default TabTitle;