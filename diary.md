## Fri 14 Mar 2025
- Add 'favourite' button to Luas pop-up. 
- Add 'favourite' button to train station pop-up. 
- Create `IrishRailTrainPopup` with favourite button.
- Create `BusPopup` with favourite button.

## Wed 12 Mar 2025
- Fix search input freezing when there's a large number of data.
  - Basically just works by using a debounce function and setting a loading screen if there's more than 500 items to filter.
  - Furthermore, if there's more than 500 items to filter, it'll wait 5 seconds after filtering the data to disable the loading screen, as it takes about that long to plot everything on the map.
- Add a filter that allows the user to specify a number of kilometres within which to display items, thus allowing them to only see nearby items.
- Centre the map on the selected marker when button is clicked to retrieve more data.
- Fix the filters side panel and the search bar overlapping on narrow screens by moving the search bar down lower.
- Add train statuses and train types pie charts.

## Tue 11 Mar 2025
- Fix spacing of Statistics page
- Add ObjectTypeProportionPieChart.
- Revert to previous batch upload method to overcome blank data issue.
- Add scroll limits on map.

## Mon 10 Mar 2025
- Add `ci.yml`.
- Update frontend to only send one request per API when loading data, using the list of `objectType`s functionaliy, thereby reducing the number of requests made.
  - Speeds up loading time from 20s to 15s for all data.
- Add Navbar, skeleton Statistics page.
- Enable TailwindCSS.
- Add better handling for Luas forecast information.
- Re-add cluster toggle to side panel.
- Add Lambda function + API to return trains due to a station in the next 90 minutes.
- Add unit tests for `return_station_data`.
- Add button to fetch trains due to a station in the next 90 minutes.

## Sun 09 Mar 2025
- Optimise `permanent_data.py` with better batched uploading and asynchronous API calls.
- Optimise `transient_data.py` with better batched uploading and asynchronous API calls.
- Add `test_permanent_data`.
- Add `test_transient_data`.
- Add tests for `return_all_data`.
- Add tests for `return_newest_data`.

## Sat 08 Mar 2025
- Make CSS more responsive for smaller screens.
- Make `return_all_data` accept a list of `objectType`s.
- Make `return_newest_data` accept a list of `objectType`s.

## Fri 07 Mar 2025
- Add red & green Luas icons for Red & Green lines.
- Add conditional filters (head hurts from Boolean algebra now).

## Wed 05 Mar 2025
- Add variable text to loading screen.
- Attempt to find the user's geolocation and centre the map + put a marker there.
- Save the user's selected filters to a cookie upon submit, and load this cookie on page load to pre-select the user's last selection.
- Add return_luas_data unit tests.

## Tue 04 Mar 2025
- Add debounce effect to search to prevent application from running out of memory, freezing up, and making markers unresponsive.

## Mon 03 Mar 2025
- Add primitive search.

## Sun 02 Mar 2025
- Refactor frontend into separate components.
- Edit icon files to have different colours for better distinguishability; make live data icons bigger than permanent data icons (assuming that people are more concered with live data than non-live).
- Add all data sources to map.
- Add DART icons.
- Add popups for all data sources except Luas.
- Add Luas popups but getting blocked by CORS 🙄.
  - Need to create proxy API in AWS.
- Added return_luas_data.
- Made Luas proxy API in AWS.
- Use Luas proxy API in LuasPopup.

## Sat 01 Mar 2025
- Add GSI to permanent_data table to allow efficient querying of objects by type.
  - Sped up querying IrishRailStations from approx 10s to 1s (10x improvement!).
- Add GSI and sort code to transient_data to allow efficient querying.
  - Sped up querying around 8x.
- Fix missing bus agency data in permanent data.
- Add bus route information to bus objects in transient data.
- Filter POC and train plotting.
- Cluster overlapping icons + add toggle.

## Fri 28 Feb 2025
- Update newest_data API to accept objectType arguments.
  - Add test script to test this.
- Update all_data API to accept objectType arguments.
  - Add test script to test this.

## Thu 27 Feb 2025
- Set up frontend with ReactJS.
- Test plot, map zoom, etc.
- Checked AWS spending; all good for API requests.
- Created icons.

## Wed 26 Feb 2025
- Add `return_newest_data` and `return_all_data`.
- Set up API endpoints for getting all permanent data and newest transient data on AWS.

## Tue 25 Feb 2025
- Met with supervisor.
- Not a lot of time, need plan for final few weeks.
- Work on frontend this weekend.
- Get database working locally.
- Was working on getting server working locally, got database and lambdas working but couldn't get them to talk to each other.

## Tue 11 Feb 2025
- Meeting with supervisor.
- Discussed avoiding costs for AWS database.
- Decided to prioritise getting the functions working locally, either with an AWS simulation of some kind (to be investigated) or by adapting the functions to be more agnostic and write to something like a locally hosted MongoDB.
- Discussed showing the report to supervisor soon.

## Mon 27 Jan 2025
- Create transient_data DynamoDB database in AWS.
- Deploy transient_data.py to DynamoDB and execute it.
- Realise AWS costs are $0.04 already: using too many WriteUnits in DynamoDB.
  - Not sure what this means, must investigate.

## Sun 26 Jan 2025
- Write transient_data.py to fetch live data.
- Write permanent_data.py to fetch live data.
- Decide to fetch Luas data as-needed, only efficient way to do it.
- Decide to separate data into permanent data (e.g., station data) and transient data (e.g., train data).
- Create permanent_data DynamoDB database in AWS.
- Deploy permanent_data.py to DynamoDB and execute it.

## Sun 05 Jan 2025
- Finish PDD.
  - Add Gantt chart.
- Submit PDD.
- Merge old diary formats into one.

## Tue 19 Nov 2024
- Research into research ethics.
- Research user feedback gathering.
- Draft survey.
- Packed in for exams / Christmas holidays.

## Tue 05 Nov 2024
- Started diary file.
- Created Git repository.
- Added diary, PDD, & final report to Git repository.

### Meeting with Supervisor
- Discussed research ethics, supervisor sent the following documents from the research ethics committee:
  - Plain language statement.
  - Consent form.
- Discussed project definition document:
  - Decided on LaTeX document.
  - Decided to work on initial draft and then get review from supervisor.
- Discussed final report:
  - Decided on LaTeX document.
  - Decided to start working on immediately, adding to it as progress is made.
  - Focus on including non-trivial progress in report immediately rather than diary.
- Discussed diary:
  - Although had set up Confluence for this meeting, decided to use a plain Markdown file to simplify the diary, keep all materials in the one Git repository, and focus on including non-trivial progress in the final report rather than the diary.
- Discussed competitor analysis:
  - Table with rows for each "competitor" product and columns for questions about how they do things.
  - Decided to include this directly in final report when table created rather than put in diary.
- Decided to focus on primarily developing product as a web app, with a secondary requirement to port it to mobile if possible.
- Discussed React vs React Native:
  - React Native is more effort and more difficult to develop in: reduced compatibility with vanilla React.
  - Discussed if worth using React Native if focussing on web.
  - For time being, decided to focus on React Native development *for web* while maintaining maximum mobile portability. Not focusing on mobile development but trying not to break anything, and attempting to port at the end of development.
  - TODO: By end of week, make permanent decision on framework & target platform.
  - Since React was originally chosen specifically for React Native, worth considering not using React if only focussing on web development. Other options:
    - Apache Cordova for porting to mobile.
    - Pure HTML & JavaScript for web app.
    - Other frameworks, e.g. Vue.
- Discussed map & plotting libraries:
  - Leading choice is Mapbox: works with React Native, free up to 50,000 monthly map loads.
- Action items:
  - [X] Create final report LaTeX document.
  - [X] Add skeleton of PDD to Git repository.
  - [X] Make decision on React vs React Native.

## Tue 29 Oct 2024
- Work on map POC, test various map technologies.
- Work on basic "plotting points on a map" POC. 
- Moved meetings to every second week.

## Tue 22 Oct 2024
- Work on API call POC, various languages.

## Tue 15 Oct 2024
- Research existing technologies.
- React Native Hello World.
- For the backend, I'm currently leaning towards the AWS Student Plan as I have some experience in AWS and the NoSQL nature of DynamoDB would likely be the most suitable for the JSON data that I would likely be working with in the application itself. However, I still need to do further research on this, ideally getting an estimate of how much compute power I will actually need (keeping in mind that a NoSQL database will likely require more computation to generate statistical data on than a structured SQL database) and ensuring that I can stay within the limits given by the AWS student plan.

## Tue 08 Oct 2024
- Had first meeting with supervisor.
- Discussed project in general.
- Decided to focus on live tracking of public transport.
- Research APIs and potential technologies to use.

## Mon 07 Oct 2024
- Received project allocations.
- Reached out to allocated project supervisor (Dr. Adrian Clear).
- Scheduled weekly meetings every Tuesday at 12.
