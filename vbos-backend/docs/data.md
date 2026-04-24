# Data Imports

To add data into the system, the first step needed is to create a superuser account. Check the [index.md](/docs/index.md#initialize-the-project) for instructions on how to do it.

With the superuser account, you can login on the Administration Interface. The URL will be: `{backend-url}/admin`.

Once logged in, you will see the Administrative Interface home screen.

## Adding data

We can add data by uploading raster files (TIFF or VRT format), vector files in the GeoJSON format or Tabular data in CSV format.
However, before uploading data, you should create the Clusters, and the Dataset entries.

### Creating clusters

On the Administrative Interface, click on Clusters, then on `Add Cluster` button.

You will see a form. Add a name and click on save.

If you need to modify or delete a Cluster, you can do it by accessing the Cluster list page in the administrative interface.

Clicking on the id of the cluster, you will have access to the form to modify it. If you need to delete clusters, select it and then click on the action dropdown and select `Delete selected clusters`. Finally, click on the `Go` button.

### Creating datasets

The exact same pattern applies when creating Raster, Vector or Tabular datasets — fill in the Raster Dataset creation form and save.

The forms to create Vector and Tabular datasets are very similar to the Raster one.

### Uploading data

The last and most important step of the data import is to upload the files containing each datasets data.

### Tabular data

Click on the `Tabular Items` link in the Administrative Interface homepage. Then, click on `Import File` in the right-top corner of the page.

You will see a form where you can upload a CSV file and select the dataset to which the data belongs.

The CSV file needs to be separated by commas and should have the following columns:

- Year
- Month `(optional)`
- Province `(optional)`
- Area Council `(optional)`
- Attribute
- Value

The name of the columns can be in lower, UPPER, or Camel Case. You can upload a file with additional columns, and the additional information will be stored in the database.

### Vector data

Click on the `Vector Items` link in the Administrative Interface homepage. Then, click on `Import File` in the right-top corner of the page.

You will see a form where you can upload a GeoJSON file and select the dataset to which the data belongs.

If you have never worked with GeoJSON files, you can convert any geospatial data format to GeoJSON using QGIS or ArcGis. The items in the GeoJSON file should have the following columns:

- Name `(optional)`
- Ref `(optional)`
- Province `(optional)`
- Area Council `(optional)`
- Attribute `(optional)`
