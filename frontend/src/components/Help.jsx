import React from "react";

import TrainOnTime from "../assets/icons/train_ontime.png";
import TrainLate from "../assets/icons/train_late.png";
import Train from "../assets/icons/train.png";
import DARTOnTime from "../assets/icons/DARTOnTime.png";
import DARTLate from "../assets/icons/DARTLate.png";
import DARTNotRunning from "../assets/icons/DARTnotRunning.png";
import TrainStation from "../assets/icons/train-station.png";
import Bus from "../assets/icons/bus.png";
import BusStop from "../assets/icons/bus-station.png";
import LuasRed from "../assets/icons/luasRed.png";
import LuasGreen from "../assets/icons/luasGreen.png";


const icons = [
    { icon: TrainOnTime, text: "On-time & early, running Irish Rail trains", alt: "On-time Train" },
    { icon: TrainLate, text: "Late, running Irish Rail trains", alt: "Late Train" },
    { icon: Train, text: "Not-yet running & terminated Irish Rail trains", alt: "Not Running Train" },
    { icon: DARTOnTime, text: "On-time & early, running DARTs", alt: "On-time DART" },
    { icon: DARTLate, text: "Late, running DARTs", alt: "Late DART" },
    { icon: DARTNotRunning, text: "Not-yet running & terminated DARTs", alt: "Not Running DART" },
    { icon: TrainStation, text: "Irish Rail stations", alt: "Train Station" },
    { icon: Bus, text: "Buses", alt: "Bus" },
    { icon: BusStop, text: "Bus stops", alt: "Bus Stop" },
    { icon: LuasRed, text: "Red line Luas stops", alt: "Red Line Luas" },
    { icon: LuasGreen, text: "Green line Luas stops", alt: "Green Line Luas" },
];

const Help = () => {
    return (
        <div
            style={{
                height: "100vh",
                width: "100%",
                display: "flex",
                position: "relative",
                padding: "4vh",
                paddingTop: "7vh",
                backgroundColor: "white",
                overflowX: "hidden",
                alignItems: "center",
                alignSelf: "center",
                justifyItems: "center",
            }}
            className="min-h-screen w-full flex flex-col bg-white pt-[7vh] px-4"
        >
            <div
                className=" bg-white p-8 mx-auto px-4 flex flex-wrap gap-4 pt-[4vh] justify-center">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Help & Frequently Asked Questions</h1>
                <div className="space-y-6 text-gray-700 text-lg">
                    <div>
                        <h2 className="font-semibold text-xl">🔍 How do I search for a service?</h2>
                        <p>
                            Type what you want to search for in the search bar on the map screen.
                            As you type, the items on the map will be filtered in real-time to only display items which
                            match your search.
                        </p>
                    </div>
                    <br/>
                    <div>
                        <h2 className="font-semibold text-xl">🚂 How can I see the punctuality of a train?</h2>
                        <p>
                            Click the marker for a train on the map and the train's punctuality and average punctuality
                            will be listed along with other details about that train.
                        </p>
                    </div>

                    <br/>

                    <div>
                        <h2 className="font-semibold text-xl">🚌 How can I see the punctuality of a bus?</h2>
                        <p>
                            Unfortunately, this data is not made publicly available and so is not displayed in this application 😔.
                        </p>
                    </div>

                    <br/>

                    <div>
                        <h2 className="font-semibold text-xl">⭐ How do I favourite a service?</h2>
                        <p>
                            Click on a marker on the map to open its pop-up.
                            Click the ⭐ icon in the top right-hand corner of the pop-up to add the item to your
                            favourites.
                            This is saved to your browser and will be remembered next time you come back to the website
                            (so long as you don't delete your cookies!).
                            To remove an item from your favourites, simply click the ⭐ button again.
                        </p>
                    </div>

                    <br/>
                    <div>
                        <h2 className="font-semibold text-xl">🚋 How do I see Luas information?</h2>
                        <p>
                            Luas data is available by clicking on the marker of a Luas stop and clicking the "Load
                            inbound/outbound trams" button.
                            This will display the next few trams due into and out of that stop.
                        </p>
                    </div>

                    <br/>
                    <div>
                        <h2 className="font-semibold text-xl">🚆 How do I find incoming train information?</h2>
                        <p>
                            Click the marker of an Irish Rail Station and then click the "Load incoming trains" button.
                            This will display all trains due into that station in the next 90 minutes.
                        </p>
                    </div>

                    <br/>
                    <div>
                        <h2 className="font-semibold text-xl">📍 How do I show only services within a certain range?</h2>
                        <p>
                            At the bottom of the Filters panel, enter a distance in kilometers. Only services within
                            that
                            range from your current location will be shown.
                        </p>
                    </div>

                    <br/>
                    <div>
                        <h2 className="font-semibold text-xl">❗ Why isn't the range filter appearing?</h2>
                        <p>
                            The range option only appears if your browser grants the app access to your location. If it
                            doesn't appear, ensure location services are enabled and that you've allowed access when
                            prompted.
                        </p>
                    </div>

                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">🗺️ Marker Icons &amp; Their Descriptions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700 text-base max-w-3xl mx-auto justify-center">
                        {icons.map((item, index) => (
                            <div key={index} className="flex items-center space-x-4">
                                <img src={item.icon} alt={item.alt} className="w-10 h-10 object-contain" />
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};

export default Help;
