import React from "react";

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
                </div>
            </div>
        </div>
    );
};

export default Help;