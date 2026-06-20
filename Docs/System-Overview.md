# Overview of EcoMap AMR Surveillance Dashboard

## 1. The problem

Antimicrobial resistance (AMR) is one of the a serious global health threats and resistant bacteria do not stay within hospitals but spread through the environment, such rivers. Researchers collect samples from the water like  isolate bacteria, sequence their genomes and then use  tools to detect which genes are present.

Output of this data is a bunch of spreadsheets and files that are hard to read and to compare across sites. The client needed a single platform that could basically do all this:

- Ingest file formats.
- Store the results in a database.
- Visualize patterns geographically and statistically.
- Allow anyone to explore the data.
- Explain the science through a AI assistant.


## 2. Who uses it

- Public / researcher(No login) - Browse the map, AMR charts, sample details, the Data Explorer and downloadable datasets.
- Admin (Login) - All above with aditional admin features.

All data viewing is public and open by design (it is an open-source surveillance tool). Only data management tasks (uploading, deleting, renaming) require an authenticated admin.

## 3. Key features

- Map View — map of sites with an AMR-intensity heatmap..
- AMR Profiles — dashboards summary across the dataset.
- Sample Details — individual sample records.
- Data Explorer — Query builder where you can filter by location, date range, collector, resistance gene, SIR profile, organism, source and element class/subclass, see live summary statistics and export results to CSV or Excel.
- Datasets / Isolate Explorer — browse and export  datasets.
- Admin — Upload Datafiles — import file format with in-browser preview and server-side validation before ingestion.
- Admin — AMR Assistant — an AI chatbot that answers questions about AMR science and how to use the dashboard.

For step-by-step usage of each feature, see [Operations-Guide.md](Operations-Guide.md).