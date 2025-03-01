## Sat 01 Mar 2025
- Add GSI to permanent_data table to allow efficient querying of objects by type.
  - Sped up querying IrishRailStations from approx 10s to 1s (10x improvement!).
- Add GSI and sort code to transient_data to allow efficient querying.
  - Sped up querying around 8x.
- Fix missing bus agency data in permanent data.
- Add bus route information to bus objects in transient data.

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
