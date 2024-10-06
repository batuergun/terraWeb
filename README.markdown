# **Cosmos Team** - NASA Space Apps Challenge 2024

![](./content/cosmos.png)

## Challenge
[Leveraging Earth Observation Data for Informed Agricultural Decision-Making](https://www.spaceappschallenge.org/nasa-space-apps-2024/challenges/leveraging-earth-observation-data-for-informed-agricultural-decision-making/)

## High Level Summary
Our solution is a web platform based on remote sensing data monitoring platform. Through this platform, farmers will be able to easily access up-to-date and reliable information about their fields. Sensors installed in the fields will continuously monitor air quality and temperature values. Our users will have 24/7 access to information about the weather conditions in their agricultural areas, enabling them to make more informed and effective decisions. This innovative approach will enhance farmers' productivity. Additionally, our platform analyzes the data from the fields to identify the most suitable cropping options and presents them to users. This way, farmers can make the most effective agricultural decisions, optimizing their production and maximizing the benefits of our services.

## Project Demo
[Demo Video](https://www.loom.com/share/b73295bb47fe4d069b54b978083b7b15?sid=964782aa-a640-43e0-a1f2-24ee1789e11c)

## Project Details

[**CosTerra**](https://costerra.co) is an innovative web application designed to empower farmers with data-driven insights for informed agricultural decision-making. By leveraging Earth observation data, real-time sensor information, and advanced AI analysis, CosTerra provides farmers with a comprehensive understanding of their land's potential and challenges.

![](./content/map_demo.jpeg)

### How We Addressed This Challenge

Our team developed CosTerra to directly address NASA's 2024 Space Apps Challenge of "Leveraging Earth Observation Data for Informed Agricultural Decision-Making." We approached this challenge by:

- Integrating satellite imagery and **NDVI** data to assess vegetation health and productivity.
- Incorporating real-time sensor data for up-to-date environmental information.
- Utilizing AI to generate concise, farmer-friendly land summaries.
- Creating an interactive map interface for easy location selection and data visualization.
- Implementing a chat feature for farmers to ask specific questions about their land.

![](./content/chat_demo.jpeg)

### How We Developed This Project

CosTerra was developed using a combination of technologies:

- Frontend: Next.js, React, and MapTiler SDK for the interactive map interface.
- Backend: Python with FastAPI for processing Earth observation data and calculating NDVI statistics.
- AI Integration: OpenAI's GPT model for generating land summaries and powering the chat feature.
- Data Sources: NASA Earth observation datasets, local sensor networks, and Microsoft Planetary Computer.

### How We Used Space Agency Data in This Project

We utilised NASA's Earth observation data, specifically **MODIS** data for long-term trend analysis of land use and crop productivity as well as **NDVI** index. These datasets were crucial in providing comprehensive insights into land characteristics and agricultural potential.

## Use of Artificial Intelligence

- Claude 3.5 Sonnet (Cursor IDE)
- GPT-4 (Spelling check & content summary generation)

## Space Agency Data

- [MODIS Version 6.1](https://planetarycomputer.microsoft.com/dataset/group/modis)
- [MODIS 13A1-061](https://planetarycomputer.microsoft.com/dataset/modis-13A1-061)

## References

- [NDVI Case Study](https://www.sciencedirect.com/science/article/pii/S1877050915019444?via%3Dihub)
- [The normalized difference vegetation index (NDVI)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9758424/)


For more information about our team and project, visit our [Space Apps Challenge team page](https://www.spaceappschallenge.org/nasa-space-apps-2024/find-a-team/cosmos-team/?tab=project).