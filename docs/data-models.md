| Model          | Fields       | Type             | Description               |
| -------------- | ------------ | ---------------- | ------------------------- |
| Route          | id           | integer          | Unique identifier         |
|                | name         | string           | Name of route             |
|                | origin       | string           | Starting city             |
|                | destination  | string           | Ending city               |
|                | stops        | array of strings | All stops on the route    |
| Bus            | id           | integer          | Unique identifier         |
|                | regNo        | string           | Registration number       |
|                | capacity     | integer          | Maximum passengers        |
|                | routeId      | integer          | Linked route              |
|                | status       | string           | Active/Inactive           |
| Trip           | id           | integer          | Unique identifier         |
|                | busId        | integer          | Bus assigned to this trip |
|                | routeId      | integer          | Route assigned            |
|                | startTime    | datetime         | Trip start time           |
|                | endTime      | datetime         | Trip end time             |
|                | status       | string           | On time/Delayed/Completed |
| LocationUpdate | busId        | integer          | Bus sending update        |
|                | timestamp    | datetime         | Time of location report   |
|                | lat          | float            | Latitude                  |
|                | lng          | float            | Longitude                 |
|                | speed        | float            | Current speed             |
| Operator       | id           | integer          | Unique identifier         |
|                | name         | string           | Operator’s name           |
|                | email        | string           | Operator login            |
|                | passwordHash | string           | Encrypted password        |
