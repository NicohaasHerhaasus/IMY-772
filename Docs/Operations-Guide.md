# Operations Guide : EcoMap AMR Surveillance Dashboard

## 1. Navigation

When you open EcoMap you land on the About page. The navigation bar has this options:

- About - introductipn to EcoMap and what it does.
- Map View - Interactive map of sampling sites with an AMR-intensity heatmap
- AMR Profiles - Charts and analytics summarising resistance across the data.
- Sample Details - Browse and search individual water samples.
- Data Explorer - Build custom queries, see statistics and export results.
- Datasets - Browse and export atasets.
- Admin - management tools.

(Everything except the Admin area is public)



## 2. Signing in (admins only)

You only need to sign in to upload, rename, or delete data, or to use the AMR Assistant.

1. Click Sign in / the account buttonn (top-right).
2. You are taken to the secure AWS Cognito login page. Enter your email and password.
3. After a successful login you are returned to EcoMap and the Admin menu appears.

Who can do what:
- Anyone signed in can reach the admin area, but full data-management rights require the
  admin role (set by your administrator in AWS Cognito).
- To sign out, use the account menu. You are returned to the public site.


## 3. Map View

The map shows where samples were colected.

- Markers / heatmap : sampling sites appear on the map. A heat overlay highlights areas of
  higher AMR intenssity (warmer colours = stronger signal).
- Pan & zoom : drag to move, scroll or use the +/- controls to zoom.
- Click a site : focuses the map on that location and shows its details.
- Location attachments : if an admin has attached documents to a location, they are available from that location.

Use the Map View to answer where is resistance showing up and how badly.



## 4. AMR Profiles

This page turns the raw data into easy-to-read analytics:

- AMR genes detected and how common they are.
- Integrons & ESBL/AmpC indicators (markers of resistance-spreading gennetic elements).
- Predicted phenotypes : the antibiotics the bacteria are predicted to resist
  (Resistant / Intermediate / Susceptible).
- Organisms detected and an overall site health indicator.

Use this page for a quick, visual summary without needing to read individual records.



## 5. Sample Details

This is the place to look at individual water samples.

1. Use the Search Samples box to find a sample by name, or filter by region/organism.
2. Click a sample to open its full record, which includes:
   - Identification : sample name, organism, collection date, collector, location.
   - Resistance : predicted SIR profile, AMR resistance genes, virulence genes, plasmid
     replicons.
   - Sequence metrics : coverage %, identity %, alignment length, accession of the closest
     reference sequence.
   - Environmental parameters : pH, water temperature, total dissolved solids (TDS) and
     dissolved oxygen.

Use this page when you need the complete story behind one sample.



## 6. Data Explorer (custom queries & export)

The Data Explorer is a visual query builder,  it lets you ask precise qustions of the data
and download the answers, without writing any code.

### Build a query
Choose any combination of filters (leave a filter blank to ignore it):

- Location (geographic name)
- Collection date range (from / to)
- Collected by
- AMR resistance gene
- Predicted SIR prfile
- Organism
- Isolation source
- Element class and Element subclass

The dropdowns are populated from the actual datta, so you only ever pick values that exist.

### Read the results
After running a query you see:

- Summary statistics : number of isolates returned, unique AMR genes, number of organisms,
  and a match rate.
- A results table of every matching record.

### Export
Download your filtered results with one click:

- Export CSV : for opening in any spreadsheet or stats tool.
- Export Excel (.xlsx) : formatted workbook.

The export contains exactly the rows your filters produced, so you can share or analyse a
precise slice of the data.



## 7. Datasets / Isolate Explorer

This page lists isolates (the individual bacterial strains analysed) in a sortable table.

- Browse & sort the isolate table by any column (quality, sequence type, genome length,
  N50, contigs and so on).
- Click an isolate to open its details, including its genotypes (resistance genes
  found, with identity/overlap % and accession), phenotypes (antibiotics affected) and
  plasmids.
- Export the full isolate dataset for offline use.

Use this when you want the genomic detail behind the samples.


## 8. Admin area

The Admin area is reched from the Admin menu (visible after signing in). It has four tools,
listed in the left sidebar.

### 8.1 Upload Datafiles

Import lab and bioinformatics files into the system. The workflow is pick type -> choose file
-> preview -> confirm.

1. Choose the upload option
2. Select your file. EcoMap shows a preview of the first rows so you can confirm it is
   the right file and the columns line up.
3. Confirm the upoad. The server validates the file and reports any problems clearly
   (e.g. missing columns or invalid values) instead of importing bad data.
4. On success the data becomes immediately available across the map, charts, explorer and
   datasets.


### 8.2 Map Location Files

Attach images or documents to a point on the map (for example, a field photo of a sampling
site).

1. Enter the location (latitude / longitude) and a display name.
2. Choose the file to attach and upload it.
3. The attachment now appears for that location in Map View and is listed in Manage
   Datafiles.

### 8.3 Manage Datafiles

Review and tidy everyting that has been uploaded, including map-pin uploads.

- See the list of all uploaded files with their names and details.
- Rename a file to give it a clearer display name.
- Delete a file you no longer want. You are asked to confirm before anything is removed.

### 8.4 AMR Assistant (chatbot)

An AI helper that answers questions about the dashboard and AMR science.

1. Type a question in the box.
2. Press Enter or click Send.
3. You get a short, focused answer.

